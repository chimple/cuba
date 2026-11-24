import type { AssignmentHeader } from './ReportsTableTypes';
import { TABLESORTBY } from '../../../common/constants';
import { TRACKABLE_IDS, type TrackableId } from '../../../analytics/trackable';

export const REPORT_SORT_TRACKABLE_IDS: Record<TABLESORTBY, TrackableId> = {
  [TABLESORTBY.NAME]: TRACKABLE_IDS.TEACHER_REPORT_SORT_ALPHABETICAL,
  [TABLESORTBY.HIGHSCORE]: TRACKABLE_IDS.TEACHER_REPORT_SORT_HIGH_TO_LOW,
  [TABLESORTBY.LOWSCORE]: TRACKABLE_IDS.TEACHER_REPORT_SORT_LOW_TO_HIGH,
};

export function getAssignmentMapObject(
  headerData: Map<string, AssignmentHeader>[],
) {
  const assignmentMapObject: Record<string, { belongsToClass: boolean }> = {};

  headerData.forEach((mapItem) => {
    mapItem.forEach((value, assignmentId) => {
      assignmentMapObject[assignmentId] = {
        belongsToClass: value.belongsToClass ?? true,
      };
    });
  });

  return assignmentMapObject;
}
