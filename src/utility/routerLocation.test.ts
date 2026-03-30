import {
  buildAppRoute,
  buildAppUrl,
  getAppHref,
  getAppLocation,
  getAppPathname,
  getAppSearch,
  getAppSearchParams,
  replaceAppHistory,
  replaceAppLocation,
} from './routerLocation';

describe('routerLocation', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
    jest.restoreAllMocks();
  });

  it('builds normalized app routes', () => {
    expect(buildAppRoute('/home/', 'tab=leaderboard')).toBe(
      '/home?tab=leaderboard',
    );
    expect(buildAppRoute('leaderboard', '?rewards=bonus')).toBe(
      '/leaderboard?rewards=bonus',
    );
  });

  it('reads pathname and search from hash-based routes', () => {
    window.history.replaceState(
      {},
      '',
      '/#/leaderboard?tab=rewards&rewards=bonus',
    );

    expect(getAppLocation()).toEqual({
      pathname: '/leaderboard',
      search: '?tab=rewards&rewards=bonus',
      pathWithSearch: '/leaderboard?tab=rewards&rewards=bonus',
    });
    expect(getAppPathname()).toBe('/leaderboard');
    expect(getAppSearch()).toBe('?tab=rewards&rewards=bonus');
    expect(getAppSearchParams().get('rewards')).toBe('bonus');
    expect(getAppHref()).toBe(
      'http://localhost/#/leaderboard?tab=rewards&rewards=bonus',
    );
  });

  it('falls back to browser pathname and search when no hash route exists', () => {
    window.history.replaceState({}, '', '/login?tab=home');

    expect(getAppLocation()).toEqual({
      pathname: '/login',
      search: '?tab=home',
      pathWithSearch: '/login?tab=home',
    });
  });

  it('replaces browser history with a hash route', () => {
    window.history.replaceState({}, '', '/#/login');

    replaceAppHistory('/home?tab=assignment');

    expect(window.location.href).toBe('http://localhost/#/home?tab=assignment');
    expect(window.location.hash).toBe('#/home?tab=assignment');
  });

  it('routes hard replaces through hash urls', () => {
    window.history.replaceState({}, '', '/#/login');
    const originalLocation = window.location;
    const replaceSpy = jest.fn();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, replace: replaceSpy },
    });

    replaceAppLocation('/leaderboard?tab=rewards');

    expect(replaceSpy).toHaveBeenCalledWith(
      'http://localhost/#/leaderboard?tab=rewards',
    );
    expect(buildAppUrl('/home?tab=home')).toBe(
      'http://localhost/#/home?tab=home',
    );

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });
});
