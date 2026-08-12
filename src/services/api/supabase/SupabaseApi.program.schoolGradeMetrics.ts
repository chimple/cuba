import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../database';
import { getNumericMetric } from './SupabaseApi.program.helpers';

const sumMetric = (rows: Array<Record<string, unknown>>, key: string) =>
  rows.reduce((total, row) => total + (getNumericMetric(row[key]) ?? 0), 0);

const maxMetric = (rows: Array<Record<string, unknown>>, key: string) =>
  rows.reduce(
    (maxValue, row) => Math.max(maxValue, getNumericMetric(row[key]) ?? 0),
    0,
  );

const weightedAverage = (
  rows: Array<Record<string, unknown>>,
  valueKey: string,
  weightKey: string,
) => {
  const { weightedTotal, totalWeight } = rows.reduce(
    (
      acc: { weightedTotal: number; totalWeight: number },
      row: Record<string, unknown>,
    ) => {
      const value = getNumericMetric(row[valueKey]) ?? 0;
      const weight = getNumericMetric(row[weightKey]) ?? 0;
      return {
        weightedTotal: acc.weightedTotal + value * weight,
        totalWeight: acc.totalWeight + weight,
      };
    },
    { weightedTotal: 0, totalWeight: 0 },
  );

  return totalWeight > 0 ? weightedTotal / totalWeight : 0;
};

const resolvePerformance = (row: Record<string, unknown>) => {
  const onboardedStudents = getNumericMetric(row.onboarded_students) ?? 0;
  const activatedStudents = getNumericMetric(row.activated_students) ?? 0;
  const activeStudents = getNumericMetric(row.active_students) ?? 0;

  const activatedRatio =
    onboardedStudents > 0 ? activatedStudents / onboardedStudents : 0;
  const activeRatio =
    activatedStudents > 0 ? activeStudents / activatedStudents : 0;

  if (activatedRatio <= 0.3 || activeRatio <= 0.3) return 'red';
  if (activatedRatio <= 0.69 || activeRatio <= 0.69) return 'yellow';
  return 'green';
};

export const getGradeIdsForSchoolMetricsFilter = async (
  supabase: SupabaseClient<Database> | undefined,
  gradeValues: string[],
) => {
  if (!supabase) return [];

  const normalizedGradeValues = Array.from(
    new Set(
      gradeValues.map((value) => value.trim()).filter((value) => value.length),
    ),
  );

  if (normalizedGradeValues.length === 0) return [];

  const gradeIdSet = new Set(normalizedGradeValues);
  const gradeNameSet = new Set(
    normalizedGradeValues.map((value) => value.toLowerCase()),
  );

  const { data, error } = await supabase
    .from('grade')
    .select('id, name')
    .eq('is_deleted', false);

  if (error) return [];

  return Array.from(
    new Set(
      (data ?? [])
        .filter(
          (grade) =>
            gradeIdSet.has(String(grade.id)) ||
            gradeNameSet.has(String(grade.name).toLowerCase()),
        )
        .map((grade) => String(grade.id)),
    ),
  );
};

export const aggregateSchoolGradeMetricRows = (
  rows: Array<Record<string, unknown>>,
) => {
  const rowsBySchool = new Map<string, Array<Record<string, unknown>>>();

  rows.forEach((row) => {
    const schoolId = String(row.school_id ?? '');
    if (!schoolId) return;
    rowsBySchool.set(schoolId, [...(rowsBySchool.get(schoolId) ?? []), row]);
  });

  return Array.from(rowsBySchool.values()).map((schoolRows) => {
    const firstRow = schoolRows[0] ?? {};
    const activeStudents = sumMetric(schoolRows, 'active_students');
    const activeTeachers = sumMetric(schoolRows, 'active_teachers');
    const totalTeachers = sumMetric(schoolRows, 'total_teachers');

    const aggregatedRow = {
      ...firstRow,
      grade_id: null,
      onboarded_students: sumMetric(schoolRows, 'onboarded_students'),
      activated_students: sumMetric(schoolRows, 'activated_students'),
      active_students: activeStudents,
      avg_time_spent: weightedAverage(
        schoolRows,
        'avg_time_spent',
        'active_students',
      ),
      active_teachers: activeTeachers,
      total_teachers: totalTeachers,
      active_teacher_percentage:
        totalTeachers > 0 ? (activeTeachers / totalTeachers) * 100 : null,
      activities_assigned: sumMetric(schoolRows, 'activities_assigned'),
      avg_assignments_completed: weightedAverage(
        schoolRows,
        'avg_assignments_completed',
        'active_students',
      ),
      avg_activities_completed: weightedAverage(
        schoolRows,
        'avg_activities_completed',
        'active_students',
      ),
      parents_on_whatsapp: sumMetric(schoolRows, 'parents_on_whatsapp'),
      student_parent_calls: maxMetric(schoolRows, 'student_parent_calls'),
      student_parent_inperson: maxMetric(schoolRows, 'student_parent_inperson'),
      teacher_hm_calls: maxMetric(schoolRows, 'teacher_hm_calls'),
      community_visits: maxMetric(schoolRows, 'community_visits'),
      community_parents_reached: maxMetric(
        schoolRows,
        'community_parents_reached',
      ),
      school_visits: maxMetric(schoolRows, 'school_visits'),
      parents_in_group: maxMetric(schoolRows, 'parents_in_group'),
    };

    return {
      ...aggregatedRow,
      school_performance: resolvePerformance(aggregatedRow),
    };
  });
};
