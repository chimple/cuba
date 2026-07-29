import { buildPushRetrySchedule, getPushRetryDelayMs } from './syncBackoff';

describe('syncBackoff', () => {
  test('builds exponential retry delays', () => {
    expect(getPushRetryDelayMs(0)).toBe(1000);
    expect(getPushRetryDelayMs(1)).toBe(2000);
    expect(getPushRetryDelayMs(2)).toBe(4000);
  });

  test('caps retry delays and increments retry count', () => {
    const now = new Date('2026-07-29T00:00:00.000Z');
    const schedule = buildPushRetrySchedule(20, now);

    expect(schedule.delayMs).toBe(5 * 60 * 1000);
    expect(schedule.retryCount).toBe(21);
    expect(schedule.nextRetryAt).toBe('2026-07-29T00:05:00.000Z');
  });
});
