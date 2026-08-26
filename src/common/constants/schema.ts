import { Constants, Database } from '../../services/database';

export const DEFAULT_LOCALE_ID = '6854a7ef-dcd3-4362-8488-0e8de869aacf'; //this is the default locale id for india
export const DEFAULT_LANGUAGE_ID_EN = '7eaf3509-e44e-460f-80a1-7f6a13a8a883'; //this is the default language id for english
export const STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON =
  'acknowledge_button';

export enum COURSES {
  SIERRA_LEONE_ENGLISH = 'sl-en',
  SIERRA_LEONE_MATHS = 'sl-maths',
  PUZZLE = 'puzzle',
  ENGLISH = 'en',
  MATHS = 'maths',
  MATHS_HINDI = 'maths-hi',
  MATHS_KANNADA = 'maths-kn',
  KANNADA = 'kn',
  HINDI = 'hi',
  MARATHI = 'mr',
}
export enum CocosCourseIdentifier {
  maths = 'maths',
  en = 'en',
  kn = 'kn',
  hi = 'hi',
  mr = 'mr',
}

// RESPECT launches use these stable catalogue grades when the local catalogue
// has not been populated yet.
export const RESPECT_GRADES = {
  grade1: {
    id: 'c802dce7-0840-4baf-b374-ef6cb4272a76',
    name: 'Grade 1',
    sort_index: 2,
  },
  grade2: {
    id: '36e7ff1f-34d6-42ac-9294-3192433ace40',
    name: 'Grade 2',
    sort_index: 3,
  },
  belowGrade1: {
    id: '30ecb762-8e63-45b3-a22a-62c1a9f71641',
    name: 'Below Grade 1',
    sort_index: 1,
  },
} as const;

export const ALL_CURRICULUM = {
  CHIMPLE_BOARD: {
    id: '7d560737-746a-4931-a49f-02de1ca526bd',
    name: 'Chimple',
    sort_index: 1,
  },
  KARNATAKA_STATE_BOARD: {
    id: 'feec6f59-b8bc-41e8-81aa-2b2689a9fc40',
    name: 'Karnataka',
    sort_index: 2,
  },
  NCERT_BOARD: {
    id: 'e1629739-5421-4996-a1f7-61225443bd04',
    name: 'NCERT',
    sort_index: 3,
  },
} as const;

export type TableTypes<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type EnumType<K extends keyof (typeof Constants)['public']['Enums']> =
  (typeof Constants)['public']['Enums'][K][number];

export enum MUTATE_TYPES {
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum LOGIN_TYPES {
  PHONE = 'phone',
  STUDENT = 'student',
  EMAIL = 'email',
  OTP = 'otp',
  FORGET_PASS = 'forget_pass',
}

export enum TABLES {
  Curriculum = 'curriculum',
  Campaign = 'campaign',
  CampaignNotification = 'campaign_notification',
  CampaignStudentPerformance = 'campaign_student_performance',
  Subject = 'subject',
  Grade = 'grade',
  Language = 'language',
  Course = 'course',
  School = 'school',
  Chapter = 'chapter',
  Lesson = 'lesson',
  Live_quiz_room = 'live_quiz_room',
  Badge = 'badge',
  Sticker = 'sticker',
  Reward = 'reward',
  Class = 'class',
  User = 'user',
  ClassInvite_code = 'class_invite_code',
  ClassUser = 'class_user',
  FavoriteLesson = 'favorite_lesson',
  ClassCourse = 'class_course',
  ChapterLesson = 'chapter_lesson',
  ParentUser = 'parent_user',
  ProgramUser = 'program_user',
  SchoolCourse = 'school_course',
  SchoolUser = 'school_user',
  SchoolMetrics = 'school_metrics',
  UserBadge = 'user_badge',
  UserBonus = 'user_bonus',
  UserCourse = 'user_course',
  UserSticker = 'user_sticker',
  Assignment = 'assignment',
  Assignment_user = 'assignment_user',
  Result = 'result',
  Assignment_cart = 'assignment_cart',
  // Chatbot = "chatbot",
  ReqNewSchool = 'req_new_school',
  ChapterLinks = 'chapter_links',
  Program = 'program',
  SpecialUsers = 'special_users',
  OpsRequests = 'ops_requests',
  GeoLocations = 'geo_locations',
  RiveReward = 'rive_reward',
  Framework = 'framework',
  Domain = 'domain',
  Competency = 'competency',
  Outcome = 'outcome',
  Skill = 'skill',
  SkillRelation = 'skill_relation',
  SkillLesson = 'skill_lesson',
  FcQuestion = 'fc_question',
  FcSchoolVisit = 'fc_school_visit',
  FcUserForms = 'fc_user_forms',
  Locale = 'locale',
  LanguageLocale = 'language_locale',
  SubjectLesson = 'subject_lesson',
  StickerBook = 'sticker_book',
  UserStickerBook = 'user_sticker_book',
  UserAchivements = 'user_achievements',
}
