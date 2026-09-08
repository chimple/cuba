import { PAGES } from '../common/constants';
import { resolveTeacherDeepLink } from './teacherDeepLinks';

describe('resolveTeacherDeepLink', () => {
  it.each([
    ['/teacher-home', 0],
    ['/home-page', 0],
    ['/reports', 3],
    ['/library', 1],
    ['/#/teacher/home-page', 0],
    ['/#/teacher/library', 1],
    ['/#/teacher/reports', 3],
    ['/#/teacher/library?isReload=true', 1],
    ['/teacher/library', 1],
  ])('resolves %s', (path, tabValue) => {
    expect(
      resolveTeacherDeepLink(new URL(`https://chimple.cc${path}`)),
    ).toEqual({
      pathname: PAGES.HOME_PAGE,
      state: { tabValue },
    });
  });

  it('resolves streaks and rejects unsupported URLs', () => {
    expect(
      resolveTeacherDeepLink(new URL('https://chimple.cc/#/teacher/streak')),
    ).toEqual({
      pathname: PAGES.STREAK_PAGE,
    });
    expect(
      resolveTeacherDeepLink(new URL('https://chimple.cc/streaks')),
    ).toEqual({
      pathname: PAGES.STREAK_PAGE,
    });
    expect(
      resolveTeacherDeepLink(new URL('https://example.com/library')),
    ).toBeNull();
    expect(
      resolveTeacherDeepLink(new URL('https://chimple.cc/unknown')),
    ).toBeNull();
  });
});
