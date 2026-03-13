import { Util } from './util';
import { EVENTS } from '../common/constants';

const STORAGE_PREFIX = 'sticker_book_notification';
const NOTIFICATION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface NotificationData {
  hasNotification: boolean;
  timestamp: number;
}

const getKey = (studentId: string) => `${STORAGE_PREFIX}:${studentId}`;

const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const getNotificationData = (studentId: string): NotificationData | null => {
  if (!isStorageAvailable()) return null;

  try {
    const data = localStorage.getItem(getKey(studentId));
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Check if data is expired
    if (Date.now() - parsed.timestamp > NOTIFICATION_TTL) {
      localStorage.removeItem(getKey(studentId));
      return null;
    }
    return parsed;
  } catch {
    // If parsing fails, clean up and return null
    localStorage.removeItem(getKey(studentId));
    return null;
  }
};

export const hasStickerBookNotification = (studentId?: string): boolean => {
  if (!studentId) return false;
  const data = getNotificationData(studentId);
  return data?.hasNotification ?? false;
};

export const setStickerBookNotification = (studentId?: string) => {
  if (!studentId || !isStorageAvailable()) return;

  const data: NotificationData = {
    hasNotification: true,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(getKey(studentId), JSON.stringify(data));
    Util.logEvent(EVENTS.STICKER_BOOK_NOTIFICATION_SHOWN, {
      user_id: studentId,
    });
  } catch (error) {
    console.warn('Failed to set sticker book notification:', error);
  }
};

export const clearStickerBookNotification = (studentId?: string) => {
  if (!studentId || !isStorageAvailable()) return;

  const hadNotification = hasStickerBookNotification(studentId);

  try {
    localStorage.removeItem(getKey(studentId));
    if (hadNotification) {
      Util.logEvent(EVENTS.STICKER_BOOK_NOTIFICATION_CLEARED, {
        user_id: studentId,
      });
    }
  } catch (error) {
    console.warn('Failed to clear sticker book notification:', error);
  }
};
