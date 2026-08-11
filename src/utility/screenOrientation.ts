import { ScreenOrientation as CapacitorScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';
import logger from './logger';

type OrientationLockType = Parameters<
  typeof CapacitorScreenOrientation.lock
>[0];

const isUnavailableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('not available');
};

export const ScreenOrientation = {
  async lock(options: OrientationLockType): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await CapacitorScreenOrientation.lock(options);
    } catch (error) {
      if (isUnavailableError(error)) return;
      logger.error('ScreenOrientation lock failed', error);
    }
  },

  async unlock(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await CapacitorScreenOrientation.unlock();
    } catch (error) {
      if (isUnavailableError(error)) return;
      logger.error('ScreenOrientation unlock failed', error);
    }
  },
};
