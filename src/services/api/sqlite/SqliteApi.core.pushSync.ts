import { v4 as uuidv4 } from 'uuid';
import { EVENTS, MUTATE_TYPES, TABLES } from '../../../common/constants';
import logger from '../../../utility/logger';
import {
  createSyncPhaseTimer,
  reportSyncError,
} from '../../../utility/syncTelemetry';
import { buildPushRetrySchedule } from '../../../utility/syncBackoff';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { SqliteApiCoreSync } from './SqliteApi.core.sync';

export class SqliteApiCorePushSync extends SqliteApiCoreSync {
  [key: string]: any;
  private _pushRetryTimeoutId: number | null = null;
  private _scheduledPushRetryAt: number | null = null;

  private getPushSyncNowIso(): string {
    return new Date().toISOString();
  }

  private getPushErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown push sync error';
    }
  }

  private schedulePushRetry(nextRetryAt: string): void {
    const nextRetryAtMs = new Date(nextRetryAt).getTime();
    if (!Number.isFinite(nextRetryAtMs)) {
      return;
    }

    if (
      this._scheduledPushRetryAt !== null &&
      this._scheduledPushRetryAt <= nextRetryAtMs
    ) {
      return;
    }

    if (this._pushRetryTimeoutId !== null) {
      window.clearTimeout(this._pushRetryTimeoutId);
    }

    const delayMs = Math.max(nextRetryAtMs - Date.now(), 0);
    this._scheduledPushRetryAt = nextRetryAtMs;
    this._pushRetryTimeoutId = window.setTimeout(() => {
      this._pushRetryTimeoutId = null;
      this._scheduledPushRetryAt = null;
      this.syncDbNow(Object.values(TABLES)).catch((error) => {
        logger.error('Scheduled push sync retry failed', error);
      });
    }, delayMs);
  }

  private async scheduleEarliestQueuedPushRetry(): Promise<void> {
    if (!this._db) return;

    const res = await this._db.query(
      `
        SELECT next_retry_at
        FROM push_sync_info
        WHERE next_retry_at IS NOT NULL
        ORDER BY next_retry_at ASC
        LIMIT 1;
      `,
    );
    const nextRetryAt = String(res.values?.[0]?.next_retry_at ?? '').trim();
    if (!nextRetryAt) {
      return;
    }

    this.schedulePushRetry(nextRetryAt);
  }

  private async markPushRowForRetry(
    row: {
      id: string;
      retry_count?: number | null;
      table_name: string;
    },
    error: unknown,
  ): Promise<number> {
    const schedule = buildPushRetrySchedule(Number(row.retry_count ?? 0));
    await this.executeQuery(
      `
        UPDATE push_sync_info
        SET retry_count = ?, next_retry_at = ?, last_error = ?
        WHERE id = ? AND table_name = ?;
      `,
      [
        schedule.retryCount,
        schedule.nextRetryAt,
        this.getPushErrorMessage(error),
        row.id,
        row.table_name,
      ],
    );
    this.schedulePushRetry(schedule.nextRetryAt);
    return schedule.delayMs;
  }

  private async pushChanges(tableNames: TABLES[]) {
    if (!this._db) return false;
    const tablePushSync = `
      SELECT *
      FROM push_sync_info
      WHERE next_retry_at IS NULL OR next_retry_at <= ?
      ORDER BY created_at;
    `;
    let res: any[] = [];
    const queueReadTimer = createSyncPhaseTimer('push_queue_read', {
      requested_table_count: tableNames.length,
    });
    try {
      res =
        (await this._db.query(tablePushSync, [this.getPushSyncNowIso()]))
          .values ?? [];
      queueReadTimer.finish('success', {
        queued_changes: res.length,
      });
      logger.info('🚀 ~ syncDB ~ tablePushSync:', res);

      this.updateDebugInfo(res.length, 0, 0); //update debug info
      await this.scheduleEarliestQueuedPushRetry();
    } catch (error) {
      const durationMs = queueReadTimer.finish('error');
      await reportSyncError('push_queue_read', error, {
        duration_ms: durationMs,
      });
      logger.error('🚀 ~ Api ~ syncDB ~ error:', error);
      await this.createSyncTables();
    }
    if (res && res.length) {
      const pushTimer = createSyncPhaseTimer('push_results', {
        queued_changes: res.length,
      });
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
            const durationMs = pushTimer.finish('error', {
              failed_table: data.table_name,
              failed_change_type: data.change_type,
            });
            await reportSyncError(
              'push_results',
              mutate?.error ??
                new Error('Push mutate failed with network error'),
              {
                duration_ms: durationMs,
                failed_table: data.table_name,
                failed_change_type: data.change_type,
                queued_changes: res.length,
                status: mutateStatus,
              },
            );
            const retryDelayMs = await this.markPushRowForRetry(
              data,
              mutate?.error ??
                new Error('Push mutate failed with network error'),
            );
            logger.warn(
              '🔁 Network error during push, will retry in next sync',
              {
                retry_delay_ms: retryDelayMs,
                user_id: _currentUser?.id,
                ...mutate?.error,
              },
            );
            return false;
          }
          if (isDuplicateConflict) {
            logger.info('🟢 Duplicate key ignored (already exists on server)');
          } else {
            const durationMs = pushTimer.finish('error', {
              failed_table: data.table_name,
              failed_change_type: data.change_type,
            });
            await reportSyncError(
              'push_results',
              mutate?.error ?? new Error('Push mutate failed'),
              {
                duration_ms: durationMs,
                failed_table: data.table_name,
                failed_change_type: data.change_type,
                queued_changes: res.length,
                status: mutateStatus,
              },
            );
            logger.info('🔴 Real push error:', mutate?.error);
            await this.executeQuery(
              `
                UPDATE push_sync_info
                SET last_error = ?, next_retry_at = NULL
                WHERE id = ? AND table_name = ?;
              `,
              [
                this.getPushErrorMessage(
                  mutate?.error ?? new Error('Push mutate failed'),
                ),
                data.id,
                data.table_name,
              ],
            );
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
      pushTimer.finish('success');
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
    await this.ensurePushSyncTableColumns();
  }

  private async ensurePushSyncTableColumns() {
    if (!this._db) return;

    const res = await this._db.query(`PRAGMA table_info(push_sync_info);`);
    const existingColumns = new Set(
      (res.values ?? []).map((row: { name?: string }) => row.name),
    );

    if (!existingColumns.has('retry_count')) {
      await this.executeQuery(
        `ALTER TABLE push_sync_info ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;`,
      );
    }
    if (!existingColumns.has('next_retry_at')) {
      await this.executeQuery(
        `ALTER TABLE push_sync_info ADD COLUMN next_retry_at TEXT;`,
      );
    }
    if (!existingColumns.has('last_error')) {
      await this.executeQuery(
        `ALTER TABLE push_sync_info ADD COLUMN last_error TEXT;`,
      );
    }
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
