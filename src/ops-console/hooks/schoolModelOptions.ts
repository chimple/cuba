import { t } from 'i18next';

const SCHOOL_MODEL_VALUES = ['at_home', 'at_school', 'hybrid'] as const;

type SchoolModelValue = (typeof SCHOOL_MODEL_VALUES)[number];
export type SchoolModelOption = { label: string; value: SchoolModelValue };

const isSchoolModelValue = (value: string): value is SchoolModelValue =>
  (SCHOOL_MODEL_VALUES as readonly string[]).includes(value);

const getSchoolModelLabel = (value: SchoolModelValue) => {
  if (value === 'at_home') return t('At Home');
  if (value === 'at_school') return t('At School');
  return t('Hybrid');
};

const normalizeModelList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean);
    }
    if (typeof parsed === 'string') {
      const normalized = parsed.trim().toLowerCase();
      return normalized ? [normalized] : [];
    }
  } catch {
    // Fall back to simple string parsing for legacy non-JSON model values.
  }

  return trimmed
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((item) => item.replace(/['"]/g, '').trim().toLowerCase())
    .filter(Boolean);
};

const getSchoolModelValuesForProgram = (
  programModel: unknown,
): SchoolModelValue[] => {
  const parsed = normalizeModelList(programModel);
  const uniqueValues = Array.from(new Set(parsed));
  return uniqueValues.filter(isSchoolModelValue);
};

export const getSchoolModelOptionsForProgram = (
  programModel: unknown,
): SchoolModelOption[] =>
  getSchoolModelValuesForProgram(programModel).map((value) => ({
    label: getSchoolModelLabel(value),
    value,
  }));

export const isSchoolModelAllowedForProgram = (
  programModel: unknown,
  schoolModel: string,
) =>
  getSchoolModelValuesForProgram(programModel).includes(
    schoolModel.toLowerCase() as SchoolModelValue,
  );
