import { useMemo } from 'react';

export const useMessagesTargetAudienceDerivedState = (
  savedGroups: Array<{ id: string; name: string }>,
  programs: Array<{ id: string; name: string }>,
  availableGrades: Array<{ id: string; name: string }>,
  selectedSchools: Array<{ id: string }>,
  selectedGrades: Array<{ id: string }>,
  audienceOptionsSchoolCount: number,
) => {
  const savedGroupNameById = useMemo(
    () => new Map(savedGroups.map((group) => [group.id, group.name])),
    [savedGroups],
  );
  const programNameById = useMemo(
    () => new Map(programs.map((program) => [program.id, program.name])),
    [programs],
  );
  const gradeSelectScopeKey = useMemo(() => {
    const schoolKey =
      selectedSchools.length === audienceOptionsSchoolCount
        ? 'all-schools'
        : selectedSchools
            .map((school) => school.id)
            .sort()
            .join('|');
    const gradeKey = availableGrades.map((grade) => grade.id).join('|');

    return `${schoolKey}:${gradeKey}`;
  }, [audienceOptionsSchoolCount, availableGrades, selectedSchools]);
  const scopedSelectedGrades = useMemo(() => {
    const availableGradeIds = new Set(availableGrades.map((grade) => grade.id));

    return selectedGrades.filter((grade) => availableGradeIds.has(grade.id));
  }, [availableGrades, selectedGrades]);

  return {
    savedGroupNameById,
    programNameById,
    gradeSelectScopeKey,
    scopedSelectedGrades,
  };
};
