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

export enum SchoolTabs {
  Overview = "Overview",
  Students = "Students",
  Teachers = "Teachers",
  Principals = "Principals",
  Coordinators = "Coordinators",
}
