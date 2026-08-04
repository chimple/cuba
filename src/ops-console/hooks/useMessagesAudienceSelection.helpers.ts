import type {
  CampaignAudienceOptions,
  CampaignAudienceSummary,
} from '../../services/api/ServiceApi';

export type UserType = 'student' | 'teacher' | 'principal';
export type ActivityRecency = 'all' | 'active_7d' | 'inactive_7d';

export const emptyAudienceOptions: CampaignAudienceOptions = {
  blocks: [],
  schools: [],
  grades: [],
};

export const emptyAudienceSummary: CampaignAudienceSummary = {
  totalStudents: 0,
  grades: [],
};

export const areStringArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

export const areOptionIdArraysEqual = <T extends { id: string }>(
  left: T[],
  right: T[],
) =>
  left.length === right.length &&
  left.every((value, index) => value.id === right[index]?.id);

export const formatProgramModel = (model?: string | string[] | null) => {
  const rawModel = Array.isArray(model)
    ? model[0]
    : (() => {
        if (typeof model !== 'string') return model;
        const trimmed = model.trim();
        if (!trimmed.startsWith('[')) return trimmed;
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed[0] : trimmed;
        } catch {
          return trimmed;
        }
      })();

  switch ((rawModel ?? '').trim()) {
    case 'at_school':
      return 'At School';
    case 'at_home':
      return 'At Home';
    case 'hybrid':
      return 'Hybrid';
    default:
      return '';
  }
};
