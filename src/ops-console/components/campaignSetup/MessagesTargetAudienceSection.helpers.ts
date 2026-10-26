import { useMemo } from 'react';
import type { CampaignOption } from '../../../services/api/ServiceApi';

type MessagesTargetAudienceDerivedState = {
  savedGroupNameById: Map<string, string>;
  programNameById: Map<string, string>;
  gradeSelectScopeKey: string;
  scopedSelectedGrades: CampaignOption[];
};

export const useMessagesTargetAudienceDerivedState = (
  savedGroups: Array<{ id: string; name: string }>,
  programs: Array<{ id: string; name: string }>,
  availableGrades: CampaignOption[],
  selectedSchools: Array<{ id: string }>,
  selectedGrades: CampaignOption[],
  audienceOptionsSchoolCount: number,
): MessagesTargetAudienceDerivedState => {
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
