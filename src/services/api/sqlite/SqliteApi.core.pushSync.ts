import { v4 as uuidv4 } from 'uuid';
import { EVENTS, MUTATE_TYPES, TABLES } from '../../../common/constants';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { SqliteApiCoreSync } from './SqliteApi.core.sync';

export class SqliteApiCorePushSync extends SqliteApiCoreSync {
  [key: string]: any;
  private async pushChanges(tableNames: TABLES[]) {
    if (!this._db) return false;
    const tables = "'" + tableNames.join("', '") + "'";

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

  private async createSyncTables() {
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
