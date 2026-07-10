import {
  buildHashAppUrl,
  normalizeInitialHashRouteEntry,
} from './routerLocation';

describe('routerLocation', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  test('buildHashAppUrl creates shareable hash-router URLs', () => {
    const url = buildHashAppUrl(
      {
        pathname: '/assignment',
        search: '?batch_id=batch-1&source=teacher',
      },
      'https://chimple.cc',
    );

    expect(url.toString()).toBe(
      'https://chimple.cc/#/assignment?batch_id=batch-1&source=teacher',
    );
  });

  test('normalizeInitialHashRouteEntry rewrites known pathname routes', () => {
    window.history.replaceState({}, '', '/join-class?classCode=123');

    expect(normalizeInitialHashRouteEntry()).toBe(true);
    expect(window.location.pathname).toBe('/');
    expect(window.location.hash).toBe('#/join-class?classCode=123');
  });

  test('normalizeInitialHashRouteEntry leaves root entry unchanged', () => {
    window.history.replaceState({}, '', '/?page=/join-class');

    expect(normalizeInitialHashRouteEntry()).toBe(false);
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?page=/join-class');
    expect(window.location.hash).toBe('');
  });
});
