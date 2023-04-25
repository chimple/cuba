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

export enum HEADERLIST {
  HOME = "HOME",
  RECOMMENDATION = "RECOMMENDATION",
  ASSIGNMENT = "ASSIGNMENT",
  FAVORITE = "FAVORITE",
  CHALLENGES = "CHALLENGES",
  SEARCH = "SEARCH",
  PROFILE = "PROFILE",
}

export class HeaderIconConfig {
  displayName: string;
  iconSrc: string;
  headerList: HEADERLIST;
}

export const HEADER_ICON_CONFIGS: Map<HEADERLIST, HeaderIconConfig> = new Map<
  HEADERLIST,
  HeaderIconConfig
>([
  [
    HEADERLIST.RECOMMENDATION,
    {
      displayName: "Recommendation",
      iconSrc: "/assets/icons/EnglishIcon.svg",
      headerList: HEADERLIST.RECOMMENDATION,
    },
  ],
  [
    HEADERLIST.ASSIGNMENT,
    {
      displayName: "Assignment",
      iconSrc: "/assets/icons/MathsIcon.svg",
      headerList: HEADERLIST.ASSIGNMENT,
    },
  ],
  [
    HEADERLIST.FAVORITE,
    {
      displayName: "Fav/History",
      iconSrc: "/assets/icons/DigitalSkillsIcon.svg",
      headerList: HEADERLIST.FAVORITE,
    },
  ],
  [
    HEADERLIST.CHALLENGES,
    {
      displayName: "Challenges",
      iconSrc: "/assets/icons/MathsIcon.svg",
      headerList: HEADERLIST.CHALLENGES,
    },
  ],
  [
    HEADERLIST.SEARCH,
    {
      displayName: "Search",
      iconSrc: "/assets/icons/DigitalSkillsIcon.svg",
      headerList: HEADERLIST.SEARCH,
    },
  ],
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
  HOME = "/",
  LOGIN = "/login",
  GAME = "/game",
  END = "/end",
  PROFILE = "/profile",
  CREATE_STUDENT = "/create-student",
  DISPLAY_STUDENT = "/display-students",
  DISPLAY_SUBJECTS = "/display-subjects",
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
export const LANGUAGE = "language";
export const EXAM = "exam";
export const PRE_QUIZ = "PreQuiz";
export const GAME_URL = "gameUrl";
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
  BOY = "boy",
  GIRL = "girl",
  OTHER = "other",
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

export const MAX_STUDENTS_ALLOWED = 3;
