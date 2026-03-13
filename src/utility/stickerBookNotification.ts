const STORAGE_PREFIX = 'sticker_book_notification';

const getKey = (studentId: string) => `${STORAGE_PREFIX}:${studentId}`;

export const hasStickerBookNotification = (studentId?: string) =>
  Boolean(studentId && localStorage.getItem(getKey(studentId)) === 'true');

export const setStickerBookNotification = (studentId?: string) => {
  if (!studentId) return;
  localStorage.setItem(getKey(studentId), 'true');
};

export const clearStickerBookNotification = (studentId?: string) => {
  if (!studentId) return;
  localStorage.removeItem(getKey(studentId));
};
