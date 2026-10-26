import logger from '../../../utility/logger';
import type { SqlStatement } from '../../../workers/background.worker.types';
import { APIMode, ServiceConfig } from '../../ServiceConfig';
import { Capacitor } from '@capacitor/core';
import { SqliteApiCoreLifecycle } from './SqliteApi.core.lifecycle';

export class SqliteApiCoreBundledImport extends SqliteApiCoreLifecycle {
  [key: string]: any;
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
}
