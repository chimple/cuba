import type { AssignmentHeader } from './ReportsTableTypes';

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
