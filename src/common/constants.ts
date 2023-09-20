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

export enum HOMEHEADERLIST {
  SUGGESTIONS = "SUGGESTIONS",
  SUBJECTS = "SUBJECTS",
  HOME = "HOME",
  ASSIGNMENT = "ASSIGNMENT",
  CHALLENGES = "CHALLENGES",
  SEARCH = "SEARCH",
  QUIZ = "QUIZ",
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
}

export const belowGrade1 = "NIAdGIaaRXi8BOl87MEu"
export const grade1 = "R5sDh8LKKBx7D7o1MMl0"
export const grade2 = "al0OqObeTBK3OFWSyDOg"
export const grade3 = "i1paELqh4uwET2OQQl1E"
export const aboveGrade3 = "rhuiXCmMzmJM1dkN8UNu"

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

export const HEADER_ICON_CONFIGS: Map<HOMEHEADERLIST, HeaderIconConfig> =
  new Map<HOMEHEADERLIST, HeaderIconConfig>([
    [
      HOMEHEADERLIST.SUGGESTIONS,
      {
        displayName: "Suggestion",
        iconSrc: "/assets/icons/SuggestionIcon.svg",
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
    // [
    //   HOMEHEADERLIST.QUIZ,
    //   {
    //     displayName: "Quiz",
    //     iconSrc: "/assets/icons/quiz_icon.svg",
    //     headerList: HOMEHEADERLIST.QUIZ,
    //   },
    // ],
  ]);

// export const HEADERLIST = [HOME_CONFIG, LANG_CONFIGS, PROFILE_CONFIG]

export const LESSON_CARD_COLORS = [
  "#FF7925",
  "#FFC000",
  "#2BAC67",
  "#008CD2",
  "#FF94B5",
  "#AC82CF",
];

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
  APP_LANG_SELECTION = "/app-lang-selection",
  STUDENT_PROGRESS = "/student-progress",
  SEARCH = "/search",
  LEADERBOARD = "/leaderboard",
  ASSIGNMENT = "/assignment",
  JOIN_CLASS = "/join-class",
  SELECT_MODE = "/select-mode",
  TERMS_AND_CONDITIONS = "/terms-and-conditions",
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
export const SOUND = "sound";
export const MUSIC = "music";
export const GAME_URL = "gameUrl";
export const TC_ACCEPT = "tcAccept";
export const BASE_NAME =
  !Capacitor.isNativePlatform() && !!process.env.REACT_APP_GITHUB_BASE
    ? process.env.REACT_APP_GITHUB_BASE
    : "";
export const MIN_PASS = 70;
export const IS_CUBA = "is_cuba";
export const BUNDLE_URL =
  "https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/";
export interface PortPlugin {
  getPort(): Promise<{ port: number }>;
  getMigrateUsers(): Promise<{ users: any }>;
}
export const DEBUG_15 = "debug15";
export const DEFAULT_COURSE_IDS = [
  "RiMQCOteNrktL0Oa6dNi", //English
  "zmElfKhtS152dPrwcJ0n", //Maths
  "KiaqDYLBN2dBcodOOBPA", //Digital Skills
];
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
}

export const CURRENT_STUDENT = "currentStudent";
export const CURRENT_USER = "currentUser";
export enum EVENTS {
  LESSON_END = "lesson_end",
  LESSON_INCOMPLETE = "lesson_incomplete",
  USER_PROFILE = "user_profile",
}

export const FCM_TOKENS = "fcmTokens";

export const LAST_UPDATE_CHECKED = "lastUpdateChecked";

export const LAST_PERMISSION_CHECKED = "lastPermissionChecked";

export const CACHE_IMAGE = "cacheImage";

export const IS_MIGRATION_CHECKED = "isMigrationChecked";

export const HOT_UPDATE_SERVER = process.env.REACT_APP_HOT_UPDATE_SERVER;

export const COPIED_BUNDLE_FILES_INDEX = "copiedBundleFilesIndex";

export const NUMBER_REGEX = /^[0-9]+$/;
