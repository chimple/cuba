import {
  PERCENTAGE_BAND,
  PROGRAM_TAB,
  ProgramType,
  SCHOOL_PERFORMANCE_STATUS,
  SCHOOL_PERFORMANCE_STATUS_VALUES,
  type PercentageBandValue,
  type SchoolPerformanceStatusValue,
} from '../../../common/constants';
import { Database } from '../../database';
import { ProgramListingProgramRow } from '../ServiceApi';

export type SchoolListPercentBand = PercentageBandValue;

export const SCHOOL_LIST_PERCENTAGE_FILTER_KEYS = new Set([
  'activatedStudents',
  'activeStudents',
  'activeTeachers',
]);
export const SCHOOL_LIST_PERFORMANCE_FILTER_VALUES =
  new Set<SchoolPerformanceStatusValue>(SCHOOL_PERFORMANCE_STATUS_VALUES);

export const isSchoolPerformanceStatusValue = (
  value: string,
): value is SchoolPerformanceStatusValue =>
  SCHOOL_LIST_PERFORMANCE_FILTER_VALUES.has(
    value as SchoolPerformanceStatusValue,
  );

export const getNumericMetric = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }
  return null;
};

export const isPercentWithinBand = (
  percent: number | null,
  band: SchoolListPercentBand,
) => {
  if (percent === null) return false;
  const roundedPercent = Math.round(percent);
  if (band === PERCENTAGE_BAND.LOW) return roundedPercent <= 30;
  if (band === PERCENTAGE_BAND.MID)
    return roundedPercent >= 31 && roundedPercent <= 69;
  return roundedPercent >= 70;
};

export const getActivatedStudentsPercent = (row: Record<string, unknown>) => {
  const onboardedStudents = getNumericMetric(row.onboarded_students);
  const activatedStudents = getNumericMetric(row.activated_students);
  if (
    onboardedStudents === null ||
    activatedStudents === null ||
    onboardedStudents <= 0
  ) {
    return null;
  }
  return (activatedStudents / onboardedStudents) * 100;
};

export const getActiveStudentsPercent = (row: Record<string, unknown>) => {
  const activatedStudents = getNumericMetric(row.activated_students);
  const activeStudents = getNumericMetric(row.active_students);
  if (
    activatedStudents === null ||
    activeStudents === null ||
    activatedStudents <= 0
  ) {
    return null;
  }
  return (activeStudents / activatedStudents) * 100;
};

export const getActiveTeachersPercent = (row: Record<string, unknown>) => {
  const activeTeachers = getNumericMetric(row.active_teachers);
  const totalTeachers = getNumericMetric(row.total_teachers);
  if (activeTeachers !== null && totalTeachers !== null && totalTeachers > 0) {
    return (activeTeachers / totalTeachers) * 100;
  }
  return null;
};

export const getSchoolMetricsSortValue = (
  row: Record<string, unknown>,
  sortBy: string,
): string | number | null => {
  if (sortBy === 'school_performance') {
    return typeof row.school_performance === 'string'
      ? row.school_performance.toLowerCase()
      : '';
  }
  if (sortBy === 'school_name') {
    return typeof row.school_name === 'string'
      ? row.school_name.toLowerCase()
      : '';
  }
  return getNumericMetric(row[sortBy]);
};

export const normalizeSchoolPerformanceStatus = (value: unknown) => {
  const text =
    typeof value === 'string'
      ? value.trim().toLowerCase().replace(/[_-]+/g, ' ')
      : '';
  if (!text) return '';
  if (text.includes('green')) return SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL;
  if (text.includes('red')) return SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT;
  if (text.includes('yellow')) return SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION;
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const resolveSchoolMetricsPerformanceStatus = (
  row: Record<string, unknown>,
) => {
  const explicitStatus = normalizeSchoolPerformanceStatus(
    row.school_performance,
  );
  if (explicitStatus) return explicitStatus;

  const onboardedStudents = getNumericMetric(row.onboarded_students);
  const activeStudents =
    getNumericMetric(row.active_students) ??
    getNumericMetric(row.activated_students);
  if (
    onboardedStudents === null ||
    activeStudents === null ||
    onboardedStudents <= 0
  ) {
    return '';
  }
  const activeRate = activeStudents / onboardedStudents;
  if (activeRate >= 0.8) return SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL;
  if (activeRate >= 0.5) return SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION;
  return SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT;
};

export type ProgramMetricsTableRow = Omit<
  ProgramListingProgramRow,
  'target_student_count' | 'target_teachers_count'
> & {
  program_managers?: string[] | string | null;
  field_coordinators?: string[] | string | null;
  partners?: string[] | string | null;
  district?: string | null;
  block?: string | null;
  cluster?: string | null;
  target_student_count?: number | string | null;
  target_teachers_count?: number | string | null;
  target_teacher_count?: number | string | null;
  program_type?: ProgramType | null;
  program_model?: PROGRAM_TAB | PROGRAM_TAB[] | string | null;
  program?: {
    students_count?: number | string | null;
    teachers_count?: number | string | null;
  } | null;
  updated_at?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
};

export type ProgramMetricsDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      program_metrics: {
        Row: ProgramMetricsTableRow;
        Insert: ProgramMetricsTableRow;
        Update: Partial<ProgramMetricsTableRow>;
        Relationships: [];
      };
    };
  };
};
