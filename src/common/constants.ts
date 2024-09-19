import { Capacitor } from "@capacitor/core";
import Auth from "../models/auth";
import { Database } from "../services/database";
import { RoleType } from "../interface/modelInterfaces";

export enum COURSES {
  SIERRA_LEONE_ENGLISH = "sl-en",
  SIERRA_LEONE_MATHS = "sl-maths",
  PUZZLE = "puzzle",
  ENGLISH = "en",
  MATHS = "maths",
}
export type TableTypes<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export enum MUTATE_TYPES {
  INSERT = "insert",
  UPDATE = "update",
  DELETE = "delete",
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
}
export enum CLASS_USERS {
  STUDENTS = "Students",
  TEACHERS = "Teachers",
}
export enum SL_GRADES {
  GRADE1 = "Grade 1",
  GRADE2 = "Grade 2",
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

export enum ASSIGNMENTTAB_LIST {
  RECOMMENDED = "Recommended",
  ASSIGNMENT = "Assignment",
  LIVEQUIZ = "Live Quiz",
}

export enum BANDWISECOLOR {
  RED = "#F09393",
  YELLOW = "#FDF7C3",
  GREEN = "#CBDFA0",
  GREY="#D4D1D8"
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

export enum TABLEDROPDOWN {
  ASSIGNMENTS = "Assignments",
  MONTHLY = "Monthly",
  WEEKLY = "Weekly",
  LIVEQUIZ = "LiveQuiz",
  CHAPTER = "Chapter",
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
        iconSrc: "/assets/icons/homeIcon.svg",
        headerList: HOMEHEADERLIST.HOME,
      },
    ],
    [
      HOMEHEADERLIST.SUGGESTIONS,
      {
        displayName: "Suggestion",
        iconSrc: "/assets/icons/suggestionIcon_icon.svg",
        headerList: HOMEHEADERLIST.SUGGESTIONS,
      },
    ],
    [
      HOMEHEADERLIST.SUBJECTS,
      {
        displayName: "Subjects",
        iconSrc: "/assets/icons/subjectIcon.svg",
        headerList: HOMEHEADERLIST.SUBJECTS,
      },
    ],
    [
      HOMEHEADERLIST.ASSIGNMENT,
      {
        displayName: "Home work",
        iconSrc: "/assets/icons/homeworkIcon.svg",
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
        iconSrc: "/assets/icons/searchIcon.svg",
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

export const DEFAULT_HEADER_ICON_CONFIGS: Map<
  HOMEHEADERLIST,
  HeaderIconConfig
> = new Map<HOMEHEADERLIST, HeaderIconConfig>([
  [
    HOMEHEADERLIST.SUGGESTIONS,
    {
      displayName: "Suggestion",
      iconSrc: "/assets/icons/suggestionInactiveIcon.svg",
      headerList: HOMEHEADERLIST.SUGGESTIONS,
    },
  ],
  [
    HOMEHEADERLIST.SUBJECTS,
    {
      displayName: "Subjects",
      iconSrc: "/assets/icons/subjectInactiveIcon.svg",
      headerList: HOMEHEADERLIST.SUBJECTS,
    },
  ],
  [
    HOMEHEADERLIST.ASSIGNMENT,
    {
      displayName: "Home work",
      iconSrc: "/assets/icons/homeworkInactiveIcon.svg",
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
      iconSrc: "/assets/icons/searchInactiveIcon.svg",
      headerList: HOMEHEADERLIST.SEARCH,
    },
  ],
  [
    HOMEHEADERLIST.LIVEQUIZ,
    {
      displayName: "Live Quiz",
      iconSrc: "/assets/icons/quizInactiveIcon.svg",
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
        displayName: "Home work",
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
  APP_UPDATE = "/",
  HOME = "/home",
  LOGIN = "/login",
  GAME = "/game",
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
  HOME_PAGE = "/home-page",
  ADD_SUBJECTS = "/add-subjects",
  APP_LANG_SELECTION = "/app-lang-selection",
  STUDENT_PROGRESS = "/student-progress",
  SEARCH = "/search",
  SHOW_CHAPTERS = "/show-chapters",
  LEADERBOARD = "/leaderboard",
  ASSIGNMENT = "/assignment",
  JOIN_CLASS = "/join-class",
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
  MANAGE_CLASS = "/manage-class",
  EDIT_SCHOOL = "/edit-school",
  EDIT_CLASS = "/edit-class",
  ADD_CLASS = "/add-class",
  CLASS_PROFILE = "/class-profile",
}

export enum LANG {
  ENGLISH = "en",
  HINDI = "hi",
  KANNADA = "kn",
  MARATHI = "mr",
  SIERRA_LEONE = "sl_en",
}
export enum DrawerOptions {
  MANAGE_SCHOOL = "Manage School",
  MANAGE_CLASS = "Manage Class",
}

export interface SchoolWithRole {
  school: TableTypes<"school">;
  role: RoleType;
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
export const TYPE = "type";
export const APP_NAME = "Kids";
export const SCHOOL = "school";
export const CLASS = "class";
export const USER_ROLE = "userRole";

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
  }>;
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
}

export enum ACTION {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
}

export const CURRENT_STUDENT = "currentStudent";
export const CURRENT_USER = "currentUser";
export enum EVENTS {
  LESSON_END = "lesson_end",
  LESSON_INCOMPLETE = "lesson_incomplete",
  USER_PROFILE = "user_profile",
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
export const DOWNLOAD_BUTTON_LOADING_STATUS = "download_button_loading_status";
export const DOMAIN = "@chimple.net";
export const AT_SYMBOL_RESTRICTION = /@/;
export const SELECTED_STUDENTS = "selectedStudent";
export const SELECTED_CLASSES = "selectedClasses";
export const CURRENT_CLASS_NAME = "currClassName";
export const CURRENT_SCHOOL_NAME = "currentSchoolName";
export const DOWNLOADING_CHAPTER_ID = "downloading_chapter_id";
export const USER_DATA = "userData";
export const REFRESH_TOKEN = "refreshToken";
