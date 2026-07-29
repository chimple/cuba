const BASE_PUSH_RETRY_DELAY_MS = 1000;
const MAX_PUSH_RETRY_DELAY_MS = 5 * 60 * 1000;

export const getPushRetryDelayMs = (retryCount: number): number =>
  Math.min(
    BASE_PUSH_RETRY_DELAY_MS * 2 ** Math.max(retryCount, 0),
    MAX_PUSH_RETRY_DELAY_MS,
  );

export const buildPushRetrySchedule = (
  currentRetryCount: number,
  now: Date = new Date(),
): {
  delayMs: number;
  nextRetryAt: string;
  retryCount: number;
} => {
  const delayMs = getPushRetryDelayMs(currentRetryCount);
  const nextRetryAt = new Date(now.getTime() + delayMs).toISOString();

  return {
    delayMs,
    nextRetryAt,
    retryCount: currentRetryCount + 1,
  };
};
