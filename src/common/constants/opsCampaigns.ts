import { RoleType } from '../../interface/modelInterfaces';
import type { EnumType } from './schema';

export const OPS_ROLES = [
  RoleType.SUPER_ADMIN,
  RoleType.OPERATIONAL_DIRECTOR,
  RoleType.PROGRAM_MANAGER,
  RoleType.FIELD_COORDINATOR,
  RoleType.EXTERNAL_USER,
];
export const CAMPAIGN_ACCESS_ROLES = [
  RoleType.SUPER_ADMIN,
  RoleType.OPERATIONAL_DIRECTOR,
  RoleType.PROGRAM_MANAGER,
  RoleType.FIELD_COORDINATOR,
];

export const CAMPAIGN_OBJECTIVE = {
  HOMEWORK: 'homework_campaign',
  HOMEPAGE_LEARNING_PATHWAY: 'homepage_learning_pathway_campaign',
} as const;
export const CAMPAIGN_STATUS = {
  ACTIVE: 'active' as EnumType<'campaign_status'>,
  INACTIVE: 'inactive' as EnumType<'campaign_status'>,
} as const;
export const CAMPAIGN_LISTING_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;
export type CampaignListingStatus =
  (typeof CAMPAIGN_LISTING_STATUS)[keyof typeof CAMPAIGN_LISTING_STATUS];
export const CAN_HOT_UPDATE = 'can-Hot-Update';
export const READY_FOR_HOT_UPDATE = 'readyForHotUpdate';
export const VERSION_KEY = 'last_native_version';
export enum SupportLevelMap {
  'Doing Good' = 'doing_good',
  'Still Learning' = 'still_learning',
  'Need Help' = 'need_help',
  'Not Tracked' = 'not_tracked',
}

export enum OpsSupportLevelMap {
  'High Engagement' = 'doing_good',
  'Medium Engagement' = 'still_learning',
  'Not Active' = 'need_help',
  'Not Downloaded' = 'not_tracked',
}

export const OPS_PERFORMANCE_BANDS = {
  HIGH: 'High Engagement',
  MEDIUM: 'Medium Engagement',
  NOT_ACTIVE: 'Not Active',
  NOT_DOWNLOADED: 'Not Downloaded',
} as const;

export const STUDENT_PERFORMANCE_BAND_KEYS = {
  GREEN: 'green_band',
  YELLOW: 'yellow_band',
  RED: 'red_band',
  GREY: 'grey_band',
} as const;

export enum RECOMMENDATION_TYPE {
  FRAMEWORK = 'framework',
  CHAPTER = 'chapter',
}

export enum PerformanceLevel {
  ALL = 'all',
  NEED_HELP = 'need_help',
  DOING_GOOD = 'doing_good',
  STILL_LEARNING = 'still_learning',
  NOT_TRACKED = 'not_tracked',
  NOT_ASSIGNING = 'not_assigning',
  ONE_TO_TWO_ASSIGNED = 'once_to_two',
  THREE_TO_FOUR_ASSIGNED = 'three_to_four',
  FOUR_PLUS_ASSIGNED = 'four_plus',
}
export enum ContactTarget {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PRINCIPAL = 'principal',
  PARENT = 'parent',
  SCHOOL = 'school',
  CLASS = 'class',
}
export enum SchoolVisitAction {
  CheckIn = 'check_in',
  CheckOut = 'check_out',
}

export enum SchoolVisitType {
  Regular = 'regular_visit',
  ParentsTeacherMeeting = 'parents_teacher_meeting',
  TeacherTraining = 'teacher_training_meeting',
  Community = 'community_visit',
}

export const SchoolVisitTypeLabels: Record<SchoolVisitType, string> = {
  [SchoolVisitType.Regular]: 'Regular Visit',
  [SchoolVisitType.ParentsTeacherMeeting]: 'Parents Teacher Meeting',
  [SchoolVisitType.TeacherTraining]: 'Teacher Training Meeting',
  [SchoolVisitType.Community]: 'Community Visit',
};

export enum SchoolVisitStatus {
  CheckedIn = 'checked_in',
  CheckedOut = 'checked_out',
}
export const PERFORMANCE_UI: Record<
  PerformanceLevel,
  { label: string; bgColor: string; textColor: string }
> = {
  [PerformanceLevel.NEED_HELP]: {
    label: 'Not Active',
    bgColor: '#FFE2E2',
    textColor: '#C10007',
  },
  [PerformanceLevel.STILL_LEARNING]: {
    label: 'Medium Engagement',
    bgColor: '#FFEDD4',
    textColor: '#CA3500',
  },
  [PerformanceLevel.DOING_GOOD]: {
    label: 'High Engagement',
    bgColor: '#DCFCE7',
    textColor: '#008236',
  },
  [PerformanceLevel.NOT_TRACKED]: {
    label: 'Not Downloaded',
    bgColor: '#F3F4F6',
    textColor: '#364153',
  },
  [PerformanceLevel.NOT_ASSIGNING]: {
    label: 'Not Assigning',
    bgColor: '#FFE2E2',
    textColor: '#CA3500',
  },
  [PerformanceLevel.ONE_TO_TWO_ASSIGNED]: {
    label: '1 - 2 Assigned',
    bgColor: '#FFEDD4',
    textColor: '#E4916A',
  },
  [PerformanceLevel.THREE_TO_FOUR_ASSIGNED]: {
    label: '3 - 4 Assigned',
    bgColor: '#DCFCE7',
    textColor: '#008236',
  },
  [PerformanceLevel.FOUR_PLUS_ASSIGNED]: {
    label: '4+ Assigned',
    bgColor: '#DCFCE7',
    textColor: '#008236',
  },
  [PerformanceLevel.ALL]: {
    label: 'All',
    bgColor: '#DCFCE7',
    textColor: '#6ec5e7ff',
  },
};
export const COURSE_CHANGED = 'courseChanged';
export const NOTES_UPDATED_EVENT = 'notes:updated';
export const ASSESSMENT_FAIL_KEY = 'assessment_failed_once';
export const LIDO_SCORES_KEY = 'lido_scores';
// 🔔 Custom Lido lifecycle events
export const LIDO_ASSESSMENT_ABORTED = 'LIDO_ASSESSMENT_ABORTED';
export const LIDO_ASSESSMENT_COMPLETED = 'LIDO_ASSESSMENT_COMPLETED';
export const LIDO_LESSON_COMPLETED = 'LIDO_LESSON_COMPLETED';
export const LIDO_RESULTS_SAVED = 'LIDO_RESULTS_SAVED';

export const LEARNING_PATHWAY_MODE = {
  DISABLED: 'DISABLED',
  ASSESSMENT_ONLY: 'ASSESSMENT_ONLY',
  FULL_ADAPTIVE: 'FULL_ADAPTIVE',
};

export const CURRENT_PATHWAY_MODE = 'currentPathwayMode';
export const FAIL_STREAK_KEY = 'failStreakCount';
export enum RESULT_STATUS {
  COMPLETED = 'completed',
  USER_EXIT = 'user_exit',
  SYSTEM_EXIT = 'system_exit',
  ASSESSMENT_TERMINATED = 'assessment_terminated',
}

export enum SOURCE {
  INITIAL_ASSESSMENT = 'initial_assessment',
  LEARNING_PATHWAY_HOME_NO_PAL = 'learning_pathway_home_no_pal',
  LEARNING_PATHWAY_HOME_PAL = 'learning_pathway_home_pal',
  LEARNING_PATHWAY_HOMEWORK = 'learning_pathway_homework',
  LIVE_QUIZ_ROOM = 'live_quiz_room',
  NO_LEARNING_PATHWAY_HOMEWORK = 'no_learning_pathway_homework',
  SUBJECT_PAGE = 'subject_page',
  TEACHER_MODE = 'teacher_mode',
}
// Used this LATEST_LEARNING_PATH to store with updateLearningPath() api and get latest learning path with Util.getLatestLearningPathByUpdatedAt() from localStorage to survive app relaunch.
export const LATEST_LEARNING_PATH = 'latest_learning_path';
export const ENABLE_STICKER_BOOK = 'enable-sticker-book';
export const STICKER_BOOK_NOTIFICATION_DOT_ENABLED =
  'sticker-book-notification-dot-enabled';
export const ENABLE_SAVE_AND_SHARE_STICKER_BOOK =
  'enable_save_and_share_sticker_book';
export const SCHOOL_PERFORMANCE_STATUS = {
  PERFORMING_WELL: 'High Performing',
  NEEDS_ATTENTION: 'Medium Performing',
  NEEDS_SUPPORT: 'Low Performing',
} as const;
export const PERCENTAGE_BAND = {
  LOW: 'low',
  MID: 'mid',
  HIGH: 'high',
} as const;
export type SchoolPerformanceStatusValue =
  (typeof SCHOOL_PERFORMANCE_STATUS)[keyof typeof SCHOOL_PERFORMANCE_STATUS];
export type PercentageBandValue =
  (typeof PERCENTAGE_BAND)[keyof typeof PERCENTAGE_BAND];
export const SCHOOL_PERFORMANCE_STATUS_VALUES = Object.values(
  SCHOOL_PERFORMANCE_STATUS,
) as SchoolPerformanceStatusValue[];
export const PERCENTAGE_BAND_VALUES = Object.values(
  PERCENTAGE_BAND,
) as PercentageBandValue[];
export const SCHOOL_PERFORMANCE_TRANSLATION_KEYS: Record<
  SchoolPerformanceStatusValue,
  string
> = {
  [SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL]:
    'schoolPerformance.performingWell',
  [SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION]:
    'schoolPerformance.needsAttention',
  [SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT]: 'schoolPerformance.needsSupport',
};
export const PERCENTAGE_BAND_TRANSLATION_KEYS: Record<
  PercentageBandValue,
  string
> = {
  [PERCENTAGE_BAND.LOW]: 'percentageBand.low',
  [PERCENTAGE_BAND.MID]: 'percentageBand.mid',
  [PERCENTAGE_BAND.HIGH]: 'percentageBand.high',
};
export const PERCENTAGE_BAND_META: Record<
  PercentageBandValue,
  { bg: string; color: string }
> = {
  [PERCENTAGE_BAND.LOW]: { bg: '#FCE8E6', color: '#D35451' },
  [PERCENTAGE_BAND.MID]: { bg: '#FEF3C7', color: '#E7A54E' },
  [PERCENTAGE_BAND.HIGH]: { bg: '#DFF7EB', color: '#2BA980' },
};
export const SCHOOL_LISTING_STATUS_META: Record<
  string,
  { bg: string; color: string }
> = {
  [SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL]: {
    bg: '#D1FAE5',
    color: '#2BA980',
  },
  [SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION]: {
    bg: '#FEF3C7',
    color: '#E7A54E',
  },
  [SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT]: {
    bg: '#FCE8E6',
    color: '#D35451',
  },
  default: { bg: '#EEF2F6', color: '#5B6472' },
};

export const CLASS_PERFORMANCE_STATUS = {
  PERFORMING_WELL: 'Performing Well',
  NEEDS_ATTENTION: 'Needs Attention',
  NEEDS_SUPPORT: 'Needs Support',
} as const;

export const CLASS_PERFORMANCE_STATUS_META: Record<
  string,
  { bg: string; color: string }
> = {
  [CLASS_PERFORMANCE_STATUS.PERFORMING_WELL]: {
    bg: '#E6F4EA',
    color: '#137333',
  },
  [CLASS_PERFORMANCE_STATUS.NEEDS_ATTENTION]: {
    bg: '#FEF7E0',
    color: '#B95000',
  },
  [CLASS_PERFORMANCE_STATUS.NEEDS_SUPPORT]: {
    bg: '#FCE8E6',
    color: '#C5221F',
  },
  default: { bg: '#EEF2F6', color: '#5B6472' },
};
