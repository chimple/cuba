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

/**
 * Represents metadata for a single sticker inside a sticker book.
 *
 * This does NOT represent user progress.
 * It defines what stickers exist in the book and their display order.
 *
 * Used inside `StickerBook.stickers_metadata`.
 */
export type StickerMeta = {
  /** Unique identifier of the sticker */
  id: string;

  /** Order in which the sticker appears within the book */
  sequence: number;
};


/**
 * Represents public metadata of a sticker book.
 *
 * Maps to the `sticker_book` table.
 * Contains book-level information but does NOT include user progress.
 *
 * Used for:
 * - Rendering sticker books
 * - Loading SVG layouts
 * - Determining total required stickers
 */
export type StickerBook = {
  id: string;

  /** Display title of the sticker book */
  title: string;

  /** URL of the SVG layout used to visually render the book */
  svg_url: string;

  /** Sorting index used to order books in the UI */
  sort_index: number;

  /**
   * List of all stickers that exist in this book.
   * Used to determine rendering order and completion logic.
   */
  stickers_metadata: StickerMeta[];

  /** Total number of stickers required to complete the book */
  total_stickers: number;
};


/**
 * Represents a user's progress for a specific sticker book.
 *
 * Maps to the `user_sticker_book` table.
 * Stores which stickers the user has collected
 * and whether the book is completed.
 *
 * Used for:
 * - Tracking collected stickers
 * - Determining completion status
 * - Rendering user progress in UI
 */
export type UserStickerProgress = {
  /** Unique identifier of this progress entry */
  id: string;

  /** ID of the user who owns this progress */
  user_id: string;

  /** ID of the associated sticker book */
  sticker_book_id: string;

  /**
   * List of sticker IDs collected by the user.
   * Must match IDs defined in `StickerMeta`.
   */
  stickers_collected: string[];

  /** Current completion state of the sticker book */
  status: "in_progress" | "completed";
};