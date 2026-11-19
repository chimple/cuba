import React, { useMemo } from 'react';
import { Button as MuiButton } from '@mui/material';
import { t } from 'i18next';
import DataTableBody from '../DataTableBody';
import {
  getClassMetricValues,
  renderClassPerformanceCell,
  renderNumberCell,
  renderNumberWithPercentCell,
} from './SchoolClassMetrics';
import { getSchoolClassColumns } from './SchoolClassColumns';
import SchoolClassActions from './SchoolClassActions';
import { sortClassesByGradeAndSection } from './ClassDetailsPageUtils';
import type { ClassMetricsForClassListingRow } from '../../../services/api/ServiceApi';
import type { ClassRow, SchoolClassTableRowData } from './SchoolClass.types';

type SchoolClassTableProps = {
  classMetrics: Record<string, ClassMetricsForClassListingRow>;
  classMetricsLoading: boolean;
  codes: Record<string, string | null>;
  effectiveClasses: ClassRow[];
  handleGenerateCode: (classId: string) => void;
  isExternalUser: boolean;
  loadingIds: Record<string, boolean>;
  onAddStudent: (classRow: ClassRow) => void;
  onEditClass: (classRow: ClassRow) => void;
  onDeleteClass: (classRow: ClassRow) => void;
  onSelectClass: (classId: string) => void;
  shouldShowClassCode: boolean;
};

export default function SchoolClassTable({
  classMetrics,
  classMetricsLoading,
  codes,
  effectiveClasses,
  handleGenerateCode,
  isExternalUser,
  loadingIds,
  onAddStudent,
  onEditClass,
  onDeleteClass,
  onSelectClass,
  shouldShowClassCode,
}: SchoolClassTableProps) {
  const rows = useMemo<SchoolClassTableRowData[]>(() => {
    return sortClassesByGradeAndSection(effectiveClasses).map((c) => {
      const classLabel = typeof c.name === 'string' ? c.name.trim() : '';
      const metrics = classMetrics[c.id];
      const metricValues = getClassMetricValues(metrics, c.studentCount);

      const rawCodeVal = c.code ?? codes[c.id] ?? metrics?.class_code ?? null;
      const codeVal =
        rawCodeVal === null || rawCodeVal === undefined
          ? null
          : String(rawCodeVal);
      const hasCode = typeof codeVal === 'string' && codeVal.trim().length > 0;
      const isLoading = !!loadingIds[c.id];
      const codeCell = hasCode
        ? codeVal
        : isExternalUser
          ? t('Not Generated')
          : {
              render: (
                <MuiButton
                  variant="outlined"
                  size="small"
                  disabled={isLoading}
                  sx={{
                    borderRadius: '9999px',
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.25,
                    height: 28,
                    fontWeight: 700,
                    boxShadow:
                      '0 1px 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateCode(c.id);
                  }}
                >
                  {isLoading ? t('Generating...') : t('Generate')}
                </MuiButton>
              ),
            };

      const baseRow: SchoolClassTableRowData = {
        id: c.id,
        _raw: c,
        class: { render: <strong>{classLabel}</strong> },
        classPerformance: renderClassPerformanceCell(metrics),
        onboardedStudents: renderNumberCell(metricValues.onboardedStudents),
        activatedStudents: renderNumberWithPercentCell(
          metricValues.activatedStudents,
          metricValues.activatedPercent,
        ),
        activeStudents: renderNumberWithPercentCell(
          metricValues.activeStudents,
          metricValues.activePercent,
        ),
        avgTimeSpent: renderNumberCell(metricValues.avgTimeSpent, 'm', {
          maxFractionDigits: 0,
        }),
        activeTeachers: renderNumberWithPercentCell(
          metricValues.activeTeachers,
          metricValues.activeTeachersPercent,
        ),
        activitiesAssigned: renderNumberCell(metricValues.activitiesAssigned),
        avgAssignmentsCompleted: renderNumberCell(
          metricValues.avgAssignmentsCompleted,
          '',
          {
            maxFractionDigits: 1,
          },
        ),
        avgActivitiesCompleted: renderNumberCell(
          metricValues.avgActivitiesCompleted,
          '',
          {
            maxFractionDigits: 1,
          },
        ),
        actions: {
          render: (
            <SchoolClassActions
              classRow={c}
              isExternalUser={isExternalUser}
              onAddStudent={onAddStudent}
              onEditClass={onEditClass}
              onDeleteClass={onDeleteClass}
            />
          ),
        },
      };
      if (shouldShowClassCode) {
        baseRow.code = codeCell;
      }

      return baseRow;
    });
  }, [
    classMetrics,
    codes,
    effectiveClasses,
    handleGenerateCode,
    isExternalUser,
    loadingIds,
    onAddStudent,
    onEditClass,
    onDeleteClass,
    shouldShowClassCode,
  ]);

  const columns = useMemo(
    () => getSchoolClassColumns(isExternalUser, shouldShowClassCode),
    [isExternalUser, shouldShowClassCode],
  );

  return (
    <div className="schoolclass-table-container">
      <DataTableBody
        columns={columns}
        rows={rows}
        orderBy={'class' as const}
        order={'asc' as const}
        onSort={() => {}}
        onRowClick={(id) => onSelectClass(String(id))}
        loading={classMetricsLoading}
        tableMinWidth={shouldShowClassCode ? 1380 : 1260}
        headerAlign="center"
        headerNoEllipsis
      />
    </div>
  );
}
