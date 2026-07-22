import type { TableTypes } from './schema';
import { COURSES } from './schema';

export enum CLASS_USERS {
  STUDENTS = 'Students',
  TEACHERS = 'Teachers',
}
export enum SCHOOL_USERS {
  PRINCIPALS = 'Principals',
  COORDINATORS = 'Coordinators',
  SPONSORS = 'Sponsors',
}
export enum SL_GRADES {
  GRADE1 = 'Grade 1',
  GRADE2 = 'Grade 2',
}

export const LOWER_GRADE_STANDARDS = {
  NURSERY: 'NURSERY',
  LKG: 'LKG',
  UKG: 'UKG',
} as const;

export const LOWER_GRADE_MAPPING = {
  [LOWER_GRADE_STANDARDS.NURSERY]: 'Preschool 1',
  [LOWER_GRADE_STANDARDS.LKG]: 'Preschool 2',
  [LOWER_GRADE_STANDARDS.UKG]: 'Preschool 3',
} as const;

export enum PROGRAM_TAB {
  ALL = 'all',
  AT_SCHOOL = 'at_school',
  AT_HOME = 'at_home',
  HYBRID = 'hybrid',
}

export const PROGRAM_TAB_LABELS: Record<PROGRAM_TAB, string> = {
  [PROGRAM_TAB.ALL]: 'All',
  [PROGRAM_TAB.AT_SCHOOL]: 'At School',
  [PROGRAM_TAB.AT_HOME]: 'At Home',
  [PROGRAM_TAB.HYBRID]: 'Hybrid',
};

export type TabType = keyof typeof PROGRAM_TAB_LABELS;

// Backend model mapping (if needed)
export enum MODEL {
  AT_SCHOOL = 'AT_SCHOOL',
  AT_HOME = 'AT_HOME',
  HYBRID = 'HYBRID',
}

export const ALL_COURSES = [COURSES.ENGLISH, COURSES.MATHS, COURSES.PUZZLE];

export enum LeaderboardDropdownList {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

export enum APP_LANGUAGES {
  en = 'English',
  hi = 'हिन्दी',
  kn = 'ಕನ್ನಡ',
  mr = 'मराठी',
}
export enum HOMEHEADERLIST {
  SUGGESTIONS = 'SUGGESTIONS',
  SUBJECTS = 'SUBJECTS',
  HOME = 'HOME',
  ASSIGNMENT = 'ASSIGNMENT',
  CHALLENGES = 'CHALLENGES',
  SEARCH = 'SEARCH',
  LIVEQUIZ = 'LIVE-QUIZ',
  PROFILE = 'PROFILE',
  HISTORY = 'HISTORY',
  FAVOURITES = 'FAVOURITES',
}

export enum PARENTHEADERLIST {
  PROFILE = 'PROFILE',
  SETTING = 'SETTING',
  HELP = 'HELP',
  FAQ = 'FAQ',
}

export enum LEADERBOARDHEADERLIST {
  LEADERBOARD = 'LEADERBOARD',
  EVENTS = 'EVENTS',
  REWARDS = 'REWARDS',
}

export enum LEADERBOARD_REWARD_LIST {
  BADGES = 'MEDALS',
  BONUS = 'BONUS',
  STICKER = 'STICKERS',
}

export type SchoolRoleMap = {
  schoolId: string;
  users: TableTypes<'user'>[];
};

export enum ASSIGNMENTTAB_LIST {
  RECOMMENDED = 'Recommended',
  ASSIGNMENT = 'Assignment',
  LIVEQUIZ = 'Live Quiz',
}

export enum BANDWISECOLOR {
  RED = '#F09393',
  YELLOW = '#FDF7C3',
  GREEN = '#CBDFA0',
  GREY = '#D4D1D8',
}

export enum BANDS {
  REDGROUP = 'redGroup',
  YELLOWGROUP = 'yellowGroup',
  GREENGROUP = 'greenGroup',
  GREYGROUP = 'greyGroup',
}

export enum COMMONTAB_LIST {
  SCHOOL = 'School',
  CLASS = 'Class',
  SUBJECTS = 'Subjects',
}

export enum USERTYPES {
  COORDINATORS = 'Coordinators',
  PRINCIAPAL = 'Principal',
  SPONSORS = 'Sponsors',
  TEACHERS = 'Teachers',
  STUDENTS = 'Students',
}

export enum PROFILETYPE {
  SCHOOL = 'school',
  CLASS = 'class',
  USER = 'user',
}

export enum TABLEDROPDOWN {
  ASSIGNMENTS = 'Assignments Report',
  MONTHLY = 'Monthly Report',
  WEEKLY = 'Weekly Report',
  LIVEQUIZ = 'LiveQuiz Report',
  CHAPTER = 'Chapter Report',
}

export enum TABLESORTBY {
  NAME = 'Alphabetical',
  HIGHSCORE = 'High to Low',
  LOWSCORE = 'Low to High',
}

export enum FileUploadStep {
  Idle = 'idle',
  Verifying = 'verifying',
  Verified = 'verified',
  Uploading = 'uploading',
  Uploaded = 'uploaded',
  Error = 'error',
  UploadError = 'uploadError',
}

export const belowGrade1 = '30ecb762-8e63-45b3-a22a-62c1a9f71641';
export const grade1 = 'c802dce7-0840-4baf-b374-ef6cb4272a76';
export const grade2 = '36e7ff1f-34d6-42ac-9294-3192433ace40';
export const grade3 = 'd8cf7700-e00c-4bf8-a082-222b1ecfe1f7';
export const aboveGrade3 = 'd05cb75a-adc2-4365-8548-30b2ac65b321';
export const CONTINUE = 'continue';

export const parentHeaderIconList: HeaderIconConfig[] = [
  {
    displayName: 'User',
    iconSrc: '/assets/icons/favicon.png',
    headerList: PARENTHEADERLIST.PROFILE,
  },
  {
    displayName: 'Setting',
    iconSrc: '/assets/icons/favicon.png',
    headerList: PARENTHEADERLIST.SETTING,
  },
  {
    displayName: 'Help/Contact',
    iconSrc: '/assets/icons/favicon.png',
    headerList: PARENTHEADERLIST.HELP,
  },
  {
    displayName: 'FAQ',
    iconSrc: '/assets/icons/favicon.png',
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
        displayName: 'Home',
        iconSrc: '/assets/icons/HomeIconActive.svg',
        headerList: HOMEHEADERLIST.HOME,
      },
    ],
    [
      HOMEHEADERLIST.ASSIGNMENT,
      {
        displayName: 'Homework',
        iconSrc: '/assets/icons/HomeworkIconActive.svg',
        headerList: HOMEHEADERLIST.ASSIGNMENT,
      },
    ],
    [
      HOMEHEADERLIST.SUBJECTS,
      {
        displayName: 'Subjects',
        iconSrc: '/assets/icons/SubjectsIconActive.svg',
        headerList: HOMEHEADERLIST.SUBJECTS,
      },
    ],
    [
      HOMEHEADERLIST.LIVEQUIZ,
      {
        displayName: 'Specials',
        iconSrc: '/assets/icons/SpecialsIconActive.svg',
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
      displayName: 'Homework',
      iconSrc: '/assets/icons/HomeworkIconInactive.svg',
      headerList: HOMEHEADERLIST.ASSIGNMENT,
    },
  ],
  [
    HOMEHEADERLIST.SUBJECTS,
    {
      displayName: 'Subjects',
      iconSrc: '/assets/icons/SubjectsIcon.svg',
      headerList: HOMEHEADERLIST.SUBJECTS,
    },
  ],
  [
    HOMEHEADERLIST.LIVEQUIZ,
    {
      displayName: 'Specials',
      iconSrc: '/assets/icons/SpecialsIcon.svg',
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
        displayName: 'Suggestion',
        iconSrc: '/assets/icons/suggestion_icon.svg',
        headerList: HOMEHEADERLIST.SUGGESTIONS,
      },
    ],
    [
      HOMEHEADERLIST.SUBJECTS,
      {
        displayName: 'Subjects',
        iconSrc: '/assets/icons/subject_icon.svg',
        headerList: HOMEHEADERLIST.SUBJECTS,
      },
    ],
    [
      HOMEHEADERLIST.ASSIGNMENT,
      {
        displayName: 'Homework',
        iconSrc: '/assets/icons/homework_icon.svg',
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
        displayName: 'Search',
        iconSrc: '/assets/icons/search_icon.svg',
        headerList: HOMEHEADERLIST.SEARCH,
      },
    ],
    [
      HOMEHEADERLIST.LIVEQUIZ,
      {
        displayName: 'Live Quiz',
        iconSrc: '/assets/icons/quiz_icon.svg',
        headerList: HOMEHEADERLIST.LIVEQUIZ,
      },
    ],
  ]);

export const LESSON_CARD_COLORS = [
  '#FF7925',
  '#FFC000',
  '#2BAC67',
  '#008CD2',
  '#FF94B5',
  '#AC82CF',
];

export const CHAPTER_CARD_COLOURS = [
  '#F99500',
  '#0090D3',
  '#F3609B',
  '#8F5AA5',
  '#009948',
];

export const DEFUALT_SUBJECT_CARD_COLOUR = '#009948';

export enum PAGES {
  RESET_PASSWORD = '/reset-password',
  APP_UPDATE = '/',
  HOME = '/home',
  LOGIN = '/login',
  LIDO_PLAYER = '/lido-player',
  END = '/end',
  PROFILE = '/profile',
  PARENT = '/parent',
  CREATE_STUDENT = '/create-student',
  EDIT_STUDENT = '/edit-student',
  DISPLAY_STUDENT = '/display-students',
  DISPLAY_SUBJECTS = '/display-subjects',
  DISPLAY_CHAPTERS = '/display-chapters',
  DISPLAY_SCHOOLS = '/display-schools',
  KIDS_APP_LOCATION = '/kids-app-location',
  DISPLAY_CLASSES = '/display-classes',
  DASHBOARD_DETAILS = '/dashboard-details',
  HOME_PAGE = '/home-page',
  ADD_SUBJECTS = '/add-subjects',
  APP_LANG_SELECTION = '/app-lang-selection',
  STUDENT_PROGRESS = '/student-progress',
  SEARCH = '/search',
  SHOW_CHAPTERS = '/show-chapters',
  LEADERBOARD = '/leaderboard',
  ASSIGNMENT = '/assignment',
  JOIN_CLASS = '/join-class',
  JOIN_SCHOOL = '/join-school',
  LIVE_QUIZ = '/live-quiz',
  SELECT_MODE = '/select-mode',
  TERMS_AND_CONDITIONS = '/terms-and-conditions',
  LIVE_QUIZ_JOIN = '/live-quiz-join',
  LIVE_QUIZ_GAME = '/live-quiz-game',
  LIVE_QUIZ_ROOM_RESULT = '/live-quiz-room-result',
  LIVE_QUIZ_LEADERBOARD = '/live-quiz-leaderboard',
  USER_PROFILE = '/user-profile',
  STUDENT_PROFILE = '/student-profile',
  ADD_STUDENT = '/add_student',
  TEST_PAGE = '/test-page',
  TEST_PAGE1 = '/test-page1',
  TEACHER_ASSIGNMENT = '/teacher-assignment',
  LESSON_DETAILS = '/lesson-details',
  SEARCH_LESSON = '/search-lesson',
  CLASS_USERS = '/class-users',
  SUBJECTS_PAGE = '/subject-selection',
  MANAGE_SCHOOL = '/manage-schools',
  SCHOOL_PROFILE = '/school-profile',
  ADD_SCHOOL = '/add-school',
  REQ_ADD_SCHOOL = '/req-add-school',
  MANAGE_CLASS = '/manage-class',
  EDIT_SCHOOL = '/edit-school',
  REQ_EDIT_SCHOOL = '/req-edit-school',
  EDIT_CLASS = '/edit-class',
  ADD_CLASS = '/add-class',
  CLASS_PROFILE = '/class-profile',
  SHOW_STUDENTS_IN_ASSIGNED_PAGE = '/show-students-in-assigned-page',
  ADD_TEACHER = '/add-teacher',
  ADD_TEACHER_NAME = '/add-teacher-name',
  TEACHER_PROFILE = '/teacher-profile',
  STUDENT_REPORT = '/student-report',
  SCHOOL_USERS = '/school-users',
  ADD_PRINCIPAL = '/add-principal',
  ADD_COORDINATOR = '/add-coordinator',
  ADD_SPONSOR = '/add-sponsor',
  UPLOAD_PAGE = '/upload-page',
  PROGRAM_PAGE = '/program-page',
  PROGRAM_DETAIL_PAGE = '/program-details-page',
  PROFILE_DETAILS = '/profile-details',
  SIDEBAR_PAGE = '/admin-home-page',
  ADMIN_DASHBOARD = '/dashboard',
  ADMIN_PROGRAMS = '/programs',
  ADMIN_SCHOOLS = '/schools',
  ADMIN_CAMPAIGNS = '/campaigns',
  ADMIN_CAMPAIGNS_NEW = '/campaigns/new',
  ADMIN_USERS = '/users',
  ADMIN_DEVICES = '/devices',
  ADMIN_RESOURCES = '/resourses',
  NEW_PROGRAM = '/new-program',
  SCHOOL_LIST = '/school-list',
  SCHOOL_DETAILS = '/school-details',
  USERS = '/users',
  USER_DETAILS = '/user-details',
  PROGRAM_CONNECTED_SCHOOL_LIST_PAGE_OPS = '/program-connected-school-list-page-ops',
  NEW_USERS_OPS = '/new-user-ops',
  REQUEST_LIST = '/request-list',
  OPS_MODULE_PAGE = '/ops-module-page',
  PARENT_WHATSAPP_INVITATION = '/parentWhatsappInvitation',
  SCHOOL_PENDING_REQUEST = '/school-pending-request',
  SCHOOL_APPROVED_REQUEST = '/school-approved-request',
  SCHOOL_REJECTED_REQUEST = '/school-rejected-request',
  SCHOOL_FORM_PAGE = '/school-form-page',
  STUDENT_PENDING_REQUEST = '/student-pending-request',
  OPS_APPROVED_REQUEST = '/student-approved-request',
  OPS_REJECTED_REQUEST = '/student-rejected-request',
  OPS_REJECTED_FLAGGED = '/student-flagged-request',
  PRINCIPAL_TEACHER_PENDING_REQUEST = '/principal-teacher-pending-request',
  SEARCH_SCHOOL = '/search-school',
  CREATE_SCHOOL = '/create-school',
  POST_SUCCESS = '/post-success',
  SCAN_REDIRECT = '/scan-redirect',
  ADD_SCHOOL_PAGE = '/add-school-page',
  MIGRATE_SCHOOLS_PAGE = '/migrate-schools-page',
  ACTIVITIES_PAGE = '/activities-page',
  SCHOOL_ACTIVITIES = '/school-activities',
  QR_ASSIGNMENTS = '/qr_assignments',
  TEACHER_RECOMMENDED_ASSIGNMENTS = '/teacher-recommended-assignments',
  COLORING_BOARD = '/coloring-board',
  STICKER_BOOK = '/sticker-book',
  STREAK_PAGE = '/streak-page',
  ROOT = '/#',
}

export const enum ASSIGNMENT_TYPE {
  ASSIGNMENT = 'assignment',
  LIVEQUIZ = 'liveQuiz',
  REWARD = 'reward',
}
export enum LANG {
  ENGLISH = 'en',
  HINDI = 'hi',
  KANNADA = 'kn',
  MARATHI = 'mr',
  SIERRA_LEONE = 'sl_en',
}
export enum SCORECOLOR {
  RED = '#D74747',
  ORANGE = '#FFA800',
  GREEN = '#86AB37',
  WHITE = 'white',
}
export enum DrawerOptions {
  MANAGE_SCHOOL = 'Manage School',
  MANAGE_CLASS = 'Manage Class',
  USER_PROFILE = 'User Profile',
}

export enum NavItems {
  DASHBOARD = 'Dashboard',
  PROGRAMS = 'Programs',
  SCHOOLS = 'Schools',
  CAMPAIGNS = 'Campaigns',
  REQUESTS = 'Requests',
  OpsMODULE = 'OpsModule',
  USERS = 'Users',
  DEVICES = 'Devices',
  RESOURCES = 'Resources',
}

export enum ProgramType {
  Government = 'government',
  Private = 'private',
  LearningCenter = 'learning_centers',
}
export enum RequestTypes {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PRINCIPAL = 'principal',
  SCHOOL = 'school',
}
export const DEFAULT_PAGE_SIZE = 20;
