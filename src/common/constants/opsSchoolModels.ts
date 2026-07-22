import type { RoleType } from '../../interface/modelInterfaces';
import type { TableTypes } from './schema';

export enum REQUEST_TABS {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  FLAGGED = 'Flagged',
}
export enum STATUS {
  ACTIVE = 'active',
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MIGRATED = 'migrated',
  FLAGGED = 'flagged',
}

// Labels for WhatsApp group status chips in Ops Console tables.
export const WHATSAPP_GROUP_STATUS_KEYS = {
  IN_GROUP: 'IN_GROUP',
  NOT_IN_GROUP: 'NOT_IN_GROUP',
  NOT_ON_WHATSAPP: 'NOT_ON_WHATSAPP',
  ON_WHATSAPP: 'ON_WHATSAPP',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  NOT_CHECKED: 'NOT_CHECKED',
} as const;

export const WHATSAPP_GROUP_STATUS = {
  IN_GROUP: 'In Group',
  NOT_IN_GROUP: 'Not in Group',
  NOT_ON_WHATSAPP: 'Not on Whatsapp',
  ON_WHATSAPP: 'On WhatsApp',
  NOT_AVAILABLE: 'Not Available',
  NOT_CHECKED: 'Not Checked',
};

// Tick icon for the "In Group" pill.
export const WHATSAPP_GROUP_TICK_ICON = '/assets/icons/SignCircleIcon.svg';

export interface SchoolWithRole {
  school: TableTypes<'school'>;
  role: RoleType;
}
export interface FilteredSchoolsForSchoolListingOps {
  school_id?: string;
  metric_window?: string | null;
  school_name: string;
  school_performance?: string | null;
  state?: string | null;
  district?: string | null;
  block?: string | null;
  cluster?: string | null;
  udise?: string | null;
  program_id?: string | null;
  program_name?: string | null;
  partners?: string[] | null;
  total_teachers?: number | null;
  num_students: number;
  num_teachers: number;
  onboarded_students?: number | null;
  activated_students?: number | null;
  active_students?: number | null;
  avg_time_spent?: number | null;
  active_teachers?: number | null;
  active_teacher_percentage?: number | null;
  activities_assigned?: number | null;
  avg_assignments_completed?: number | null;
  avg_activities_completed?: number | null;
  phone_calls_students_parents?: number | null;
  inperson_students_parents?: number | null;
  phone_calls_teachers_hms?: number | null;
  community_visits?: number | null;
  school_visits?: number | null;
  parents_on_whatsapp?: number | null;
  parents_in_whatsapp_group?: number | null;
  parents_reached?: number | null;
  program_managers: string[];
  field_coordinators: string[];
}
export enum School_Creation_Stages {
  // CREATE_SCHOOL = "create_school",
  SCHOOL_COURSE = 'school_course',
  CREATE_CLASS = 'create_class',
  CLASS_COURSE = 'class_course',
}
