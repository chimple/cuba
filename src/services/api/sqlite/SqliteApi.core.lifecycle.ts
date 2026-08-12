import { BASE_NAME, CURRENT_SQLITE_VERSION } from '../../../common/constants';
import { setGlobalLoading } from '../../../redux/slices/auth/authSlice';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import type { SqlStatement } from '../../../workers/background.worker.types';
import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { SqliteApiCoreFoundation } from './SqliteApi.core.foundation';

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

export class SqliteApiCoreLifecycle extends SqliteApiCoreFoundation {
  [key: string]: any;
  protected async setUpDatabase() {
    if (!this._db || !this._sqlite) return;

    let res1: DBSQLiteValues | undefined = undefined;
    try {
      const stmt =
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';";
      res1 = await this._db.query(stmt);
      // logger.info("?? sqlite_master count result:", res1);
    } catch (error) {
      logger.error(
        '?? ~ SqliteApi ~ setUpDatabase ~ error:',
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
          //  logger.info("?? About to import SQLite schema from JSON");
          const importData = await fetch('databases/import.json');
          if (!importData || !importData.ok) return;
          const importJson = JSON.stringify((await importData.json()) ?? {});
          const resImport = await this._sqlite.importFromJson(importJson);
          // logger.info("? importFromJson SUCCESS:", resImport);
          localStorage.setItem(
            CURRENT_SQLITE_VERSION,
            this.DB_VERSION.toString(),
          );
          // Fresh installs already imported the bundled data, so record the marker to avoid re-importing on the next launch.
          localStorage.setItem(
            this.BUNDLED_IMPORT_APP_VERSION_KEY,
            await this.getCurrentAppVersionMarker(),
          );
          logger.info('?? ~ SqliteApi ~ setUpDatabase ~ resImport:', resImport);

          // Keep current web behavior; avoid native full page reload on first import.
          if (!Capacitor.isNativePlatform()) {
            window.location.replace(BASE_NAME || '/');
            return;
          }
        } catch (error) {
          logger.info('?? ~ SqliteApi ~ setUpDatabase ~ error:', error);
        }
      } catch (error) {
        logger.info('?? ~ SqliteApi ~ setUpDatabase ~ error:', error);
      }
    } else {
      try {
        store.dispatch(setGlobalLoading(true));
        logger.warn(
          '?? ~ SqliteApi ~ Updating Local Database from import.json after app update',
        );
        await this.importBundledDataAfterUpgrade();
      } finally {
        store.dispatch(setGlobalLoading(false));
        logger.warn('?? ~ SqliteApi ~ Local Database update complete');
      }
    }
    if (this._syncTableData) {
      const tableNames = Object.keys(this._syncTableData) ?? [];
      if (tableNames.length > 0) {
        const tables = "'" + tableNames.join("', '") + "'";
        const tablePullSync = `SELECT * FROM pull_sync_info WHERE table_name IN (${tables});`;
        const res = (await this._db?.query(tablePullSync))?.values ?? [];
        res.forEach((row: any) => {
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
            '?? ~ SqliteApi ~ setUpDatabase ~ updatePullSyncQuery:',
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
        (table: any) =>
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
        '?? ~ SqliteApi ~ importBundledDataAfterUpgrade ~ imported tables:',
        importedTableNames,
      );
    } catch (error) {
      logger.error(
        '?? ~ SqliteApi ~ importBundledDataAfterUpgrade ~ error:',
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
      (table: any) => table.name === this.BUNDLED_IMPORT_PULL_SYNC_TABLE,
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
      (column: any) => getColumnName(column) === 'table_name',
    );
    const lastPulledIndex = (pullSyncTable.schema ?? []).findIndex(
      (column: any) => getColumnName(column) === 'last_pulled',
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
        .map((column: any) =>
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
        .map((column: string, index: number) => ({ column, index }))
        .filter(({ column }: any) => existingColumns.has(column));
      if (columnIndexes.length === 0) continue;

      const conflictColumn =
        columnIndexes.find(({ column }: any) => column === 'id')?.column ??
        columnIndexes[0].column;
      const insertColumns = columnIndexes.map(({ column }: any) => column);
      const quotedTableName = this.quoteSqlIdentifier(table.name);
      const quotedInsertColumns = insertColumns
        .map((column: any) => this.quoteSqlIdentifier(column))
        .join(', ');
      const placeholders = insertColumns.map(() => '?').join(', ');
      // Primary path matches the required bundled-data upsert behavior without guessing a conflict target.
      const statement = `INSERT OR REPLACE INTO ${quotedTableName} (${quotedInsertColumns}) VALUES (${placeholders});`;
      const updateColumns = insertColumns.filter(
        (column: any) => column !== conflictColumn,
      );
      const conflictClause =
        updateColumns.length > 0
          ? `DO UPDATE SET ${updateColumns
              .map((column: any) => {
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
          rows.map((row: any) => ({
            statement: sqlStatement,
            values: columnIndexes.map(({ index }: any) =>
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
}
