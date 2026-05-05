export const getStandardFromClassName = (
  className: string,
): string | undefined => {
  const normalized = className.trim().toUpperCase();
  if (!normalized) return undefined;

  if (normalized.startsWith('NURSERY')) return 'NURSERY';
  if (normalized.startsWith('LKG')) return 'LKG';
  if (normalized.startsWith('UKG')) return 'UKG';

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
  if (standard === 'NURSERY') return 'Preschool 1';
  if (standard === 'LKG') return 'Preschool 2';
  if (standard === 'UKG') return 'Preschool 3';

  const num = Number(standard);
  if (Number.isInteger(num) && num >= 1 && num <= 10) {
    return `Grade ${num}`;
  }

  return undefined;
};
