import SelectIconImage from '../../teachers-module/assets/icons/all_subject_icon.png';
import type { TableTypes } from './schema';
import { BANDWISECOLOR, LEADERBOARD_REWARD_LIST } from './navigation';

export type LeaderboardBadge = {
  id: string;
  seen: boolean;
};

export type LeaderboardBonus = {
  id: string;
  seen: boolean;
};

export type LeaderboardSticker = {
  id: string;
  seen: boolean;
};

export type LeaderboardRewards = {
  badges: LeaderboardBadge[];
  bonus: LeaderboardBonus[];
  sticker: LeaderboardSticker[];
};

export type unlockedRewardsInfo = {
  id: string;
  type: LeaderboardRewardsType;
  image: string;
  name: string;
  leaderboardRewardList: LEADERBOARD_REWARD_LIST;
};

export enum LeaderboardRewardsType {
  BADGE = 'badge',
  BONUS = 'bonus',
  STICKER = 'sticker',
}
export const DOWNLOAD_LESSON_BATCH_SIZE = 1;
export const MAX_DOWNLOAD_LESSON_ATTEMPTS = 3;

export const LESSON_DOWNLOAD_SUCCESS_EVENT = 'lesson_download_success';
export const ALL_LESSON_DOWNLOAD_SUCCESS_EVENT = 'all_lesson_download_success';
export const CLASS_OR_SCHOOL_CHANGE_EVENT = 'class_or_school_change_event';
export const DOWNLOAD_BUTTON_LOADING_STATUS = 'download_button_loading_status';
export const DOMAIN = '@chimple.net';
export const AT_SYMBOL_RESTRICTION = /@/;
export const SELECTED_STUDENTS = 'selectedStudent';
export const SELECTED_CLASSES = 'selectedClasses';
export const CURRENT_CLASS_NAME = 'currClassName';
export const USER_SELECTION_STAGE = 'userSelectionStage';
export const CURRENT_SCHOOL_NAME = 'currentSchoolName';
export const DOWNLOADING_CHAPTER_ID = 'downloading_chapter_id';
export const REFRESH_TOKEN = 'refreshToken';
export const LOCAL_BUNDLES_PATH = 'https://localhost/assets/lessonBundles/';
export const CURRENT_SELECTED_COURSE = 'currentSelectedCourse';
export const CURRENT_SELECTED_CHAPTER = 'currentSelectedChapter';
export const CURRENT_STAGE = 'currentStage';
export const CURRENT_SELECTED_GRADE = 'currentSelectedGrade';
export interface HomeWeeklySummary {
  activeStudents: {
    count: number;
    totalStudents: number;
    trend: 'up' | 'down' | 'same';
  };
  averageTimeSpent: {
    minutes: number;
    trend: 'up' | 'down' | 'same';
  };
  averageScore: {
    percentage: number;
    trend: 'up' | 'down' | 'same';
  };
}
export type StudentProgressData = Map<
  string,
  TableTypes<'user'> | TableTypes<'result'>[] | number
>;
export const getBandTitleByColor = (
  color: string,
  t: (key: string) => string,
) => {
  if (color === BANDWISECOLOR.RED) {
    return t('Not active for last 7 or more days');
  }
  if (color === BANDWISECOLOR.YELLOW) {
    return t('Medium Engagement <45 minutes');
  }
  if (color === BANDWISECOLOR.GREEN) {
    return t('High Engagement 45+ minutes');
  }
  return t('App not downloaded');
};
export const LidoActivityEndKey = 'lidoActivityEnd';
export const LidoLessonEndKey = 'lidoLessonEnd';
export const LidoNextContainerKey = 'lidoNextContainer';
export const LidoActivityChangeKey = 'lidoActivityChange';
export const LidoGameCompletedKey = 'lidoGameCompleted';
export const LidoGameExitKey = 'lidoGameExit';
export const QUIZ_POPUP_SHOWN = 'quizPopupShown';
export const ASSIGNMENT_POPUP_SHOWN = 'assignmentPopupShown';
export const GrowthBookAttributes = 'growthBookAttributes';
export const SCHOOL_LOGIN = 'schoolLogin';
export const CAMERAPERMISSION = 'cameraPermission';
export const LOCAL_LESSON_BUNDLES_PATH = '/assets/lessonBundles/';

export const ALL_SUBJECT = {
  id: 'all',
  name: 'All Subjects',
  icon: SelectIconImage,
  subjectDetail: 'All Grades',
};
export const CAN_ACCESS_REMOTE_ASSETS = 'can_access_remote_assets';
export const HOMEWORK_REMOTE_ASSETS_ENABLED = 'homework_remote_assets_enabled';
export const HOME_HEADER_SPECIALS_ENABLED = 'home-header-specials-enabled';
export const STICKER_BOOK_PREVIEW_ENABLED = 'sticker-book-preview-enabled';
export const STICKER_BOOK_CELEBRATION_POPUP_ENABLED =
  'sticker-book-celebration-popup-enabled';
export const STICKER_BOOK_COMPLETION_POPUP = 'sticker_book_completion_popup';
export const PATHWAY_END_REWARD_BOX_VARIANT = 'pathway-end-reward-box-variant';
export const LEARNING_PATH_ASSETS = 'learning_path_assets';
export const HOMEWORK_PATHWAY_ASSETS = 'homework_pathway_assets';
export const SHOULD_SHOW_REMOTE_ASSETS = 'shouldShowRemoteAssets';
export const SHOULD_SHOW_HOMEWORK_REMOTE_ASSETS =
  'shouldShowHomeworkRemoteAssets';
export const HOMEWORK_PATHWAY_DROPDOWN = 'homework_pathway_dropdown';
export const HOMEWORK_PATHWAY = 'homework_pathway';
export const AUTO_OPEN_STICKER_PREVIEW_KEY = 'auto_open_sticker_preview';
export const AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY =
  'auto_open_sticker_completion_popup';
export const PENDING_PATHWAY_STICKER_REWARD_KEY =
  'pending_pathway_sticker_reward';
export const PENDING_FINAL_HOMEWORK_COMPLETE_AFTER_STICKER_FLOW_KEY =
  'pending_final_homework_complete_after_sticker_flow';
export const STICKER_BOOK_COMPLETION_READY_EVENT =
  'sticker_book_completion_ready';
export const PATHWAY_REWARD_CELEBRATION_STARTED_EVENT =
  'pathway_reward_celebration_started';
export const PATHWAY_REWARD_AUDIO_READY_EVENT = 'pathway_reward_audio_ready';
export const ENABLE_PAINT_MODE = 'enable-paint-mode';
export const CHIMPLE_ENGLISH = '63e40488-3c1a-47ab-aa8a-6f07ad21709f';
export const CHIMPLE_MATHS = '9d2474bd-b9c6-43ea-8415-242668807ba0';
export const CHIMPLE_DIGITAL_SKILLS = '19bb079f-bc69-44e4-bc1d-0b77f2683b6c';
export const CHIMPLE_HINDI = '7e9d65fa-ac2e-452e-bca4-1499d5c174e0';
export const GRADE1_KANNADA = 'a90608de-4376-4baf-82c2-07760b2aa899';
export const GRADE1_MARATHI = '2cada0d1-db3d-4da0-8ade-e9ba282a3558';
export const BULK_UPLOAD_TEMPLATE_URL =
  'https://aeakbcdznktpsbrfsgys.supabase.co/storage/v1/object/public/common-files//Bulk%20School%20&%20Students%20Upload%20Template.xlsx';
export const BUNDLE_ZIP_URLS = 'bundle_zip_urls';
export const LIDO_BUNDLE_ZIP_URLS = 'lido_bundle_zip_urls';
export const CURRENT_HEADER = 'currentHeader';
export const SEARCH_TERM = 'searchTerm';
export const FORM_MODES = {
  ALL_REQUIRED: 'all-required',
  NAME_REQUIRED: 'name-required',
  ALL_OPTIONAL: 'all-optional',
};

export const PROFILE_DETAILS_GROWTHBOOK_VARIATION = {
  ONBOARDING: 'student-profile-creation-flow',
  CONTROL: 'create_student_profile_v',
  VARIANT_1: 'create_student_profile_v1',
  VARIANT_2: 'create_student_profile_v2',
  VARIANT_3: 'create_student_profile_v3',
};

export const ACTION_TYPES = {
  PROFILE_CREATED: 'profile_created',
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_SKIPPED: 'profile_skipped',
};

export enum AGE_OPTIONS {
  LESS_THAN_EQUAL_4 = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  GREATER_THAN_EQUAL_10 = '10',
}

export const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 1,
  operational_director: 2,
  program_manager: 3,
  field_coordinator: 4,
  external_user: 5,
};

export enum AssignmentSource {
  MANUAL = 'manual',
  RECOMMENDED = 'recommended',
  CHATBOT = 'chatbot',
  QR_CODE = 'qr_code',
}
export interface StudentInfo {
  user: TableTypes<'user'>;
  grade: number;
  classSection: string;
  parent: TableTypes<'user'> | null;
  // Optional full parent list used when merged profiles carry multiple contacts.
  parents?: TableTypes<'user'>[];
  classWithidname?: {
    id: string;
    class_name: string;
  };
}
export interface StudentAPIResponse {
  data: StudentInfo[];
  total: number;
}
export interface TeacherInfo {
  user: TableTypes<'user'>;
  grade: number;
  classWithidname: {
    id: string;
    name: string;
  };
  classSection: string;
}
export interface TeacherAPIResponse {
  data: TeacherInfo[];
  total: number;
}
export type PrincipalInfo = TableTypes<'user'>;
export interface PrincipalAPIResponse {
  data: PrincipalInfo[];
  total: number;
}
export type CoordinatorInfo = TableTypes<'user'>;
export interface CoordinatorAPIResponse {
  data: CoordinatorInfo[];
  total: number;
}
export const CHIMPLE_RIVE_STATE_MACHINE_MAX = 'chimple_rive_state_machine_max';
// Shared mascot Rive state machine/input identifiers.
export const CHIMPLE_MASCOT_STATE_MACHINE_HOMEWORK_COMPLETE = 'State Machine 1';
export const CHIMPLE_MASCOT_STATE_MACHINE_CELEBRATE = 'State Machine 2';
export const CHIMPLE_MASCOT_STATE_MACHINE_NORMAL = 'State Machine 3';
export const CHIMPLE_MASCOT_STATE_MACHINE_REWARD = 'State Machine 4';
export const CHIMPLE_MASCOT_INPUT_CELEBRATE = 'Number 1';
export const CHIMPLE_MASCOT_INPUT_NORMAL = 'Number 2';
export const CHIMPLE_MASCOT_INPUT_REWARD = 'Number 3';
export const CHIMPLE_MASCOT_ANIMATION_IDLE = 'id';
export const CHIMPLE_MASCOT_ANIMATION_WAVY = 'wavy';
export const CHIMPLE_MASCOT_ANIMATION_WIN = 'win';

export interface GeoDataParams {
  p_country?: string;
  p_state?: string;
  p_district?: string;
  p_block?: string;
}

export interface SearchSchoolsParams {
  p_country?: string;
  p_state?: string;
  p_district?: string;
  p_block?: string;
  p_cluster?: string;
  p_search_text?: string;
  p_page_limit?: number;
  p_page_offset?: number;
}
export type School = TableTypes<'school'>;
export interface SearchSchoolsResult {
  total_count: number;
  schools: School[];
}

export const CACHE_TABLES_TO_CLEAR = [
  'school',
  'class',
  'user',
  'class_invite_code',
  'class_user',
  'favorite_lesson',
  'class_course',
  'parent_user',
  'school_course',
  'school_user',
  'user_badge',
  'user_bonus',
  'user_course',
  'user_sticker',
  'assignment',
  'assignment_user',
  'result',
  'program',
] as const;
export type CACHETABLES = (typeof CACHE_TABLES_TO_CLEAR)[number];
export const REWARD_MODAL_SHOWN_DATE = 'RewardModalShownDate';
export const DAILY_USER_REWARD = 'DailyUserReward';
export const IDLE_REWARD_ID = '5dfa8e34-14a3-42de-ae3a-977862712b1e';
export const REWARD_LESSON = 'RewardLesson';
export const STUDENT_RESULT = 'studentResult';
export const REWARD_LEARNING_PATH = 'RewardLearningPath';
export const ACTIVATION_REWARD_FLOW_KEY = 'ActivationRewardFlow';
export enum RewardBoxState {
  IDLE = 'idle',
  SHAKING = 'shaking',
  BLAST = 'blast',
}
export const IS_REWARD_FEATURE_ON = 'isRewardFeatureOn';
