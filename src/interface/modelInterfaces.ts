export interface GUIDRef {
  href: string;
  sourcedId: string;
  type: string;
}

export enum ClassType {
  HOME_ROOM = "homeroom",
  SCHEDULED = "scheduled",
}

export enum OneRosterStatus {
  ACTIVE = "active",
  TO_BE_DELETED = "tobedeleted",
}

export enum ScoreStatusEnum {
  EXEMPT = "exempt",
  FULLY_GRADED = "fully graded",
  NOT_SUBMITTED = "not submitted",
  PARTIALLY_GRADED = "partially graded",
  SUBMITTED = "submitted",
  INCOMPLETE = "incomplete",
  MISSING = "missing",
  WITHDRAWAL = "withdrawal",
  IN_PROGRESS = "in progress",
}

export interface LearningObjectiveResult {
  learningObjectiveId: string;
  score: number;
  textScore: string;
}

export interface LearningObjective {
  source: string;
  learningObjectiveResults: LearningObjectiveResult[];
}
export enum OrgTypeEnum {
  DEPARTMENT = "department",
  DISTRICT = "district",
  LOCAL = "local",
  NATIONAL = "national",
  SCHOOL = "school",
  STATE = "state",
}

export interface UserId {
  type: string;
  identifier: string;
}

export enum TrueFalseEnum {
  TRUE = "true",
  FALSE = "false",
}

export enum RoleType {
  PARENT = "parent",
  STUDENT = "student",
  TEACHER = "teacher",
  PRINCIPAL = "principal",
  SPONSOR = "sponsor",
  COORDINATOR = "coordinator",
  AUTOUSER = "autouser",
  PROGRAM_MANAGER = "program_manager",
  OPERATIONAL_DIRECTOR = "operational_director",
  SUPER_ADMIN = "super_admin",
  FIELD_COORDINATOR = "field_coordinator",
}

export const RoleLabels: Record<RoleType, string> = {
  [RoleType.PROGRAM_MANAGER]: "Program Manager",
  [RoleType.OPERATIONAL_DIRECTOR]: "Operational Director",
  [RoleType.SUPER_ADMIN]: "Super Admin",
  [RoleType.FIELD_COORDINATOR]: "Field Coordinator",
  [RoleType.PARENT]: "Parent",
  [RoleType.STUDENT]: "Student",
  [RoleType.TEACHER]: "Teacher",
  [RoleType.PRINCIPAL]: "Principal",
  [RoleType.SPONSOR]: "Sponsor",
  [RoleType.COORDINATOR]: "Coordinator",
  [RoleType.AUTOUSER]: "Autouser",
};

export enum SchoolTabs {
  Overview = "Overview",
  Classes = "Classes",
  Students = "Students",
  Teachers = "Teachers",
  Principals = "Principals",
  Coordinators = "Coordinators",
  Notes = "Notes"
}

export interface FcActivity {
  raw: {
    created_at: string;
    contact_target: string;
    call_status: string;
    support_level: string;
    tech_issues_reported: boolean;
    question_response?: string;
    comment?: string;
    how_helped? : string;
    tech_issue_comment?: string;
    media_links?: string;
  };
  user: {
    name: string;
  } | null;
  classInfo: {
    name: string;
  } | null;
}

export interface CreateSchoolNoteInput {
  schoolId: string;
  classId?: string | null;
  content: string;
}

export interface SchoolNote {
  id: string;
  text: string;
  className: string | null;
  createdAt: string;

  createdBy: {
    userId: string;
    name: string;
    role: string | null;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
}

export interface Note {
  id: string;
  createdBy: string;
  role: string;
  className?: string | null;
  date?: string;
  text: string;
  media_links?: string;
}