import { Capacitor } from "@capacitor/core";
import Auth from "../models/auth";
import { Constants, Database } from "../services/database";
import { RoleType } from "../interface/modelInterfaces";
import SelectIconImage from "../teachers-module/assets/icons/all_subject_icon.png";

export enum COURSES {
  SIERRA_LEONE_ENGLISH = "sl-en",
  SIERRA_LEONE_MATHS = "sl-maths",
  PUZZLE = "puzzle",
  ENGLISH = "en",
  MATHS = "maths",
}
export enum CocosCourseIdentifier {
  maths = "maths",
  en = "en",
  kn = "kn",
  hi = "hi",
  mr = "mr",
}

export type TableTypes<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type EnumType<K extends keyof (typeof Constants)["public"]["Enums"]> =
  (typeof Constants)["public"]["Enums"][K][number];

export enum MUTATE_TYPES {
  INSERT = "insert",
  UPDATE = "update",
  DELETE = "delete",
}

export enum LOGIN_TYPES {
  PHONE = "phone",
  STUDENT = "student",
  EMAIL = "email",
  OTP = "otp",
  FORGET_PASS = "forget_pass",
}

export enum TABLES {
  Curriculum = "curriculum",
  Subject = "subject",
  Grade = "grade",
  Language = "language",
  Course = "course",
  School = "school",
  Chapter = "chapter",
  Lesson = "lesson",
  Live_quiz_room = "live_quiz_room",
  Badge = "badge",
  Sticker = "sticker",
  Reward = "reward",
  Class = "class",
  User = "user",
  ClassInvite_code = "class_invite_code",
  ClassUser = "class_user",
  FavoriteLesson = "favorite_lesson",
  ClassCourse = "class_course",
  ChapterLesson = "chapter_lesson",
  ParentUser = "parent_user",
  ProgramUser = "program_user",
  SchoolCourse = "school_course",
  SchoolUser = "school_user",
  UserBadge = "user_badge",
  UserBonus = "user_bonus",
  UserCourse = "user_course",
  UserSticker = "user_sticker",
  Assignment = "assignment",
  Assignment_user = "assignment_user",
  Result = "result",
  Assignment_cart = "assignment_cart",
  // Chatbot = "chatbot",
  ReqNewSchool = "req_new_school",
  ChapterLinks = "chapter_links",
  Program = "program",
  SpecialUsers = "special_users",
  OpsRequests = "ops_requests",
  GeoLocations = "geo_locations",
  RiveReward = "rive_reward",
}
export enum CLASS_USERS {
  STUDENTS = "Students",
  TEACHERS = "Teachers",
}
export enum SCHOOL_USERS {
  PRINCIPALS = "Principals",
  COORDINATORS = "Coordinators",
  SPONSORS = "Sponsors",
}
export enum SL_GRADES {
  GRADE1 = "Grade 1",
  GRADE2 = "Grade 2",
}

export enum PROGRAM_TAB {
  ALL = "all",
  AT_SCHOOL = "at_school",
  AT_HOME = "at_home",
  HYBRID = "hybrid",
}

export const PROGRAM_TAB_LABELS: Record<PROGRAM_TAB, string> = {
  [PROGRAM_TAB.ALL]: "All",
  [PROGRAM_TAB.AT_SCHOOL]: "At School",
  [PROGRAM_TAB.AT_HOME]: "At Home",
  [PROGRAM_TAB.HYBRID]: "Hybrid",
};

export type TabType = keyof typeof PROGRAM_TAB_LABELS;

// Backend model mapping (if needed)
export enum MODEL {
  AT_SCHOOL = "AT_SCHOOL",
  AT_HOME = "AT_HOME",
  HYBRID = "HYBRID",
}

export const ALL_COURSES = [COURSES.ENGLISH, COURSES.MATHS, COURSES.PUZZLE];

export enum LeaderboardDropdownList {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  ALL_TIME = "ALL_TIME",
}

export enum APP_LANGUAGES {
  en = "English",
  hi = "हिन्दी",
  kn = "ಕನ್ನಡ",
  mr = "मराठी",
}
export enum HOMEHEADERLIST {
  SUGGESTIONS = "SUGGESTIONS",
  SUBJECTS = "SUBJECTS",
  HOME = "HOME",
  ASSIGNMENT = "ASSIGNMENT",
  CHALLENGES = "CHALLENGES",
  SEARCH = "SEARCH",
  LIVEQUIZ = "LIVE-QUIZ",
  PROFILE = "PROFILE",
  HISTORY = "HISTORY",
  FAVOURITES = "FAVOURITES",
}

export enum PARENTHEADERLIST {
  PROFILE = "PROFILE",
  SETTING = "SETTING",
  HELP = "HELP",
  FAQ = "FAQ",
}

export enum LEADERBOARDHEADERLIST {
  LEADERBOARD = "LEADERBOARD",
  EVENTS = "EVENTS",
  REWARDS = "REWARDS",
}

export enum LEADERBOARD_REWARD_LIST {
  BADGES = "MEDALS",
  BONUS = "BONUS",
  STICKER = "STICKERS",
}

export type SchoolRoleMap = {
  schoolId: string;
  users: TableTypes<"user">[];
};

export enum ASSIGNMENTTAB_LIST {
  RECOMMENDED = "Recommended",
  ASSIGNMENT = "Assignment",
  LIVEQUIZ = "Live Quiz",
}

export enum BANDWISECOLOR {
  RED = "#F09393",
  YELLOW = "#FDF7C3",
  GREEN = "#CBDFA0",
  GREY = "#D4D1D8",
}

export enum BANDS {
  REDGROUP = "redGroup",
  YELLOWGROUP = "yellowGroup",
  GREENGROUP = "greenGroup",
  GREYGROUP = "greyGroup",
}

export enum COMMONTAB_LIST {
  SCHOOL = "School",
  CLASS = "Class",
  SUBJECTS = "Subjects",
}

export enum USERTYPES {
  COORDINATORS = "Coordinators",
  PRINCIAPAL = "Principal",
  SPONSORS = "Sponsors",
  TEACHERS = "Teachers",
  STUDENTS = "Students",
}

export enum PROFILETYPE {
  SCHOOL = "school",
  CLASS = "class",
  USER = "user",
}

export enum TABLEDROPDOWN {
  ASSIGNMENTS = "Assignments Report",
  MONTHLY = "Monthly Report",
  WEEKLY = "Weekly Report",
  LIVEQUIZ = "LiveQuiz Report",
  CHAPTER = "Chapter Report",
}

export enum TABLESORTBY {
  NAME = "Alphabetical",
  HIGHSCORE = "High to Low",
  LOWSCORE = "Low to High",
}

export enum FileUploadStep {
  Idle = "idle",
  Verifying = "verifying",
  Verified = "verified",
  Uploading = "uploading",
  Uploaded = "uploaded",
  Error = "error",
  UploadError = "uploadError",
}

export const belowGrade1 = "30ecb762-8e63-45b3-a22a-62c1a9f71641";
export const grade1 = "c802dce7-0840-4baf-b374-ef6cb4272a76";
export const grade2 = "36e7ff1f-34d6-42ac-9294-3192433ace40";
export const grade3 = "d8cf7700-e00c-4bf8-a082-222b1ecfe1f7";
export const aboveGrade3 = "d05cb75a-adc2-4365-8548-30b2ac65b321";
export const CONTINUE = "continue";

export const parentHeaderIconList: HeaderIconConfig[] = [
  {
    displayName: "User",
    iconSrc: "assets/icons/favicon.png",
    headerList: PARENTHEADERLIST.PROFILE,
  },
  {
    displayName: "Setting",
    iconSrc: "/assets/icons/favicon.png",
    headerList: PARENTHEADERLIST.SETTING,
  },
  {
    displayName: "Help/Contact",
    iconSrc: "/assets/icons/favicon.png",
    headerList: PARENTHEADERLIST.HELP,
  },
  {
    displayName: "FAQ",
    iconSrc: "/assets/icons/favicon.png",
    headerList: PARENTHEADERLIST.FAQ,
  },
];

export interface HeaderIconConfig {
  displayName: string;
  iconSrc: string;
  headerList: any;
}

export const ACTIVE_HEADER_ICON_CONFIGS: Map<HOMEHEADERLIST, HeaderIconConfig> =
  new Map<HOMEHEADERLIST, HeaderIconConfig>([
    [
      HOMEHEADERLIST.HOME,
      {
        displayName: "Home",
        iconSrc: "/assets/icons/HomeIconActive.svg",
        headerList: HOMEHEADERLIST.HOME,
      },
    ],
    [
      HOMEHEADERLIST.ASSIGNMENT,
      {
        displayName: "Homework",
        iconSrc: "/assets/icons/HomeworkIconActive.svg",
        headerList: HOMEHEADERLIST.ASSIGNMENT,
      },
    ],
    [
      HOMEHEADERLIST.SUBJECTS,
      {
        displayName: "Subjects",
        iconSrc: "/assets/icons/SubjectsIconActive.svg",
        headerList: HOMEHEADERLIST.SUBJECTS,
      },
    ],
    [
      HOMEHEADERLIST.LIVEQUIZ,
      {
        displayName: "Specials",
        iconSrc: "/assets/icons/SpecialsIconActive.svg",
        headerList: HOMEHEADERLIST.LIVEQUIZ,
      },
    ],
  ]);

export const DEFAULT_HEADER_ICON_CONFIGS: Map<
  HOMEHEADERLIST,
  HeaderIconConfig
> = new Map<HOMEHEADERLIST, HeaderIconConfig>([
  [
    HOMEHEADERLIST.ASSIGNMENT,
    {
      displayName: "Homework",
      iconSrc: "/assets/icons/HomeworkIconInactive.svg",
      headerList: HOMEHEADERLIST.ASSIGNMENT,
    },
  ],
  [
    HOMEHEADERLIST.SUBJECTS,
    {
      displayName: "Subjects",
      iconSrc: "/assets/icons/SubjectsIcon.svg",
      headerList: HOMEHEADERLIST.SUBJECTS,
    },
  ],
  [
    HOMEHEADERLIST.LIVEQUIZ,
    {
      displayName: "Specials",
      iconSrc: "/assets/icons/SpecialsIcon.svg",
      headerList: HOMEHEADERLIST.LIVEQUIZ,
    },
  ],
]);

// export const HEADERLIST = [HOME_CONFIG, LANG_CONFIGS, PROFILE_CONFIG]
export const HEADER_ICON_CONFIGS: Map<HOMEHEADERLIST, HeaderIconConfig> =
  new Map<HOMEHEADERLIST, HeaderIconConfig>([
    [
      HOMEHEADERLIST.SUGGESTIONS,
      {
        displayName: "Suggestion",
        iconSrc: "/assets/icons/suggestion_icon.svg",
        headerList: HOMEHEADERLIST.SUGGESTIONS,
      },
    ],
    [
      HOMEHEADERLIST.SUBJECTS,
      {
        displayName: "Subjects",
        iconSrc: "/assets/icons/subject_icon.svg",
        headerList: HOMEHEADERLIST.SUBJECTS,
      },
    ],
    [
      HOMEHEADERLIST.ASSIGNMENT,
      {
        displayName: "Homework",
        iconSrc: "/assets/icons/homework_icon.svg",
        headerList: HOMEHEADERLIST.ASSIGNMENT,
      },
    ],
    // [
    //   HOMEHEADERLIST.CHALLENGES,
    //   {
    //     displayName: "Challenges",
    //     iconSrc: "/assets/icons/MathsIcon.svg",
    //     headerList: HOMEHEADERLIST.CHALLENGES,
    //   },
    // ],
    [
      HOMEHEADERLIST.SEARCH,
      {
        displayName: "Search",
        iconSrc: "/assets/icons/search_icon.svg",
        headerList: HOMEHEADERLIST.SEARCH,
      },
    ],
    [
      HOMEHEADERLIST.LIVEQUIZ,
      {
        displayName: "Live Quiz",
        iconSrc: "/assets/icons/quiz_icon.svg",
        headerList: HOMEHEADERLIST.LIVEQUIZ,
      },
    ],
  ]);

export const LESSON_CARD_COLORS = [
  "#FF7925",
  "#FFC000",
  "#2BAC67",
  "#008CD2",
  "#FF94B5",
  "#AC82CF",
];

export const CHAPTER_CARD_COLOURS = [
  "#F99500",
  "#0090D3",
  "#F3609B",
  "#8F5AA5",
  "#009948",
];

export const DEFUALT_SUBJECT_CARD_COLOUR = "#009948";

export enum PAGES {
  RESET_PASSWORD = "/reset-password",
  APP_UPDATE = "/",
  HOME = "/home",
  LOGIN = "/login",
  GAME = "/game",
  LIDO_PLAYER = "/lido-player",
  END = "/end",
  PROFILE = "/profile",
  PARENT = "/parent",
  CREATE_STUDENT = "/create-student",
  EDIT_STUDENT = "/edit-student",
  DISPLAY_STUDENT = "/display-students",
  DISPLAY_SUBJECTS = "/display-subjects",
  DISPLAY_CHAPTERS = "/display-chapters",
  DISPLAY_SCHOOLS = "/display-schools",
  DISPLAY_CLASSES = "/display-classes",
  DASHBOARD_DETAILS = "/dashboard-details",
  HOME_PAGE = "/home-page",
  ADD_SUBJECTS = "/add-subjects",
  APP_LANG_SELECTION = "/app-lang-selection",
  STUDENT_PROGRESS = "/student-progress",
  SEARCH = "/search",
  SHOW_CHAPTERS = "/show-chapters",
  LEADERBOARD = "/leaderboard",
  ASSIGNMENT = "/assignment",
  JOIN_CLASS = "/join-class",
  JOIN_SCHOOL = "/join-school",
  LIVE_QUIZ = "/live-quiz",
  SELECT_MODE = "/select-mode",
  TERMS_AND_CONDITIONS = "/terms-and-conditions",
  LIVE_QUIZ_JOIN = "/live-quiz-join",
  LIVE_QUIZ_GAME = "/live-quiz-game",
  LIVE_QUIZ_ROOM_RESULT = "/live-quiz-room-result",
  LIVE_QUIZ_LEADERBOARD = "/live-quiz-leaderboard",
  USER_PROFILE = "/user-profile",
  STUDENT_PROFILE = "/student-profile",
  ADD_STUDENT = "/add_student",
  TEST_PAGE = "/test-page",
  TEST_PAGE1 = "/test-page1",
  TEACHER_ASSIGNMENT = "/teacher-assignment",
  LESSON_DETAILS = "/lesson-details",
  SEARCH_LESSON = "/search-lesson",
  CLASS_USERS = "/class-users",
  SUBJECTS_PAGE = "/subject-selection",
  MANAGE_SCHOOL = "/manage-schools",
  SCHOOL_PROFILE = "/school-profile",
  ADD_SCHOOL = "/add-school",
  REQ_ADD_SCHOOL = "/req-add-school",
  MANAGE_CLASS = "/manage-class",
  EDIT_SCHOOL = "/edit-school",
  REQ_EDIT_SCHOOL = "/req-edit-school",
  EDIT_CLASS = "/edit-class",
  ADD_CLASS = "/add-class",
  CLASS_PROFILE = "/class-profile",
  SHOW_STUDENTS_IN_ASSIGNED_PAGE = "/show-students-in-assigned-page",
  ADD_TEACHER = "/add-teacher",
  ADD_TEACHER_NAME = "/add-teacher-name",
  TEACHER_PROFILE = "/teacher-profile",
  STUDENT_REPORT = "/student-report",
  SCHOOL_USERS = "/school-users",
  ADD_PRINCIPAL = "/add-principal",
  ADD_COORDINATOR = "/add-coordinator",
  ADD_SPONSOR = "/add-sponsor",
  UPLOAD_PAGE = "/upload-page",
  PROGRAM_PAGE = "/program-page",
  PROGRAM_DETAIL_PAGE = "/program-details-page",
  PROFILE_DETAILS = "/profile-details",
  SIDEBAR_PAGE = "/admin-home-page",
  ADMIN_DASHBOARD = "/dashboard",
  ADMIN_PROGRAMS = "/programs",
  ADMIN_SCHOOLS = "/schools",
  ADMIN_COMPAIGNS = "/compaigns",
  ADMIN_USERS = "/users",
  ADMIN_DEVICES = "/devices",
  ADMIN_RESOURCES = "/resourses",
  NEW_PROGRAM = "/new-program",
  SCHOOL_LIST = "/school-list",
  SCHOOL_DETAILS = "/school-details",
  USERS = "/users",
  USER_DETAILS = "/user-details",
  PROGRAM_CONNECTED_SCHOOL_LIST_PAGE_OPS = "/program-connected-school-list-page-ops",
  NEW_USERS_OPS = "/new-user-ops",
  REQUEST_LIST = "/request-list",
  SCHOOL_PENDING_REQUEST = "/school-pending-request",
  SCHOOL_APPROVED_REQUEST = "/school-approved-request",
  SCHOOL_REJECTED_REQUEST = "/school-rejected-request",
  SCHOOL_FORM_PAGE = "/school-form-page",
  STUDENT_PENDING_REQUEST = "/student-pending-request",
  OPS_APPROVED_REQUEST = "/student-approved-request",
  OPS_REJECTED_REQUEST = "/student-rejected-request",
  OPS_REJECTED_FLAGGED = "/student-flagged-request",
  PRINCIPAL_TEACHER_PENDING_REQUEST = "/principal-teacher-pending-request",
  SEARCH_SCHOOL = "/search-school",
  CREATE_SCHOOL = "/create-school",
  POST_SUCCESS = "/post-success",
  SCAN_REDIRECT = "/scan-redirect",
  ADD_SCHOOL_PAGE = "/add-school-page",
}

export const enum ASSIGNMENT_TYPE {
  ASSIGNMENT = "assignment",
  LIVEQUIZ = "liveQuiz",
  REWARD = "reward",
}
export enum LANG {
  ENGLISH = "en",
  HINDI = "hi",
  KANNADA = "kn",
  MARATHI = "mr",
  SIERRA_LEONE = "sl_en",
}
export enum SCORECOLOR {
  RED = "#D74747",
  ORANGE = "#FFA800",
  GREEN = "#86AB37",
  WHITE = "white",
}
export enum DrawerOptions {
  MANAGE_SCHOOL = "Manage School",
  MANAGE_CLASS = "Manage Class",
  USER_PROFILE = "User Profile",
}

export enum NavItems {
  DASHBOARD = "Dashboard",
  PROGRAMS = "Programs",
  SCHOOLS = "Schools",
  COMPAIGNS = "Campaigns",
  REQUESTS = "Requests",
  USERS = "Users",
  DEVICES = "Devices",
  RESOURCES = "Resources",
}

export enum ProgramType {
  Government = "government",
  Private = "private",
  LearningCenter = "learning_centers",
}
export enum RequestTypes {
  STUDENT = "student",
  TEACHER = "teacher",
  PRINCIPAL = "principal",
  SCHOOL = "school",
}
export const DEFAULT_PAGE_SIZE = 20;

export enum REQUEST_TABS {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  FLAGGED = "Flagged",
}
export enum STATUS {
  ACTIVE = "active",
  REQUESTED = "requested",
  APPROVED = "approved",
  REJECTED = "rejected",
  MIGRATED = "migrated",
  FLAGGED = "flagged",
}

export interface SchoolWithRole {
  school: TableTypes<"school">;
  role: RoleType;
}
export interface FilteredSchoolsForSchoolListingOps {
  school_name: string;
  num_students: number;
  num_teachers: number;
  program_managers: string[];
  field_coordinators: string[];
}
export enum School_Creation_Stages {
  // CREATE_SCHOOL = "create_school",
  SCHOOL_COURSE = "school_course",
  CREATE_CLASS = "create_class",
  CLASS_COURSE = "class_course",
}
export const SCREEN_WIDTH = window.innerWidth;
export const SCREEN_HEIGHT = window.innerHeight;

export const LESSONS_PLAYED_COUNT = "lessonsPlayedCount";
export const LESSON_END = "lessonEnd";
export const PROBLEM_END = "problemEnd";
export const GAME_END = "gameEnd";
export const GAME_EXIT = "gameExit";
export const TEMP_LESSONS_STORE = () => `${Auth.i.sourcedId}-lessonsStore`;
export const IS_USER_LOGED_IN = "isUserLogedIn";
export const USER_TOKEN = "userToken";
export const CURRENT_LESSON_LEVEL = () =>
  `${Auth.i.sourcedId}-currentLessonLevel`;
export const PREVIOUS_PLAYED_COURSE = () =>
  `${Auth.i.sourcedId}-previousPlayedCourse`;
export const PREVIOUS_SELECTED_COURSE = () =>
  `${Auth.i.sourcedId}-previousSelectedCourse`;
export const SELECTED_GRADE = () => `${Auth.i.sourcedId}-selectedGrade`;
// export const APP_LANG = "appLang";
export const CURRENT_SCHOOL = "currentSchool";
export const CURRENT_MODE = "currentMode";
export const CURRENT_CLASS = "currentClass";
export const LANGUAGE = "language";
export const EXAM = "exam";
export const PRE_QUIZ = "PreQuiz";
export const GRADE_MAP = "GradeMap";
export const DISPLAY_SUBJECTS_STORE = "DispSubStore";
export const EDIT_STUDENT_STORE = "EditStudentStorage";
export const SOUND = "sfxOff";
export const MUSIC = "musicOff";
export const GAME_URL = "gameUrl";
export const TC_ACCEPT = "tcAccept";
export const RECOMMENDATIONS = "recommendations";
export const LIVE_QUIZ = "liveQuiz";
export const COCOS = "cocos";
export const LIDO = "lido";
export const TYPE = "type";
export const APP_NAME = "Kids";
export const SCHOOL = "school";
export const CLASS = "class";
export const CLASSES = "classes";
export const DELETED_CLASSES = "deleted_classes";
export const USER_ROLE = "userRole";
export const CURRENT_TEACHER = "currentTeacher";
export const CURRENT_COURSE = "currentCourse";
export const NAVIGATION_STATE = "navigationState";
export const STARS_COUNT = "starsCount";
export const LATEST_STARS = "latestStar";
export const IS_OPS_USER = "isOpsUser";
export const EDIT_STUDENTS_MAP = "editStudentsMap";
export enum IconType {
  SCHOOL = "school",
  CLASS = "class",
}

export const BASE_NAME =
  !Capacitor.isNativePlatform() && !!process.env.REACT_APP_GITHUB_BASE
    ? process.env.REACT_APP_GITHUB_BASE
    : "";
export const MIN_PASS = 70;
export const IS_CUBA = "is_cuba";
export const BUNDLE_URL =
  "https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/";
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
}
export const DEBUG_15 = "debug15";
export const DEFAULT_SUBJECT_IDS = [
  "54abf22e-7102-4e14-915b-acd8eab47d56", //English
  "c5674cc5-48f8-40b8-8123-f5246ea0c5e8", //Maths
  "c2dfd745-e7f2-4614-8890-f983d04155b2", //Digital Skills
];

export const KARNATAKA_STATE_BOARD_CURRICULUM =
  "feec6f59-b8bc-41e8-81aa-2b2689a9fc40";
export const NCERT_CURRICULUM = "e1629739-5421-4996-a1f7-61225443bd04";
export const OTHER_CURRICULUM = "7d560737-746a-4931-a49f-02de1ca526bd";
export const LANGUAGE_COURSE_MAP = {
  sju2ne9JwNE1TZgo9M4G: "WUfGFSqcW8cIyl8yiqcR", //Hindi
  zvmpksodSkr8bmhGAFaT: "jZp8NfR84MILMEazPSK7", //Kannada
};

export enum GENDER {
  BOY = "male",
  GIRL = "female",
  OTHER = "unspecified",
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
];

export const AVATARS: string[] = [
  "Aligator",
  "armydog",
  "astronautraccon",
  "barbermouse",
  "bosspanda",
  "bull",
  "cheetah",
  "chefrat",
  "chicken",
  "chimpanzee",
  "cow",
  "deer",
  "doctorrabbit",
  "donkey",
  "elephant",
  "fox",
  "giraffe",
  "goat",
  "hamster",
  "hippo",
  "horse",
  "journalistdeer",
  "koala",
  "lion",
  "monkey",
  "owl",
  "pilotpenguin",
  "plumerpig",
  "policecat",
  "postmanbear",
  "rabbit",
  "reporterfox",
  "rhino",
  "sheep",
  "sloth",
  "snake",
  "soldierpolar",
  "teacherbird",
  "tiger",
  "zebra",
];
export const NUMBER_NAME = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

export const MAX_STUDENTS_ALLOWED = 3;
export const INSTANT_SEARCH_INDEX_NAME =
  process.env.REACT_APP_ALGOLIA_INDEX_NAME ?? "";

export enum MODES {
  PARENT = "PARENT",
  SCHOOL = "SCHOOL",
  TEACHER = "TEACHER",
  OPS_CONSOLE = "OPS_CONSOLE",
}

export enum ACTION {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
}
export enum STAGES {
  MODE = "mode",
  SCHOOL = "school",
  CLASS = "class",
  STUDENT = "student",
  TEACHER = "teacher",
}

export const CURRENT_STUDENT = "currentStudent";
export const CURRENT_USER = "currentUser";
export enum EVENTS {
  LESSON_END = "lesson_end",
  LESSON_INCOMPLETE = "lesson_incomplete",
  USER_PROFILE = "user_profile",
  CLICKS_ANALYTICS = "clicks_analytics",
  EXPERIMENT_VIEWED = "experiment_viewed",
  PATHWAY_CREATED = "pathway_created",
  PATHWAY_COMPLETED = "pathway_completed",
  PATHWAY_COURSE_CHANGED = "pathway_course_changed",
  SYNCHING_ERROR = "synching_error",
  PROFILE_CREATED = "profile_created",
  PROFILE_UPDATED = "profile_updated",
  PROFILE_SKIPPED = "profile_skipped",
  DEEPLINK_CLICKED = "deeplink_clicked",
  ERROR_LOGS = "error_logs",
  PROFILE_CLICKS_ANALYTICS = "profile_clicks_analytics",
  REWARD_COLLECTED = "reward_collected",
  HOMEWORK_PATHWAY_CREATED = "homework_pathway_created",
  HOMEWORK_PATHWAY_COMPLETED = "homework_pathway_completed",
  LIVE_UPDATE_APPLIED = "live_update_applied",
  LIVE_UPDATE_STARTED = "live_update_started",
  LIVE_UPDATE_ERROR = "live_update_error",
}

export const FCM_TOKENS = "fcmTokens";
export const IS_CONECTED = "is_conected";

export const LAST_UPDATE_CHECKED = "lastUpdateChecked";

export const LAST_PERMISSION_CHECKED = "lastPermissionChecked";

export const CACHE_IMAGE = "cacheImage";

export const IS_MIGRATION_CHECKED = "isMigrationChecked";

export const HOT_UPDATE_SERVER = process.env.REACT_APP_HOT_UPDATE_SERVER;

export const COPIED_BUNDLE_FILES_INDEX = "copiedBundleFilesIndex";

export const NUMBER_REGEX = /^[0-9]+$/;
export const DOWNLOADED_LESSON_ID = "downloadedLessonId";
export enum SnackbarType {
  Success = "success",
  Error = "error",
}
export const LAST_FUNCTION_CALL = "lastFunctionCall";
export const CHAPTER_ID_LESSON_ID_MAP = "chapterIdLessonidMap";

export const CURRENT_AVATAR_SUGGESTION_NO = "currentAvatarSuggestion";
export const SHOW_DAILY_PROGRESS_FLAG = "showAvatarDailyProgress";

export const CURRENT_SQLITE_VERSION = "currentSqliteVersion";

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
  BADGE = "badge",
  BONUS = "bonus",
  STICKER = "sticker",
}
export const DOWNLOAD_LESSON_BATCH_SIZE = 8;
export const MAX_DOWNLOAD_LESSON_ATTEMPTS = 3;

export const LESSON_DOWNLOAD_SUCCESS_EVENT = "lesson_download_success";
export const ALL_LESSON_DOWNLOAD_SUCCESS_EVENT = "all_lesson_download_success";
export const CLASS_OR_SCHOOL_CHANGE_EVENT = "class_or_school_change_event";
export const DOWNLOAD_BUTTON_LOADING_STATUS = "download_button_loading_status";
export const DOMAIN = "@chimple.net";
export const AT_SYMBOL_RESTRICTION = /@/;
export const SELECTED_STUDENTS = "selectedStudent";
export const SELECTED_CLASSES = "selectedClasses";
export const CURRENT_CLASS_NAME = "currClassName";
export const USER_SELECTION_STAGE = "userSelectionStage";
export const CURRENT_SCHOOL_NAME = "currentSchoolName";
export const DOWNLOADING_CHAPTER_ID = "downloading_chapter_id";
export const USER_DATA = "userData";
export const REFRESH_TOKEN = "refreshToken";
export const LOCAL_BUNDLES_PATH = "https://localhost/assets/lessonBundles/";
export const CURRENT_SELECTED_COURSE = "currentSelectedCourse";
export const CURRENT_SELECTED_CHAPTER = "currentSelectedChapter";
export const CURRENT_STAGE = "currentStage";
export const CURRENT_SELECTED_GRADE = "currentSelectedGrade";
export interface HomeWeeklySummary {
  assignments: {
    asgnmetCmptd: number;
    totalAssignments: number;
  };
  students: {
    stdCompletd: number;
    totalStudents: number;
  };
  timeSpent: number;
  averageScore: number;
}

export const LidoActivityEndKey = "lidoActivityEnd";
export const LidoLessonEndKey = "lidoLessonEnd";
export const LidoNextContainerKey = "lidoNextContainer";
export const LidoActivityChangeKey = "lidoActivityChange";
export const LidoGameCompletedKey = "lidoGameCompleted";
export const LidoGameExitKey = "lidoGameExit";
export const QUIZ_POPUP_SHOWN = "quizPopupShown";
export const ASSIGNMENT_POPUP_SHOWN = "assignmentPopupShown";
export const GrowthBookAttributes = "growthBookAttributes";
export const SCHOOL_LOGIN = "schoolLogin";
export const CAMERAPERMISSION = "cameraPermission";
export const LOCAL_LESSON_BUNDLES_PATH = "/assets/lessonBundles/";

export const ALL_SUBJECT = {
  id: "all",
  name: "All Subjects",
  icon: SelectIconImage,
  subjectDetail: "All Grades",
};
export const CAN_ACCESS_REMOTE_ASSETS = "can_access_remote_assets";
export const HOMEWORK_REMOTE_ASSETS_ENABLED = "homework_remote_assets_enabled";
export const LEARNING_PATH_ASSETS = "learning_path_assets";
export const HOMEWORK_PATHWAY_ASSETS = "homework_pathway_assets";
export const SHOULD_SHOW_REMOTE_ASSETS = "shouldShowRemoteAssets";
export const SHOULD_SHOW_HOMEWORK_REMOTE_ASSETS =
  "shouldShowHomeworkRemoteAssets";
export const HOMEWORK_PATHWAY_DROPDOWN = "homework_pathway_dropdown";
export const HOMEWORK_PATHWAY = "homework_pathway";
export const CHIMPLE_ENGLISH = "63e40488-3c1a-47ab-aa8a-6f07ad21709f";
export const CHIMPLE_MATHS = "9d2474bd-b9c6-43ea-8415-242668807ba0";
export const CHIMPLE_DIGITAL_SKILLS = "19bb079f-bc69-44e4-bc1d-0b77f2683b6c";
export const CHIMPLE_HINDI = "7e9d65fa-ac2e-452e-bca4-1499d5c174e0";
export const GRADE1_KANNADA = "a90608de-4376-4baf-82c2-07760b2aa899";
export const GRADE1_MARATHI = "2cada0d1-db3d-4da0-8ade-e9ba282a3558";
export const BULK_UPLOAD_TEMPLATE_URL =
  "https://aeakbcdznktpsbrfsgys.supabase.co/storage/v1/object/public/common-files//Bulk%20School%20&%20Students%20Upload%20Template.xlsx";

export const FORM_MODES = {
  ALL_REQUIRED: "all-required",
  NAME_REQUIRED: "name-required",
  ALL_OPTIONAL: "all-optional",
};

export const PROFILE_DETAILS_GROWTHBOOK_VARIATION = {
  AFTER_LOGIN_ONBOARDING: "after-login-onboarding",
  AFTER_LOGIN_CONTROL: "after_login_control",
  AFTER_LOGIN_V1: "after_login_v1",
  AFTER_LOGIN_V2: "after_login_v2",
  AFTER_LOGIN_V3: "after_login_v3",
};

export const ACTION_TYPES = {
  PROFILE_CREATED: "profile_created",
  PROFILE_UPDATED: "profile_updated",
  PROFILE_SKIPPED: "profile_skipped",
};

export enum AGE_OPTIONS {
  LESS_THAN_EQUAL_4 = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  GREATER_THAN_EQUAL_10 = "10",
}

export const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 1,
  operational_director: 2,
  program_manager: 3,
  field_coordinator: 4,
};

export enum AssignmentSource {
  MANUAL = "manual",
  RECOMMENDED = "recommended",
  CHATBOT = "chatbot",
  QR_CODE = "qr_code",
}
export interface StudentInfo {
  user: TableTypes<"user">;
  grade: number;
  classSection: string;
  parent: TableTypes<"user"> | null;
  classWithidname?: {
    id: string;
    name: string;
  };
}
export interface StudentAPIResponse {
  data: StudentInfo[];
  total: number;
}
export interface TeacherInfo {
  user: TableTypes<"user">;
  grade: number;
  classSection: string;
}
export interface TeacherAPIResponse {
  data: TeacherInfo[];
  total: number;
}
export type PrincipalInfo = TableTypes<"user">;
export interface PrincipalAPIResponse {
  data: PrincipalInfo[];
  total: number;
}
export type CoordinatorInfo = TableTypes<"user">;
export interface CoordinatorAPIResponse {
  data: CoordinatorInfo[];
  total: number;
}
export const CHIMPLE_RIVE_STATE_MACHINE_MAX = "chimple_rive_state_machine_max";

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
export type School = TableTypes<"school">;
export interface SearchSchoolsResult {
  total_count: number;
  schools: School[];
}

export const CACHE_TABLES_TO_CLEAR = [
  "school",
  "class",
  "user",
  "class_invite_code",
  "class_user",
  "favorite_lesson",
  "class_course",
  "parent_user",
  "school_course",
  "school_user",
  "user_badge",
  "user_bonus",
  "user_course",
  "user_sticker",
  "assignment",
  "assignment_user",
  "result",
  "program",
] as const;
export type CACHETABLES = (typeof CACHE_TABLES_TO_CLEAR)[number];
export const REWARD_MODAL_SHOWN_DATE = "RewardModalShownDate";
export const DAILY_USER_REWARD = "DailyUserReward";
export const IDLE_REWARD_ID = "5dfa8e34-14a3-42de-ae3a-977862712b1e";
export const REWARD_LESSON = "RewardLesson";
export const REWARD_LEARNING_PATH = "RewardLearningPath";
export enum RewardBoxState {
  IDLE = "idle",
  SHAKING = "shaking",
  BLAST = "blast",
}
export const IS_REWARD_FEATURE_ON = "isRewardFeatureOn";

export const OPS_ROLES = [
  RoleType.SUPER_ADMIN,
  RoleType.OPERATIONAL_DIRECTOR,
  RoleType.PROGRAM_MANAGER,
  RoleType.FIELD_COORDINATOR,
];
export const CAN_HOT_UPDATE = "can-Hot-Update";
