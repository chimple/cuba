import {
  hasFutureTimesForPeriod,
  isScheduledTimeInPast,
  isTimeOptionInPast,
} from './MessagesPage.helpers';

describe('MessagesPage time helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-06T13:20:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats past AM slots as unavailable for today when the current time is PM', () => {
    expect(isTimeOptionInPast('2026-08-06', '01', 'AM')).toBe(true);
    expect(hasFutureTimesForPeriod('2026-08-06', 'AM')).toBe(false);
    expect(isScheduledTimeInPast('2026-08-06', '01:00 AM')).toBe(true);
  });

  it('keeps future PM slots available for today', () => {
    expect(isTimeOptionInPast('2026-08-06', '02', 'PM')).toBe(false);
    expect(isTimeOptionInPast('2026-08-06', '03', 'PM')).toBe(false);
    expect(hasFutureTimesForPeriod('2026-08-06', 'PM')).toBe(true);
  });

  it('does not block past checks for future dates', () => {
    expect(isTimeOptionInPast('2026-08-07', '01', 'AM')).toBe(false);
    expect(isScheduledTimeInPast('2026-08-07', '01:00 AM')).toBe(false);
  });
});
