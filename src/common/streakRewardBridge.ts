type StreakRectResolver = () => DOMRect | null;
type StreakPulseHandler = () => void;

let resolveStreakRect: StreakRectResolver | null = null;
let triggerPulseHandler: StreakPulseHandler | null = null;

export const registerStreakRectResolver = (
  resolver: StreakRectResolver | null,
) => {
  resolveStreakRect = resolver;
};

export const getStreakTargetRect = (): DOMRect | null => {
  return resolveStreakRect?.() ?? null;
};

export const registerStreakRewardPulseHandler = (
  handler: StreakPulseHandler | null,
) => {
  triggerPulseHandler = handler;
};

export const triggerStreakRewardPulse = (): boolean => {
  if (!triggerPulseHandler) {
    return false;
  }
  triggerPulseHandler();
  return true;
};
