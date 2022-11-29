import { Capacitor } from "@capacitor/core";

export enum COURSES {
    SIERRA_LEONE_ENGLISH = 'en-sl',
    SIERRA_LEONE_MATHS = 'maths-sl',
    PUZZLE = 'puzzle',
    ENGLISH = 'en',
    MATHS = 'maths'
}

export const ALL_COURSES = [COURSES.SIERRA_LEONE_ENGLISH, COURSES.SIERRA_LEONE_MATHS, COURSES.PUZZLE];

export enum HEADERLIST {
    HOME = 'HOME',
    ENGLISH = 'en',
    MATHS = 'maths',
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
}


export const SCREEN_WIDTH = window.innerWidth;
export const SCREEN_HEIGHT = window.innerHeight;

export const LESSON_END = "lessonEnd"
export const PROBLEM_END = "problemEnd"
export const GAME_END = "gameEnd"
export const TEMP_LESSONS_STORE = "tempLessonsStore"
export const IS_USER_LOGED_IN = "isUserLogedIn"
export const USER_TOKEN = 'userToken'
export const CURRENT_LESSON_LEVEL = "currentLessonLevel"
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