import JSZip from 'jszip';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type CliOptions = {
  language: string;
  avatar: string;
  courseIds: string[];
  output: string;
  zipSource: string;
  skipBuild: boolean;
  dryRun: boolean;
  force: boolean;
  failOnMissing: boolean;
};

type CourseRow = {
  id: string;
  code: string | null;
  name: string | null;
};

type ChapterRow = {
  id: string;
  course_id: string | null;
  name: string | null;
  sort_index: number | null;
};

type ChapterLessonRow = {
  chapter_id: string | null;
  language_id: string | null;
  lesson_id: string | null;
  locale_id: string | null;
  sort_index: number | null;
};

type LanguageRow = {
  id: string;
  code: string | null;
  name?: string | null;
};

type ImportJsonColumn = {
  column: string;
  value: string;
};

type ImportJsonTable = {
  name: string;
  schema: ImportJsonColumn[];
  values?: unknown[][];
};

type ImportJson = {
  tables: ImportJsonTable[];
};

type LessonRow = {
  id: string;
  name: string | null;
  cocos_lesson_id: string | null;
  lido_lesson_id: string | null;
  version: number | null;
};

type BundleManifestEntry = {
  bundleId: string;
  lessonIds: string[];
  status: 'already-extracted' | 'extracted' | 'missing' | 'dry-run';
  source?: string;
  sourceUrl?: string;
  zipPath?: string;
  dbVersion?: number;
  error?: string;
};

type Manifest = {
  generatedAt: string;
  language: string;
  languageId: string | null;
  avatar: string;
  pathwayMascot: string;
  courseIds: string[];
  courses: CourseRow[];
  chapterCount: number;
  chapterLessonCount: number;
  lessonCount: number;
  bundleCount: number;
  bundles: BundleManifestEntry[];
};

const repoRoot = process.cwd();
const lessonBundlesDir = path.join(
  repoRoot,
  'public',
  'assets',
  'lessonBundles',
);
const tmpRoot = path.join(lessonBundlesDir, '.tmp-open-apk');
const manifestPath = path.join(repoRoot, 'scripts', 'open-apk-manifest.json');
const importJsonPath = path.join(
  repoRoot,
  'public',
  'databases',
  'import.json',
);
const animationAssetsDir = path.join(repoRoot, 'public', 'assets', 'animation');
const pathwayMascotPath = path.join(
  repoRoot,
  'public',
  'pathwayAssets',
  'chimpleRive.riv',
);

const remoteBundleBaseUrls = [
  'https://chimple-bundles.web.app/',
  'https://pub-9d27d46558f64e93a979827424d3e766.r2.dev/',
  'https://cuba-stage-zip-bundle.web.app/',
  'https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/',
  'https://raw.githubusercontent.com/chimple/chimple-zips/main/',
];

const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

const parseArgs = (argv: string[]): CliOptions => {
  const raw: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const trimmed = arg.slice(2);
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex >= 0) {
      raw[trimmed.slice(0, equalsIndex)] = trimmed.slice(equalsIndex + 1);
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      raw[trimmed] = true;
      continue;
    }

    raw[trimmed] = next;
    index += 1;
  }

  const getString = (key: string): string | undefined => {
    const value = raw[key];
    return typeof value === 'string' ? value.trim() : undefined;
  };

  const courseIds = (
    getString('course_ids') ??
    getString('course-ids') ??
    getString('course_id') ??
    getString('course-id') ??
    ''
  )
    .split(',')
    .map((courseId) => courseId.trim())
    .filter(Boolean);

  const options: CliOptions = {
    language: getString('language') ?? '',
    avatar: getString('avatar') ?? '',
    courseIds,
    output: getString('output') ?? '',
    zipSource: getString('zip-source') ?? 'D:\\chimple-zips',
    skipBuild: raw['skip-build'] === true,
    dryRun: raw['dry-run'] === true,
    force: raw.force === true,
    failOnMissing: raw['fail-on-missing'] === true,
  };

  const missing = [
    ['language', options.language],
    ['avatar', options.avatar],
    ['course_ids', options.courseIds.length ? 'ok' : ''],
    ['output', options.output],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => `--${key}`);

  if (missing.length > 0) {
    throw new Error(`Missing required argument(s): ${missing.join(', ')}`);
  }

  return options;
};

const safeWithin = (parent: string, child: string): boolean => {
  const relative = path.relative(parent, child);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const ensureCleanTmpDir = async (dir: string): Promise<void> => {
  if (!safeWithin(tmpRoot, dir)) {
    throw new Error(`Refusing to clean unsafe temp directory: ${dir}`);
  }
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const prepareAvatar = async (
  avatar: string,
): Promise<{ avatarPath: string; pathwayMascotPath: string }> => {
  const sourcePath = path.isAbsolute(avatar)
    ? avatar
    : path.join(animationAssetsDir, avatar);

  if (!(await fileExists(sourcePath))) {
    throw new Error(`Avatar asset not found: ${sourcePath}`);
  }

  if (path.extname(sourcePath).toLowerCase() !== '.riv') {
    throw new Error(`Avatar must be a .riv file: ${sourcePath}`);
  }

  await fs.mkdir(animationAssetsDir, { recursive: true });
  const animationAssetPath = path.join(
    animationAssetsDir,
    path.basename(sourcePath),
  );

  if (path.resolve(sourcePath) !== path.resolve(animationAssetPath)) {
    await fs.copyFile(sourcePath, animationAssetPath);
  }

  await fs.copyFile(sourcePath, pathwayMascotPath);

  return {
    avatarPath: animationAssetPath,
    pathwayMascotPath,
  };
};

const isActiveRow = (row: { is_deleted?: unknown }): boolean =>
  row.is_deleted === false ||
  row.is_deleted === 0 ||
  row.is_deleted === '0' ||
  row.is_deleted == null;

const readImportJson = async (): Promise<ImportJson> => {
  const content = await fs.readFile(importJsonPath, 'utf8');
  return JSON.parse(content) as ImportJson;
};

const readRows = <T extends Record<string, unknown>>(
  importJson: ImportJson,
  tableName: string,
): T[] => {
  const table = importJson.tables.find(
    (candidate) => candidate.name === tableName,
  );
  if (!table) throw new Error(`Table not found in import.json: ${tableName}`);

  const columns = table.schema.map((column) => column.column);
  return (table.values ?? []).map((values) => {
    const row: Record<string, unknown> = {};
    columns.forEach((column, index) => {
      row[column] = values[index];
    });
    return row as T;
  });
};

const resolveLanguage = (
  importJson: ImportJson,
  languageCode: string,
): LanguageRow | null => {
  const language = readRows<LanguageRow & { is_deleted?: unknown }>(
    importJson,
    'language',
  ).find(
    (row) =>
      isActiveRow(row) &&
      row.code?.trim().toLowerCase() === languageCode.trim().toLowerCase(),
  );

  if (!language?.id) {
    console.warn(
      `Language code not found in import.json: ${languageCode}. Continuing without chapter_lesson language filtering.`,
    );
    return null;
  }

  return language;
};

const resolveLessons = (
  importJson: ImportJson,
  courseIds: string[],
  languageId: string | null,
) => {
  const courses = readRows<CourseRow & { is_deleted?: unknown }>(
    importJson,
    'course',
  ).filter((course) => courseIds.includes(course.id) && isActiveRow(course));
  const foundCourseIds = new Set(courses.map((course) => course.id));
  const missingCourseIds = courseIds.filter(
    (courseId) => !foundCourseIds.has(courseId),
  );

  if (missingCourseIds.length > 0) {
    throw new Error(`Course ID(s) not found: ${missingCourseIds.join(', ')}`);
  }

  const chapters = readRows<ChapterRow & { is_deleted?: unknown }>(
    importJson,
    'chapter',
  )
    .filter(
      (chapter) =>
        !!chapter.course_id &&
        courseIds.includes(chapter.course_id) &&
        isActiveRow(chapter),
    )
    .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));

  const chapterIds = unique(chapters.map((chapter) => chapter.id));
  const chapterLessons = readRows<ChapterLessonRow & { is_deleted?: unknown }>(
    importJson,
    'chapter_lesson',
  )
    .filter(
      (chapterLesson) =>
        !!chapterLesson.chapter_id &&
        chapterIds.includes(chapterLesson.chapter_id) &&
        isActiveRow(chapterLesson) &&
        (!languageId ||
          chapterLesson.language_id == null ||
          chapterLesson.language_id === languageId),
    )
    .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));

  const lessonIds = unique(
    chapterLessons
      .map((chapterLesson) => chapterLesson.lesson_id)
      .filter((lessonId): lessonId is string => !!lessonId),
  );
  const lessons = readRows<LessonRow & { is_deleted?: unknown }>(
    importJson,
    'lesson',
  ).filter((lesson) => lessonIds.includes(lesson.id) && isActiveRow(lesson));

  return { courses, chapters, chapterLessons, lessons };
};

const getBundleId = (lesson: LessonRow): string | null =>
  lesson.lido_lesson_id ?? lesson.cocos_lesson_id ?? null;

const downloadZip = async (
  bundleId: string,
): Promise<{ data: Buffer; sourceUrl: string } | null> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    for (const baseUrl of remoteBundleBaseUrls) {
      const zipUrl = new URL(
        `${bundleId}.zip`,
        baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      ).toString();

      try {
        console.log(`Trying remote bundle: ${zipUrl}`);
        const response = await fetch(zipUrl);
        if (!response.ok) continue;
        return {
          data: Buffer.from(await response.arrayBuffer()),
          sourceUrl: zipUrl,
        };
      } catch (error) {
        console.warn(`Remote bundle failed: ${zipUrl}`);
      }
    }
  }
  return null;
};

const detectCommonRoot = (fileNames: string[], bundleId: string): string => {
  if (fileNames.includes('index.xml')) return '';

  const roots = unique(
    fileNames
      .map((fileName) => fileName.replace(/\\/g, '/').split('/')[0])
      .filter(Boolean),
  );

  if (roots.length !== 1) return '';

  const root = roots[0];
  const rootPrefix = `${root}/`;
  if (fileNames.includes(`${rootPrefix}index.xml`)) return rootPrefix;
  if (root === bundleId) return rootPrefix;
  return '';
};

const extractZipToBundleDir = async (
  zipData: Buffer,
  bundleId: string,
  force: boolean,
  dbVersion: number,
): Promise<void> => {
  const finalDir = path.join(lessonBundlesDir, bundleId);
  const indexPath = path.join(finalDir, 'index.xml');

  if (await fileExists(indexPath)) return;

  if ((await fileExists(finalDir)) && !force) {
    throw new Error(
      `Bundle folder exists without index.xml: ${finalDir}. Re-run with --force to replace it.`,
    );
  }

  await fs.mkdir(tmpRoot, { recursive: true });
  const tmpDir = path.join(tmpRoot, `${bundleId}-${process.pid}`);
  await ensureCleanTmpDir(tmpDir);

  try {
    const zip = await JSZip.loadAsync(zipData);
    const files = Object.values(zip.files).filter((file) => !file.dir);
    const normalizedNames = files.map((file) => file.name.replace(/\\/g, '/'));
    const commonRoot = detectCommonRoot(normalizedNames, bundleId);

    for (const file of files) {
      const normalizedName = file.name.replace(/\\/g, '/');
      const relativeName = commonRoot
        ? normalizedName.slice(commonRoot.length)
        : normalizedName;

      if (!relativeName || relativeName.startsWith('../')) continue;

      const outputPath = path.resolve(tmpDir, relativeName);
      if (!safeWithin(tmpDir, outputPath)) {
        throw new Error(`Unsafe ZIP entry path: ${file.name}`);
      }

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, await file.async('nodebuffer'));
    }

    if (!(await fileExists(path.join(tmpDir, 'index.xml')))) {
      throw new Error(
        `Extracted bundle ${bundleId} does not contain index.xml`,
      );
    }

    await fs.writeFile(path.join(tmpDir, '.version'), String(dbVersion));

    if (force) {
      await fs.rm(finalDir, { recursive: true, force: true });
    }
    await fs.rename(tmpDir, finalDir);
  } catch (error) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw error;
  }
};

const prepareBundle = async (
  bundleId: string,
  lessonIds: string[],
  dbVersion: number,
  options: CliOptions,
): Promise<BundleManifestEntry> => {
  const finalIndexPath = path.join(lessonBundlesDir, bundleId, 'index.xml');
  if (await fileExists(finalIndexPath)) {
    return {
      bundleId,
      lessonIds,
      status: 'already-extracted',
      source: 'bundled',
      dbVersion,
    };
  }

  if (options.dryRun) {
    return { bundleId, lessonIds, status: 'dry-run', dbVersion };
  }

  const localZipPath = path.join(options.zipSource, `${bundleId}.zip`);
  if (await fileExists(localZipPath)) {
    const zipData = await fs.readFile(localZipPath);
    await extractZipToBundleDir(zipData, bundleId, options.force, dbVersion);
    return {
      bundleId,
      lessonIds,
      status: 'extracted',
      source: 'local',
      zipPath: localZipPath,
      dbVersion,
    };
  }

  const remoteZip = await downloadZip(bundleId);
  if (remoteZip) {
    await extractZipToBundleDir(
      remoteZip.data,
      bundleId,
      options.force,
      dbVersion,
    );
    return {
      bundleId,
      lessonIds,
      status: 'extracted',
      source: 'remote',
      sourceUrl: remoteZip.sourceUrl,
      dbVersion,
    };
  }

  return {
    bundleId,
    lessonIds,
    status: 'missing',
    dbVersion,
    error: `No ZIP found locally or remotely for ${bundleId}`,
  };
};

const run = (command: string, args: string[], cwd: string): void => {
  console.log(`Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
};

const findReleaseApk = async (): Promise<string> => {
  const releaseDir = path.join(
    repoRoot,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'release',
  );
  const entries = await fs.readdir(releaseDir, { withFileTypes: true });
  const apks = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.apk'))
    .map((entry) => path.join(releaseDir, entry.name));

  if (apks.length < 1) {
    throw new Error(`No release APK found in ${releaseDir}`);
  }

  const apkStats = await Promise.all(
    apks.map(async (apkPath) => ({
      apkPath,
      stat: await fs.stat(apkPath),
    })),
  );
  apkStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  return apkStats[0].apkPath;
};

const buildAndCopyApk = async (outputDir: string): Promise<void> => {
  run('npm', ['run', 'build:android'], repoRoot);
  run(
    process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    ['assembleRelease'],
    path.join(repoRoot, 'android'),
  );

  await fs.mkdir(outputDir, { recursive: true });
  const apkPath = await findReleaseApk();
  const targetPath = path.join(outputDir, path.basename(apkPath));
  await fs.copyFile(apkPath, targetPath);
  console.log(`APK copied to ${targetPath}`);
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));

  await fs.mkdir(lessonBundlesDir, { recursive: true });
  const importJson = await readImportJson();
  const avatar = await prepareAvatar(options.avatar);

  const language = resolveLanguage(importJson, options.language);
  const courseIds = options.courseIds;

  console.log(`Resolving lessons for course IDs: ${courseIds.join(', ')}`);
  const { courses, chapters, chapterLessons, lessons } = await resolveLessons(
    importJson,
    courseIds,
    language?.id ?? null,
  );

  const lessonsByBundle = new Map<string, string[]>();
  const bundleVersions = new Map<string, number>();
  const lessonsWithoutBundle = lessons.filter((lesson) => !getBundleId(lesson));
  for (const lesson of lessons) {
    const bundleId = getBundleId(lesson);
    if (!bundleId) continue;
    lessonsByBundle.set(bundleId, [
      ...(lessonsByBundle.get(bundleId) ?? []),
      lesson.id,
    ]);
    bundleVersions.set(
      bundleId,
      Math.max(bundleVersions.get(bundleId) ?? 1, Number(lesson.version ?? 1)),
    );
  }

  const bundles: BundleManifestEntry[] = [];
  for (const [bundleId, lessonIds] of lessonsByBundle) {
    const dbVersion = bundleVersions.get(bundleId) ?? 1;
    try {
      bundles.push(
        await prepareBundle(bundleId, lessonIds, dbVersion, options),
      );
    } catch (error: any) {
      bundles.push({
        bundleId,
        lessonIds,
        status: 'missing',
        dbVersion,
        error: error?.message ?? String(error),
      });
    }
  }

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    language: options.language,
    languageId: language?.id ?? null,
    avatar: avatar.avatarPath,
    pathwayMascot: avatar.pathwayMascotPath,
    courseIds,
    courses,
    chapterCount: chapters.length,
    chapterLessonCount: chapterLessons.length,
    lessonCount: lessons.length,
    bundleCount: lessonsByBundle.size,
    bundles,
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Manifest written to ${manifestPath}`);

  if (lessonsWithoutBundle.length > 0) {
    console.warn(
      `Lessons without lido_lesson_id/cocos_lesson_id: ${lessonsWithoutBundle.length}`,
    );
  }

  const missingBundles = bundles.filter(
    (bundle) => bundle.status === 'missing',
  );
  if (missingBundles.length > 0) {
    const missingMessage = `Missing or invalid bundles: ${missingBundles
      .map((bundle) => bundle.bundleId)
      .join(', ')}`;
    if (options.failOnMissing) {
      throw new Error(missingMessage);
    }
    console.warn(missingMessage);
    console.warn(
      'Continuing APK build because --fail-on-missing was not provided.',
    );
  }

  console.log(
    `Prepared ${bundles.length} bundles: ${bundles.filter((bundle) => bundle.status === 'extracted').length} extracted, ${bundles.filter((bundle) => bundle.status === 'already-extracted').length} already present.`,
  );

  if (options.skipBuild || options.dryRun) {
    console.log('Skipping APK build.');
    return;
  }

  await buildAndCopyApk(path.resolve(options.output));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
