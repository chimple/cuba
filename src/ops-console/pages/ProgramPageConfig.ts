import React from 'react';
import { t } from 'i18next';
import { PROGRAM_TAB, PROGRAM_TAB_LABELS } from '../../common/constants';
import {
  DATE_RANGE_OPTIONS,
  DEFAULT_DATE_RANGE as SCHOOL_DEFAULT_DATE_RANGE,
  parseSchoolListJsonParam,
  type DateRangeValue,
  type Filters,
} from './SchoolList.helpers';

export { DATE_RANGE_OPTIONS };
export const DEFAULT_DATE_RANGE = SCHOOL_DEFAULT_DATE_RANGE;
export type { DateRangeValue, Filters };

export const DEFAULT_PROGRAM_PAGE_SIZE = 20;

export const PROGRAM_PERCENT_FILTERS = {
  LOW: 'Low',
  MID: 'Mid',
  HIGH: 'High',
} as const;

export const programTabOptions = [
  PROGRAM_TAB.ALL,
  PROGRAM_TAB.AT_SCHOOL,
  PROGRAM_TAB.AT_HOME,
  PROGRAM_TAB.HYBRID,
].map((value) => ({
  label:
    value === PROGRAM_TAB.ALL
      ? t('All Programs')
      : t(PROGRAM_TAB_LABELS[value]),
  value,
}));

export const createEmptyProgramFilters = (): Filters => ({
  programType: [],
  partner: [],
  programManager: [],
  fieldCoordinator: [],
  state: [],
  district: [],
  block: [],
  cluster: [],
  onboardedStudentsPct: [],
  activatedStudentsPct: [],
  activeStudentsPct: [],
  onboardedTeachersPct: [],
  activatedTeachersPct: [],
  activeTeachersPct: [],
});

export const programFilterConfigs = [
  { key: 'partner', label: t('Select Partner') },
  { key: 'programManager', label: t('Select Program Manager') },
  { key: 'programType', label: t('Select Program Type') },
  { key: 'state', label: t('Select State') },
  { key: 'district', label: t('Select District') },
];

const PROGRAM_SELECTED_FILTER_LABELS: Record<string, string> = {
  partner: t('Partner'),
  programManager: t('Program Manager'),
  programType: t('Program Type'),
  fieldCoordinator: t('Field Coordinator'),
  state: t('State'),
  district: t('District'),
  block: t('Block'),
  cluster: t('Cluster'),
  model: t('Program Model'),
  onboardedStudentsPct: t('Onboarded Students'),
  activatedStudentsPct: t('Activated Students'),
  activeStudentsPct: t('Active Students'),
  onboardedTeachersPct: t('Onboarded Teachers'),
  activatedTeachersPct: t('Activated Teachers'),
  activeTeachersPct: t('Active Teachers'),
};

const PROGRAM_PERCENT_FILTER_LABELS: Record<string, string> = {
  [PROGRAM_PERCENT_FILTERS.LOW]: '\u2264 30%',
  [PROGRAM_PERCENT_FILTERS.MID]: '31% \u2013 69%',
  [PROGRAM_PERCENT_FILTERS.HIGH]: '\u2265 70%',
};

export const getProgramSelectedFilterLabel = (
  key: string,
  value: string,
): React.ReactNode => {
  const label = PROGRAM_SELECTED_FILTER_LABELS[key] ?? key;
  const displayValue = PROGRAM_PERCENT_FILTER_LABELS[value] ?? value;
  return React.createElement(
    React.Fragment,
    null,
    `${label}: `,
    React.createElement('strong', null, displayValue),
  );
};

export const getProgramSelectedFilterText = (
  key: string,
  value: string,
): string => {
  const label = PROGRAM_SELECTED_FILTER_LABELS[key] ?? key;
  const displayValue = PROGRAM_PERCENT_FILTER_LABELS[value] ?? value;
  return `${label}: ${displayValue}`;
};

export const PROGRAM_HEADER_PERCENT_FILTER_BY_COLUMN: Record<string, string> = {
  onboardedStudents: 'onboardedStudentsPct',
  activatedStudents: 'activatedStudentsPct',
  activeStudents: 'activeStudentsPct',
  onboardedTeachers: 'onboardedTeachersPct',
  activatedTeachers: 'activatedTeachersPct',
  activeTeachers: 'activeTeachersPct',
};
export const parseProgramListJsonParam = parseSchoolListJsonParam;
