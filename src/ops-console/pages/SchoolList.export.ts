import { type SchoolListSourceRow } from './SchoolList.fetcher';
import {
  buildSchoolUdiseLocationLabel,
  formatCompactNumber,
  formatPercent,
  getSchoolListExportColumns,
  pickFirstNumber,
  resolvePerformanceStatus,
} from './SchoolList.helpers';

type ExportMetricText = {
  valueText: string;
  percentText: string;
};

const formatMetricValue = (
  value: unknown,
  suffix = '',
  options?: { maxFractionDigits?: number },
) =>
  value === null || value === undefined || value === ''
    ? '--'
    : `${formatCompactNumber(value, options)}${suffix}`;

const buildMetricExportText = (
  value: unknown,
  suffix = '',
  options?: { maxFractionDigits?: number },
): ExportMetricText => ({
  valueText: formatMetricValue(value, suffix, options),
  percentText: '--',
});

const buildMetricWithPercentExportText = (
  value: unknown,
  percent: number | null,
  suffix = '',
  options?: { maxFractionDigits?: number },
): ExportMetricText => ({
  valueText: formatMetricValue(value, suffix, options),
  percentText: percent === null ? '--' : (formatPercent(percent) ?? '--'),
});

const buildExportCellTextMap = (school: SchoolListSourceRow) => {
  const onboardedStudents = pickFirstNumber(
    school.onboarded_students,
    school.total_students,
  );
  const activatedStudents = pickFirstNumber(school.activated_students);
  const activeStudents = pickFirstNumber(school.active_students);
  const activeTeachers = pickFirstNumber(school.active_teachers);
  const completionAssignments = pickFirstNumber(
    school.avg_assignments_completed,
  );
  const completionActivities = pickFirstNumber(school.avg_activities_completed);
  const udiseLocation = buildSchoolUdiseLocationLabel(school);
  const performanceStatus = resolvePerformanceStatus(school) || '--';
  const metricTextByKey: Record<string, ExportMetricText> = {
    name: {
      valueText: udiseLocation
        ? `${school.school_name}\n${udiseLocation}`
        : school.school_name,
      percentText: '--',
    },
    schoolPerformance: {
      valueText: performanceStatus,
      percentText: '--',
    },
    onboardedStudents: buildMetricExportText(onboardedStudents),
    activatedStudents: buildMetricWithPercentExportText(
      activatedStudents,
      onboardedStudents && activatedStudents
        ? (activatedStudents / onboardedStudents) * 100
        : null,
    ),
    activeStudents: buildMetricWithPercentExportText(
      activeStudents,
      activatedStudents && activeStudents
        ? (activeStudents / activatedStudents) * 100
        : null,
    ),
    avgTimeSpent: buildMetricExportText(
      pickFirstNumber(
        school.avg_time_spent,
        school.average_time_spent_mins,
        school.avg_time_spent_minutes,
      ),
      'm',
      { maxFractionDigits: 0 },
    ),
    activeTeachers: buildMetricWithPercentExportText(
      activeTeachers,
      activeTeachers && activeTeachers > 0 ? 100 : null,
    ),
    activitiesAssigned: buildMetricExportText(
      pickFirstNumber(
        school.activities_assigned,
        school.total_activities_assigned,
        school.assignments_assigned,
      ),
    ),
    avgAssignmentsCompleted: buildMetricExportText(completionAssignments),
    avgActivitiesCompleted: buildMetricExportText(completionActivities),
  };
  return metricTextByKey;
};

export const buildSchoolListExportSheetRows = (rows: SchoolListSourceRow[]) => {
  const exportColumns = getSchoolListExportColumns();

  return [
    exportColumns.map((column) => column.label),
    ...rows.map((school) => {
      const exportCellTextMap = buildExportCellTextMap(school);
      return exportColumns.map((column) => {
        const metric = exportCellTextMap[column.key];
        if (!metric) return '--';
        return column.part === 'percent'
          ? metric.percentText
          : metric.valueText;
      });
    }),
  ];
};
