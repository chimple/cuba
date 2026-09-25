import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LeaderboardRewards from './LeaderboardRewards';
import { EVENTS } from '../../common/constants';
import { logBadgeEvent } from '../../common/Badges/badgeAnalytics';
import logger from '../../utility/logger';

const mockGetUserBadgeProgress = jest.fn();

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: { getUserBadgeProgress: mockGetUserBadgeProgress },
    }),
  },
}));
jest.mock('../../utility/util', () => ({
  Util: { getCurrentStudent: () => ({ id: 'student-1' }) },
}));
jest.mock('../../common/Badges/badgeAnalytics', () => ({
  logBadgeEvent: jest.fn(),
}));
jest.mock('../../utility/logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));
jest.mock('./LessonCompletionRewards', () => ({
  __esModule: true,
  default: () => <div>Lesson rewards</div>,
}));
jest.mock('./LeaderboardSticker', () => () => <div>Stickers</div>);
jest.mock('./LeaderboardBadges', () => () => <div>Badges</div>);
jest.mock('./LeaderboardBonus', () => () => <div>Bonus</div>);

describe('LeaderboardRewards', () => {
  const progress = {
    lessons_played_count: 163,
    latest_badge_milestone: 150,
    has_unseen_badge: false,
  };

  beforeEach(() => {
    mockGetUserBadgeProgress.mockResolvedValue(progress);
  });

  it('records the page view and both tab selections', async () => {
    render(<LeaderboardRewards />);

    await waitFor(() =>
      expect(logBadgeEvent).toHaveBeenCalledWith(
        EVENTS.REWARDS_PAGE_VIEWED,
        'student-1',
        progress,
      ),
    );

    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(logBadgeEvent).toHaveBeenCalledWith(
      EVENTS.REWARDS_TAB_CLICKED,
      'student-1',
      progress,
      { target_tab: 'stickers' },
    );

    fireEvent.click(tabs[0]);
    expect(logBadgeEvent).toHaveBeenCalledWith(
      EVENTS.REWARDS_TAB_CLICKED,
      'student-1',
      progress,
      { target_tab: 'lesson_completion_badges' },
    );
  });

  it('handles progress-loading failures without rejecting the page', async () => {
    const error = new Error('Badge progress unavailable');
    mockGetUserBadgeProgress.mockRejectedValue(error);

    render(<LeaderboardRewards />);

    await waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to load badge progress:',
        error,
      ),
    );
    expect(logBadgeEvent).toHaveBeenCalledWith(
      EVENTS.REWARDS_PAGE_VIEWED,
      'student-1',
      {
        lessons_played_count: 0,
        latest_badge_milestone: 0,
        has_unseen_badge: false,
      },
    );
    expect(screen.getByText('Lesson rewards')).toBeInTheDocument();
  });
});
