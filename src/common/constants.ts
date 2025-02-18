import { Capacitor } from "@capacitor/core";
import Auth from "../models/auth";

export enum COURSES {
  SIERRA_LEONE_ENGLISH = "sl-en",
  SIERRA_LEONE_MATHS = "sl-maths",
  PUZZLE = "puzzle",
  ENGLISH = "en",
  MATHS = "maths",
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

export enum ASSIGNMENTTAB_LIST {
  RECOMMENDED = "Recommended",
  ASSIGNMENT = "Assignment",
  LIVEQUIZ = "Live Quiz",
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

export const belowGrade1 = "NIAdGIaaRXi8BOl87MEu";
export const grade1 = "R5sDh8LKKBx7D7o1MMl0";
export const grade2 = "al0OqObeTBK3OFWSyDOg";
export const grade3 = "i1paELqh4uwET2OQQl1E";
export const aboveGrade3 = "rhuiXCmMzmJM1dkN8UNu";
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
  FAVOURITES = "/favourites",
  HISTORY = "/history",
  ADD_SUBJECTS = "/add-subjects",
  APP_LANG_SELECTION = "/app-lang-selection",
  REWARDS = "/rewards",
  STUDENT_PROGRESS = "/student-progress",
  SEARCH = "/search",
  STICKERS = "/stickers",
  SUBJECTS = "/subjects",
  SUGGESTIONS = "/suggestions",
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
  TEACHER_PROFILE = "/teacher-profile",
  STUDENT_PROFILE = "/student-profile",
  ADD_STUDENT = "/add_student",
  BONUS = "/bonus",
  BADGES = "/badges"
}

export enum SUBTAB {
  SUGGESTIONS,
  FAVOURITES,
  HISTORY,
}

export const SUBTAB_MAPPINGS = {
  [PAGES.LIVE_QUIZ]: { header: HOMEHEADERLIST.LIVEQUIZ, isLinked: true },
  [PAGES.ASSIGNMENT]: { header: HOMEHEADERLIST.ASSIGNMENT, isLinked: true },
  [PAGES.APP_UPDATE]: { header: HOMEHEADERLIST.HOME},
  [PAGES.HOME]: { header: HOMEHEADERLIST.HOME},
  [PAGES.SEARCH]: { header: HOMEHEADERLIST.SEARCH },
  [PAGES.SUBJECTS]: { header: HOMEHEADERLIST.SUBJECTS },
  [PAGES.SUGGESTIONS]: { header: HOMEHEADERLIST.SUGGESTIONS, subtab: SUBTAB.SUGGESTIONS },
  [PAGES.FAVOURITES]: { header: HOMEHEADERLIST.SUGGESTIONS, subtab: SUBTAB.FAVOURITES },
  [PAGES.HISTORY]: { header: HOMEHEADERLIST.SUGGESTIONS, subtab: SUBTAB.HISTORY },
  [PAGES.LEADERBOARD]: { redirect: PAGES.LEADERBOARD },
  [PAGES.REWARDS]: {
    redirect: `${PAGES.LEADERBOARD}?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${LEADERBOARD_REWARD_LIST.STICKER.toLowerCase()}`
  },
  // [PAGES.STICKERS] : {
  //   redirect: `${PAGES.LEADERBOARD}?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${LEADERBOARD_REWARD_LIST.STICKER.toLowerCase()}`
  // },
  // [PAGES.BONUS] : {
  //   redirect: `${PAGES.LEADERBOARD}?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${LEADERBOARD_REWARD_LIST.BONUS.toLowerCase()}`
  // },
  // [PAGES.BADGES] : {
  //   redirect: `${PAGES.LEADERBOARD}?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${LEADERBOARD_REWARD_LIST.BADGES.toLowerCase()}`
  // }
}
export enum LANG {
  ENGLISH = "en",
  HINDI = "hi",
  KANNADA = "kn",
  MARATHI = "mr",
  SIERRA_LEONE = "sl_en",
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
    rewardProfileId?: string;
    classId?: string;
  }>;
}
export const DEBUG_15 = "debug15";
export const DEFAULT_SUBJECT_IDS = [
  "MWGQt7j9HrEE9XqKYsGg", //English
  "5fq9UvGv0sjzZJqOZt3c", //Maths
  "nnFVTiGBmw1LiV3xa4V1", //Digital Skills
];

export const KARNATAKA_STATE_BOARD_CURRICULUM = "mKDCldpkmAntlspPx21o";
export const NCERT_CURRICULUM = "2m6ocNBLQc7jlyCKFZve";
export const OTHER_CURRICULUM = "BVTIRg2Wm3zxcMPrU5Ob";
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
}

export enum ACTION {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  SEARCH = "search"
}
export enum NOTIFICATIONTYPE {
  REWARD = "reward",
  ASSIGNMENT = "assignment",
}
export const CURRENT_STUDENT = "currentStudent";
export const CURRENT_USER = "currentUser";
export enum EVENTS {
  LESSON_END = "lesson_end",
  LESSON_INCOMPLETE = "lesson_incomplete",
  USER_PROFILE = "user_profile",
  User_Clicks = "user_clicks",
  SEARCH_TRENDS = "search_trends"
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
export const LESSON_DOC_LESSON_ID_MAP = "lessonDocLessonidMap";

export const CURRENT_AVATAR_SUGGESTION_NO = "currentAvatarSuggestion";
export const SHOW_DAILY_PROGRESS_FLAG = "showAvatarDailyProgress";

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
export const DOWNLOAD_LESSON_BATCH_SIZE = 10;
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
export const CURRENT_SELECTED_COURSE = "currentSelectedCourse";
export const CURRENT_SELECTED_CHAPTER = "currentSelectedChapter";
export const CURRENT_STAGE = "currentStage";
export const CURRENT_SELECTED_GRADE = "currentSelectedGrade";
