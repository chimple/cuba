import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { t } from 'i18next';
import {
  buildSchoolSubtitle,
  getSchoolCoordinatorList,
  getStatusMeta,
  resolvePerformanceStatus,
  renderMetricCell,
  renderMetricWithPercentCell,
  pickFirstNumber,
} from './SchoolList.helpers';
import {
  type SchoolListRow,
  type SchoolListSourceRow,
  type SchoolMetricCell,
} from './SchoolList.fetcher';

export const isSchoolMetricCell = (value: unknown): value is SchoolMetricCell =>
  typeof value === 'object' &&
  value !== null &&
  'render' in value &&
  'value' in value;

export const mapSchoolRowsToRenderRows = (
  data: SchoolListSourceRow[],
): SchoolListRow[] =>
  data.map((school) => {
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
    const completionActivities = pickFirstNumber(
      school.avg_activities_completed,
    );

    return {
      ...school,
      id: school.sch_id ?? school.school_id ?? school.id ?? '',
      fieldCoordinators:
        getSchoolCoordinatorList(school).join(', ') ||
        String(t('not assigned yet')),
      name: {
        value: school.school_name,
        render: (
          <Box display="flex" flexDirection="column" alignItems="flex-start">
            <Typography variant="subtitle2">{school.school_name}</Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontSize={'12px'}
            >
              {buildSchoolSubtitle(school)}
            </Typography>
          </Box>
        ),
      },
      schoolPerformance: (() => {
        const status = resolvePerformanceStatus(school);
        const meta = getStatusMeta(status);
        return {
          value: status || '--',
          render: (
            <Chip
              label={status ? t(status) : '--'}
              size="small"
              sx={{
                backgroundColor: `${meta.bg} !important`,
                color: `${meta.color} !important`,
                border: 'none',
                fontWeight: 600,
                height: 24,
                '& .MuiChip-label': {
                  px: 1,
                  color: `${meta.color} !important`,
                  fontWeight: 600,
                },
              }}
            />
          ),
        };
      })(),
      onboardedStudents: renderMetricCell(onboardedStudents),
      activatedStudents: renderMetricWithPercentCell(
        activatedStudents,
        onboardedStudents && activatedStudents
          ? (activatedStudents / onboardedStudents) * 100
          : null,
      ),
      activeStudents: renderMetricWithPercentCell(
        activeStudents,
        activatedStudents && activeStudents
          ? (activeStudents / activatedStudents) * 100
          : null,
      ),
      avgTimeSpent: renderMetricCell(
        pickFirstNumber(
          school.avg_time_spent,
          school.average_time_spent_mins,
          school.avg_time_spent_minutes,
        ),
        'm',
        { maxFractionDigits: 0 },
      ),
      activeTeachers: renderMetricWithPercentCell(
        activeTeachers,
        activeTeachers && activeTeachers > 0 ? 100 : null,
      ),
      activitiesAssigned: renderMetricCell(
        pickFirstNumber(
          school.activities_assigned,
          school.total_activities_assigned,
          school.assignments_assigned,
        ),
      ),
      avgAssignmentsCompleted: renderMetricCell(completionAssignments),
      avgActivitiesCompleted: renderMetricCell(completionActivities),
    };
  });
