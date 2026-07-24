import type React from 'react';
import type { TableTypes } from '../../../common/constants';
import type { ClassWithDetails, SchoolStats } from '../../pages/SchoolDetailsPage';
import type { ProgramGradeScopeData } from './ClassDetailsPageUtils';

export type SchoolData = TableTypes<'school'> & {
  whatsapp_bot_number?: string | null;
};

export type ClassRow = ClassWithDetails & {
  code?: string | number | null;
  grade?: number | string;
  section?: string;
  whatsapp_connected?: boolean;
};

export type SchoolDetailsData = {
  schoolData?: SchoolData;
  programData?: ProgramGradeScopeData;
  programManagers?: any[];
  principals?: any[];
  totalPrincipalCount?: number;
  coordinators?: any[];
  totalCoordinatorCount?: number;
  teachers?: any[];
  students?: any[];
  totalTeacherCount?: number;
  totalStudentCount?: number;
  schoolStats?: SchoolStats;
  classData?: ClassRow[];
  totalClassCount?: number;
};

export type SchoolClassTableRowData = {
  id: string;
  _raw: ClassRow;
  class: { render: React.ReactNode };
  code?: string | { render: React.ReactNode };
  classPerformance: { render: React.ReactNode };
  onboardedStudents: { render: React.ReactNode };
  activatedStudents: { render: React.ReactNode };
  activeStudents: { render: React.ReactNode };
  avgTimeSpent: { render: React.ReactNode };
  activeTeachers: { render: React.ReactNode };
  activitiesAssigned: { render: React.ReactNode };
  avgAssignmentsCompleted: { render: React.ReactNode };
  avgActivitiesCompleted: { render: React.ReactNode };
  actions: { render: React.ReactNode };
};

export type SchoolClassColumnDef = {
  key: keyof SchoolClassTableRowData;
  label: string;
  align?: 'left' | 'right' | 'center' | 'justify' | 'inherit';
  headerAlign?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string | number;
};
