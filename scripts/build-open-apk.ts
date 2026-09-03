// - Copy/extract lesson ZIPs from local D:\chimple-zips first, then fall back to prod remote bundle URLs
// - Add full-path mascot .riv input and copy it into bundled app assets
// - Continue APK builds while reporting missing bundles unless --fail-on-missing is passed

// Run locally:

// npx ts-node scripts/build-open-apk.ts --language=pt --avatar=G:\mascot_with_accessories_sep_2025.riv --course_ids=0937c891-9bed-4fa2-b422-ad3bee7f4569 --output=G:\open-apk-output
// npx ts-node scripts/build-open-apk.ts --language=en --subjects=math-subject-id --avatar=G:\mascot_with_accessories_sep_2025.riv --output=G:\open-apk-output
// npx ts-node scripts/build-open-apk.ts --language=pt --avatar=G:\mascot_with_accessories_sep_2025.riv --course_ids=0937c891-9bed-4fa2-b422-ad3bee7f4569 --output=G:\open-apk-output --zip-source=D:\chimple-zips

// npx ts-node scripts/build-open-apk.ts --language=pt --avatar=G:\mascot_with_accessories_sep_2025.riv --course_ids=0937c891-9bed-4fa2-b422-ad3bee7f4569 --output=G:\open-apk-output --zip-source=D:\chimple-zips --splash="C:\Users\LENOVO\Downloads\splash_screen.png"

// Optional flags:

// --skip-build       Prepare bundles only, do not build APK
// --debug            Build and copy app-debug.apk instead of release APK
// --dry-run          Resolve lessons and write manifest only
// --zip-source=PATH  Override local ZIP folder, defaults to D:\chimple-zips
// --fail-on-missing  Stop if any bundle cannot be found
// --splash=PATH      Temporarily replace Android launch splash for this APK build

import JSZip from 'jszip';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type CliOptions = {
  language: string;
  avatar: string;
  courseIds: string[];
  subjectIds: string[];
  output: string;
  splash?: string;
  zipSource: string;
  skipBuild: boolean;
  dryRun: boolean;
  debug: boolean;
  force: boolean;
  failOnMissing: boolean;
  splashTime?: number;
  splashImage?: string;
};

type CourseRow = {
  id: string;
  code: string | null;
  name: string | null;
  subject_id?: string | null;
  framework_id?: string | null;
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

type SubjectLessonRow = {
  id: string;
  lesson_id: string | null;
  subject_id: string | null;
  framework_id: string | null;
  language_id: string | null;
  locale_id: string | null;
  sort_index: number | null;
};

type SkillLessonRow = {
  skill_id: string | null;
  lesson_id: string | null;
  language_id: string | null;
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
  subject_id?: string | null;
  language_id?: string | null;
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

type ImageManifestEntry = {
  table: string;
  rowId: string;
  column: string;
  originalUrl: string;
  localPath?: string;
  filePath?: string;
  status: 'already-present' | 'downloaded' | 'missing' | 'dry-run';
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
  imageAssetCount: number;
  imageAssets: ImageManifestEntry[];
  importJsonRewrittenForBuild: boolean;
  splash?: {
    source: string;
    target: string;
  };
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
const imageAssetsDir = path.join(
  repoRoot,
  'public',
  'assets',
  'open-apk-images',
);
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
const androidSplashPath = path.join(
  repoRoot,
  'android',
  'app',
  'src',
  'main',
  'res',
  'drawable',
  'new_splash.png',
);
const openApkSplashAssetPath = path.join(
  repoRoot,
  'public',
  'assets',
  'open-apk-splash.png',
);
const nativeRuntimePath = path.join(
  repoRoot,
  'src',
  'startup',
  'nativeRuntime.ts',
);
const splashImagePath = path.join(
  repoRoot,
  'android',
  'app',
  'src',
  'main',
  'res',
  'drawable',
  'new_splash.png',
);
const splashDurationPath = path.join(
  repoRoot,
  'android',
  'app',
  'src',
  'main',
  'res',
  'values',
  'integers.xml',
);
const maxAndroidInteger = 2_147_483_647;

const remoteBundleBaseUrls = [
  'https://pub-9d27d46558f64e93a979827424d3e766.r2.dev/',
  'https://chimple-bundles.web.app/',
  'https://cuba-stage-zip-bundle.web.app/',
  'https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/',
  'https://raw.githubusercontent.com/chimple/chimple-zips/main/',
];

const unique = <T>(items: T[]): T[] => Array.from(new Set(items));
const imageColumnNames = new Set(['image', 'image_url', 'thumbnail', 'icon']);

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

  const getPositiveInteger = (key: string): number | undefined => {
    const value = getString(key);
    if (value === undefined) {
      if (raw[key] !== undefined) {
        throw new Error(`--${key} requires a value in milliseconds`);
      }
      return undefined;
    }
    if (!/^\d+$/.test(value)) {
      throw new Error(`--${key} must be a whole number of milliseconds`);
    }

    const parsed = Number(value);
    if (
      !Number.isSafeInteger(parsed) ||
      parsed < 1 ||
      parsed > maxAndroidInteger
    ) {
      throw new Error(
        `--${key} must be between 1 and ${maxAndroidInteger} milliseconds`,
      );
    }

    return parsed;
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

  const subjectIds = (
    getString('subjects') ??
    getString('subject_ids') ??
    getString('subject-ids') ??
    ''
  )
    .split(',')
    .map((subjectId) => subjectId.trim())
    .filter(Boolean);

  const options: CliOptions = {
    language: getString('language') ?? '',
    avatar: getString('avatar') ?? '',
    courseIds,
    subjectIds,
    output: getString('output') ?? '',
    splash: getString('splash'),
    zipSource: getString('zip-source') ?? 'D:\\chimple-zips',
    skipBuild: raw['skip-build'] === true,
    dryRun: raw['dry-run'] === true,
    debug: raw.debug === true,
    force: raw.force === true,
    failOnMissing: raw['fail-on-missing'] === true,
    splashTime: getPositiveInteger('splashtime'),
    splashImage: getString('splashimage'),
  };

  if (raw.splashimage !== undefined && !options.splashImage) {
    throw new Error('--splashimage requires a PNG file path');
  }

  const missing = [
    ['language', options.language],
    ['avatar', options.avatar],
    [
      'course_ids or subjects',
      options.courseIds.length || options.subjectIds.length ? 'ok' : '',
    ],
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

const prepareSplashConfiguration = async (
  options: CliOptions,
): Promise<void> => {
  if (options.splashTime === undefined && !options.splashImage) return;

  let splashImageSource: string | undefined;
  if (options.splashImage) {
    splashImageSource = path.resolve(options.splashImage);
    if (path.extname(splashImageSource).toLowerCase() !== '.png') {
      throw new Error('--splashimage must point to a PNG file');
    }

    const stats = await fs.stat(splashImageSource);
    if (!stats.isFile()) {
      throw new Error(
        `--splashimage must point to a file: ${splashImageSource}`,
      );
    }
  }

  if (options.splashTime !== undefined) {
    const resourceContent = await fs.readFile(splashDurationPath, 'utf8');
    if (!resourceContent.includes('name="splash_screen_duration_ms"')) {
      throw new Error(
        `Splash duration resource is missing: ${splashDurationPath}`,
      );
    }
  }

  if (options.skipBuild || options.dryRun) {
    console.log(
      'Splash configuration was not changed because no APK is built.',
    );
    return;
  }

  if (
    splashImageSource &&
    path.resolve(splashImageSource).toLowerCase() !==
      path.resolve(splashImagePath).toLowerCase()
  ) {
    await fs.copyFile(splashImageSource, splashImagePath);
    console.log(`Replaced native splash image with ${splashImageSource}`);
  }

  if (options.splashTime !== undefined) {
    const resourceContent = await fs.readFile(splashDurationPath, 'utf8');
    const updatedResourceContent = resourceContent.replace(
      /(<integer name="splash_screen_duration_ms">)\d+(<\/integer>)/,
      `$1${options.splashTime}$2`,
    );
    if (updatedResourceContent === resourceContent) {
      throw new Error(
        `Unable to update splash duration: ${splashDurationPath}`,
      );
    }
    await fs.writeFile(splashDurationPath, updatedResourceContent);
    console.log(`Set native splash duration to ${options.splashTime}ms`);
  }
};

const isRemoteUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\//i.test(value.trim());

const getPublicImagePath = (url: string): string => {
  const parsedUrl = new URL(url);
  const extension = path.extname(parsedUrl.pathname).toLowerCase();
  const safeExtension =
    extension && extension.length <= 8
      ? extension.replace(/[^a-z0-9.]/g, '')
      : '';
  const hash = crypto
    .createHash('sha256')
    .update(url)
    .digest('hex')
    .slice(0, 24);
  return `/assets/open-apk-images/${hash}${safeExtension || '.bin'}`;
};

const downloadImageAsset = async (
  url: string,
): Promise<{
  localPath: string;
  filePath: string;
  status: 'already-present' | 'downloaded';
}> => {
  const localPath = getPublicImagePath(url);
  const filePath = path.join(repoRoot, 'public', localPath.replace(/^\//, ''));

  if (await fileExists(filePath)) {
    return { localPath, filePath, status: 'already-present' };
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
      return { localPath, filePath, status: 'downloaded' };
    } catch {
      // Try again; transient image CDN failures should not block the whole graph.
    }
  }

  throw new Error(`Unable to download image: ${url}`);
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

const replaceAndroidSplashForBuild = async (
  splash: string,
): Promise<() => Promise<void>> => {
  const sourcePath = path.isAbsolute(splash)
    ? splash
    : path.resolve(repoRoot, splash);

  if (!(await fileExists(sourcePath))) {
    throw new Error(`Splash image not found: ${sourcePath}`);
  }

  if (path.extname(sourcePath).toLowerCase() !== '.png') {
    throw new Error(`Splash image must be a .png file: ${sourcePath}`);
  }

  const originalSplash = await fs.readFile(androidSplashPath);
  await fs.copyFile(sourcePath, androidSplashPath);
  console.log(`Temporarily replaced Android splash with ${sourcePath}`);

  return async () => {
    await fs.writeFile(androidSplashPath, originalSplash);
    console.log('Restored original Android splash.');
  };
};

const prepareOpenApkSplashOverlayForBuild = async (
  splash: string,
): Promise<() => Promise<void>> => {
  const sourcePath = path.isAbsolute(splash)
    ? splash
    : path.resolve(repoRoot, splash);

  if (!(await fileExists(sourcePath))) {
    throw new Error(`Splash image not found: ${sourcePath}`);
  }

  if (path.extname(sourcePath).toLowerCase() !== '.png') {
    throw new Error(`Splash image must be a .png file: ${sourcePath}`);
  }

  const hadExistingAsset = await fileExists(openApkSplashAssetPath);
  const originalAsset = hadExistingAsset
    ? await fs.readFile(openApkSplashAssetPath)
    : null;
  const originalNativeRuntime = await fs.readFile(nativeRuntimePath, 'utf8');
  const updatedNativeRuntime = originalNativeRuntime
    .replace(
      'const OPEN_APK_SPLASH_ENABLED = false;',
      'const OPEN_APK_SPLASH_ENABLED = true;',
    )
    .replace(
      "const OPEN_APK_SPLASH_IMAGE_PATH = '';",
      "const OPEN_APK_SPLASH_IMAGE_PATH = '/assets/open-apk-splash.png';",
    );

  if (updatedNativeRuntime === originalNativeRuntime) {
    throw new Error(
      `Unable to enable open APK splash overlay in ${nativeRuntimePath}`,
    );
  }

  await fs.mkdir(path.dirname(openApkSplashAssetPath), { recursive: true });
  await fs.copyFile(sourcePath, openApkSplashAssetPath);
  await fs.writeFile(nativeRuntimePath, updatedNativeRuntime);
  console.log(`Prepared web splash overlay with ${sourcePath}`);

  return async () => {
    if (originalAsset) {
      await fs.writeFile(openApkSplashAssetPath, originalAsset);
    } else {
      await fs.rm(openApkSplashAssetPath, { force: true });
    }

    await fs.writeFile(nativeRuntimePath, originalNativeRuntime);
    console.log('Restored open APK splash overlay source files.');
  };
};

const isActiveRow = (row: { is_deleted?: unknown }): boolean =>
  row.is_deleted === false ||
  row.is_deleted === 0 ||
  row.is_deleted === '0' ||
  row.is_deleted == null;

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

const offlineGraphTables = [
  'framework',
  'domain',
  'competency',
  'outcome',
  'skill',
  'skill_lesson',
  'skill_relation',
  'subject_lesson',
] as const;

const validateOfflineGraphTables = (importJson: ImportJson): void => {
  const missingTables = offlineGraphTables.filter(
    (tableName) => !importJson.tables.some((table) => table.name === tableName),
  );
  if (missingTables.length > 0) {
    throw new Error(
      `import.json is missing offline PAL/assessment table(s): ${missingTables.join(', ')}`,
    );
  }
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

const resolveEnglishLanguageId = (importJson: ImportJson): string | null =>
  readRows<LanguageRow & { is_deleted?: unknown }>(importJson, 'language').find(
    (row) => isActiveRow(row) && row.code?.trim().toLowerCase() === 'en',
  )?.id ?? null;

const isMathsSubject = (subject: { name?: string | null }): boolean =>
  /\bmath(?:s|ematics)?\b/i.test(subject.name ?? '');

const resolveLessons = (
  importJson: ImportJson,
  courseIds: string[],
  requestedSubjectIds: string[],
  languageId: string | null,
) => {
  // Resolve the requested courses and combine lessons from the curriculum,
  // assessment, and PAL flows into one deduplicated offline lesson set.
  const courses = readRows<CourseRow & { is_deleted?: unknown }>(
    importJson,
    'course',
  ).filter(
    (course) =>
      isActiveRow(course) &&
      (courseIds.includes(course.id) ||
        (!!course.subject_id &&
          requestedSubjectIds.includes(course.subject_id))),
  );
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
  // Rule A: always resolve Course -> Chapter -> chapter_lesson for the base
  // curriculum, applying the requested chapter language.
  const lessons = readRows<LessonRow & { is_deleted?: unknown }>(
    importJson,
    'lesson',
  ).filter((lesson) => lessonIds.includes(lesson.id) && isActiveRow(lesson));

  const subjects = getSubjectRowsForCourses(importJson, courses);
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const englishLanguageId = resolveEnglishLanguageId(importJson);
  const candidateSubjectLessonRows = readRows<
    SubjectLessonRow & { is_deleted?: unknown }
  >(importJson, 'subject_lesson').filter((subjectLesson) => {
    if (!isActiveRow(subjectLesson) || !subjectLesson.subject_id) return false;
    if (!subjectIds.has(subjectLesson.subject_id)) return false;

    const matchingCourses = courses.filter(
      (candidate) =>
        candidate.subject_id === subjectLesson.subject_id &&
        (!candidate.framework_id ||
          !subjectLesson.framework_id ||
          subjectLesson.framework_id === candidate.framework_id),
    );
    if (matchingCourses.length === 0) return false;
    const subject = subjects.find(
      (candidate) => candidate.id === subjectLesson.subject_id,
    );

    return !!subject;
  });
  // Rule B: subject assessment lessons are always considered. Math language
  // filtering is applied after linked lesson rows have been resolved.

  const frameworkCourses = courses.filter(
    (course) => !!course.subject_id && !!course.framework_id,
  );
  // Rule C: only courses with framework_id enable PAL traversal through
  // Framework -> Domain -> Competency -> Outcome -> Skill -> skill_lesson.
  const frameworkCourseKeys = new Set(
    frameworkCourses.map(
      (course) => `${course.subject_id}:${course.framework_id}`,
    ),
  );
  const domains = readRows<{
    id: string;
    framework_id: string | null;
    subject_id: string | null;
    is_deleted?: unknown;
  }>(importJson, 'domain').filter(
    (domain) =>
      isActiveRow(domain) &&
      !!domain.subject_id &&
      !!domain.framework_id &&
      frameworkCourseKeys.has(`${domain.subject_id}:${domain.framework_id}`),
  );
  const domainIds = new Set(domains.map((domain) => domain.id));
  const subjectByDomainId = new Map(
    domains.map((domain) => [domain.id, domain.subject_id]),
  );
  const competencies = readRows<{
    id: string;
    domain_id: string | null;
    is_deleted?: unknown;
  }>(importJson, 'competency').filter(
    (row) =>
      isActiveRow(row) && !!row.domain_id && domainIds.has(row.domain_id),
  );
  const competencyIds = new Set(competencies.map((row) => row.id));
  const subjectByCompetencyId = new Map(
    competencies.map((row) => [
      row.id,
      subjectByDomainId.get(row.domain_id ?? ''),
    ]),
  );
  const outcomes = readRows<{
    id: string;
    competency_id: string | null;
    is_deleted?: unknown;
  }>(importJson, 'outcome').filter(
    (row) =>
      isActiveRow(row) &&
      !!row.competency_id &&
      competencyIds.has(row.competency_id),
  );
  const outcomeIds = new Set(outcomes.map((row) => row.id));
  const subjectByOutcomeId = new Map(
    outcomes.map((row) => [
      row.id,
      subjectByCompetencyId.get(row.competency_id ?? ''),
    ]),
  );
  const skills = readRows<{
    id: string;
    outcome_id: string | null;
    is_deleted?: unknown;
  }>(importJson, 'skill').filter(
    (row) =>
      isActiveRow(row) && !!row.outcome_id && outcomeIds.has(row.outcome_id),
  );
  const skillIds = new Set(skills.map((row) => row.id));
  const subjectBySkillId = new Map(
    skills.map((row) => [row.id, subjectByOutcomeId.get(row.outcome_id ?? '')]),
  );
  const skillLessons = readRows<
    SkillLessonRow & { id: string; is_deleted?: unknown }
  >(importJson, 'skill_lesson').filter(
    (row) => isActiveRow(row) && !!row.skill_id && skillIds.has(row.skill_id),
  );
  const skillRelations = readRows<{
    id: string;
    source_skill_id: string | null;
    target_skill_id: string | null;
    is_deleted?: unknown;
  }>(importJson, 'skill_relation').filter((row) => isActiveRow(row));
  const relatedSkillIds = new Set(skillIds);
  let relationChanged = true;
  while (relationChanged) {
    relationChanged = false;
    for (const relation of skillRelations) {
      if (
        (relation.source_skill_id &&
          relatedSkillIds.has(relation.source_skill_id)) ||
        (relation.target_skill_id &&
          relatedSkillIds.has(relation.target_skill_id))
      ) {
        for (const skillId of [
          relation.source_skill_id,
          relation.target_skill_id,
        ]) {
          if (skillId && !relatedSkillIds.has(skillId)) {
            relatedSkillIds.add(skillId);
            relationChanged = true;
          }
        }
      }
    }
  }
  const resolvedSkillLessons = skillLessons.filter(
    (row) => !!row.skill_id && relatedSkillIds.has(row.skill_id),
  );
  // PAL lessons are added to the same master set as curriculum and assessment
  // lessons; Set-based resolution below removes duplicates.
  const frameworkLessonIds = resolvedSkillLessons
    .map((row) => row.lesson_id)
    .filter((lessonId): lessonId is string => !!lessonId);
  const allLessonIds = unique([
    ...lessonIds,
    ...candidateSubjectLessonRows
      .map((subjectLesson) => subjectLesson.lesson_id)
      .filter((lessonId): lessonId is string => !!lessonId),
    ...frameworkLessonIds,
  ]);
  const allLessons = readRows<LessonRow & { is_deleted?: unknown }>(
    importJson,
    'lesson',
  ).filter((lesson) => allLessonIds.includes(lesson.id) && isActiveRow(lesson));

  const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));
  const desiredLanguageId = languageId ?? englishLanguageId;
  const subjectLessonRows = candidateSubjectLessonRows.filter((row) => {
    const subject = subjects.find(
      (candidate) => candidate.id === row.subject_id,
    );
    if (!isMathsSubject(subject ?? {})) return true;
    const lesson = row.lesson_id ? lessonById.get(row.lesson_id) : undefined;
    if (!lesson) return false;
    // For Math, both the subject_lesson mapping and linked lesson must match
    // the requested language. Null is the database's default English Math
    // language.
    const matchesMathLanguage = (rowLanguageId: string | null | undefined) =>
      desiredLanguageId === englishLanguageId
        ? rowLanguageId == null || rowLanguageId === desiredLanguageId
        : rowLanguageId === desiredLanguageId;
    return (
      matchesMathLanguage(row.language_id) &&
      matchesMathLanguage(lesson.language_id)
    );
  });
  const filteredFrameworkLessonIds = resolvedSkillLessons
    .filter((row) => {
      const lesson = row.lesson_id ? lessonById.get(row.lesson_id) : undefined;
      if (!lesson) return false;
      const subjectId = row.skill_id
        ? subjectBySkillId.get(row.skill_id)
        : lesson?.subject_id;
      const subject = subjectId
        ? subjects.find((candidate) => candidate.id === subjectId)
        : undefined;
      if (!isMathsSubject(subject ?? {})) return true;
      return desiredLanguageId === englishLanguageId
        ? lesson.language_id == null || lesson.language_id === desiredLanguageId
        : lesson.language_id === desiredLanguageId;
    })
    .map((row) => row.lesson_id)
    .filter((lessonId): lessonId is string => !!lessonId);
  const resolvedLessonIds = new Set([
    ...lessonIds,
    ...subjectLessonRows
      .map((row) => row.lesson_id)
      .filter((lessonId): lessonId is string => !!lessonId),
    ...filteredFrameworkLessonIds,
  ]);

  return {
    courses,
    chapters,
    chapterLessons,
    lessons: allLessons.filter((lesson) => resolvedLessonIds.has(lesson.id)),
    subjectLessonRows,
    skillLessons,
    palRowIds: {
      framework: new Set(
        frameworkCourses
          .map((course) => course.framework_id)
          .filter((frameworkId): frameworkId is string => !!frameworkId),
      ),
      domain: new Set(domains.map((row) => row.id)),
      competency: new Set(competencies.map((row) => row.id)),
      outcome: new Set(outcomes.map((row) => row.id)),
      skill: new Set(skills.map((row) => row.id)),
      skill_lesson: new Set(
        resolvedSkillLessons.map((row) => row.id).filter(Boolean),
      ),
      skill_relation: new Set(
        skillRelations
          .filter(
            (row) =>
              (row.source_skill_id &&
                relatedSkillIds.has(row.source_skill_id)) ||
              (row.target_skill_id && relatedSkillIds.has(row.target_skill_id)),
          )
          .map((row) => row.id)
          .filter(Boolean),
      ),
    },
  };
};

const getSubjectRowsForCourses = (
  importJson: ImportJson,
  courses: CourseRow[],
) => {
  const subjectIds = new Set(
    courses
      .map((course) => course.subject_id)
      .filter((subjectId): subjectId is string => !!subjectId),
  );

  if (subjectIds.size === 0) return [];

  return readRows<{ id: string; name: string | null; is_deleted?: unknown }>(
    importJson,
    'subject',
  ).filter((subject) => subjectIds.has(subject.id) && isActiveRow(subject));
};

const rewriteSelectedImageUrls = async (
  importJson: ImportJson,
  selectedRowsByTable: Map<string, Set<string>>,
  dryRun: boolean,
): Promise<ImageManifestEntry[]> => {
  const imageAssets: ImageManifestEntry[] = [];
  const downloadCache = new Map<
    string,
    Pick<ImageManifestEntry, 'localPath' | 'filePath' | 'status' | 'error'>
  >();

  for (const table of importJson.tables) {
    const selectedIds = selectedRowsByTable.get(table.name);
    if (!selectedIds || selectedIds.size === 0) continue;

    const idIndex = table.schema.findIndex((column) => column.column === 'id');
    if (idIndex < 0) continue;

    const imageColumnIndexes = table.schema
      .map((column, index) => ({ column: column.column, index }))
      .filter(({ column }) => imageColumnNames.has(column));

    if (imageColumnIndexes.length === 0) continue;

    for (const row of table.values ?? []) {
      const rowId = String(row[idIndex] ?? '');
      if (!selectedIds.has(rowId)) continue;

      for (const { column, index } of imageColumnIndexes) {
        const originalUrl = row[index];
        if (!isRemoteUrl(originalUrl)) continue;

        if (dryRun) {
          imageAssets.push({
            table: table.name,
            rowId,
            column,
            originalUrl,
            localPath: getPublicImagePath(originalUrl),
            status: 'dry-run',
          });
          continue;
        }

        let cached = downloadCache.get(originalUrl);
        if (!cached) {
          try {
            cached = await downloadImageAsset(originalUrl);
          } catch (error: any) {
            cached = {
              status: 'missing',
              error: error?.message ?? String(error),
            };
          }
          downloadCache.set(originalUrl, cached);
        }

        imageAssets.push({
          table: table.name,
          rowId,
          column,
          originalUrl,
          ...cached,
        });

        if (cached.localPath) {
          row[index] = cached.localPath;
        }
      }
    }
  }

  return imageAssets;
};

const getBundleId = (lesson: LessonRow): string | null =>
  // Prefer the LIDO bundle ID and fall back to the Cocos bundle ID.
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

const findApk = async (variant: 'debug' | 'release'): Promise<string> => {
  const apkDir = path.join(
    repoRoot,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    variant,
  );
  const entries = await fs.readdir(apkDir, { withFileTypes: true });
  const apks = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.apk'))
    .map((entry) => path.join(apkDir, entry.name));

  if (apks.length < 1) {
    throw new Error(`No ${variant} APK found in ${apkDir}`);
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

const buildAndCopyApk = async (
  
  outputDir: string,
  splash?: string,
,
  debug: boolean,
): Promise<void> => {
  let restoreOpenApkSplash: (() => Promise<void>) | null = null;
  let restoreSplash: (() => Promise<void>) | null = null;
  try {
    if (splash) {
      restoreOpenApkSplash = await prepareOpenApkSplashOverlayForBuild(splash);
    }

    run('npm', ['run', 'build:android'], repoRoot);

    if (splash) {
      restoreSplash = await replaceAndroidSplashForBuild(splash);
    } else {
      console.warn(
        'No --splash image provided. APK will use the existing Android splash resource.',
      );
    }

    run(
      process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    // Build a debug APK when --debug is supplied; otherwise preserve the
    // standard release APK flow.
      splash ? ['assembleRelease', '--rerun-tasks'] : [debug ? 'assembleDebug' : 'assembleRelease'],
      path.join(repoRoot, 'android'),
    );
  } finally {
    if (restoreSplash) {
      await restoreSplash();
    }
    if (restoreOpenApkSplash) {
      await restoreOpenApkSplash();
    }
  }

  await fs.mkdir(outputDir, { recursive: true });
  const apkPath = await findApk(debug ? 'debug' : 'release');
  const targetPath = path.join(outputDir, path.basename(apkPath));
  await fs.copyFile(apkPath, targetPath);
  console.log(`APK copied to ${targetPath}`);
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));

  await fs.mkdir(lessonBundlesDir, { recursive: true });
  await fs.mkdir(imageAssetsDir, { recursive: true });
  const originalImportJsonContent = await fs.readFile(importJsonPath, 'utf8');
  const importJson = JSON.parse(originalImportJsonContent) as ImportJson;
  validateOfflineGraphTables(importJson);
  for (const table of importJson.tables) {
    console.warn(
      `[OPEN_APK][TABLE] name=${table.name} columns=${table.schema.length} rows=${table.values?.length ?? 0}`,
    );
  }
  const avatar = await prepareAvatar(options.avatar);

  const language = resolveLanguage(importJson, options.language);
  const courseIds = options.courseIds;

  console.log(`Resolving lessons for course IDs: ${courseIds.join(', ')}`);
  const {
    courses,
    chapters,
    chapterLessons,
    lessons,
    subjectLessonRows,
    palRowIds,
  } = await resolveLessons(
    importJson,
    courseIds,
    options.subjectIds,
    language?.id ?? null,
  );
  const subjects = getSubjectRowsForCourses(importJson, courses);

  for (const chapterLesson of chapterLessons) {
    const lesson = lessons.find(
      (candidate) => candidate.id === chapterLesson.lesson_id,
    );
    console.warn(
      `[OPEN_APK][CHAPTER][LESSON] name=${lesson?.name ?? '(missing)'} id=${chapterLesson.lesson_id ?? 'null'} chapterId=${chapterLesson.chapter_id ?? 'null'} lidoLessonId=${lesson?.lido_lesson_id ?? 'null'} cocosLessonId=${lesson?.cocos_lesson_id ?? 'null'} playableId=${lesson ? (getBundleId(lesson) ?? 'null') : 'null'}`,
    );
  }

  console.log(`Subject lessons: ${subjectLessonRows.length}`);
  for (const subjectLesson of subjectLessonRows) {
    const lesson = lessons.find(
      (candidate) => candidate.id === subjectLesson.lesson_id,
    );
    console.log(
      `Subject lesson: ${lesson?.name ?? '(unnamed)'} (${subjectLesson.lesson_id ?? 'missing lesson id'})`,
    );
  }

  const selectedRowsByTable = new Map<string, Set<string>>([
    ['subject', new Set(subjects.map((subject) => subject.id))],
    ['course', new Set(courses.map((course) => course.id))],
    ['chapter', new Set(chapters.map((chapter) => chapter.id))],
    ['lesson', new Set(lessons.map((lesson) => lesson.id))],
    // Select resolved PAL and assessment rows for image rewriting. import.json
    // is not pruned, so raw graph rows remain available to offline SQLite.
    ['framework', palRowIds.framework],
    ['domain', palRowIds.domain],
    ['competency', palRowIds.competency],
    ['outcome', palRowIds.outcome],
    ['skill', palRowIds.skill],
    ['skill_lesson', palRowIds.skill_lesson],
    ['skill_relation', palRowIds.skill_relation],
    ['subject_lesson', new Set(subjectLessonRows.map((row) => row.id))],
  ]);
  for (const [tableName, rowIds] of selectedRowsByTable) {
    console.warn(
      `[OPEN_APK][TABLE][SELECTED] name=${tableName} rows=${rowIds.size}`,
    );
  }

  const imageAssets = await rewriteSelectedImageUrls(
    importJson,
    selectedRowsByTable,
    options.dryRun,
  );
  const importJsonNeedsRewrite =
    !options.dryRun &&
    !options.skipBuild &&
    imageAssets.some((asset) => asset.localPath);

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
    imageAssetCount: imageAssets.length,
    imageAssets,
    importJsonRewrittenForBuild: importJsonNeedsRewrite,
    splash: options.splash
      ? {
          source: path.isAbsolute(options.splash)
            ? options.splash
            : path.resolve(repoRoot, options.splash),
          target: androidSplashPath,
        }
      : undefined,
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

  const missingImages = imageAssets.filter(
    (asset) => asset.status === 'missing',
  );
  if (missingImages.length > 0) {
    console.warn(
      `Missing image assets: ${missingImages
        .map((asset) => `${asset.table}.${asset.column}:${asset.rowId}`)
        .join(', ')}`,
    );
  }

  console.log(
    `Prepared ${bundles.length} bundles: ${bundles.filter((bundle) => bundle.status === 'extracted').length} extracted, ${bundles.filter((bundle) => bundle.status === 'already-extracted').length} already present.`,
  );
  console.log(
    `Prepared ${imageAssets.length} image assets: ${imageAssets.filter((asset) => asset.status === 'downloaded').length} downloaded, ${imageAssets.filter((asset) => asset.status === 'already-present').length} already present.`,
  );

  await prepareSplashConfiguration(options);

  if (options.skipBuild || options.dryRun) {
    console.log('Skipping APK build.');
    return;
  }

  try {
    if (importJsonNeedsRewrite) {
      await fs.writeFile(
        importJsonPath,
        `${JSON.stringify(importJson, null, 2)}\n`,
      );
      console.log(
        'Temporarily rewrote public/databases/import.json with bundled image paths for this APK build.',
      );
    }

    await buildAndCopyApk(path.resolve(options.output), options.splash);
  } finally {
    if (importJsonNeedsRewrite) {
      await fs.writeFile(importJsonPath, originalImportJsonContent);
      console.log('Restored original public/databases/import.json.');
    }
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
