import {
  EVENTS,
  KidsAppLocationSelection,
  MODES,
} from '../../common/constants';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';

export const logKidsAppLocationSelected = async (
  selectedLocation: KidsAppLocationSelection,
  selectedAppMode: MODES,
): Promise<void> => {
  try {
    await Util.logEvent(EVENTS.KIDS_APP_LOCATION_SELECTED, {
      selected_location: selectedLocation,
      selected_app_mode: selectedAppMode,
    });
  } catch (error) {
    logger.warn('Failed to log kids app location selection:', error);
  }
};
