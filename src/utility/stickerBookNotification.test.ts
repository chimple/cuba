import {
  hasStickerBookNotification,
  setStickerBookNotification,
  clearStickerBookNotification,
} from './stickerBookNotification';
import { Util } from './util';
import { EVENTS } from '../common/constants';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Util.logEvent
jest.mock('./util', () => ({
  Util: {
    logEvent: jest.fn(),
  },
}));

describe('stickerBookNotification', () => {
  const mockStudentId = 'test-student-id';
  const mockTimestamp = Date.now();
  const validData = JSON.stringify({
    hasNotification: true,
    timestamp: mockTimestamp,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hasStickerBookNotification', () => {
    it('returns false when studentId is undefined', () => {
      expect(hasStickerBookNotification(undefined)).toBe(false);
    });

    it('returns false when localStorage is not available', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      expect(hasStickerBookNotification(mockStudentId)).toBe(false);
    });

    it('returns false when localStorage has no value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(hasStickerBookNotification(mockStudentId)).toBe(false);
    });

    it('returns false when data is expired', () => {
      const expiredTimestamp = mockTimestamp - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      const expiredData = JSON.stringify({
        hasNotification: true,
        timestamp: expiredTimestamp,
      });
      localStorageMock.getItem.mockReturnValue(expiredData);
      expect(hasStickerBookNotification(mockStudentId)).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `sticker_book_notification:${mockStudentId}`,
      );
    });

    it('returns true when localStorage has valid data', () => {
      localStorageMock.getItem.mockReturnValue(validData);
      expect(hasStickerBookNotification(mockStudentId)).toBe(true);
    });

    it('handles corrupted data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      expect(hasStickerBookNotification(mockStudentId)).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `sticker_book_notification:${mockStudentId}`,
      );
    });
  });

  describe('setStickerBookNotification', () => {
    it('does nothing when studentId is undefined', () => {
      setStickerBookNotification(undefined);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(Util.logEvent).not.toHaveBeenCalled();
    });

    it('does nothing when localStorage is not available', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      setStickerBookNotification(mockStudentId);
      expect(Util.logEvent).not.toHaveBeenCalled();
    });

    it('sets localStorage and logs event when studentId is provided', () => {
      setStickerBookNotification(mockStudentId);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `sticker_book_notification:${mockStudentId}`,
        JSON.stringify({
          hasNotification: true,
          timestamp: mockTimestamp,
        }),
      );
      expect(Util.logEvent).toHaveBeenCalledWith(
        EVENTS.STICKER_BOOK_NOTIFICATION_SHOWN,
        {
          user_id: mockStudentId,
        },
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      // Should not throw, just log warning
      expect(() => setStickerBookNotification(mockStudentId)).not.toThrow();
      expect(Util.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('clearStickerBookNotification', () => {
    it('does nothing when studentId is undefined', () => {
      clearStickerBookNotification(undefined);
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      expect(Util.logEvent).not.toHaveBeenCalled();
    });

    it('does nothing when localStorage is not available', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      clearStickerBookNotification(mockStudentId);
      expect(Util.logEvent).not.toHaveBeenCalled();
    });

    it('removes from localStorage but does not log event when no notification exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      clearStickerBookNotification(mockStudentId);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `sticker_book_notification:${mockStudentId}`,
      );
      expect(Util.logEvent).not.toHaveBeenCalled();
    });

    it('removes from localStorage and logs event when notification exists', () => {
      localStorageMock.getItem.mockReturnValue(validData);
      clearStickerBookNotification(mockStudentId);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `sticker_book_notification:${mockStudentId}`,
      );
      expect(Util.logEvent).toHaveBeenCalledWith(
        EVENTS.STICKER_BOOK_NOTIFICATION_CLEARED,
        {
          user_id: mockStudentId,
        },
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue(validData);
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      // Should not throw, just log warning
      expect(() => clearStickerBookNotification(mockStudentId)).not.toThrow();
      expect(Util.logEvent).not.toHaveBeenCalled();
    });
  });
});
