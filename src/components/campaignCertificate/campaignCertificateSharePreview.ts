import { Capacitor } from '@capacitor/core';

const NATIVE_SHARE_PREVIEW_TIMEOUT_MS = 15000;

/** Keeps the captured artwork visible behind Android's native share sheet. */
export const scheduleNativeSharePreviewRelease = (
  hidePreview: () => void,
): boolean => {
  if (!Capacitor.isNativePlatform()) return false;

  let shareSheetOpened = false;
  let fallbackTimer: number | undefined;
  const releasePreview = () => {
    window.removeEventListener('blur', markShareSheetOpened);
    window.removeEventListener('focus', restorePopup);
    document.removeEventListener('visibilitychange', watchVisibility);
    if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    hidePreview();
  };
  const markShareSheetOpened = () => {
    shareSheetOpened = true;
  };
  const restorePopup = () => {
    if (shareSheetOpened) releasePreview();
  };
  const watchVisibility = () => {
    if (document.visibilityState === 'hidden') shareSheetOpened = true;
    else if (shareSheetOpened) releasePreview();
  };

  window.addEventListener('blur', markShareSheetOpened);
  window.addEventListener('focus', restorePopup);
  document.addEventListener('visibilitychange', watchVisibility);
  fallbackTimer = window.setTimeout(
    releasePreview,
    NATIVE_SHARE_PREVIEW_TIMEOUT_MS,
  );
  return true;
};
