import {
  LOWER_GRADE_MAPPING,
  LOWER_GRADE_STANDARDS,
} from '../common/constants';

export const getStandardFromClassName = (
  className: string,
): string | undefined => {
  const normalized = className.trim().toUpperCase();
  if (!normalized) return undefined;

  const matchedLowerStandard = (
    Object.values(LOWER_GRADE_STANDARDS) as string[]
  ).find((standard) => normalized.includes(standard));

  if (matchedLowerStandard) {
    return matchedLowerStandard;
  }

  const numberPrefix = normalized.match(/^(\d+)/);
  if (numberPrefix?.[1]) {
    const num = Number(numberPrefix[1]);
    if (num >= 1 && num <= 10) {
      return String(num);
    }
  }

  return undefined;
};

export const getGradeNameFromStandard = (
  standard: string | undefined,
): string | undefined => {
  if (!standard) return undefined;

  if (standard in LOWER_GRADE_MAPPING) {
    return LOWER_GRADE_MAPPING[standard as keyof typeof LOWER_GRADE_MAPPING];
  }

  const num = Number(standard);
  if (Number.isInteger(num) && num >= 1 && num <= 10) {
    return `Grade ${num}`;
  }

  return undefined;
};
