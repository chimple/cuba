// Splits a comma-separated class-id string into trimmed non-empty ids.
const splitClassIds = (classIdsCsv: string): string[] => {
  return classIdsCsv
    .split(',')
    .map((classId) => classId.trim())
    .filter((classId) => classId.length > 0);
};

// Normalizes class ids so comparisons are deterministic across edit/save cycles.
export const normalizeClassIds = (classIds: string[]): string[] => {
  return Array.from(
    new Set(
      classIds
        .map((classId) => classId.trim())
        .filter((classId) => classId.length > 0),
    ),
  ).sort();
};

// Parses form csv value into a normalized class-id list used by assignment diffing.
export const parseClassIdsFromCsv = (classIdsCsv: string): string[] => {
  return normalizeClassIds(splitClassIds(classIdsCsv));
};

// Converts class-id arrays into normalized csv for stable form initial values.
export const toClassIdsCsv = (classIds: string[]): string => {
  return normalizeClassIds(classIds).join(',');
};

export interface TeacherClassAssignmentDiff {
  classIdsToAdd: string[];
  classIdsToRemove: string[];
  hasChanges: boolean;
}

// Returns class ids to add/remove so save mutates only assignment deltas.
export const getTeacherClassAssignmentDiff = (
  initialClassIds: string[],
  selectedClassIds: string[],
): TeacherClassAssignmentDiff => {
  const normalizedInitialClassIds = normalizeClassIds(initialClassIds);
  const normalizedSelectedClassIds = normalizeClassIds(selectedClassIds);

  const initialClassIdSet = new Set(normalizedInitialClassIds);
  const selectedClassIdSet = new Set(normalizedSelectedClassIds);

  const classIdsToAdd = normalizedSelectedClassIds.filter(
    (classId) => !initialClassIdSet.has(classId),
  );
  const classIdsToRemove = normalizedInitialClassIds.filter(
    (classId) => !selectedClassIdSet.has(classId),
  );

  return {
    classIdsToAdd,
    classIdsToRemove,
    hasChanges: classIdsToAdd.length > 0 || classIdsToRemove.length > 0,
  };
};
