// - Copy/extract lesson ZIPs from local D:\chimple-zips first, then fall back to prod remote bundle URLs
// - Add full-path mascot .riv input and copy it into bundled app assets
// - Continue APK builds while reporting missing bundles unless --fail-on-missing is passed

// Run locally:

// PowerShell runner (the app tsconfig targets ESM, so ts-node needs a Node override):
// $env:TS_NODE_COMPILER_OPTIONS = '{"module":"CommonJS","moduleResolution":"node"}'
// node -r ts-node/register scripts/build-open-apk.ts --supabase-url "$env:SUPABASE_URL" --supabase-key "$env:SUPABASE_READ_KEY" --language=pt --avatar=G:\mascot_with_accessories_sep_2025.riv --course_ids=0937c891-9bed-4fa2-b422-ad3bee7f4569 --output=G:\open-apk-output
// node -r ts-node/register scripts/build-open-apk.ts --supabase-url "$env:SUPABASE_URL" --supabase-key "$env:SUPABASE_READ_KEY" --language=en --subjects=math-subject-id --avatar=G:\mascot_with_accessories_sep_2025.riv --output=G:\open-apk-output
// Use a read-only key with suitable RLS; CLI argument values can appear in process listings.

// Optional flags:

// --skip-build       Prepare bundles only, do not build APK
// --debug            Build and copy app-debug.apk instead of release APK
// --dry-run          Resolve lessons and write manifest only
// --supabase-url     Supabase project URL used to resolve course metadata
// --supabase-key     Supabase read key used to resolve course metadata
// --zip-source=PATH  Override local ZIP folder, defaults to D:\chimple-zips
// --fail-on-missing  Stop if any bundle cannot be found
// --splashtime=MS    Set the native splash duration in milliseconds
// --splashimage=PATH Replace the native splash PNG for this APK build

import JSZip from 'jszip';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import type { Database } from '../src/services/database';
import type { TableTypes } from '../src/common/constants/schema';

type CliOptions = {
  language: string;
  avatar: string;
  supabaseUrl: string;
  supabaseKey: string;
  courseIds: string[];
  subjectIds: string[];
  output: string;
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

type CatalogTableName =
  | 'language'
  | 'course'
  | 'chapter'
  | 'chapter_lesson'
  | 'lesson';

type CatalogRows = {
  [Table in CatalogTableName]: TableTypes<Table>[];
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
  status: 'already-packaged' | 'packaged' | 'missing' | 'dry-run';
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
  bundles: BundleManifestEntry[];
};

const repoRoot = process.cwd();
const lessonBundlesDir = path.join(
  repoRoot,
  'public',
  'assets',
  'lessonBundles',
);
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
    supabaseUrl: getString('supabase-url') ?? getString('supabase_url') ?? '',
    supabaseKey: getString('supabase-key') ?? getString('supabase_key') ?? '',
    courseIds,
    subjectIds,
    output: getString('output') ?? '',
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
    ['supabase-url', options.supabaseUrl],
    ['supabase-key', options.supabaseKey],
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

  let supabaseUrl: URL;
  try {
    supabaseUrl = new URL(options.supabaseUrl);
  } catch {
    throw new Error('--supabase-url must be a valid HTTP or HTTPS URL');
  }
  if (!['http:', 'https:'].includes(supabaseUrl.protocol)) {
    throw new Error('--supabase-url must be a valid HTTP or HTTPS URL');
  }

  return options;
};

const supabasePageSize = 1000;
const supabaseFilterBatchSize = 100;

type SupabasePage<Row> = {
  data: Row[] | null;
  error: { message: string } | null;
};

const fetchAllPages = async <Row>(
  context: string,
  fetchPage: (from: number, to: number) => PromiseLike<SupabasePage<Row>>,
): Promise<Row[]> => {
  const rows: Row[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await fetchPage(
      offset,
      offset + supabasePageSize - 1,
    );
    if (error) {
      throw new Error(`Supabase query failed for ${context}: ${error.message}`);
    }

    const pageRows = data ?? [];
    rows.push(...pageRows);
    if (pageRows.length < supabasePageSize) break;
    offset += supabasePageSize;
  }

  return rows;
};

const fetchRowsByValues = async <Row>(
  context: string,
  values: string[],
  fetchPage: (
    values: string[],
    from: number,
    to: number,
  ) => PromiseLike<SupabasePage<Row>>,
): Promise<Row[]> => {
  const rows: Row[] = [];
  const uniqueValues = unique(values);

  for (
    let batchStart = 0;
    batchStart < uniqueValues.length;
    batchStart += supabaseFilterBatchSize
  ) {
    const batch = uniqueValues.slice(
      batchStart,
      batchStart + supabaseFilterBatchSize,
    );
    let offset = 0;

    while (true) {
      const { data, error } = await fetchPage(
        batch,
        offset,
        offset + supabasePageSize - 1,
      );
      if (error) {
        throw new Error(
          `Supabase query failed for ${context}: ${error.message}`,
        );
      }

      const pageRows = data ?? [];
      rows.push(...pageRows);
      if (pageRows.length < supabasePageSize) break;
      offset += supabasePageSize;
    }
  }

  return rows;
};

const fetchCatalogRows = async (
  supabase: SupabaseClient<Database>,
  requestedCourseIds: string[],
  requestedSubjectIds: string[],
  languageCode: string,
): Promise<CatalogRows> => {
  const [languages, coursesById, coursesBySubject] = await Promise.all([
    fetchAllPages('language', (from, to) =>
      supabase
        .from('language')
        .select('*')
        .ilike('code', languageCode.trim())
        .order('id')
        .range(from, to),
    ),
    fetchRowsByValues('course.id', requestedCourseIds, (values, from, to) =>
      supabase
        .from('course')
        .select('*')
        .in('id', values)
        .order('id')
        .range(from, to),
    ),
    fetchRowsByValues(
      'course.subject_id',
      requestedSubjectIds,
      (values, from, to) =>
        supabase
          .from('course')
          .select('*')
          .in('subject_id', values)
          .order('id')
          .range(from, to),
    ),
  ]);
  const courses = Array.from(
    new Map(
      [...coursesById, ...coursesBySubject].map((course) => [
        course.id,
        course,
      ]),
    ).values(),
  );
  const courseIds = courses
    .filter((course) => isActiveRow(course))
    .map((course) => course.id);

  const chapters = await fetchRowsByValues(
    'chapter.course_id',
    courseIds,
    (values, from, to) =>
      supabase
        .from('chapter')
        .select('*')
        .in('course_id', values)
        .order('id')
        .range(from, to),
  );
  const chapterLessons = await fetchRowsByValues(
    'chapter_lesson.chapter_id',
    chapters.map((chapter) => chapter.id),
    (values, from, to) =>
      supabase
        .from('chapter_lesson')
        .select('*')
        .in('chapter_id', values)
        .order('id')
        .range(from, to),
  );
  const lessonIds = unique(
    chapterLessons.map((chapterLesson) => chapterLesson.lesson_id),
  );
  const lessons = await fetchRowsByValues(
    'lesson.id',
    lessonIds,
    (values, from, to) =>
      supabase
        .from('lesson')
        .select('*')
        .in('id', values)
        .order('id')
        .range(from, to),
  );

  return {
    language: languages,
    course: courses,
    chapter: chapters,
    chapter_lesson: chapterLessons,
    lesson: lessons,
  };
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

const isActiveRow = (row: { is_deleted?: boolean | null }): boolean =>
  row.is_deleted !== true;

const readRows = <Table extends CatalogTableName>(
  catalogRows: CatalogRows,
  tableName: Table,
): CatalogRows[Table] => catalogRows[tableName];

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
  catalogRows: CatalogRows,
  languageCode: string,
): LanguageRow | null => {
  const language = readRows(catalogRows, 'language').find(
    (row) =>
      isActiveRow(row) &&
      row.code?.trim().toLowerCase() === languageCode.trim().toLowerCase(),
  );

  if (!language?.id) {
    console.warn(
      `Language code not found in Supabase: ${languageCode}. Continuing without chapter_lesson language filtering.`,
    );
    return null;
  }

  return language;
};

const resolveLessons = (
  catalogRows: CatalogRows,
  courseIds: string[],
  requestedSubjectIds: string[],
  languageId: string | null,
) => {
  // Resolve only the selected course hierarchy; assessment and PAL links are
  // intentionally excluded so they cannot add unrelated lesson bundles.
  const courses = readRows(catalogRows, 'course').filter(
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

  const foundSubjectIds = new Set(
    courses
      .map((course) => course.subject_id)
      .filter((subjectId): subjectId is string => !!subjectId),
  );
  const missingSubjectIds = requestedSubjectIds.filter(
    (subjectId) => !foundSubjectIds.has(subjectId),
  );
  if (missingSubjectIds.length > 0) {
    throw new Error(
      `Subject ID(s) not linked to an active course: ${missingSubjectIds.join(', ')}`,
    );
  }

  const selectedCourseIds = courses.map((course) => course.id);

  const chapters = readRows(catalogRows, 'chapter')
    .filter(
      (chapter) =>
        !!chapter.course_id &&
        selectedCourseIds.includes(chapter.course_id) &&
        isActiveRow(chapter),
    )
    .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));

  const chapterIds = unique(chapters.map((chapter) => chapter.id));
  // Keep the requested language (and DB-default null rows) from the selected
  // chapter links so this course stays scoped to its own lesson sequence.
  const chapterLessons = readRows(catalogRows, 'chapter_lesson')
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
  const lessons = readRows(catalogRows, 'lesson').filter(
    (lesson) => lessonIds.includes(lesson.id) && isActiveRow(lesson),
  );

  return {
    courses,
    chapters,
    chapterLessons,
    lessons,
  };
};

const getSubjectIdsForCourses = (courses: CourseRow[]): string[] =>
  unique(
    courses
      .map((course) => course.subject_id)
      .filter((subjectId): subjectId is string => !!subjectId),
  );

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

// Keep one ZIP entry per lesson bundle; Lido consumes it directly offline.
const packageZipForBundle = async (
  zipData: Buffer,
  bundleId: string,
  dbVersion: number,
): Promise<void> => {
  const finalDir = path.join(lessonBundlesDir, bundleId);
  const finalZipPath = path.join(lessonBundlesDir, `${bundleId}.zip`);
  const zip = await JSZip.loadAsync(zipData);
  const files = Object.values(zip.files).filter((file) => !file.dir);
  const normalizedNames = files.map((file) => file.name.replace(/\\/g, '/'));
  const commonRoot = detectCommonRoot(normalizedNames, bundleId);
  const packagedZip = new JSZip();

  for (const file of files) {
    const normalizedName = file.name.replace(/\\/g, '/');
    const relativeName = commonRoot
      ? normalizedName.slice(commonRoot.length)
      : normalizedName;

    if (
      !relativeName ||
      relativeName.startsWith('../') ||
      relativeName.startsWith('dist/')
    ) {
      continue;
    }

    packagedZip.file(relativeName, await file.async('nodebuffer'));
  }

  // Standard Lido lessons use index.xml, while Live Quiz bundles use
  // config.json. Both formats are valid offline lesson bundles.
  if (!packagedZip.file('index.xml') && !packagedZip.file('config.json')) {
    throw new Error(
      `Packaged bundle ${bundleId} contains neither index.xml nor config.json`,
    );
  }

  packagedZip.file('.version', String(dbVersion));
  const packagedData = await packagedZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  await fs.rm(finalDir, { recursive: true, force: true });
  await fs.writeFile(finalZipPath, packagedData);
};

const prepareBundle = async (
  bundleId: string,
  lessonIds: string[],
  dbVersion: number,
  options: CliOptions,
): Promise<BundleManifestEntry> => {
  const finalZipPath = path.join(lessonBundlesDir, `${bundleId}.zip`);
  if (await fileExists(finalZipPath)) {
    return {
      bundleId,
      lessonIds,
      status: 'already-packaged',
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
    await packageZipForBundle(zipData, bundleId, dbVersion);
    return {
      bundleId,
      lessonIds,
      status: 'packaged',
      source: 'local',
      zipPath: localZipPath,
      dbVersion,
    };
  }

  const remoteZip = await downloadZip(bundleId);
  if (remoteZip) {
    await packageZipForBundle(remoteZip.data, bundleId, dbVersion);
    return {
      bundleId,
      lessonIds,
      status: 'packaged',
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
  debug: boolean,
): Promise<void> => {
  run('npm', ['run', 'build:android'], repoRoot);
  run(
    process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    // Build a debug APK when --debug is supplied; otherwise preserve the
    // standard release APK flow.
    [debug ? 'assembleDebug' : 'assembleRelease'],
    path.join(repoRoot, 'android'),
  );

  await fs.mkdir(outputDir, { recursive: true });
  const apkPath = await findApk(debug ? 'debug' : 'release');
  const targetPath = path.join(outputDir, path.basename(apkPath));
  await fs.copyFile(apkPath, targetPath);
  console.log(`APK copied to ${targetPath}`);
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));

  await fs.mkdir(imageAssetsDir, { recursive: true });
  const originalImportJsonContent = await fs.readFile(importJsonPath, 'utf8');
  const importJson = JSON.parse(originalImportJsonContent) as ImportJson;
  validateOfflineGraphTables(importJson);
  for (const table of importJson.tables) {
    console.warn(
      `[OPEN_APK][TABLE] name=${table.name} columns=${table.schema.length} rows=${table.values?.length ?? 0}`,
    );
  }

  const supabase = createClient<Database>(
    options.supabaseUrl,
    options.supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  const catalogRows = await fetchCatalogRows(
    supabase,
    options.courseIds,
    options.subjectIds,
    options.language,
  );
  const avatar = await prepareAvatar(options.avatar);

  const language = resolveLanguage(catalogRows, options.language);

  console.log(
    `Resolving lessons for course IDs: ${options.courseIds.join(', ') || '(from selected subjects)'}`,
  );
  const { courses, chapters, chapterLessons, lessons } = await resolveLessons(
    catalogRows,
    options.courseIds,
    options.subjectIds,
    language?.id ?? null,
  );
  const courseIds = courses.map((course) => course.id);
  const subjectIds = getSubjectIdsForCourses(courses);

  for (const chapterLesson of chapterLessons) {
    const lesson = lessons.find(
      (candidate) => candidate.id === chapterLesson.lesson_id,
    );
    console.warn(
      `[OPEN_APK][CHAPTER][LESSON] name=${lesson?.name ?? '(missing)'} id=${chapterLesson.lesson_id ?? 'null'} chapterId=${chapterLesson.chapter_id ?? 'null'} lidoLessonId=${lesson?.lido_lesson_id ?? 'null'} cocosLessonId=${lesson?.cocos_lesson_id ?? 'null'} playableId=${lesson ? (getBundleId(lesson) ?? 'null') : 'null'}`,
    );
  }

  const selectedRowsByTable = new Map<string, Set<string>>([
    ['subject', new Set(subjectIds)],
    ['course', new Set(courses.map((course) => course.id))],
    ['chapter', new Set(chapters.map((chapter) => chapter.id))],
    ['lesson', new Set(lessons.map((lesson) => lesson.id))],
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

  // Delay deleting old bundles until Supabase has returned and resolved the
  // requested graph, so invalid credentials or IDs preserve the last build.
  if (!options.dryRun) {
    await fs.rm(lessonBundlesDir, { recursive: true, force: true });
  }
  await fs.mkdir(lessonBundlesDir, { recursive: true });

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
    `Prepared ${bundles.length} bundles: ${bundles.filter((bundle) => bundle.status === 'packaged').length} packaged, ${bundles.filter((bundle) => bundle.status === 'already-packaged').length} already present.`,
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

    await buildAndCopyApk(path.resolve(options.output), options.debug);
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
