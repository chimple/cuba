import { SchoolVisitAction, SchoolVisitType } from '../../../common/constants';

export const COMMUNITY_VISIT_PARENT_COUNT_MIN = 0;
export const WHOLE_NUMBER_PATTERN = /^\d+$/;

export const shouldShowCommunityVisitParentsField = (
  status: SchoolVisitAction,
  visitType?: SchoolVisitType,
): boolean =>
  status === SchoolVisitAction.CheckOut &&
  visitType === SchoolVisitType.Community;

export const sanitizeCommunityVisitParentsInput = (value: string): string =>
  value.replace(/\D/g, '');

export const parseCommunityVisitParentsCount = (
  value: string,
): number | null => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  if (!WHOLE_NUMBER_PATTERN.test(trimmedValue)) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < COMMUNITY_VISIT_PARENT_COUNT_MIN
  ) {
    return null;
  }

  return parsedValue;
};

export const validateCommunityVisitParentsCount = (
  visitType: SchoolVisitType | undefined,
  value: string,
): string | null => {
  if (visitType !== SchoolVisitType.Community) {
    return null;
  }

  if (!value.trim()) {
    return 'Number of Parents is required.';
  }

  if (parseCommunityVisitParentsCount(value) === null) {
    return 'Enter a valid whole number.';
  }

  return null;
};
