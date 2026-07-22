import { Capacitor } from '@capacitor/core';
import Auth from '../../models/Auth';
import { TABLES } from './schema';

export const SCREEN_WIDTH = window.innerWidth;
export const SCREEN_HEIGHT = window.innerHeight;

export const LESSONS_PLAYED_COUNT = 'lessonsPlayedCount';
export const LESSON_END = 'lessonEnd';
export const PROBLEM_END = 'problemEnd';
export const GAME_END = 'gameEnd';
export const GAME_EXIT = 'gameExit';
export const TEMP_LESSONS_STORE = () => `${Auth.i.sourcedId}-lessonsStore`;
export const IS_USER_LOGED_IN = 'isUserLogedIn';
export const USER_TOKEN = 'userToken';
export const CURRENT_LESSON_LEVEL = () =>
  `${Auth.i.sourcedId}-currentLessonLevel`;
export const PREVIOUS_PLAYED_COURSE = () =>
  `${Auth.i.sourcedId}-previousPlayedCourse`;
export const PREVIOUS_SELECTED_COURSE = () =>
  `${Auth.i.sourcedId}-previousSelectedCourse`;
export const SELECTED_GRADE = () => `${Auth.i.sourcedId}-selectedGrade`;
// export const APP_LANG = "appLang";
export const CURRENT_SCHOOL = 'currentSchool';
export const SEARCH_LESSON_HISTORY = 'search_lesson_history';
export const SEARCH_LESSON_CACHE_KEY = 'search_lesson_last_state';
export const CURRENT_MODE = 'currentMode';
export const LAST_MODE = 'lastMode';
export const CURRENT_CLASS = 'currentClass';
export const LANGUAGE = 'language';
export const LANG_REFRESHED = 'langRefreshed';
export const EXAM = 'exam';
export const PRE_QUIZ = 'PreQuiz';
export const GRADE_MAP = 'GradeMap';
export const DISPLAY_SUBJECTS_STORE = 'DispSubStore';
export const EDIT_STUDENT_STORE = 'EditStudentStorage';
export const SOUND = 'sfxOff';
export const MUSIC = 'musicOff';
export const GAME_URL = 'gameUrl';
export const TC_ACCEPT = 'tcAccept';
export const RECOMMENDATIONS = 'recommendations';
export const LIVE_QUIZ = 'liveQuiz';
export const LIDO = 'lido';
export const LIDO_ASSESSMENT = 'lido_assessment';
export const TYPE = 'type';
export const APP_NAME = 'Kids';
export const SCHOOL = 'school';
export const CLASS = 'class';
export const CLASSES = 'classes';
export const DELETED_CLASSES = 'deleted_classes';
export const CURRENT_TEACHER = 'currentTeacher';
export const CURRENT_COURSE = 'currentCourse';
export const COURSE_LESSONS = 'CourseLessons';
export const NAVIGATION_STATE = 'navigationState';
export const STARS_COUNT = 'starsCount';
export const LATEST_STARS = (studentId: string) => `latestStar_${studentId}`;
export const IS_OPS_USER = 'isOpsUser';
export const EDIT_STUDENTS_MAP = 'editStudentsMap';
export const CURRENT_STUDENT_CHANGED_EVENT = 'currentStudentChanged';
export const SHOW_GENERIC_POPUP = 'SHOW_GENERIC_POPUP';
export const GENERIC_POPUP_INTERNAL_NAVIGATION = 'POPUP_INTERNAL_NAVIGATION';
export const GENERIC_POP_UP = 'generic-pop-up';
export const TC_HTML_URL = 'tc_html_url';
export const LATEST_TC_VERSION = 'latest_tc_version';
export enum GENERIC_POPUP_TRIGGER_CONDITION {
  APP_OPEN = 'APP_OPEN',
  GAME_COMPLETE = 'GAME_COMPLETE',
  TIME_ELAPSED = 'TIME_ELAPSED',
}
export enum IconType {
  SCHOOL = 'school',
  CLASS = 'class',
}

const rawWebBaseName = import.meta.env.VITE_GITHUB_BASE ?? '';
const normalizedWebBaseName = rawWebBaseName
  .replace(/\/$/, '')
  .replace(/^\.$/, '')
  .replace(/^\.\//, '');
export const BASE_NAME =
  !Capacitor.isNativePlatform() && normalizedWebBaseName
    ? normalizedWebBaseName.startsWith('/')
      ? normalizedWebBaseName
      : `/${normalizedWebBaseName}`
    : '';
export const MIN_PASS = 70;
export const IS_CUBA = 'is_cuba';
export const BUNDLE_URL =
  'https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/';
export interface PortPlugin {
  addListener(eventName: string, listenerFunc: (data: any) => void): void;
  getPort(): Promise<{ port: number }>;
  getMigrateUsers(): Promise<{ users: any }>;
  fetchNotificationData(): Promise<{
    notificationType: string;
    rewardProfileId: string;
    classId?: string;
  }>;
  shareContentWithAndroidShare(options: {
    text: string;
    title: string;
    url?: string;
    imageFile?: File[];
  }): Promise<void>;
  shareUserId(options: { userId: string }): Promise<void>;
  saveProceesedXlsxFile(options: {
    fileData: string;
    fileName?: string;
  }): Promise<void>;
  saveImageToGallery(options: {
    fileData: string;
    fileName?: string;
    mimeType?: string;
  }): Promise<{ uri?: string }>;
}
export const DEBUG_15 = 'debug15';
export const DEFAULT_SUBJECT_IDS = [
  '54abf22e-7102-4e14-915b-acd8eab47d56', //English
  'c5674cc5-48f8-40b8-8123-f5246ea0c5e8', //Maths
  'c2dfd745-e7f2-4614-8890-f983d04155b2', //Digital Skills
];

export const KARNATAKA_STATE_BOARD_CURRICULUM =
  'feec6f59-b8bc-41e8-81aa-2b2689a9fc40';
export const NCERT_CURRICULUM = 'e1629739-5421-4996-a1f7-61225443bd04';
export const OTHER_CURRICULUM = '7d560737-746a-4931-a49f-02de1ca526bd';
export const LANGUAGE_COURSE_MAP = {
  sju2ne9JwNE1TZgo9M4G: 'WUfGFSqcW8cIyl8yiqcR', //Hindi
  zvmpksodSkr8bmhGAFaT: 'jZp8NfR84MILMEazPSK7', //Kannada
};

export enum GENDER {
  BOY = 'male',
  GIRL = 'female',
  OTHER = 'unspecified',
}

export const REFRESH_TABLES_ON_LOGIN: TABLES[] = [
  TABLES.School,
  TABLES.Live_quiz_room,
  TABLES.Class,
  TABLES.User,
  TABLES.ClassInvite_code,
  TABLES.ClassUser,
  TABLES.FavoriteLesson,
  TABLES.ClassCourse,
  TABLES.ParentUser,
  TABLES.SchoolCourse,
  TABLES.SchoolUser,
  TABLES.UserBadge,
  TABLES.UserBonus,
  TABLES.UserCourse,
  TABLES.UserSticker,
  TABLES.Assignment,
  TABLES.Assignment_user,
  TABLES.Result,
  TABLES.Assignment_cart,
  TABLES.ReqNewSchool,
  TABLES.Program,
  TABLES.FcSchoolVisit,
  TABLES.LanguageLocale,
  TABLES.Locale,
];

export const AVATARS: string[] = [
  'Aligator',
  'armydog',
  'astronautraccon',
  'barbermouse',
  'bosspanda',
  'bull',
  'cheetah',
  'chefrat',
  'chicken',
  'chimpanzee',
  'cow',
  'deer',
  'doctorrabbit',
  'donkey',
  'elephant',
  'fox',
  'giraffe',
  'goat',
  'hamster',
  'hippo',
  'horse',
  'journalistdeer',
  'koala',
  'lion',
  'monkey',
  'owl',
  'pilotpenguin',
  'plumerpig',
  'policecat',
  'postmanbear',
  'rabbit',
  'reporterfox',
  'rhino',
  'sheep',
  'sloth',
  'snake',
  'soldierpolar',
  'teacherbird',
  'tiger',
  'zebra',
];
export const NUMBER_NAME = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];

export const MAX_STUDENTS_ALLOWED = 3;
export const INSTANT_SEARCH_INDEX_NAME =
  import.meta.env.VITE_ALGOLIA_INDEX_NAME ?? '';

export enum MODES {
  PARENT = 'PARENT',
  SCHOOL = 'SCHOOL',
  TEACHER_HOME = 'TEACHER_HOME',
  TEACHER_SCHOOL = 'TEACHER_SCHOOL',
  TEACHER = 'TEACHER',
  OPS_CONSOLE = 'OPS_CONSOLE',
}

export enum ACTION {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
}
export enum STAGES {
  MODE = 'mode',
  SCHOOL = 'school',
  CLASS = 'class',
  STUDENT = 'student',
  TEACHER = 'teacher',
}

export const CURRENT_STUDENT = 'currentStudent';
export enum EVENTS {
  LESSON_END = 'lesson_end',
  LESSON_INCOMPLETE = 'lesson_incomplete',
  USER_PROFILE = 'user_profile',
  GOAL_PROGRESS = 'Goal_Progress',
  CLICKS_ANALYTICS = 'clicks_analytics',
  EXPERIMENT_VIEWED = 'experiment_viewed',
  PATHWAY_CREATED = 'pathway_created',
  PATHWAY_COMPLETED = 'pathway_completed',
  PATHWAY_LESSON_END = 'pathway_lesson_end',
  PATHWAY_COURSE_CHANGED = 'pathway_course_changed',
  SYNCHING_ERROR = 'synching_error',
  PROFILE_CREATED = 'profile_created',
  PROFILE_UPDATED = 'profile_updated',
  DEEPLINK_CLICKED = 'deeplink_clicked',
  ERROR_LOGS = 'error_logs',
  PROFILE_CLICKS_ANALYTICS = 'profile_clicks_analytics',
  REWARD_COLLECTED = 'reward_collected',
  HW_DAILY_REWARD_CLAIMED = 'hw_daily_reward_claimed',
  HOME_DAILY_REWARD_CLAIMED = 'home_daily_reward_claimed',
  STICKER_BOOK_MENU_TAP = 'sticker_book_menu_tap',
  STICKER_BOOK_PAGE_NEXT = 'sticker_book_page_next',
  STICKER_BOOK_PAGE_PREV = 'sticker_book_page_prev',
  STICKER_BOOK_PAGE_BACK = 'sticker_book_page_back',
  STICKER_BOOK_PROGRESS_COUNTS = 'sticker_book_progress_counts',
  PAINT_MODE_PAGE_VIEW = 'paint_mode_page_view',
  PAINT_MODE_BUTTON_TAP = 'paint_mode_button_tap',
  PAINT_SAVE_TAP = 'paint_save_tap',
  PAINT_IMAGE_SAVED = 'paint_image_saved',
  PAINT_COLOR_TAP = 'paint_color_tap',
  PAINT_CANVAS_TAP = 'paint_canvas_tap',
  PAINT_EXIT_TAP = 'paint_exit_tap',
  PAINT_EXIT_STAY_TAP = 'paint_exit_stay_tap',
  PAINT_EXIT_CONFIRM_TAP = 'paint_exit_confirm_tap',
  PAINT_EXIT_CLOSE_TAP = 'paint_exit_close_tap',
  HOMEWORK_PATHWAY_CREATED = 'homework_pathway_created',
  HOMEWORK_PATHWAY_COMPLETED = 'homework_pathway_completed',
  HOMEWORK_PATHWAY_COURSE_CHANGED = 'homework_pathway_course_changed',
  HOMEWORK_PATHWAY_ASSIGNMENT_COMPLETED = 'homework_pathway_assignment_completed',
  LIVE_UPDATE_APPLIED = 'live_update_applied',
  LIVE_UPDATE_STARTED = 'live_update_started',
  LIVE_UPDATE_ERROR = 'live_update_error',
  USER_ACTIVATION_LESSON = 'user_activation_lesson',
  ASSESSMENT_ABORTED = 'assessment_aborted',
  ASSESSMENT_COMPLETED = 'assessment_completed',
  RESULTS_SAVED = 'results_saved',
  STICKER_PREVIEW_BOX_CLICKED = 'sticker_preview_box_clicked',
  STICKER_PREVIEW_POPUP_SHOWN = 'sticker_preview_popup_shown',
  STICKER_PREVIEW_POPUP_CLOSED = 'sticker_preview_popup_closed',
  PATHWAY_STICKER_BOX_TAPPED = 'pathway_sticker_box_tapped',
  PATHWAY_MYSTERY_BOX_TAPPED = 'pathway_mystery_box_tapped',
  HW_PATHWAY_STICKER_COLLECTED = 'hw_pathway_sticker_collected',
  HOME_PATHWAY_STICKER_COLLECTED = 'home_pathway_sticker_collected',
  STICKER_DRAG_POPUP_SHOWN = 'sticker_drag_popup_shown',
  STICKER_DRAG_POPUP_EXPANDED = 'sticker_drag_popup_expanded',
  STICKER_DRAG_POPUP_CLOSED = 'sticker_drag_popup_closed',
  STICKER_DRAG_STARTED = 'sticker_drag_started',
  STICKER_DRAG_DROPPED_SUCCESS = 'sticker_drag_dropped_success',
  STICKER_DRAG_DROPPED_MISS = 'sticker_drag_dropped_miss',
  STICKER_DRAG_STICKER_SHOWN = 'sticker_drag_sticker_shown',
  STICKER_DRAG_POINTER_SHOWN = 'sticker_drag_pointer_shown',
  STICKER_DRAG_CONFETTI_SHOWN = 'sticker_drag_confetti_shown',
  STICKER_DRAG_POPUP_TO_PROFILE = 'sticker_drag_popup_to_profile',
  STICKER_BOOK_COMPLETION_POPUP_OPEN = 'sticker_book_completion_popup_open',
  STICKER_BOOK_COMPLETION_POPUP_CLOSE = 'sticker_book_completion_popup_close',
  STICKER_BOOK_COMPLETION_POPUP_SAVE = 'sticker_book_completion_popup_save',
  STICKER_BOOK_COMPLETION_POPUP_PAINT = 'sticker_book_completion_popup_paint',
  STICKER_BOOK_SAVE_CLICKED = 'sticker_book_save_clicked',
  STICKER_BOOK_IMAGE_SAVED = 'sticker_book_image_saved',
  STICKER_BOOK_IMAGE_SHARED = 'sticker_book_image_shared',
  TC_POPUP_VIEWED = 'tc_popup_viewed',
  TC_AGREED = 'tc_agreed',
  SWITCH_TO_KIDS_APP_CLICKED = 'switch_to_kids_app_clicked',
  KIDS_APP_LOCATION_SELECTED = 'kids_app_location_selected',
  CLASS_TAB_CLASS_CHANGED = 'class_tab_class_changed',
  PROFILE_CREATION_CLICKED = 'profile_creation_clicked',
  PROFILE_CARD_ACTION_CLICKED = 'profile_card_action_clicked',
  PROFILE_DELETION_CONFIRMED = 'profile_deletion_confirmed',
  PROFILE_DELETION_CANCELLED = 'profile_deletion_cancelled',
  TEACHER_AUTH_GATE_VIEWED = 'teacher_auth_gate_viewed',
  TEACHER_AUTH_GATE_ATTEMPTED = 'teacher_auth_gate_attempted',
  TEACHER_APP_ENTRY_CLICKED = 'teacher_app_entry_clicked',
  TEACHER_APP_AUTH_SUCCESS = 'teacher_app_auth_success',
  AUTO_USER_ACTION_ATTEMPTED = 'auto_user_action_attempted',
  ASSESSMENT_TERMINATED = 'assessment_terminated',
}

export const KIDS_APP_LOCATION_SELECTIONS = {
  HOME: 'home',
  SCHOOL: 'school',
} as const;

export type KidsAppLocationSelection =
  (typeof KIDS_APP_LOCATION_SELECTIONS)[keyof typeof KIDS_APP_LOCATION_SELECTIONS];

export const TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS = {
  SWITCH_PROFILE_BACK_BUTTON: 'switch_profile_back_button',
  PARENT_SETTINGS_TAB: 'parent_settings_tab',
} as const;

export type TeacherAuthGateSourceEntryPoint =
  (typeof TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS)[keyof typeof TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS];

export const TEACHER_APP_AUTH_METHODS = {
  BIOMETRIC: 'biometric',
  MATH_GATE: 'math_gate',
} as const;

export const TEACHER_APP_USER_ROLES = {
  AUTO_USER: 'auto_user',
} as const;

export const AUTO_USER_ACTION_TYPES = {
  ADD_STUDENT: 'add_student',
} as const;

export const FCM_TOKENS = 'fcmTokens';
export const IS_CONECTED = 'is_conected';

export const LAST_UPDATE_CHECKED = 'lastUpdateChecked';

export const LAST_PERMISSION_CHECKED = 'lastPermissionChecked';

export const CACHE_IMAGE = 'cacheImage';

export const IS_MIGRATION_CHECKED = 'isMigrationChecked';

export const HOT_UPDATE_SERVER = import.meta.env.VITE_HOT_UPDATE_SERVER;

export const COPIED_BUNDLE_FILES_INDEX = 'copiedBundleFilesIndex';

export const NUMBER_REGEX = /^[0-9]+$/;
export const DOWNLOADED_LESSON_ID = 'downloadedLessonId';
export const DOWNLOADED_LESSONS_SIZE = 'downloaded_lessons_size';
export enum SnackbarType {
  Success = 'success',
  Error = 'error',
}
export const LAST_FUNCTION_CALL = 'lastFunctionCall';
export const CHAPTER_ID_LESSON_ID_MAP = 'chapterIdLessonidMap';

export const CURRENT_AVATAR_SUGGESTION_NO = 'currentAvatarSuggestion';
export const SHOW_DAILY_PROGRESS_FLAG = 'showAvatarDailyProgress';

export const CURRENT_SQLITE_VERSION = 'currentSqliteVersion';
export const BUNDLED_IMPORT_APP_VERSION_KEY = 'bundledImportAppVersion';
export const CAMPAIGN_SEQUENCE_FINISHED = 'CAMPAIGN_SEQUENCE_FINISHED';
export const LIDO_COMMON_AUDIO_DIR = 'Lido-CommonAudios';
export const LIDO_COMMON_AUDIO_LANG_KEY = 'lido_common_audio_language';
export const HOT_UPDATE_STATE_KEY = 'hotUpdateState';
export const PAL_LEARNING_RATES_CONFIG = 'pal_learning_rates_config';
