import {
  CapacitorSQLite,
  DBSQLiteValues,
  SQLiteConnection,
  SQLiteDBConnection,
  capSQLiteResult,
  capSQLiteVersionUpgrade,
} from '@capacitor-community/sqlite';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { v4 as uuidv4 } from 'uuid';
import {
  BASE_NAME,
  CLASS,
  COURSES,
  CURRENT_SQLITE_VERSION,
  EVENTS,
  MODES,
  MUTATE_TYPES,
  SCHOOL,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { setGlobalLoading } from '../../../redux/slices/auth/authSlice';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import { isRecoverableStorageError } from '../../../utility/recoverableStorageError';
import { Util } from '../../../utility/util';
import type { SqlStatement } from '../../../workers/background.worker.types';
import { runBackgroundWorkerStreamingSync } from '../../../workers/backgroundWorkerClient';
import { APIMode, ServiceConfig } from '../../ServiceConfig';
import { SupabaseApi } from '../SupabaseApi';

type ImportJsonTable = {
  name: string;
  schema?: unknown[];
  values?: unknown[][];
  indexes?: unknown[];
  triggers?: unknown[];
};

type ImportJsonData = {
  database: string;
  version: number;
  encrypted: boolean;
  mode: string;
  tables: ImportJsonTable[];
  views?: unknown[];
  overwrite?: boolean;
};

export interface SqliteApiCore {
  [key: string]: any;
}
export class SqliteApiCore {
  protected _db: SQLiteDBConnection | undefined;
  protected _sqlite: SQLiteConnection | undefined;
  protected DB_NAME = 'db_issue10';
  protected DB_VERSION = 15;
  // Tracks the native shell plus active hot-update bundle so new bundled data is imported once per app asset version.
  protected BUNDLED_IMPORT_APP_VERSION_KEY = 'bundledImportAppVersion';
  protected BUNDLED_IMPORT_PULL_SYNC_TABLE = 'pull_sync_info';
  protected BUNDLED_IMPORT_TABLES = new Set<string>([
    TABLES.Curriculum,
    TABLES.Subject,
    TABLES.Grade,
    TABLES.Language,
    TABLES.Badge,
    TABLES.Course,
    TABLES.Sticker,
    TABLES.Reward,
    TABLES.Chapter,
    TABLES.Lesson,
    TABLES.ChapterLesson,
    TABLES.ChapterLinks,
    TABLES.RiveReward,
    TABLES.Framework,
    TABLES.Domain,
    TABLES.Competency,
    TABLES.Outcome,
    TABLES.Skill,
    TABLES.SkillRelation,
    TABLES.SkillLesson,
    TABLES.SubjectLesson,
    TABLES.LanguageLocale,
    TABLES.Locale,
    TABLES.StickerBook,
  ]);
  protected _serverApi: SupabaseApi;
  protected _currentMode: MODES;
  protected _currentStudent: TableTypes<'user'> | undefined;
  protected _currentClass: TableTypes<'class'> | undefined;
  protected _currentSchool: TableTypes<'school'> | undefined;
  protected chapterCourseIdCache = new Map<string, string | null>();
  protected courseLanguageIdCache = new Map<string, string | null>();
  protected courseLanguageIdPromiseCache = new Map<
    string,
    Promise<string | null>
  >();
  protected _currentCourse:
    | Map<string, TableTypes<'course'> | undefined>
    | undefined;
  protected _syncTableData: Record<string, string> = {};
  protected _tablesNeedingFullSync = new Set<string>();
  protected _tableColumnsCache = new Map<string, string[]>();
  protected _initPromise: Promise<void> | null = null;

  protected _syncInProgress: boolean = false;
  protected _syncRequestedAgain: boolean = false;
  protected _retryRefreshTables: TABLES[] = [];
  protected _postSyncAssetPrefetchScheduled: boolean = false;
  protected _postSyncAssetPrefetchRequestedAt: number | null = null;
  protected _shouldImportBundledDataAfterUpgrade: boolean = false;

  protected _cachedRewards: TableTypes<'rive_reward'>[] | undefined;

  protected async resolveCourseLanguageId(
    courseId: string,
  ): Promise<string | null> {
    // Reuse successful course-language resolution across chapter lesson fetches.
    if (this.courseLanguageIdCache.has(courseId)) {
      return this.courseLanguageIdCache.get(courseId) ?? null;
    }

    // Deduplicate concurrent lookups for the same course while one query is in flight.
    const inFlightPromise = this.courseLanguageIdPromiseCache.get(courseId);
    if (inFlightPromise) {
      return inFlightPromise;
    }

    const languagePromise = (async () => {
      const courseRes = await this.executeQuery(
        `
          SELECT code
          FROM ${TABLES.Course}
          WHERE id = ?
            AND is_deleted = 0
          LIMIT 1;
        `,
        [courseId],
      );
      if (!courseRes) {
        throw new Error(
          `Failed to fetch course code while resolving language for course ${courseId}`,
        );
      }

      const courseCode = (
        ((courseRes as DBSQLiteValues | undefined)?.values?.[0] ?? {}) as {
          code?: string | null;
        }
      ).code
        ?.trim()
        .toLowerCase();
      const courseLanguageCode =
        courseCode === COURSES.MATHS
          ? COURSES.ENGLISH
          : courseCode?.includes('-')
            ? courseCode.split('-').pop()
            : courseCode;

      if (!courseLanguageCode) {
        return null;
      }

      const languageRes = await this.executeQuery(
        `
          SELECT id
          FROM ${TABLES.Language}
          WHERE LOWER(code) = ?
            AND is_deleted = 0
          LIMIT 1;
        `,
        [courseLanguageCode],
      );
      if (!languageRes) {
        throw new Error(
          `Failed to fetch language id while resolving language for course ${courseId}`,
        );
      }

      const courseLanguageId = (
        ((languageRes as DBSQLiteValues | undefined)?.values?.[0] ?? {}) as {
          id?: string | null;
        }
      ).id;

      return courseLanguageId ?? null;
    })()
      .then((languageId) => {
        // Cache only confirmed language ids so transient query failures can retry later.
        if (languageId) {
          this.courseLanguageIdCache.set(courseId, languageId);
        }
        return languageId;
      })
      .finally(() => {
        this.courseLanguageIdPromiseCache.delete(courseId);
      });

    this.courseLanguageIdPromiseCache.set(courseId, languagePromise);
    return languagePromise;
  }

  protected async resolveCourseLanguageIdForChapter(
    chapterId: string,
  ): Promise<string | null> {
    const cachedCourseId = this.chapterCourseIdCache.get(chapterId);
    if (cachedCourseId !== undefined) {
      return cachedCourseId
        ? this.resolveCourseLanguageId(cachedCourseId)
        : Promise.resolve(null);
    }

    const courseRes = await this.executeQuery(
      `
        SELECT course_id
        FROM ${TABLES.Chapter}
        WHERE id = ?
          AND is_deleted = 0
        LIMIT 1;
      `,
      [chapterId],
    );
    if (!courseRes) {
      throw new Error(
        `Failed to fetch chapter course while resolving language for chapter ${chapterId}`,
      );
    }

    const courseId = (
      ((courseRes as DBSQLiteValues | undefined)?.values?.[0] ?? {}) as {
        course_id?: string | null;
      }
    ).course_id;

    // Keep the chapter -> course mapping only when we resolved a real course id.
    if (courseId) {
      this.chapterCourseIdCache.set(chapterId, courseId);
    }
    return courseId ? this.resolveCourseLanguageId(courseId) : null;
  }

  protected async ensureInitialized(): Promise<void> {
    if (this._db && this._sqlite) return;
    if (!this._initPromise) {
      this._initPromise = this.initializeWithRetry();
    }
    await this._initPromise;
  }

  protected isRecoverableInitError(error: unknown): boolean {
    return isRecoverableStorageError(error);
  }

  protected resetDbHandles(): void {
    this._db = undefined;
  }

  protected async initializeWithRetry(
    attempts = 3,
    delayMs = 400,
  ): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await this.init();
        return;
      } catch (error) {
        lastError = error;
        this.resetDbHandles();

        if (!this.isRecoverableInitError(error) || attempt === attempts) {
          this._initPromise = null;
          throw error;
        }

        // Resume can briefly race with an in-flight native SQLite connection,
        // so retry a couple of times before surfacing the failure as real.
        logger.warn(
          'SqliteApi init failed during recoverable resume window. Retrying.',
          {
            attempt,
            attempts,
            error,
          },
        );
        await new Promise((resolve) => window.setTimeout(resolve, delayMs));
      }
    }

    this._initPromise = null;
    throw lastError;
  }

  protected async init(): Promise<void> {
    SupabaseApi.getInstance();
    const platform = Capacitor.getPlatform();
    this._sqlite = new SQLiteConnection(CapacitorSQLite);
    if (platform === 'web') {
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);

      await customElements.whenDefined('jeep-sqlite');

      await this._sqlite.initWebStore();
    }

    let ret: capSQLiteResult | undefined;
    let isConn: boolean | undefined;
    try {
      ret = await this._sqlite.checkConnectionsConsistency();
      isConn = (await this._sqlite.isConnection(this.DB_NAME, false)).result;
    } catch (error) {
      logger.error('🚀 ~ Api ~ init ~ error:', error);
    }
    try {
      const localVersion = localStorage.getItem(CURRENT_SQLITE_VERSION);

      if (
        localVersion &&
        !Number.isNaN(localVersion) &&
        Number(localVersion) !== this.DB_VERSION
      ) {
        const upgradeStatements: capSQLiteVersionUpgrade[] = [];
        const localVersionNumber = Number(localVersion);

        const data = await fetch('databases/upgradeStatements.json');

        if (!data || !data.ok) return;
        const upgradeStatementsMap: Record<
          string,
          { statements?: string[]; tableChanges?: Record<string, string> }
        > = await data.json();

        for (
          let version = localVersionNumber + 1;
          version <= this.DB_VERSION;
          version++
        ) {
          const versionData = upgradeStatementsMap[version];

          if (versionData && versionData['statements']) {
            const currentStatements = [...versionData['statements']];

            // Track tables with schema changes for forced full sync
            for (const statement of versionData['statements']) {
              const match = statement.match(
                /(?:ALTER|CREATE|DROP)\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/i,
              );
              if (match && match[1]) {
                const tableName = match[1];
                // Mark this table for full sync (will use old timestamp)
                this._tablesNeedingFullSync.add(tableName);
                logger.warn(
                  'setUpDatabase: Auto-detected schema change for table: ' +
                    tableName +
                    '. Will force full sync.',
                );
              }
            }

            upgradeStatements.push({
              toVersion: version,
              statements: currentStatements,
            });
          }

          if (versionData['tableChanges']) {
            for (const tableName in versionData['tableChanges']) {
              const changeDate = versionData['tableChanges'][tableName];
              if (!this._syncTableData[tableName]) {
                this._syncTableData[tableName] = changeDate;
              } else {
                if (
                  new Date(this._syncTableData[tableName]) >
                  new Date(changeDate)
                ) {
                  this._syncTableData[tableName] = changeDate;
                }
              }
            }
          }
        }

        logger.info(
          '🚀 ~ SqliteApi ~ init ~ upgradeStatements:',
          upgradeStatements,
        );

        await this._sqlite.addUpgradeStatement(this.DB_NAME, upgradeStatements);
        this._shouldImportBundledDataAfterUpgrade = true;

        localStorage.setItem(
          CURRENT_SQLITE_VERSION,
          this.DB_VERSION.toString(),
        );
      }
    } catch (error) {
      logger.error('🚀 ~ SqliteApi ~ init ~ error:', JSON.stringify(error));
    }

    if (ret && ret.result && isConn) {
      this._db = await this._sqlite.retrieveConnection(this.DB_NAME, false);
    } else {
      this._db = await this._sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        this.DB_VERSION,
        false,
      );
    }
    try {
      await this._db?.open();
    } catch (err) {
      logger.error('🚀 ~ SqliteApi ~ init ~ err:', err);
      throw err;
    }
    await this.setUpDatabase();
  }

  public async close(): Promise<void> {
    if (this._initPromise) {
      try {
        await this._initPromise;
      } catch (error) {
        logger.error(
          'Error waiting for SQLite initialization before close:',
          error,
        );
      }
    }

    const db = this._db;
    const sqlite = this._sqlite;
    if (!db || !sqlite) return;

    try {
      await db.close();
    } catch (error) {
      logger.error('Error closing SQLite database:', error);
    }

    try {
      await sqlite.closeConnection(this.DB_NAME, false);
    } catch (error) {
      logger.error('Error closing SQLite connection:', error);
    } finally {
      this.resetDbHandles();
      this._initPromise = null;
    }
  }

  protected async setUpDatabase() {
    if (!this._db || !this._sqlite) return;

    let res1: DBSQLiteValues | undefined = undefined;
    try {
      const stmt =
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';";
      res1 = await this._db.query(stmt);
      // logger.info("📊 sqlite_master count result:", res1);
    } catch (error) {
      logger.error(
        '🚀 ~ SqliteApi ~ setUpDatabase ~ error:',
        JSON.stringify(error),
      );
    }
    if (
      !res1 ||
      !res1.values ||
      !res1.values.length ||
      res1.values[0].count < 10
    ) {
      try {
        try {
          //  logger.info("⬇️ About to import SQLite schema from JSON");
          const importData = await fetch('databases/import.json');
          if (!importData || !importData.ok) return;
          const importJson = JSON.stringify((await importData.json()) ?? {});
          const resImport = await this._sqlite.importFromJson(importJson);
          // logger.info("✅ importFromJson SUCCESS:", resImport);
          localStorage.setItem(
            CURRENT_SQLITE_VERSION,
            this.DB_VERSION.toString(),
          );
          // Fresh installs already imported the bundled data, so record the marker to avoid re-importing on the next launch.
          localStorage.setItem(
            this.BUNDLED_IMPORT_APP_VERSION_KEY,
            await this.getCurrentAppVersionMarker(),
          );
          logger.info('🚀 ~ SqliteApi ~ setUpDatabase ~ resImport:', resImport);

          // Keep current web behavior; avoid native full page reload on first import.
          if (!Capacitor.isNativePlatform()) {
            window.location.replace(BASE_NAME || '/');
            return;
          }
        } catch (error) {
          logger.info('🚀 ~ SqliteApi ~ setUpDatabase ~ error:', error);
        }
      } catch (error) {
        logger.info('🚀 ~ SqliteApi ~ setUpDatabase ~ error:', error);
      }
    } else {
      try {
        store.dispatch(setGlobalLoading(true));
        logger.warn(
          '🚀 ~ SqliteApi ~ Updating Local Database from import.json after app update',
        );
        await this.importBundledDataAfterUpgrade();
      } finally {
        store.dispatch(setGlobalLoading(false));
        logger.warn('🚀 ~ SqliteApi ~ Local Database update complete');
      }
    }
    if (this._syncTableData) {
      const tableNames = Object.keys(this._syncTableData) ?? [];
      if (tableNames.length > 0) {
        const tables = "'" + tableNames.join("', '") + "'";
        const tablePullSync = `SELECT * FROM pull_sync_info WHERE table_name IN (${tables});`;
        const res = (await this._db?.query(tablePullSync))?.values ?? [];
        res.forEach((row) => {
          if (
            row.last_pulled &&
            new Date(this._syncTableData[row.table_name]) >
              new Date(row.last_pulled)
          ) {
            this._syncTableData[row.table_name] = row.last_pulled;
          }
        });
        for (const _tableName of Object.keys(this._syncTableData)) {
          const updatePullSyncQuery = `UPDATE pull_sync_info SET last_pulled = '${this._syncTableData[_tableName]}' WHERE table_name = '${_tableName}'`;
          logger.info(
            '🚀 ~ SqliteApi ~ setUpDatabase ~ updatePullSyncQuery:',
            updatePullSyncQuery,
          );
          await this.executeQuery(updatePullSyncQuery);
        }
      }
    }

    await this.checkAndSyncData();
  }

  protected async importBundledDataAfterUpgrade(): Promise<void> {
    if (!this._db || !this._sqlite) return;

    const currentAppVersion = await this.getCurrentAppVersionMarker();
    const storedAppVersion = localStorage.getItem(
      this.BUNDLED_IMPORT_APP_VERSION_KEY,
    );
    // Import after db.open() when either schema migrations ran or a newer bundled app asset version is active.
    const shouldImport =
      this._shouldImportBundledDataAfterUpgrade ||
      this.shouldImportBundledDataForAppVersion(
        storedAppVersion,
        currentAppVersion,
      );

    if (!shouldImport) return;

    try {
      const importData = await fetch('databases/import.json');
      if (!importData || !importData.ok) {
        logger.warn(
          'SqliteApi: Unable to fetch bundled import.json for app update import.',
          {
            status: importData?.status,
            statusText: importData?.statusText,
          },
        );
        return;
      }
      logger.warn(
        'SqliteApi: Fetched bundled import.json for app update import.',
        {
          status: importData.status,
        },
      );

      const importJson = ((await importData.json()) ?? {}) as ImportJsonData;
      const tables = (importJson.tables ?? []).filter(
        (table) =>
          this.BUNDLED_IMPORT_TABLES.has(table.name) &&
          (table.values?.length ?? 0) > 0,
      );

      if (tables.length === 0) {
        this._shouldImportBundledDataAfterUpgrade = false;
        // Empty eligible data is still a completed check for this app asset version.
        localStorage.setItem(
          this.BUNDLED_IMPORT_APP_VERSION_KEY,
          currentAppVersion,
        );
        return;
      }

      const bundledPullSyncInfo = this.getBundledPullSyncInfo(importJson);
      const importedTableNames = await this.upsertBundledImportTables(tables);
      await this.markBundledImportTablesPulled(
        importedTableNames,
        bundledPullSyncInfo,
      );

      if (!Capacitor.isNativePlatform()) {
        await this._sqlite.saveToStore(this.DB_NAME);
      }

      this._shouldImportBundledDataAfterUpgrade = false;
      // Store only after successful local ingestion so failed imports retry on the next launch.
      localStorage.setItem(
        this.BUNDLED_IMPORT_APP_VERSION_KEY,
        currentAppVersion,
      );
      logger.info(
        '🚀 ~ SqliteApi ~ importBundledDataAfterUpgrade ~ imported tables:',
        importedTableNames,
      );
    } catch (error) {
      logger.error(
        '🚀 ~ SqliteApi ~ importBundledDataAfterUpgrade ~ error:',
        error,
      );
    }
  }

  protected async getCurrentAppVersionMarker(): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      return `web-sqlite-${this.DB_VERSION}`;
    }

    try {
      const appInfo = await App.getInfo();
      const version = appInfo.version || `native-sqlite-${this.DB_VERSION}`;
      // LiveUpdate can replace import.json without changing the native APK version, so include the active bundle id.
      const bundleId = await this.getCurrentLiveUpdateBundleId();
      const nativeMarker = appInfo.build
        ? `${version}|${appInfo.build}`
        : version;
      return bundleId ? `${nativeMarker}|${bundleId}` : nativeMarker;
    } catch (error) {
      logger.warn(
        'SqliteApi: Unable to read native app version for bundled import marker.',
        error,
      );
      return `native-sqlite-${this.DB_VERSION}`;
    }
  }

  protected async getCurrentLiveUpdateBundleId(): Promise<string | undefined> {
    try {
      const bundle = await LiveUpdate.getCurrentBundle();
      return bundle.bundleId || undefined;
    } catch (error) {
      logger.warn(
        'SqliteApi: Unable to read LiveUpdate bundle for bundled import marker.',
        error,
      );
      return undefined;
    }
  }

  protected shouldImportBundledDataForAppVersion(
    storedAppVersion: string | null,
    currentAppVersion: string,
  ): boolean {
    // Web keeps its existing fresh-import behavior; this marker is only for native app/hot-update assets.
    if (!Capacitor.isNativePlatform()) return false;
    // Old installs will not have this key, so run once to align local SQLite with the bundled import.
    if (!storedAppVersion) return true;

    // A different marker should import only when it is newer, preventing old APKs from re-importing after rollback.
    return (
      this.compareAppVersionMarkers(currentAppVersion, storedAppVersion) > 0
    );
  }

  protected compareAppVersionMarkers(current: string, stored: string): number {
    // Parse both markers so native version/build can be compared before considering hot-update bundle changes.
    const currentVersion = this.parseAppVersionMarker(current);
    const storedVersion = this.parseAppVersionMarker(stored);

    // If either marker is not parseable, avoid importing on unknown differences because that could re-run on rollback.
    if (!currentVersion || !storedVersion) {
      return current === stored ? 0 : -1;
    }

    // Version strings can have different lengths, so compare missing parts as zero: 3.5 equals 3.5.0.
    const versionLength = Math.max(
      currentVersion.versionParts.length,
      storedVersion.versionParts.length,
    );

    // Native version decides whether this is an upgrade or rollback before build or bundle checks.
    for (let index = 0; index < versionLength; index++) {
      const currentPart = currentVersion.versionParts[index] ?? 0;
      const storedPart = storedVersion.versionParts[index] ?? 0;
      if (currentPart !== storedPart) return currentPart - storedPart;
    }

    // Build number catches same-version native releases.
    const buildComparison = currentVersion.build - storedVersion.build;
    if (buildComparison !== 0) return buildComparison;

    // Same native build and same hot-update bundle means this import already completed.
    if (currentVersion.bundleId === storedVersion.bundleId) return 0;
    // If the active bundle cannot be read, do not import repeatedly on an unknown bundle state.
    if (!currentVersion.bundleId) return 0;

    // Same native build with a different active LiveUpdate bundle means import.json may have changed.
    return 1;
  }

  protected parseAppVersionMarker(
    marker: string,
  ): { versionParts: number[]; build: number; bundleId?: string } | undefined {
    // Current markers use pipes so semantic versions like 3.5.0 and bundle ids stay separate.
    const markerParts = marker.split('|');
    // First segment is the native version because native downgrade protection must be checked first.
    let versionMarker = markerParts[0] ?? '';
    // Second segment is the native build number when App.getInfo() provides it.
    let buildMarker = markerParts[1] ?? '';
    // Remaining segments belong to the LiveUpdate bundle id, which can contain arbitrary characters.
    const bundleId =
      markerParts.length > 2 ? markerParts.slice(2).join('|') : undefined;

    // Earlier marker format used version-build, so keep parsing it to avoid forcing a one-time false update.
    if (markerParts.length === 1) {
      const legacyBuildSeparatorIndex = marker.lastIndexOf('-');
      const legacyBuildMarker = marker.slice(legacyBuildSeparatorIndex + 1);

      // Treat the suffix as a build only when it is numeric; otherwise it may be part of a version label.
      if (legacyBuildSeparatorIndex > -1 && /^\d+$/.test(legacyBuildMarker)) {
        versionMarker = marker.slice(0, legacyBuildSeparatorIndex);
        buildMarker = legacyBuildMarker;
      }
    }

    // Extract numeric version pieces so 3.5.0, v3.5.0, and similar native strings compare consistently.
    const versionParts =
      versionMarker.match(/\d+/g)?.map((part) => Number(part)) ?? [];
    // Without numeric version parts we cannot safely decide upgrade versus rollback.
    if (versionParts.length === 0) return undefined;

    // Missing or malformed build should behave like build 0 instead of blocking app-version comparison.
    const build = buildMarker ? Number(buildMarker) : 0;

    return {
      versionParts,
      build: Number.isFinite(build) ? build : 0,
      bundleId,
    };
  }

  protected quoteSqlIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  protected getBundledPullSyncInfo(
    importJson: ImportJsonData,
  ): Map<string, string> {
    const pullSyncTable = (importJson.tables ?? []).find(
      (table) => table.name === this.BUNDLED_IMPORT_PULL_SYNC_TABLE,
    );
    if (!pullSyncTable) return new Map();

    const getColumnName = (column: unknown): string | undefined =>
      typeof column === 'object' &&
      column !== null &&
      'column' in column &&
      typeof column.column === 'string'
        ? column.column
        : undefined;

    const tableNameIndex = (pullSyncTable.schema ?? []).findIndex(
      (column) => getColumnName(column) === 'table_name',
    );
    const lastPulledIndex = (pullSyncTable.schema ?? []).findIndex(
      (column) => getColumnName(column) === 'last_pulled',
    );

    if (tableNameIndex < 0 || lastPulledIndex < 0) return new Map();

    const bundledPullSyncInfo = new Map<string, string>();
    for (const row of pullSyncTable.values ?? []) {
      const tableName = row[tableNameIndex];
      const lastPulled = row[lastPulledIndex];
      if (typeof tableName === 'string' && typeof lastPulled === 'string') {
        bundledPullSyncInfo.set(tableName, lastPulled);
      }
    }

    return bundledPullSyncInfo;
  }

  protected async upsertBundledImportTables(
    tables: ImportJsonTable[],
  ): Promise<string[]> {
    if (!this._db) return [];

    const importedTableNames: string[] = [];
    const batchSize = this.getSyncWriteTuning().defaultBatchSize;

    for (const table of tables) {
      const schema = table.schema ?? [];
      const values = table.values ?? [];
      if (schema.length === 0 || values.length === 0) continue;

      const importColumns = schema
        .map((column) =>
          typeof column === 'object' &&
          column !== null &&
          'column' in column &&
          typeof column.column === 'string'
            ? column.column
            : undefined,
        )
        .filter((column): column is string => !!column);
      if (importColumns.length === 0) continue;

      const columns = await this.getTableColumns(table.name);
      if (!columns) continue;
      const existingColumns = new Set(columns);
      const columnIndexes = importColumns
        .map((column, index) => ({ column, index }))
        .filter(({ column }) => existingColumns.has(column));
      if (columnIndexes.length === 0) continue;

      const conflictColumn =
        columnIndexes.find(({ column }) => column === 'id')?.column ??
        columnIndexes[0].column;
      const insertColumns = columnIndexes.map(({ column }) => column);
      const quotedTableName = this.quoteSqlIdentifier(table.name);
      const quotedInsertColumns = insertColumns
        .map((column) => this.quoteSqlIdentifier(column))
        .join(', ');
      const placeholders = insertColumns.map(() => '?').join(', ');
      // Primary path matches the required bundled-data upsert behavior without guessing a conflict target.
      const statement = `INSERT OR REPLACE INTO ${quotedTableName} (${quotedInsertColumns}) VALUES (${placeholders});`;
      const updateColumns = insertColumns.filter(
        (column) => column !== conflictColumn,
      );
      const conflictClause =
        updateColumns.length > 0
          ? `DO UPDATE SET ${updateColumns
              .map((column) => {
                const quotedColumn = this.quoteSqlIdentifier(column);
                return `${quotedColumn} = excluded.${quotedColumn}`;
              })
              .join(', ')}`
          : 'DO NOTHING';
      const fallbackStatement = `INSERT INTO ${quotedTableName} (${quotedInsertColumns}) VALUES (${placeholders}) ON CONFLICT(${this.quoteSqlIdentifier(
        conflictColumn,
      )}) ${conflictClause};`;

      for (let offset = 0; offset < values.length; offset += batchSize) {
        const rows = values.slice(offset, offset + batchSize);
        const buildBatch = (sqlStatement: string): SqlStatement[] =>
          rows.map((row) => ({
            statement: sqlStatement,
            values: columnIndexes.map(({ index }) =>
              this.normalizeSqliteValue(row[index]),
            ),
          }));

        try {
          await this.executeSqlStatementBatch(buildBatch(statement));
        } catch (error) {
          logger.warn(
            'SqliteApi: INSERT OR REPLACE bundled import failed. Retrying with conflict upsert.',
            error,
          );
          // Keep the previous conflict-upsert path as a compatibility fallback if INSERT OR REPLACE fails.
          await this.executeSqlStatementBatch(buildBatch(fallbackStatement));
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }

      importedTableNames.push(table.name);
    }

    return importedTableNames;
  }

  protected async markBundledImportTablesPulled(
    tableNames: string[],
    bundledPullSyncInfo: Map<string, string>,
  ): Promise<void> {
    if (!this._db || tableNames.length === 0) return;

    const fallbackLastPulled = new Date().toISOString();
    const statements = tableNames.map((tableName) => ({
      statement:
        'INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)',
      values: [
        tableName,
        bundledPullSyncInfo.get(tableName) ?? fallbackLastPulled,
      ],
    }));

    await this.executeSqlStatementBatch(statements);

    for (const tableName of tableNames) {
      delete this._syncTableData[tableName];
      this._tablesNeedingFullSync.delete(tableName);
    }
  }

  protected async checkAndSyncData() {
    try {
      const config = ServiceConfig.getInstance(APIMode.SQLITE);
      const isUserLoggedIn = await config.authHandler.isUserLoggedIn();

      if (isUserLoggedIn) {
        logger.warn('checkAndSyncData: User logged in, triggering sync');
        const user = await config.authHandler.getCurrentUser();

        if (!user) {
          await this.syncDbNow();
          logger.warn('checkAndSyncData: No user, syncDbNow awaited');
        } else {
          this.syncDbNow();
          logger.warn('checkAndSyncData: User exists, syncDbNow called');
        }
      }
    } catch (error) {
      logger.warn('checkAndSyncData: Error during sync check: ' + error);
    }
  }

  protected async executeQuery(
    statement: string,
    values?: any[] | undefined,
    isSQL92?: boolean | undefined,
  ) {
    await this.ensureInitialized();
    if (!this._db || !this._sqlite) return;
    const res = await this._db.query(statement, values, isSQL92);
    if (!Capacitor.isNativePlatform())
      await this._sqlite?.saveToStore(this.DB_NAME);

    return res;
  }

  protected normalizeSqliteValue(value: unknown): unknown {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (
      value &&
      typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype
    ) {
      return JSON.stringify(value);
    }
    return value;
  }

  protected isWebPlatform(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  protected getSyncWriteTuning(): {
    defaultBatchSize: number;
    userTableBatchSize: number;
    rowsPerChunk: number;
  } {
    const nav =
      typeof navigator !== 'undefined'
        ? (navigator as Navigator & {
            deviceMemory?: number;
            hardwareConcurrency?: number;
          })
        : undefined;
    const deviceMemory =
      typeof nav?.deviceMemory === 'number' ? nav.deviceMemory : undefined;
    const hardwareConcurrency =
      typeof nav?.hardwareConcurrency === 'number'
        ? nav.hardwareConcurrency
        : undefined;
    const hasDeviceHints =
      typeof deviceMemory === 'number' ||
      typeof hardwareConcurrency === 'number';

    const isLowEndDevice =
      !hasDeviceHints ||
      (typeof deviceMemory === 'number' && deviceMemory <= 3) ||
      (typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 4);
    const isMidRangeDevice =
      !isLowEndDevice &&
      ((typeof deviceMemory === 'number' && deviceMemory <= 6) ||
        (typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 6));

    if (isLowEndDevice) {
      return {
        defaultBatchSize: 60,
        userTableBatchSize: 120,
        rowsPerChunk: 120,
      };
    }

    if (isMidRangeDevice) {
      return {
        defaultBatchSize: 100,
        userTableBatchSize: 200,
        rowsPerChunk: 180,
      };
    }

    return {
      defaultBatchSize: 140,
      userTableBatchSize: 280,
      rowsPerChunk: 260,
    };
  }

  protected async executeSqlStatementBatch(
    batch: SqlStatement[],
    useImplicitTransaction = true,
  ) {
    if (!this._db || batch.length === 0) return;
    await this._db.executeSet(batch as any, useImplicitTransaction);
  }

  protected async isSqliteTransactionActive(): Promise<boolean> {
    if (!this._db) return false;

    try {
      return (await this._db.isTransactionActive()).result === true;
    } catch {
      return false;
    }
  }

  protected schedulePostSyncAssetPrefetch(): void {
    if (!Capacitor.isNativePlatform() || this._postSyncAssetPrefetchScheduled) {
      return;
    }

    this._postSyncAssetPrefetchScheduled = true;
    this._postSyncAssetPrefetchRequestedAt = Date.now();
    logger.warn('[ANRGuard] Scheduled post-sync asset prefetch', {
      delayMs: 30000,
      visibilityState: document.visibilityState,
    });
    window.setTimeout(() => {
      this.runPostSyncAssetPrefetch();
    }, 30000);
  }

  protected async runPostSyncAssetPrefetch(): Promise<void> {
    const startedAt = Date.now();
    try {
      if (document.visibilityState !== 'visible') {
        logger.warn('[ANRGuard] Deferred post-sync prefetch while not visible');
        window.addEventListener(
          'visibilitychange',
          () => {
            if (document.visibilityState === 'visible') {
              this.runPostSyncAssetPrefetch();
            }
          },
          { once: true },
        );
        return;
      }

      await this.prefetchStickerBookAssetsAfterSync();
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1000);
      });
      await this.prefetchLidoCommonAudioAfterSync();
      logger.warn('[ANRGuard] Post-sync prefetch completed', {
        queueDelayMs: this._postSyncAssetPrefetchRequestedAt
          ? startedAt - this._postSyncAssetPrefetchRequestedAt
          : null,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      logger.warn('[ANRGuard] Post-sync prefetch failed', error);
    } finally {
      this._postSyncAssetPrefetchScheduled = false;
      this._postSyncAssetPrefetchRequestedAt = null;
    }
  }

  protected async showToastWithRetry(
    message: string,
    actionLabel = 'Retry',
    duration = 15000,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      let timeoutId: number | null = null;
      let overlay: HTMLDivElement | null = null;

      const finish = (val: boolean) => {
        if (resolved) return;
        resolved = true;
        try {
          if (overlay && overlay.parentElement)
            overlay.parentElement.removeChild(overlay);
        } catch {}
        if (timeoutId) window.clearTimeout(timeoutId);
        resolve(val);
      };

      try {
        // Ionic style presenter
        if (typeof (window as any).presentToast === 'function') {
          (window as any).presentToast({
            message,
            duration,
            position: 'bottom',
            color: 'warning',
            buttons: [
              {
                text: actionLabel,
                handler: () => finish(true),
              },
            ],
          });
          timeoutId = window.setTimeout(() => finish(false), duration + 200);
          return;
        }

        // Fallback DOM toast
        overlay = document.createElement('div');
        overlay.setAttribute(
          'style',
          [
            'position:fixed',
            'left:12px',
            'right:12px',
            'bottom:20px',
            'z-index:2147483647',
            'display:flex',
            'align-items:center',
            'justify-content:space-between',
            'gap:12px',
            'padding:10px 14px',
            'background:rgba(0,0,0,0.85)',
            'color:#fff',
            'border-radius:8px',
            "font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
            'box-shadow:0 6px 18px rgba(0,0,0,0.3)',
          ].join(';'),
        );

        const msgSpan = document.createElement('div');
        msgSpan.textContent = message;
        msgSpan.style.flex = '1';
        msgSpan.style.fontSize = '13px';
        msgSpan.style.overflow = 'hidden';
        msgSpan.style.textOverflow = 'ellipsis';
        msgSpan.style.whiteSpace = 'nowrap';

        const btn = document.createElement('button');
        btn.textContent = actionLabel;
        btn.setAttribute(
          'style',
          [
            'margin-left:12px',
            'padding:6px 10px',
            'border-radius:6px',
            'border:none',
            'background:#fff',
            'color:#000',
            'cursor:pointer',
            'font-weight:600',
          ].join(';'),
        );
        btn.onclick = () => finish(true);

        overlay.appendChild(msgSpan);
        overlay.appendChild(btn);
        document.body?.appendChild(overlay);

        timeoutId = window.setTimeout(() => finish(false), duration + 200);
      } catch (err) {
        logger.warn('Fallback toast failed:', err);
        timeoutId = window.setTimeout(() => finish(false), duration);
      }
    });
  }

  protected async pullChanges(
    tableNames: TABLES[],
    isFirstSync?: boolean,
    isRefreshSync = false,
  ): Promise<void> {
    if (!this._db) return;

    const isInitialFetch = isFirstSync;
    logger.info('🚀 ~ pullChanges ~ isInitialFetch:', isInitialFetch);

    // Update pull_sync_info table with old timestamp for tables needing full sync
    const FORCE_FULL_SYNC_DATE = '2024-01-01T00:00:00.000Z';
    const LESSON_FORCE_FULL_SYNC_DATE = '2026-04-10T00:00:00.000Z';
    if (this._tablesNeedingFullSync.size > 0) {
      for (const tableName of this._tablesNeedingFullSync) {
        if (tableNames.includes(tableName as TABLES)) {
          const fullSyncDate =
            tableName === TABLES.Lesson
              ? LESSON_FORCE_FULL_SYNC_DATE
              : FORCE_FULL_SYNC_DATE;
          await this.executeQuery(
            `INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)`,
            [tableName, fullSyncDate],
          );
          logger.info(`Forcing full sync for table: ${tableName}`);
        }
      }
      this._tablesNeedingFullSync.clear();
    }

    // ensure USER table syncs first (single-row, heavy JSON)
    const orderedTableNames = tableNames.includes(TABLES.User)
      ? [TABLES.User, ...tableNames.filter((t) => t !== TABLES.User)]
      : [...tableNames];

    const tables = orderedTableNames.map((t) => `'${t}'`).join(', ');
    const tablePullSync = `SELECT * FROM pull_sync_info WHERE table_name IN (${tables});`;
    let lastPullTables = new Map<string, string>();
    try {
      const res = (await this._db.query(tablePullSync)).values ?? [];
      res.forEach((row) => lastPullTables.set(row.table_name, row.last_pulled));
    } catch (error) {
      logger.error('🚀 ~ Api ~ syncDB ~ error:', error);
      await this.createSyncTables();
    }
    let data = new Map<string, any[]>();
    if (isInitialFetch === true) {
      let attempt = 1;
      const maxAttempts = 5;
      while (true) {
        try {
          data = await this._serverApi.getTablesData(
            orderedTableNames,
            lastPullTables,
            isInitialFetch,
          );
          break;
        } catch (err) {
          logger.error(`❌ Attempt ${attempt}: getTablesData failed`, err);
          if (attempt < maxAttempts) {
            const delay = 500 * Math.pow(2, attempt);
            await new Promise((res) => setTimeout(res, delay));
            attempt += 1;
            continue;
          }
          logger.warn('❌ All retries failed. Truncating local tables...');
          if (!this._db) return;
          const query = `PRAGMA foreign_keys=OFF;`;
          const result = await this._db?.query(query);
          logger.info(result);
          for (const table of orderedTableNames) {
            const tableDel = `DELETE FROM "${table}";`;
            const res = await this._db.query(tableDel);
            logger.info(res);
          }
          const vaccum = `VACUUM;`;
          const resv = await this._db.query(vaccum);
          logger.info(resv);
          const querys = `PRAGMA foreign_keys=ON;`;
          const results = await this._db?.query(querys);
          logger.info(results);
          const userWantsRetry = await this.showToastWithRetry(
            'Sync failed. Retry now?',
          );
          if (userWantsRetry) {
            logger.warn('🔁 Final retry triggered by user.');
            attempt = 1;
            continue;
          }
          logger.warn('⛔ User canceled final retry.');
          return;
        }
      }
    } else {
      data = await this._serverApi.getTablesData(
        orderedTableNames,
        lastPullTables,
        isInitialFetch,
      );
    }

    const lastPulled = new Date().toISOString();
    const syncWriteTuning = this.getSyncWriteTuning();
    const DEFAULT_DB_BATCH_SIZE = syncWriteTuning.defaultBatchSize;
    const SAFE_USER_BATCH_SIZE = syncWriteTuning.userTableBatchSize;
    const STREAM_ROWS_CHUNK = syncWriteTuning.rowsPerChunk;
    const tablesForWorker: Record<string, any[]> = {};
    const tableColumnsByName: Record<string, string[]> = {};
    const tablesWritten = new Set<string>();
    const tableColumnEntries = await Promise.all(
      orderedTableNames.map(
        async (tableName) =>
          [tableName, await this.getTableColumns(tableName)] as const,
      ),
    );
    for (const [tableName, existingColumns] of tableColumnEntries) {
      const tableData = data.get(tableName) ?? [];
      if (tableData.length === 0) continue;
      if (!existingColumns || existingColumns.length === 0) continue;
      tablesForWorker[tableName] = tableData;
      tableColumnsByName[tableName] = existingColumns;
      tablesWritten.add(tableName);
    }

    const pullSyncStatements: SqlStatement[] = orderedTableNames.map(
      (tableName) => ({
        statement:
          'INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)',
        values: [tableName, lastPulled],
      }),
    );
    const isWebPlatform = this.isWebPlatform();
    let syncWriteTransactionOpen = false;
    let webStoreDirty = false;

    const beginSyncWriteTransaction = async () => {
      if (!this._db || syncWriteTransactionOpen) return;
      await this._db.beginTransaction();
      syncWriteTransactionOpen = await this.isSqliteTransactionActive();
    };

    const commitSyncWriteTransaction = async () => {
      if (!this._db || !syncWriteTransactionOpen) return;
      const isTransactionActive = await this.isSqliteTransactionActive();
      if (!isTransactionActive) {
        syncWriteTransactionOpen = false;
        webStoreDirty = false;
        return;
      }
      await this._db.commitTransaction();
      syncWriteTransactionOpen = false;
      if (isWebPlatform && webStoreDirty) {
        await this._sqlite?.saveToStore(this.DB_NAME);
        webStoreDirty = false;
      }
    };

    const rollbackSyncWriteTransaction = async () => {
      if (!this._db || !syncWriteTransactionOpen) return;
      try {
        if (await this.isSqliteTransactionActive()) {
          await this._db.rollbackTransaction();
        }
      } finally {
        syncWriteTransactionOpen = false;
        webStoreDirty = false;
      }
    };

    const writeSyncBatch = async (batch: SqlStatement[]) => {
      if (!batch.length) return;
      await this.executeSqlStatementBatch(batch, !syncWriteTransactionOpen);
      if (isWebPlatform) {
        webStoreDirty = true;
      }
    };

    try {
      await beginSyncWriteTransaction();
      try {
        await runBackgroundWorkerStreamingSync(
          {
            tables: tablesForWorker,
            tableColumns: tableColumnsByName,
            defaultBatchSize: DEFAULT_DB_BATCH_SIZE,
            userTableName: TABLES.User,
            userTableBatchSize: SAFE_USER_BATCH_SIZE,
            rowsPerChunk: STREAM_ROWS_CHUNK,
          },
          async (batch) => {
            await writeSyncBatch(batch);
          },
        );
      } catch (workerError) {
        logger.warn(
          'Background worker sync batch generation failed:',
          workerError,
        );
        await rollbackSyncWriteTransaction();
        if (Capacitor.isNativePlatform()) {
          throw workerError;
        }
        logger.warn('Falling back to main-thread sync batch generation on web');
        await beginSyncWriteTransaction();

        for (const tableName of Object.keys(tablesForWorker)) {
          const existingColumns = tableColumnsByName[tableName] ?? [];
          const tableData = tablesForWorker[tableName] ?? [];
          if (!existingColumns.length || !tableData.length) continue;
          const isUserTable = tableName === TABLES.User;
          const batchSize = isUserTable
            ? SAFE_USER_BATCH_SIZE
            : DEFAULT_DB_BATCH_SIZE;
          let batchQueries: SqlStatement[] = [];
          let currentFieldNames: string[] | null = null;
          let currentRows: unknown[][] = [];

          const flushBatchRows = async () => {
            if (!currentFieldNames || currentRows.length === 0) {
              return;
            }
            const placeholdersPerRow = `(${currentFieldNames
              .map(() => '?')
              .join(', ')})`;
            const valuesPlaceholders = currentRows
              .map(() => placeholdersPerRow)
              .join(', ');
            const updateSetClause = currentFieldNames
              .filter((f) => f !== 'id')
              .map((f) => `${f} = excluded.${f}`)
              .join(', ');
            const statement = updateSetClause
              ? `
            INSERT INTO ${tableName} (${currentFieldNames.join(', ')})
            VALUES ${valuesPlaceholders}
            ON CONFLICT(id) DO UPDATE SET
            ${updateSetClause}
            `
              : `
            INSERT INTO ${tableName} (${currentFieldNames.join(', ')})
            VALUES ${valuesPlaceholders}
            ON CONFLICT(id) DO NOTHING;
            `;
            batchQueries.push({
              statement,
              values: currentRows.flat(),
            });
            currentFieldNames = null;
            currentRows = [];

            if (batchQueries.length >= batchSize) {
              await writeSyncBatch(batchQueries);
              batchQueries = [];
            }
          };

          for (const row of tableData) {
            const fieldNames = existingColumns.filter((columnName) =>
              Object.prototype.hasOwnProperty.call(row, columnName),
            );
            if (fieldNames.length === 0) continue;
            const fieldValues = fieldNames.map((f) =>
              this.normalizeSqliteValue(row[f]),
            );
            const maxRowsPerStatement = Math.max(
              Math.floor(900 / fieldNames.length),
              1,
            );
            const fieldSignature = fieldNames.join('|');
            const currentSignature = currentFieldNames?.join('|');

            if (
              currentFieldNames &&
              (currentSignature !== fieldSignature ||
                currentRows.length >= maxRowsPerStatement)
            ) {
              await flushBatchRows();
            }

            if (!currentFieldNames) {
              currentFieldNames = fieldNames;
            }

            currentRows.push(fieldValues);

            if (currentRows.length >= maxRowsPerStatement) {
              await flushBatchRows();
            }
          }
          await flushBatchRows();
          if (batchQueries.length > 0) {
            await writeSyncBatch(batchQueries);
          }
        }
      }

      await writeSyncBatch(pullSyncStatements);
      await commitSyncWriteTransaction();
    } catch (error) {
      await rollbackSyncWriteTransaction();
      throw error;
    }

    // Update debug info (avoid expensive full JSON serialization on hot path).
    let totalpulledRows = 0;
    for (const value of data.values()) {
      if (Array.isArray(value) && value.length > 0) {
        totalpulledRows += value.length;
      }
    }
    const pulledRowsSizeInBytes = totalpulledRows * 128;
    this.updateDebugInfo(0, totalpulledRows, pulledRowsSizeInBytes);

    if (tablesWritten.has(TABLES.RiveReward)) {
      this._cachedRewards = undefined;
    }

    if (!isInitialFetch && !isRefreshSync) {
      const new_school = data.get(TABLES.School);
      const school_user_data = data.get(TABLES.SchoolUser);
      const hasSelectionUpdates =
        (new_school?.length ?? 0) > 0 ||
        (school_user_data?.length ?? 0) > 0 ||
        (data.get(TABLES.Class)?.length ?? 0) > 0 ||
        (data.get(TABLES.ClassUser)?.length ?? 0) > 0;
      if ((new_school && new_school?.length > 0) || hasSelectionUpdates) {
        const localSchoolRaw = localStorage.getItem(SCHOOL);

        if (localSchoolRaw) {
          let localSchool: TableTypes<'school'>;

          try {
            localSchool = JSON.parse(localSchoolRaw);
          } catch (e) {
            localStorage.removeItem(SCHOOL);
            logger.warn('invalid local school data removed');
            return;
          }

          const localSchoolId = localSchool?.id;

          if (!localSchoolId || !Array.isArray(school_user_data)) return;

          const deletedSchoolUser = school_user_data.find(
            (entry: TableTypes<'school_user'>) =>
              entry.school_id === localSchoolId && entry.is_deleted === true,
          );

          if (deletedSchoolUser) {
            localStorage.removeItem(SCHOOL);
            localStorage.removeItem(CLASS);
            logger.info('local school removed because school_user is_deleted');
          }
        }
        // Selection updates need one follow-up refresh, but refresh syncs must
        // not request themselves again or syncDbNow can loop indefinitely.
        await this.syncDbNow(Object.values(TABLES), [
          TABLES.Assignment,
          TABLES.Assignment_user,
          TABLES.School,
          TABLES.SchoolCourse,
          TABLES.Class,
          TABLES.ClassInvite_code,
          TABLES.Result,
          TABLES.User,
          TABLES.ClassUser,
          TABLES.SchoolUser,
          TABLES.ClassCourse,
        ]);
      }

      if (hasSelectionUpdates) {
        await this.reconcileCurrentClassSelection();
      }
    }
  }

  async getTableColumns(tableName: string): Promise<string[] | undefined> {
    await this.ensureInitialized();
    const cachedColumns = this._tableColumnsCache.get(tableName);
    if (cachedColumns?.length) {
      return cachedColumns;
    }
    const query = `PRAGMA table_info(${tableName})`;
    const result = await this._db?.query(query);
    const columns = result?.values
      ?.map((row: any) => row.name)
      .filter((name): name is string => Boolean(name));
    if (columns?.length) {
      this._tableColumnsCache.set(tableName, columns);
    }
    return columns;
  }

  protected async reconcileCurrentClassSelection() {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    const currentSchool = Util.getCurrentSchool();
    const storedClass = Util.getCurrentClass();

    if (!currentUser?.id || !currentSchool?.id) {
      return;
    }

    const classes = (await this.getClassesForSchool(
      currentSchool.id,
      currentUser.id,
    )) as TableTypes<'class'>[];

    if (!classes.length) {
      await Util.setCurrentClass(null);
      return;
    }

    const resolvedClass = storedClass
      ? (classes.find((classItem) => classItem.id === storedClass.id) ??
        classes[0])
      : classes[0];

    if (storedClass?.id !== resolvedClass.id) {
      await Util.setCurrentClass(resolvedClass);
    }
  }

  protected async pushChanges(tableNames: TABLES[]) {
    if (!this._db) return false;
    const tablePushSync = `SELECT * FROM push_sync_info ORDER BY created_at;`;
    let res: any[] = [];
    try {
      res = (await this._db.query(tablePushSync)).values ?? [];
      logger.info('🚀 ~ syncDB ~ tablePushSync:', res);

      this.updateDebugInfo(res.length, 0, 0); //update debug info
    } catch (error) {
      logger.error('🚀 ~ Api ~ syncDB ~ error:', error);
      await this.createSyncTables();
    }
    if (res && res.length) {
      for (const data of res) {
        const newData = JSON.parse(data.data);
        const mutate = await this._serverApi.mutate(
          data.change_type,
          data.table_name,
          newData,
          newData.id,
        );
        let networkError = false;
        let isPermissionDenied = false;
        if (!mutate || mutate.error) {
          const _currentUser =
            await ServiceConfig.getI().authHandler.getCurrentUser();
          Util.logEvent(EVENTS.ERROR_LOGS, {
            user_id: _currentUser?.id,
            ...mutate?.error,
          });
          const mutateStatus = Number(mutate?.status ?? 0);
          const mutateCode = String(mutate?.error?.code ?? '').toLowerCase();
          const mutateMessage = String(
            mutate?.error?.message ?? mutate?.error?.details ?? '',
          ).toLowerCase();
          const isDuplicateConflict =
            mutateCode === '23505' || mutateStatus === 409;
          isPermissionDenied =
            mutateStatus === 401 ||
            mutateStatus === 403 ||
            mutateCode === '42501' ||
            mutateMessage.includes('permission denied') ||
            mutateMessage.includes('row-level security') ||
            mutateMessage.includes('violates row-level security') ||
            mutateMessage.includes('unauthorized');
          networkError =
            mutateStatus === 0 ||
            mutateStatus >= 500 ||
            mutateMessage.includes('network error') ||
            mutateMessage.includes('failed to fetch');

          if (networkError) {
            logger.warn(
              '🔁 Network error during push, will retry in next sync',
              {
                user_id: _currentUser?.id,
                ...mutate?.error,
              },
            );
            return false;
          }
          if (isDuplicateConflict || !isPermissionDenied) {
            logger.info('🟢 Duplicate key ignored (already exists on server)');
          } else {
            logger.info('🔴 Real push error:', mutate?.error);
            return false;
          }
        }
        await this.executeQuery(
          `DELETE FROM push_sync_info WHERE id = ? AND table_name = ?`,
          [data.id, data.table_name],
        );
        if (mutate?.error && isPermissionDenied) {
          continue;
        }
        await this.executeQuery(
          `INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)`,
          [data.table_name, new Date().toISOString()],
        );
      }
    }
    return true;
  }

  async syncDbNow(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
    isFirstSync?: boolean,
  ): Promise<boolean | undefined> {
    await this.ensureInitialized();
    if (!this._db) return;
    await this.createSyncTables();
    // 🔒 LOCK
    if (this._syncInProgress) {
      if (refreshTables && refreshTables.length > 0) {
        this._retryRefreshTables.push(...refreshTables);
      }
      this._syncRequestedAgain = true;
      return true;
    }
    this._syncInProgress = true;
    try {
      if (refreshTables.length > 0) {
        const refresh_tables = "'" + refreshTables.join("', '") + "'";
        logger.info(
          'logs to check synced tables',
          JSON.stringify(refresh_tables),
        );
        await this.executeQuery(
          `UPDATE pull_sync_info SET last_pulled = '2024-01-01 00:00:00' WHERE table_name IN (${refresh_tables})`,
        );
      }
      await this.pullChanges(tableNames, isFirstSync, refreshTables.length > 0);
      this.schedulePostSyncAssetPrefetch();
      const res = await this.pushChanges(Object.values(TABLES));
      const tables = "'" + tableNames.join("', '") + "'";
      // logger.info('logs to check synced tables1', JSON.stringify(tables));
      const currentTimestamp = new Date();
      const reducedTimestamp = new Date(currentTimestamp); // clone it
      reducedTimestamp.setMinutes(reducedTimestamp.getMinutes() - 1);
      const formattedTimestamp = reducedTimestamp.toISOString();
      this.executeQuery(
        `UPDATE pull_sync_info SET last_pulled = '${formattedTimestamp}'  WHERE table_name IN (${tables})`,
      );
      return res;
    } finally {
      this._syncInProgress = false;
      if (this._syncRequestedAgain) {
        logger.info(
          '🔁 Running sync again because changes happened during sync',
        );
        this._syncRequestedAgain = false;

        const retryTablesToRefresh = [
          ...new Set([...this._retryRefreshTables]),
        ];
        this._retryRefreshTables = [];

        setTimeout(() => {
          this.syncDbNow(Object.values(TABLES), retryTablesToRefresh);
        }, 0);
      }
    }
    // logger.info("logs to check synced tables2", JSON.stringify(tables));
  }

  protected async createSyncTables() {
    const createPullSyncInfoTable = `CREATE TABLE IF NOT EXISTS pull_sync_info (
      table_name TEXT NOT NULL PRIMARY KEY,
      last_pulled TIMESTAMP NOT NULL
  )`;
    const createPushSyncInfoTable = `CREATE TABLE IF NOT EXISTS push_sync_info (
      id TEXT NOT NULL PRIMARY KEY,
      table_name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      change_type TEXT NOT NULL,
      data TEXT NOT NULL
  )`;

    await this.executeQuery(createPullSyncInfoTable);
    await this.executeQuery(createPushSyncInfoTable);
  }

  protected async updatePushChanges(
    tableName: TABLES,
    mutateType: MUTATE_TYPES,
    data: { [key: string]: any },
  ) {
    if (!this._db) return;
    data['updated_at'] = new Date().toISOString();
    const stmt = `INSERT OR REPLACE INTO push_sync_info (id, table_name, change_type, data) VALUES (?, ?, ?, ?)`;
    const variables = [
      uuidv4(),
      tableName.toString(),
      mutateType,
      JSON.stringify(data),
    ];
    await this.executeQuery(stmt, variables);
    return await this.syncDbNow(
      [tableName],
      undefined,
      undefined,
      // is_sync_immediate,
    );
  }
}
