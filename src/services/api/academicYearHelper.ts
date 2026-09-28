const toFullAcademicYear = (value: string): string | null => {
  const token = String(value ?? '').trim();
  const fullMatch = token.match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (fullMatch) {
    return `${Number(fullMatch[1])}-${Number(fullMatch[2])}`;
  }

  const shortMatch = token.match(/^(\d{4})\s*-\s*(\d{2})$/);
  if (!shortMatch) return null;

  const startYear = Number(shortMatch[1]);
  const endYearShort = Number(shortMatch[2]);
  const centuryBase = Math.floor(startYear / 100) * 100;
  let endYear = centuryBase + endYearShort;
  if (endYear < startYear) endYear += 100;
  return `${startYear}-${endYear}`;
};

const parseAcademicYears = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((year) => toFullAcademicYear(String(year)))
      .filter((year): year is string => Boolean(year));
  }

  if (typeof value !== 'string' || !value.trim()) return [];

  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parseAcademicYears(parsed);
  } catch {
    // Plain-text academic years are handled below.
  }

  return trimmed
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((year) => toFullAcademicYear(year.replace(/"/g, '')))
    .filter((year): year is string => Boolean(year));
};

export const getRuntimeCurrentAcademicYear = (now = new Date()): string => {
  const currentYear = now.getFullYear();
  return `${currentYear}-${currentYear + 1}`;
};

export const resolveAcademicYearForClass = (
  schoolAcademicYear: unknown,
  now = new Date(),
): string => {
  const years = parseAcademicYears(schoolAcademicYear);
  if (!years.length) return getRuntimeCurrentAcademicYear(now);

  return years.reduce((latest, year) => {
    const latestStart = Number(latest.slice(0, 4));
    const yearStart = Number(year.slice(0, 4));
    return yearStart > latestStart ? year : latest;
  });
};

export const resolveAcademicYearForClassAndSchool = (
  schoolAcademicYear: unknown,
  now = new Date(),
): { classAcademicYear: string; schoolAcademicYear: string | null } => {
  const currentAcademicYear = getRuntimeCurrentAcademicYear(now);
  const years = parseAcademicYears(schoolAcademicYear);
  const latestAcademicYear = years.reduce<string | null>((latest, year) => {
    if (!latest) return year;
    return Number(year.slice(0, 4)) > Number(latest.slice(0, 4))
      ? year
      : latest;
  }, null);

  if (latestAcademicYear === currentAcademicYear) {
    return {
      classAcademicYear: currentAcademicYear,
      schoolAcademicYear: null,
    };
  }

  const mergedYears = Array.from(new Set([...years, currentAcademicYear]));

  return {
    classAcademicYear: currentAcademicYear,
    schoolAcademicYear: JSON.stringify(mergedYears),
  };
};
