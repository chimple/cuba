import type { ProgramListingProgramRow } from '../ServiceApi';
import type { ProgramMetricsTableRow } from './SupabaseApi.program.helpers';

export const getProgramMetricNumber = (
  value: number | string | null | undefined,
): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }
  return 0;
};

export const getProgramConfiguredTargetCount = (
  value: number | string | null | undefined,
): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }
  return null;
};

export const getProgramSchoolDivisionPercent = (
  value: number | null | undefined,
  totalSchools: number,
): number => {
  if (totalSchools <= 0) return 0;
  return Math.round((getProgramMetricNumber(value) / totalSchools) * 100);
};

export const mapProgramMetricsRow = (
  row: ProgramMetricsTableRow,
): ProgramListingProgramRow => {
  const onboardedStudents = getProgramMetricNumber(row.onboarded_students);
  const targetStudentCount = getProgramConfiguredTargetCount(
    row.target_student_count ?? row.program?.students_count,
  );
  const activatedStudents = getProgramMetricNumber(row.activated_students);
  const activeStudents = getProgramMetricNumber(row.active_students);
  const onboardedTeachers = getProgramMetricNumber(row.onboarded_teachers);
  const targetTeachersCount = getProgramConfiguredTargetCount(
    row.target_teacher_count ??
      row.target_teachers_count ??
      row.program?.teachers_count,
  );
  const activatedTeachers = getProgramMetricNumber(row.activated_teachers);
  const activeTeachers = getProgramMetricNumber(row.active_teachers);
  const totalSchools = getProgramMetricNumber(row.total_schools);

  return {
    ...row,
    total_schools: totalSchools,
    performing_well: getProgramSchoolDivisionPercent(
      row.performing_well,
      totalSchools,
    ),
    needs_attention: getProgramSchoolDivisionPercent(
      row.needs_attention,
      totalSchools,
    ),
    needs_support: getProgramSchoolDivisionPercent(
      row.needs_support,
      totalSchools,
    ),
    onboarded_students: onboardedStudents,
    target_student_count: targetStudentCount,
    onboarded_students_pct:
      targetStudentCount !== null
        ? (onboardedStudents / targetStudentCount) * 100
        : null,
    activated_students: activatedStudents,
    activated_students_pct:
      onboardedStudents > 0 ? (activatedStudents / onboardedStudents) * 100 : 0,
    active_students: activeStudents,
    active_students_pct:
      activatedStudents > 0 ? (activeStudents / activatedStudents) * 100 : 0,
    avg_time_spent: getProgramMetricNumber(row.avg_time_spent),
    onboarded_teachers: onboardedTeachers,
    target_teachers_count: targetTeachersCount,
    onboarded_teachers_pct:
      targetTeachersCount !== null
        ? (onboardedTeachers / targetTeachersCount) * 100
        : null,
    activated_teachers: activatedTeachers,
    activated_teachers_pct:
      onboardedTeachers > 0 ? (activatedTeachers / onboardedTeachers) * 100 : 0,
    active_teachers: activeTeachers,
    active_teachers_pct:
      activatedTeachers > 0 ? (activeTeachers / activatedTeachers) * 100 : 0,
  };
};
