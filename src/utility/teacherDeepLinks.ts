import { PAGES } from '../common/constants';

export type TeacherDeepLinkTarget = {
  pathname: string;
  state?: { tabValue: number };
};

// CC links are intentionally allow-listed. Unknown paths are ignored safely.
export const resolveTeacherDeepLink = (
  url: URL,
): TeacherDeepLinkTarget | null => {
  if (
    url.protocol !== 'https:' ||
    url.hostname.toLowerCase() !== 'chimple.cc'
  ) {
    return null;
  }

  const route = url.hash.startsWith('#/') ? url.hash.slice(1) : url.pathname;
  const path = route.split('?')[0].replace(/\/+$/, '').toLowerCase() || '/';
  switch (path) {
    case '/teacher/home-page':
    case '/teacher-home-page':
      return { pathname: PAGES.HOME_PAGE, state: { tabValue: 0 } };
    case '/teacher/streak':
    case '/teacher/streaks':
      return { pathname: PAGES.STREAK_PAGE };
    case '/teacher/reports':
    case '/reports':
      return { pathname: PAGES.HOME_PAGE, state: { tabValue: 3 } };
    case '/teacher/library':
    case '/library':
      return { pathname: PAGES.HOME_PAGE, state: { tabValue: 1 } };
    default:
      return null;
  }
};

export const PENDING_TEACHER_DEEP_LINK = 'pending_teacher_deep_link';
