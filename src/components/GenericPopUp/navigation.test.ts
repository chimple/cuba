import { buildReplacementLocation } from './navigation';

describe('GenericPopUp navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds hash-router urls for internal popup targets when the app is hash-routed', () => {
    window.history.replaceState({}, '', 'http://localhost/#/leaderboard');

    expect(buildReplacementLocation('/home?tab=SUBJECTS')).toBe(
      'http://localhost/#/home?tab=SUBJECTS',
    );
  });

  it('builds pathname urls for internal popup targets when the app is not hash-routed', () => {
    window.history.replaceState({}, '', 'http://localhost/leaderboard');

    expect(buildReplacementLocation('/home?tab=SUBJECTS')).toBe(
      'http://localhost/home?tab=SUBJECTS',
    );
  });
});
