import { EVENTS, STAGES, TableTypes } from '../common/constants';
import logger from '../utility/logger';
import { Util } from '../utility/util';

export const logClassTabClassChanged = async (
  selectedClass: TableTypes<'class'>,
  previousClass: TableTypes<'class'> | undefined,
  selectionStage: STAGES,
): Promise<void> => {
  if (previousClass?.id === selectedClass.id) {
    return;
  }

  try {
    await Util.logEvent(EVENTS.CLASS_TAB_CLASS_CHANGED, {
      selected_class_id: selectedClass.id,
      selected_class_name: selectedClass.name,
      previous_class_id: previousClass?.id ?? '',
      previous_class_name: previousClass?.name ?? '',
      selection_stage: selectionStage,
    });
  } catch (error) {
    logger.warn('Failed to log class tab class change:', error);
  }
};
