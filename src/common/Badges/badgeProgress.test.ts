import { getBadgeMilestone, nextBadgeProgress } from './badgeProgress';

describe('badge progress', () => {
  it('awards every 50th lesson through 3000', () => {
    expect(getBadgeMilestone(50)).toBe(50);
    expect(getBadgeMilestone(3000)).toBe(3000);
    expect(getBadgeMilestone(3050)).toBeNull();
    expect(getBadgeMilestone(49)).toBeNull();
  });

  it('increments from zero and preserves the latest milestone', () => {
    expect(nextBadgeProgress()).toEqual({
      progress: {
        lessons_played_count: 1,
        latest_badge_milestone: 0,
      },
      milestoneReached: null,
    });
    expect(nextBadgeProgress({ lessons_played_count: 49 })).toEqual({
      progress: { lessons_played_count: 50, latest_badge_milestone: 50 },
      milestoneReached: 50,
    });
  });
});
