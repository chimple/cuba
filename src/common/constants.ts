import { Capacitor } from "@capacitor/core";

export enum COURSES {
    SIERRA_LEONE_ENGLISH = 'sl-en',
    SIERRA_LEONE_MATHS = 'sl-maths',
    PUZZLE = 'puzzle',
    ENGLISH_G1 = 'sl_en1_mp',
    MATHS_G1 = 'sl_maths1_mp',
    ENGLISH_G2 = 'sl_en2_mp',
    MATHS_G2 = 'sl_maths2_mp'

}

export const ALL_COURSES = [COURSES.ENGLISH_G1, COURSES.MATHS_G1, COURSES.PUZZLE];

export enum HEADERLIST {
    HOME = 'HOME',
    ENGLISH_G1 = 'sl_en1_mp',
    MATHS_G1 = 'sl_maths1_mp',
    ENGLISH_G2 = 'sl_en2_mp',
    MATHS_G2 = 'sl_maths2_mp',
    PUZZLE = 'puzzle',
    PROFILE = 'PROFILE'
}

export const LESSON_CARD_COLORS = [
    "#FF7925",
    "#FFC000",
    "#2BAC67",
    "#008CD2",
    "#FF94B5",
    "#AC82CF"
]

export enum PAGES {
    HOME = "/",
    LOGIN = "/login",
    GAME = "/game",
    END = "/end",
    PROFILE = "/profile",
}

export enum LANG {
    ENGLISH = 'en',
    HINDI = 'hi',
    KANNADA = 'kn',
    MARATHI = 'mr',
    SIERRA_LEONE = "sl_en"
}


export const SCREEN_WIDTH = window.innerWidth;
export const SCREEN_HEIGHT = window.innerHeight;

export const LESSON_END = "lessonEnd"
export const PROBLEM_END = "problemEnd"
export const GAME_END = "gameEnd"
export const GAME_EXIT = "gameExit"
export const TEMP_LESSONS_STORE = "tempLessonsStore"
export const IS_USER_LOGED_IN = "isUserLogedIn"
export const USER_TOKEN = 'userToken'
export const CURRENT_LESSON_LEVEL = "currentLessonLevel"
export const PREVIOUS_PLAYED_COURSE = "previousPlayedCourse"
export const PREVIOUS_SELECTED_COURSE = "previousSelectedCourse"
export const LANGUAGE = "language"
export const EXAM = 'exam'
export const PRE_QUIZ = "PreQuiz";
export const GAME_URL = "gameUrl"
export const BASE_NAME = !Capacitor.isNativePlatform() && !!process.env.REACT_APP_GITHUB_BASE
    ? process.env.REACT_APP_GITHUB_BASE
    : "";
export const MIN_PASS = 70
export const IS_CUBA = "is_cuba"
export const BUNDLE_URL = "https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/"