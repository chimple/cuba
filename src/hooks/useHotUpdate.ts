import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { GrowthBook } from '@growthbook/growthbook';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { useGrowthBook } from '@growthbook/growthbook-react';
import { CAN_HOT_UPDATE, EVENTS } from '../common/constants';
import { useAppSelector } from '../redux/hooks';
import { Util } from '../utility/util';
import logger from '../utility/logger';

const MAX_RETRIES = 5;
const AUTO_UPDATE_DELAY_MS = 60000;

export const useHotUpdate = () => {
  const growthbook = useGrowthBook();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    const timeoutId = window.setTimeout(() => {
      void checkForUpdate(growthbook, user.id);
    }, AUTO_UPDATE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [growthbook, user]);
};

const checkForUpdate = async (growthbook: GrowthBook, userId: string) => {
  let majorVersion = '0';
  const canHotUpdate = growthbook?.isOn?.(CAN_HOT_UPDATE) ?? false;
  logger.info('ðŸš€ Started for updates...');

  try {
    if (!Capacitor.isNativePlatform() || !canHotUpdate) return;

    logger.info('ðŸš€ Checking for updates...');
    const { versionName } = await LiveUpdate.getVersionName();
    majorVersion = versionName.split('.')[0];
    const channel = `${process.env.REACT_APP_ENV}-${majorVersion}`;

    Util.setHotUpdateState({
      status: 'Checking (Auto)',
      progress: 10,
      channel,
      lastChecked: new Date().toLocaleString(),
      isAuto: true,
      error: '',
    });

    const { bundleId: currentBundleId } = await LiveUpdate.getCurrentBundle();
    const result = await LiveUpdate.fetchLatestBundle({ channel });
    const isUpdateAllowed =
      !!result.customProperties?.version &&
      Util.isVersionAllowed(result.customProperties.version, versionName);

    if (
      !result.bundleId ||
      currentBundleId === result.bundleId ||
      !isUpdateAllowed
    ) {
      logger.info(
        'ðŸš€ LiveUpdate: No new update available, Current applied bundleID: ',
        currentBundleId,
      );
      return;
    }

    logger.info('ðŸš€ LiveUpdate fetch latest bundle result', result);
    Util.logEvent(EVENTS.LIVE_UPDATE_STARTED, {
      user_id: userId,
      current_bundle_id: currentBundleId,
      new_bundle_id: result.bundleId,
      timestamp: new Date().toISOString(),
      channel_name: channel,
      app_version: versionName,
      update_type: result.artifactType,
    });

    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      attempt++;

      try {
        if (!navigator.onLine) throw new Error('Device is offline');
        logger.info(`ðŸ” LiveUpdate SYNC attempt ${attempt}/${MAX_RETRIES}`);
        const start = performance.now();

        Util.setHotUpdateState({
          status: 'Downloading (Auto)',
          progress: 60,
        });

        await LiveUpdate.sync({ channel });
        Util.setHotUpdateState({
          status: 'Updated successfully (Auto)',
          progress: 100,
          lastUpdated: new Date().toLocaleString(),
        });

        const totalEnd = performance.now();
        Util.logEvent(EVENTS.LIVE_UPDATE_APPLIED, {
          user_id: userId,
          previous_bundle_id: currentBundleId,
          new_bundle_id: result.bundleId,
          timestamp: new Date().toISOString(),
          time_taken_ms: (totalEnd - start).toFixed(2),
          channel_name: channel,
          app_version: versionName,
          update_type: result.artifactType,
        });
        logger.info(
          `ðŸš€ LiveUpdate: Update applied successfully to bundle ${result.bundleId}`,
        );
        success = true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`âŒ Sync attempt ${attempt} failed`, error);
        Util.setHotUpdateState({
          status: 'Auto update failed',
          progress: 0,
          error: message,
        });

        if (attempt === MAX_RETRIES) {
          logger.error('âŒ All retry attempts failed');
          Util.logEvent(EVENTS.LIVE_UPDATE_ERROR, {
            user_id: userId,
            timestamp: new Date().toISOString(),
            channel_name: channel,
            error:
              message || 'All attempts to apply update failed, Device offline',
            retries: attempt,
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('LiveUpdate failedâŒ', error);
    Util.setHotUpdateState({
      status: 'Auto update failed',
      progress: 0,
      error: message,
    });

    Util.logEvent(EVENTS.LIVE_UPDATE_ERROR, {
      user_id: userId,
      timestamp: new Date().toISOString(),
      channel_name: `${process.env.REACT_APP_ENV}-${majorVersion}`,
      error: message || 'LiveUpdate failed unknown error',
    });
  }
};
