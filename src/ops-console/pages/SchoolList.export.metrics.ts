import { t } from 'i18next';
import {
  type SchoolListExportGrade,
  type SchoolListSourceRow,
} from './SchoolList.fetcher';

const NULL_EXPORT_VALUE = 'NULL';

export const collectSchoolListExportGrades = (
  rows: SchoolListSourceRow[],
): SchoolListExportGrade[] => {
  const grades = new Map<string, SchoolListExportGrade>();
  rows.forEach((school) =>
    (school.school_grade_columns ?? []).forEach((grade) => {
      if (!grades.has(grade.id)) grades.set(grade.id, grade);
    }),
  );
  return Array.from(grades.values());
};

export const buildSchoolListExportMetricHeaders = (
  grades: SchoolListExportGrade[],
): string[] => [
  ...grades.map(
    (grade) => `${t('Onboarded Students')} - ${grade.name}`,
  ),
  t('Total Onboarded Teachers'),
  t('Activated Teachers'),
  ...grades.map(
    (grade) => `${t('Parents on WhatsApp')} - ${grade.name}`,
  ),
  ...grades.map(
    (grade) => `${t('Parents on Group')} - ${grade.name}`,
  ),
];

export const buildSchoolListExportMetricValues = (
  school: SchoolListSourceRow,
  grades: SchoolListExportGrade[],
): string[] => {
  const storedRows = school.school_metrics_export_rows;
  const metrics = storedRows ?? [];
  const summary =
    metrics.find((metric) => metric.grade_id === null) ??
    (storedRows ? undefined : school);
  const byGrade = new Map(
    metrics.flatMap((metric) =>
      metric.grade_id ? [[metric.grade_id, metric] as const] : [],
    ),
  );

  return [
    ...grades.map((grade) => {
      const metric = byGrade.get(grade.id);
      return metric
        ? String(metric.onboarded_students ?? 0)
        : NULL_EXPORT_VALUE;
    }),
    String(summary?.total_teachers ?? 0),
    String(summary?.activated_teachers ?? 0),
    ...grades.map((grade) => {
      const metric = byGrade.get(grade.id);
      return metric
        ? String(metric.parents_on_whatsapp ?? 0)
        : NULL_EXPORT_VALUE;
    }),
    ...grades.map((grade) => {
      const metric = byGrade.get(grade.id);
      return metric ? String(metric.parents_in_group ?? 0) : NULL_EXPORT_VALUE;
    }),
  ];
};
