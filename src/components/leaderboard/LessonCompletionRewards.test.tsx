import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import LessonCompletionRewards from './LessonCompletionRewards';
import { logBadgeEvent } from '../../common/Badges/badgeAnalytics';
import { toPng } from 'html-to-image';
import { Util } from '../../utility/util';
import { EVENTS } from '../../common/constants';

jest.mock('html-to-image', () => ({
  toPng: jest.fn(() => new Promise(() => undefined)),
}));
jest.mock('i18next', () => ({
  t: (key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key,
}));
jest.mock('../../common/Badges/badgeAnalytics', () => ({
  logBadgeEvent: jest.fn(),
}));
jest.mock('../../utility/util', () => ({
  Util: { sendContentToAndroidOrWebShare: jest.fn() },
}));
jest.mock('../badges/BadgeCelebrationModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    SharedBadgeArtwork: React.forwardRef(
      (
        { milestone }: { milestone: number },
        ref: React.Ref<HTMLDivElement>,
      ) => (
        <div ref={ref} data-testid="shared-badge-artwork">
          Share {milestone}
        </div>
      ),
    ),
  };
});
jest.mock('./LessonCompletionBadge', () => ({
  __esModule: true,
  default: ({ number, isLocked }: { number: number; isLocked?: boolean }) => (
    <div data-testid={`badge-${number}`} data-locked={isLocked}>
      {number}
    </div>
  ),
}));

describe('LessonCompletionRewards', () => {
  const progress = {
    lessons_played_count: 163,
    latest_badge_milestone: 150,
    has_unseen_badge: false,
  };
  const mockedToPng = toPng as jest.MockedFunction<typeof toPng>;
  const mockedShare = Util.sendContentToAndroidOrWebShare as jest.Mock;

  beforeEach(() => {
    mockedToPng.mockReturnValue(new Promise(() => undefined));
    mockedShare.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders earned badges and the next locked milestone', () => {
    render(
      <LessonCompletionRewards studentId="student-1" progress={progress} />,
    );

    expect(screen.getByTestId('badge-50')).toHaveAttribute(
      'data-locked',
      'false',
    );
    expect(screen.getByTestId('badge-100')).toHaveAttribute(
      'data-locked',
      'false',
    );
    expect(screen.getByTestId('badge-150')).toHaveAttribute(
      'data-locked',
      'false',
    );
    expect(screen.getByTestId('badge-200')).toHaveAttribute(
      'data-locked',
      'true',
    );
    expect(screen.getAllByRole('button', { name: /share/i })).toHaveLength(3);
    expect(
      screen.getAllByTestId(/badge-/).map((badge) => badge.textContent),
    ).toEqual(['50', '100', '150', '200']);
  });

  it('opens the share preview and records the selected milestone', () => {
    render(
      <LessonCompletionRewards studentId="student-1" progress={progress} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /share 150/i }));

    expect(screen.getByTestId('shared-badge-artwork')).toHaveTextContent(
      'Share 150',
    );
    expect(logBadgeEvent).toHaveBeenCalledWith(
      expect.anything(),
      'student-1',
      progress,
      expect.objectContaining({
        shared_milestone_number: 150,
        source_location: 'rewards_page_tab',
      }),
    );
  });

  it('does not render a milestone beyond the maximum', () => {
    render(
      <LessonCompletionRewards
        studentId="student-1"
        progress={{ ...progress, latest_badge_milestone: 3000 }}
      />,
    );

    expect(screen.queryByText('Upcoming')).not.toBeInTheDocument();
    expect(screen.queryByTestId('badge-3050')).not.toBeInTheDocument();
  });

  it('records a successful share outcome', async () => {
    jest.useFakeTimers();
    mockedToPng.mockResolvedValue('data:image/png;base64,AA==');
    render(
      <LessonCompletionRewards studentId="student-1" progress={progress} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /share 100/i }));
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(logBadgeEvent).toHaveBeenCalledWith(
        EVENTS.REWARD_BADGE_SHARE_SUCCESS,
        'student-1',
        progress,
        { shared_milestone_number: 100 },
      ),
    );
    expect(mockedShare).toHaveBeenCalledWith(
      '100 lessons complete!',
      'My Chimple Badge',
      undefined,
      expect.arrayContaining([expect.any(File)]),
      { rethrowOnError: true },
    );
  });

  it('records a failed share outcome with its error', async () => {
    jest.useFakeTimers();
    mockedToPng.mockResolvedValue('data:image/png;base64,AA==');
    mockedShare.mockRejectedValue(new Error('Native share unavailable'));
    render(
      <LessonCompletionRewards studentId="student-1" progress={progress} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /share 50/i }));
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(logBadgeEvent).toHaveBeenCalledWith(
        EVENTS.REWARD_BADGE_SHARE_FAILED,
        'student-1',
        progress,
        {
          shared_milestone_number: 50,
          error_message: 'Native share unavailable',
        },
      ),
    );
  });
});
