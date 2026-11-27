// - Package lesson ZIPs referenced by the selected workbook sheets
// - Add full-path mascot .riv input and copy it into bundled app assets
// - Continue APK builds while reporting missing bundles unless --fail-on-missing is passed

// Run locally:

// $env:TS_NODE_COMPILER_OPTIONS = '{"module":"CommonJS","moduleResolution":"node"}'
// node -r ts-node/register scripts/respect-openeel/respect-build-open-apk.ts --avatar=G:\mascot_with_accessories_sep_2025.riv --output=G:\open-apk-output

// Optional flags:

// --skip-build       Prepare bundles only, do not build APK
// --debug            Build and copy app-debug.apk instead of release APK
// --dry-run          Resolve selected workbook rows and write manifest only
// --sheet-names      Comma-separated workbook sheet names or numbers; omit to choose in terminal
// --zip-source=PATH  Override local ZIP folder, defaults to D:\chimple-zips
// --fail-on-missing  Stop if any bundle cannot be found
// --splashtime=MS    Set the native splash duration in milliseconds
// --splashimage=PATH Replace the native splash PNG for this APK build

import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

type CliOptions = {
  sheetNames: string[];
  avatar: string;
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

type ImportJsonColumn = {
  column: string;
  value: string;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type ImportJsonTable = {
  name: string;
  schema: ImportJsonColumn[];
  values?: JsonValue[][];
};

type ImportJson = {
  tables: ImportJsonTable[];
};

type WorkbookLessonCell = string | number | boolean | null | undefined;

type WorkbookLessonRow = {
  lesson_id?: WorkbookLessonCell;
  chapter_id?: WorkbookLessonCell;
  title?: WorkbookLessonCell;
  lesson_name?: WorkbookLessonCell;
  lido_lesson_id?: WorkbookLessonCell;
  cocos_lesson_code?: WorkbookLessonCell;
  'Asset Link'?: WorkbookLessonCell;
};

type SelectedWorkbookLesson = {
  sheetName: string;
  lessonId: string;
  chapterId: string;
  bundleId: string;
  assetLink: string;
  zipFileName: string;
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
  selectedSheets: string[];
  avatar: string;
  pathwayMascot: string;
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
const importJsonPath = path.join(
  repoRoot,
  'public',
  'databases',
  'import.json',
);
const workbookPath = path.join(
  repoRoot,
  'scripts',
  'respect-openeel',
  'Respect Course Latest All Course Details From dashboard.xlsx',
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

  const sheetNames = (getString('sheet-names') ?? '')
    .split(',')
    .map((sheetName) => sheetName.trim())
    .filter(Boolean);

  const options: CliOptions = {
    sheetNames,
    avatar: getString('avatar') ?? '',
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
    ['avatar', options.avatar],
    ['output', options.output],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => `--${key}`);

  if (missing.length > 0) {
    throw new Error(`Missing required argument(s): ${missing.join(', ')}`);
  }

  return options;
};

const parseSheetSelection = (
  selection: string,
  availableSheetNames: string[],
): string[] => {
  const requestedNames = selection
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  if (requestedNames.length === 0) {
    throw new Error('Select at least one workbook sheet.');
  }
  if (requestedNames.some((name) => name.toLowerCase() === 'all')) {
    if (requestedNames.length !== 1) {
      throw new Error('Use "all" by itself to select every workbook sheet.');
    }
    return [...availableSheetNames];
  }

  const selectedNames = requestedNames.map((requestedName) => {
    if (/^\d+$/.test(requestedName)) {
      const sheetIndex = Number(requestedName) - 1;
      const sheetName = availableSheetNames[sheetIndex];
      if (sheetName) return sheetName;
    } else {
      const matchingName = availableSheetNames.find(
        (sheetName) => sheetName.toLowerCase() === requestedName.toLowerCase(),
      );
      if (matchingName) return matchingName;
    }

    throw new Error(
      `Unknown sheet selection "${requestedName}". Use a listed number or exact sheet name.`,
    );
  });

  return unique(selectedNames);
};

const chooseWorkbookSheets = async (
  availableSheetNames: string[],
  requestedSheetNames: string[],
): Promise<string[]> => {
  if (availableSheetNames.length === 0) {
    throw new Error(`Workbook contains no sheets: ${workbookPath}`);
  }
  if (requestedSheetNames.length > 0) {
    return parseSheetSelection(
      requestedSheetNames.join(','),
      availableSheetNames,
    );
  }
  if (!process.stdin.isTTY) {
    throw new Error(
      'No interactive terminal is available. Pass --sheet-names with comma-separated sheet names or numbers.',
    );
  }

  console.log('Available workbook sheets:');
  availableSheetNames.forEach((sheetName, index) => {
    console.log(`${index + 1}. ${sheetName}`);
  });
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const selection = await prompt.question(
      'Select sheet number(s) or exact sheet name(s), comma separated (or "all"): ',
    );
    return parseSheetSelection(selection, availableSheetNames);
  } finally {
    prompt.close();
  }
};

const readWorkbookLessons = (
  workbook: XLSX.WorkBook,
  selectedSheetNames: string[],
): SelectedWorkbookLesson[] => {
  const selectedLessons: SelectedWorkbookLesson[] = [];

  for (const sheetName of selectedSheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Selected workbook sheet is missing: ${sheetName}`);
    }

    const rows = XLSX.utils.sheet_to_json<WorkbookLessonRow>(worksheet, {
      defval: '',
    });
    rows.forEach((row, index) => {
      const lessonId = String(row.lesson_id ?? '').trim();
      const chapterId = String(row.chapter_id ?? '').trim();
      const bundleId = String(
        row.lido_lesson_id || row.cocos_lesson_code || '',
      ).trim();
      const assetLink = String(row['Asset Link'] ?? '').trim();

      if (!lessonId || !chapterId || !bundleId || !assetLink) {
        throw new Error(
          `Incomplete lesson row in sheet "${sheetName}" near Excel row ${index + 2}; lesson_id, chapter_id, a LIDO/Cocos bundle ID, and Asset Link are required.`,
        );
      }

      let assetUrl: URL;
      try {
        assetUrl = new URL(assetLink);
      } catch {
        throw new Error(
          `Invalid Asset Link in sheet "${sheetName}" near Excel row ${index + 2}; expected an HTTP(S) ZIP URL.`,
        );
      }
      if (
        !['http:', 'https:'].includes(assetUrl.protocol) ||
        assetUrl.username ||
        assetUrl.password
      ) {
        throw new Error(
          `Invalid Asset Link in sheet "${sheetName}" near Excel row ${index + 2}; expected an HTTP(S) ZIP URL without embedded credentials.`,
        );
      }

      let zipFileName: string;
      try {
        zipFileName = decodeURIComponent(
          path.posix.basename(assetUrl.pathname),
        );
      } catch {
        throw new Error(
          `Invalid ZIP filename in Asset Link in sheet "${sheetName}" near Excel row ${index + 2}.`,
        );
      }
      if (
        !zipFileName ||
        zipFileName !== path.posix.basename(zipFileName) ||
        zipFileName !== path.win32.basename(zipFileName) ||
        !/\.zip$/i.test(zipFileName)
      ) {
        throw new Error(
          `Asset Link in sheet "${sheetName}" near Excel row ${index + 2} must point to a .zip file.`,
        );
      }

      selectedLessons.push({
        sheetName,
        lessonId,
        chapterId,
        bundleId,
        assetLink,
        zipFileName,
      });
    });
  }

  if (selectedLessons.length === 0) {
    throw new Error('The selected workbook sheets contain no lesson rows.');
  }

  return selectedLessons;
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

const isRemoteUrl = (value: JsonValue | undefined): value is string =>
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

const resolveWorkbookSelection = (
  workbookLessons: SelectedWorkbookLesson[],
): {
  chapterIds: string[];
  chapterLessonKeys: string[];
  lessonIds: string[];
} => {
  if (workbookLessons.length === 0) {
    throw new Error('The selected workbook sheets contain no lesson rows.');
  }

  return {
    chapterIds: unique(workbookLessons.map((lesson) => lesson.chapterId)),
    chapterLessonKeys: unique(
      workbookLessons.map((lesson) =>
        JSON.stringify([lesson.chapterId, lesson.lessonId]),
      ),
    ),
    lessonIds: unique(workbookLessons.map((lesson) => lesson.lessonId)),
  };
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
          } catch (error) {
            cached = {
              status: 'missing',
              error: error instanceof Error ? error.message : String(error),
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

const downloadZip = async (
  assetLinks: string[],
  zipFileName: string,
): Promise<{ data: Buffer; sourceUrl: string } | null> => {
  const zipUrls = unique([
    ...assetLinks,
    ...remoteBundleBaseUrls.map((baseUrl) =>
      new URL(
        zipFileName,
        baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      ).toString(),
    ),
  ]);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    for (const zipUrl of zipUrls) {
      try {
        const displayUrl = new URL(zipUrl);
        displayUrl.search = '';
        displayUrl.hash = '';
        console.log(`Trying remote bundle: ${displayUrl.toString()}`);
        const response = await fetch(zipUrl);
        if (!response.ok) continue;
        return {
          data: Buffer.from(await response.arrayBuffer()),
          sourceUrl: displayUrl.toString(),
        };
      } catch {
        console.warn(`Remote bundle failed: ${zipFileName}`);
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
  assetLinks: string[],
  zipFileName: string,
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

  for (const localZipName of unique([zipFileName, `${bundleId}.zip`])) {
    const localZipPath = path.join(options.zipSource, localZipName);
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
  }

  const remoteZip = await downloadZip(assetLinks, zipFileName);
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
  const workbook = XLSX.readFile(workbookPath);
  const selectedSheetNames = await chooseWorkbookSheets(
    workbook.SheetNames,
    options.sheetNames,
  );
  const selectedWorkbookLessons = readWorkbookLessons(
    workbook,
    selectedSheetNames,
  );
  // An Asset Link identifies the source ZIP; the LIDO/Cocos code remains the APK filename.
  const selectedBundles = new Map<
    string,
    { lessonIds: string[]; assetLinks: string[]; zipFileName: string }
  >();
  for (const workbookLesson of selectedWorkbookLessons) {
    const selectedBundle = selectedBundles.get(workbookLesson.bundleId);
    if (selectedBundle) {
      if (selectedBundle.zipFileName !== workbookLesson.zipFileName) {
        throw new Error(
          `Selected workbook rows map bundle ${workbookLesson.bundleId} to different ZIP filenames.`,
        );
      }
      if (!selectedBundle.lessonIds.includes(workbookLesson.lessonId)) {
        selectedBundle.lessonIds.push(workbookLesson.lessonId);
      }
      if (!selectedBundle.assetLinks.includes(workbookLesson.assetLink)) {
        selectedBundle.assetLinks.push(workbookLesson.assetLink);
      }
      continue;
    }

    selectedBundles.set(workbookLesson.bundleId, {
      lessonIds: [workbookLesson.lessonId],
      assetLinks: [workbookLesson.assetLink],
      zipFileName: workbookLesson.zipFileName,
    });
  }
  console.log(`Selected workbook sheets: ${selectedSheetNames.join(', ')}`);
  console.log(
    `Workbook lesson rows selected: ${selectedWorkbookLessons.length}`,
  );

  const originalImportJsonContent = await fs.readFile(importJsonPath, 'utf8');
  const importJson = JSON.parse(originalImportJsonContent) as ImportJson;
  validateOfflineGraphTables(importJson);
  for (const table of importJson.tables) {
    console.warn(
      `[OPEN_APK][TABLE] name=${table.name} columns=${table.schema.length} rows=${table.values?.length ?? 0}`,
    );
  }

  const avatar = await prepareAvatar(options.avatar);
  const { chapterIds, chapterLessonKeys, lessonIds } = resolveWorkbookSelection(
    selectedWorkbookLessons,
  );
  console.log(
    `Workbook lessons selected for packaging: ${selectedWorkbookLessons.length}`,
  );
  for (const workbookLesson of selectedWorkbookLessons) {
    console.warn(
      `[OPEN_APK][CHAPTER][LESSON] sheet=${workbookLesson.sheetName} lessonId=${workbookLesson.lessonId} chapterId=${workbookLesson.chapterId} bundleId=${workbookLesson.bundleId} zip=${workbookLesson.zipFileName}`,
    );
  }

  const selectedRowsByTable = new Map<string, Set<string>>([
    ['chapter', new Set(chapterIds)],
    ['lesson', new Set(lessonIds)],
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

  // Validate all selected workbook mappings before replacing the previous bundle set.
  if (!options.dryRun) {
    await fs.rm(lessonBundlesDir, { recursive: true, force: true });
  }
  await fs.mkdir(lessonBundlesDir, { recursive: true });

  const bundles: BundleManifestEntry[] = [];
  for (const [bundleId, selectedBundle] of selectedBundles) {
    const { lessonIds, assetLinks, zipFileName } = selectedBundle;
    const dbVersion = 1;
    try {
      bundles.push(
        await prepareBundle(
          bundleId,
          lessonIds,
          assetLinks,
          zipFileName,
          dbVersion,
          options,
        ),
      );
    } catch (error) {
      bundles.push({
        bundleId,
        lessonIds,
        status: 'missing',
        dbVersion,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    language: unique(
      selectedSheetNames.map(
        (sheetName) => sheetName.split(/\s+Grade\s+/i)[0]?.trim() || sheetName,
      ),
    ).join(', '),
    selectedSheets: selectedSheetNames,
    avatar: avatar.avatarPath,
    pathwayMascot: avatar.pathwayMascotPath,
    chapterCount: chapterIds.length,
    chapterLessonCount: chapterLessonKeys.length,
    lessonCount: lessonIds.length,
    bundleCount: selectedBundles.size,
    imageAssetCount: imageAssets.length,
    imageAssets,
    importJsonRewrittenForBuild: importJsonNeedsRewrite,
    bundles,
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Manifest written to ${manifestPath}`);

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
