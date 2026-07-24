import { t } from 'i18next';
import type { SchoolClassColumnDef } from './SchoolClass.types';

export function getSchoolClassColumns(
  isExternalUser: boolean,
  shouldShowClassCode: boolean,
): SchoolClassColumnDef[] {
  const cols: SchoolClassColumnDef[] = [
    {
      key: 'class',
      label: t('Class'),
      sortable: false,
      width: 120,
      align: 'left',
      headerAlign: 'left',
    },
  ];
  if (shouldShowClassCode) {
    cols.push({
      key: 'code',
      label: t('Class Code'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    });
  }
  cols.push(
    {
      key: 'classPerformance',
      label: t('Class Performance'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'onboardedStudents',
      label: t('Onboarded Students'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'activatedStudents',
      label: t('Activated Students'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'activeStudents',
      label: t('Active Students'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'avgTimeSpent',
      label: t('Avg Time Spent'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'activeTeachers',
      label: t('Active Teachers'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'activitiesAssigned',
      label: t('Activities Assigned'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'avgAssignmentsCompleted',
      label: t('Avg Assignments Completed'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
    {
      key: 'avgActivitiesCompleted',
      label: t('Avg Activities Completed'),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
    },
  );
  if (!isExternalUser) {
    cols.push({
      key: 'actions',
      label: t('Actions'),
      align: 'center',
      headerAlign: 'center',
      sortable: false,
    });
  }
  return cols;
}
