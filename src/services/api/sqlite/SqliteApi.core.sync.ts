import { v4 as uuidv4 } from 'uuid';
import { SqliteApiCoreBundledImport } from './SqliteApi.core.bundledImport';
import {
  CLASS,
  EVENTS,
  MUTATE_TYPES,
  PROFILETYPE,
  SCHOOL,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import Lesson from '../../../models/Lesson';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import type { SqlStatement } from '../../../workers/background.worker.types';
import { runBackgroundWorkerStreamingSync } from '../../../workers/backgroundWorkerClient';
import { ServiceConfig } from '../../ServiceConfig';
import { Capacitor } from '@capacitor/core';

export class SqliteApiCoreSync extends SqliteApiCoreBundledImport {
  [key: string]: any;
  public async uploadSchoolVisitMediaFile(params: {
    schoolId: string;
    file: File;
  }): Promise<string> {
    return this._serverApi.uploadSchoolVisitMediaFile(params);
  }

  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE,
  ): Promise<string | null> {
    return await this._serverApi.addProfileImages(id, file, profileType);
  }

  async uploadData(payload: any): Promise<boolean | null> {
    return await this._serverApi.uploadData(payload);
  }

  async migrateSchoolData(payload: { school_ids: string[] }): Promise<boolean> {
    return await this._serverApi.migrateSchoolData(payload);
  }

  protected async pullChanges(
    tableNames: TABLES[],
    isFirstSync?: boolean,
    isRefreshSync = false,
  ): Promise<void> {
    if (!this._db) return;

    const isInitialFetch = isFirstSync;
    logger.info('?? ~ pullChanges ~ isInitialFetch:', isInitialFetch);

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
      res.forEach((row: any) =>
        lastPullTables.set(row.table_name, row.last_pulled),
      );
    } catch (error) {
      logger.error('?? ~ Api ~ syncDB ~ error:', error);
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
          logger.error(`? Attempt ${attempt}: getTablesData failed`, err);
          if (attempt < maxAttempts) {
            const delay = 500 * Math.pow(2, attempt);
            await new Promise((res) => setTimeout(res, delay));
            attempt += 1;
            continue;
          }
          logger.warn('? All retries failed. Truncating local tables...');
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
            logger.warn('?? Final retry triggered by user.');
            attempt = 1;
            continue;
          }
          logger.warn('? User canceled final retry.');
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
      .filter((name: string | undefined): name is string => Boolean(name));
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

    const classes = await this.getClassesForSchool(
      currentSchool.id,
      currentUser.id,
    );

    if (!classes.length) {
      await Util.setCurrentClass(null);
      return;
    }

    const resolvedClass = storedClass
      ? (classes.find(
          (classItem: TableTypes<'class'>) => classItem.id === storedClass.id,
        ) ?? classes[0])
      : classes[0];

    if (storedClass?.id !== resolvedClass.id) {
      await Util.setCurrentClass(resolvedClass);
    }
  }
}
