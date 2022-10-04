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
    ENGLISH = 'ENGLISH',
    MATHS = 'MATHS',
    PUZZLE = 'PUZZLE',
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

export const SCREEN_WIDTH = window.innerWidth;
export const SCREEN_HEIGHT = window.innerHeight;

export const LESSON_END = "lessonEnd"
export const PROBLEM_END = "problemEnd"
export const GAME_END = "gameEnd"
export const TEMP_LESSONS_STORE = "tempLessonsStore"
export const IS_USER_LOGED_IN = "isUserLogedIn"
export const CURRENT_LESSON_LEVEL = "currentLessonLevel"