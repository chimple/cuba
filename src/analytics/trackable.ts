import { CURRENT_MODE, MODES, PAGES } from '../common/constants';

export const TRACKABLE_SELECTOR = '[data-trackable="true"]';
export const TRACKABLE_ATTRIBUTE = 'data-trackable';
export const TRACKABLE_ID_ATTRIBUTE = 'data-trackable-id';
export const TRACKABLE_PARENT_IGNORE_SELECTOR =
  '[data-trackable-ignore-parent="true"]';
export const TRACKABLE_PARENT_IGNORE_ATTRIBUTE = 'data-trackable-ignore-parent';

// Values describe the user action so they remain clear in Firebase and BigQuery.
export const TRACKABLE_IDS = {
  HOME_TAB: 'open_home_tab',
  HOME_HOMEWORK_TAB: 'open_homework_tab',
  HOME_SUBJECTS_TAB: 'open_subjects_tab',
  HOME_SPECIALS_TAB: 'open_specials_tab',
  HOME_PROFILE_MENU: 'open_profile_menu',
  PATHWAY_COURSE_SELECTOR: 'pathway_course_dropdown',
  PATHWAY_COURSE_OPTION: 'select_course',
  PATHWAY_PLAY_LESSON: 'start_pathway_lesson',
  PATHWAY_STICKER_REWARD: 'open_sticker_reward',
  PATHWAY_MYSTERY_REWARD: 'open_mystery_reward',
  PROFILE_MENU_STICKER_BOOK: 'open_sticker_book',
  PROFILE_MENU_LEADERBOARD: 'open_leaderboard',
  PROFILE_MENU_REWARDS: 'open_rewards',
  PROFILE_MENU_EDIT_PROFILE: 'edit_profile',
  PROFILE_MENU_PARENT_SECTION: 'open_parent_section',
  PROFILE_MENU_SWITCH_PROFILE: 'switch_profile',
  PROFILE_SWITCHER_PARENT: 'switch_to_parent_page',
  PROFILE_SWITCHER_PLAY_PROFILE: 'select_profile_to_play',
  PARENT_TAB_PROFILE: 'open_parent_profile_tab',
  PARENT_TAB_SETTINGS: 'open_parent_settings_tab',
  PARENT_TAB_HELP: 'open_parent_help_tab',
  PARENT_TAB_FAQ: 'open_parent_faq_tab',
  PARENT_RETURN_PROFILE_SWITCHER: 'return_to_profile_switcher',
  PARENT_PROFILE_PROGRESS: 'view_child_progress',
  PARENT_PROFILE_ADD_CHILD: 'add_child_profile',
  PARENT_PROFILE_MANAGE: 'open_child_profile_options',
  PARENT_PROFILE_EDIT: 'edit_child_profile',
  PARENT_PROFILE_DELETE: 'delete_child_profile',
  PARENT_PROFILE_OPTIONS_CLOSE: 'close_child_profile_options',
  PARENT_PROFILE_DELETE_CONFIRM: 'confirm_delete_child_profile',
  PARENT_PROFILE_DELETE_CANCEL: 'cancel_delete_child_profile',
  SETTINGS_LANGUAGE_SELECTOR: 'open_language_selector',
  SETTINGS_LANGUAGE_OPTION: 'select_language',
  SETTINGS_SOUND_TOGGLE: 'toggle_sound',
  SETTINGS_MUSIC_TOGGLE: 'toggle_music',
  SETTINGS_TEACHERS_APP: 'open_teachers_app',
  SETTINGS_TERMS: 'open_terms_and_conditions',
  SETTINGS_SIGN_OUT: 'start_sign_out',
  SETTINGS_DELETE_ACCOUNT: 'start_delete_account',
  SETTINGS_SIGN_OUT_CANCEL: 'cancel_sign_out',
  SETTINGS_DELETE_ACCOUNT_CANCEL: 'cancel_delete_account',
  REWARDS_TAB_ACHIEVEMENTS: 'open_achievement_rewards',
  REWARDS_TAB_COMPETITIONS: 'open_competition_rewards',
  REWARDS_POPUP_CLOSE: 'close_reward_popup',
  REWARDS_POPUP_PLAY: 'play_from_reward_popup',
  REWARDS_BADGE_SHARE: 'share_reward_badge',
  REWARDS_BACK_HOME: 'return_to_home',
  LEADERBOARD_SWITCH_PROFILE: 'switch_profile_from_leaderboard',
  LEADERBOARD_PERIOD_DROPDOWN: 'open_leaderboard_period_dropdown',
  LEADERBOARD_PERIOD_OPTION: 'select_leaderboard_period',
  LEADERBOARD_DEBUG_TAB: 'open_leaderboard_debug_mode',
  LEADERBOARD_DEBUG_DIALOG_CANCEL: 'cancel_leaderboard_debug_mode',
  LEADERBOARD_DEBUG_SYNC_NOW: 'debug_sync_now',
  LEADERBOARD_DEBUG_CLEAR_LESSONS: 'debug_clear_downloaded_lessons',
  LEADERBOARD_DEBUG_SCREENSHOT: 'debug_capture_screenshot',
  LEADERBOARD_DEBUG_HOT_UPDATE: 'debug_manual_hot_update',
  SUBJECT_CARD: 'select_subject',
  PROGRESS_SWITCH_SUBJECT: 'switch_progress_subject',
  PROGRESS_BACK: 'back_from_progress_page',
  ADD_SUBJECTS: 'open_add_subjects',
  ADDITIONAL_SUBJECT: 'select_subject_to_add',
  CONFIRM_ADD_SUBJECTS: 'confirm_add_subjects',
  CHAPTER_BACK: 'back_from_chapter_page',
  CHAPTER_CARD: 'select_chapter',
  LESSON_BACK: 'back_from_lesson_page',
  LESSON_CARD: 'select_lesson',
  DOWNLOAD_LESSON: 'download_lesson',
  DOWNLOAD_CHAPTER: 'download_chapter',
  DOWNLOAD_ALL_HOMEWORK: 'download_all_homework',
  CONFIRM_JOIN_CLASS: 'confirm_join_class',
  BADGE_CELEBRATION_SHARE: 'share_celebration_badge',
  CONTACT_HELP_BY_EMAIL: 'contact_help_by_email',
  OPEN_HELP_WEBSITE: 'open_help_website',
  CONTACT_HELP_BY_WHATSAPP: 'contact_help_by_whatsapp',
  OPEN_HELP_INSTAGRAM: 'open_help_instagram',
  OPEN_HELP_FACEBOOK: 'open_help_facebook',
  OPEN_HELP_TWITTER: 'open_help_twitter',
  OPEN_FAQ_WEBSITE: 'open_faq_website',
  CONTINUE_AFTER_LESSON: 'continue_after_lesson',
  CONTINUE_TO_CLASS_SELECTION: 'continue_to_class_selection',
} as const;

export type TrackableId = (typeof TRACKABLE_IDS)[keyof typeof TRACKABLE_IDS];

export const getTrackableProps = (id: TrackableId) => ({
  [TRACKABLE_ATTRIBUTE]: 'true',
  [TRACKABLE_ID_ATTRIBUTE]: id,
});

export const getTrackableParentIgnoreProps = () => ({
  [TRACKABLE_PARENT_IGNORE_ATTRIBUTE]: 'true',
});

const KIDS_APP_CLICK_ANALYTICS_PATHS = new Set<string>([
  PAGES.HOME,
  PAGES.ASSIGNMENT,
  PAGES.DISPLAY_SUBJECTS,
  PAGES.ADD_SUBJECTS,
  PAGES.DISPLAY_CHAPTERS,
  PAGES.DISPLAY_STUDENT,
  PAGES.PARENT,
  PAGES.STUDENT_PROGRESS,
  PAGES.LEADERBOARD,
  PAGES.LIDO_PLAYER,
]);

export const isKidsAppClickAnalyticsPath = (pathname: string) => {
  if (pathname !== PAGES.SELECT_MODE) {
    return KIDS_APP_CLICK_ANALYTICS_PATHS.has(pathname);
  }

  return (
    typeof window !== 'undefined' &&
    window.localStorage.getItem(CURRENT_MODE) === MODES.SCHOOL
  );
};
