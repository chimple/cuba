import { t } from 'i18next';

const SCHOOL_MODEL_VALUES = ['at_home', 'at_school', 'hybrid'] as const;

type SchoolModelValue = (typeof SCHOOL_MODEL_VALUES)[number];
export type SchoolModelOption = { label: string; value: SchoolModelValue };

const isSchoolModelValue = (value: string): value is SchoolModelValue =>
  (SCHOOL_MODEL_VALUES as readonly string[]).includes(value);

const getSchoolModelLabel = (value: SchoolModelValue): string => {
  if (value === 'at_home') return t('At Home');
  if (value === 'at_school') return t('At School');
  return t('Hybrid');
};

export const getSchoolModelOptionsForProgram = (
  _programModel: unknown,
): SchoolModelOption[] =>
  SCHOOL_MODEL_VALUES.map((value) => ({
    label: getSchoolModelLabel(value),
    value,
  }));

export const isSchoolModelAllowedForProgram = (
  _programModel: unknown,
  schoolModel: string,
): boolean => isSchoolModelValue(schoolModel.trim().toLowerCase());
