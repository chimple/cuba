import { Capacitor } from '@capacitor/core';

const NATIVE_SHARE_PREVIEW_TIMEOUT_MS = 15000;

export const dataUrlToFile = (dataUrl: string, campaignId: string) => {
  const [header, encoded] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = Uint8Array.from(window.atob(encoded), (char) =>
    char.charCodeAt(0),
  );
  return new File([bytes], `chimple-certificate-${campaignId}.png`, {
    type: mime,
  });
};

/** Keeps the captured artwork visible behind Android's native share sheet. */
export const scheduleNativeSharePreviewRelease = (
  closeCertificate: () => void,
): boolean => {
  if (!Capacitor.isNativePlatform()) return false;

  let shareSheetOpened = false;
  let fallbackTimer: number | undefined;
  let released = false;
  const releasePreview = () => {
    if (released) return;
    released = true;
    window.removeEventListener('blur', markShareSheetOpened);
    window.removeEventListener('focus', restorePopup);
    document.removeEventListener('visibilitychange', watchVisibility);
    document.removeEventListener('pointerdown', releasePreview, true);
    if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    closeCertificate();
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
  document.addEventListener('pointerdown', releasePreview, true);
  fallbackTimer = window.setTimeout(
    releasePreview,
    NATIVE_SHARE_PREVIEW_TIMEOUT_MS,
  );
  return true;
};
