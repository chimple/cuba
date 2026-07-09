import { GrowthBook } from '@growthbook/growthbook-react';
import { configureCache } from '@growthbook/growthbook';
import { EVENTS } from '../common/constants';
import { tryRestoreGrowthbookPayloadFromCache } from '../growthbook/growthbookCacheRestore';
import { ServiceConfig } from '../services/ServiceConfig';
import { store } from '../redux/store';
import { Util } from '../utility/util';
import logger from '../utility/logger';

const GB_API_HOST = 'https://cdn.growthbook.io';
const GB_STALE_TTL_MS = 1000 * 60 * 5;
const GB_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365;

export const createGrowthBookClient = () => {
  const clientKey = import.meta.env.VITE_GROWTHBOOK_ID;

  configureCache({
    staleTTL: GB_STALE_TTL_MS,
    maxAge: GB_MAX_AGE_MS,
  });

  return new GrowthBook({
    apiHost: GB_API_HOST,
    clientKey,
    enableDevMode: true,
    trackingCallback: async (experiment, result) => {
      try {
        let userId = store.getState().auth?.user?.id ?? 'anonymous';
        if (userId === 'anonymous') {
          try {
            const auth = ServiceConfig.getI().authHandler;
            const currentUser = await auth.getCurrentUser();
            userId = currentUser?.id ?? 'anonymous';
          } catch (error) {
            logger.error('Error reading user from auth handler:', error);
          }
        }

        await Util.logEvent(EVENTS.EXPERIMENT_VIEWED, {
          user_id: userId,
          experiment_id: experiment.key,
          variation_id: result.key,
        });
      } catch (error) {
        logger.error('Error in GrowthBook tracking callback:', error);
      }
    },
  });
};

export const initializeGrowthBook = async (growthbook: GrowthBook) => {
  const clientKey = import.meta.env.VITE_GROWTHBOOK_ID;
  const initResult = await growthbook.init({ streaming: true });
  if (!initResult?.success) {
    await tryRestoreGrowthbookPayloadFromCache(
      growthbook,
      clientKey,
      GB_API_HOST,
    );
  }
};
