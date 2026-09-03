import { Capacitor, registerPlugin } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { Preferences } from '@capacitor/preferences';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { VERSION_KEY } from '../common/constants';
import { ensureSocialLoginInitialized } from '../services/auth/SocialLoginInit';
import logger from '../utility/logger';

export const isNativePlatform = Capacitor.isNativePlatform();
const MIN_SPLASH_DISPLAY_MS = 1000;
const OPEN_APK_SPLASH_ENABLED = false;
const OPEN_APK_SPLASH_IMAGE_PATH = '';
const nativeRuntimeStartedAt = Date.now();
let splashHideScheduled = false;
let openApkSplashOverlay: HTMLDivElement | null = null;
let openApkSplashShownAt = 0;

interface RespectLaunchPlugin {
  sendLaunchData(): Promise<{ lessonId?: string }>;
}

const respectLaunchPlugin = registerPlugin<RespectLaunchPlugin>('Port');

export const initializeNativeRuntime = () => {
  if (!isNativePlatform) return;

  showOpenApkSplashOverlay();
  void startNativeInit();
  void ensureSocialLoginInitialized().catch((error) => {
    logger.error('SocialLogin initialize failed', error);
  });
};

export const hideNativeSplashScreen = (): void => {
  if (splashHideScheduled) return;
  splashHideScheduled = true;

  void hideNativeSplashScreenAfterMinimumDisplay();
};

const showOpenApkSplashOverlay = (): void => {
  if (!OPEN_APK_SPLASH_ENABLED || !OPEN_APK_SPLASH_IMAGE_PATH) return;

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483647';
  overlay.style.backgroundColor = '#ffffff';
  overlay.style.pointerEvents = 'none';

  const image = document.createElement('img');
  image.src = OPEN_APK_SPLASH_IMAGE_PATH;
  image.alt = '';
  image.style.width = '100%';
  image.style.height = '100%';
  image.style.objectFit = 'cover';
  image.style.display = 'block';

  overlay.appendChild(image);
  document.body.appendChild(overlay);
  openApkSplashOverlay = overlay;
  openApkSplashShownAt = Date.now();
};

const hideNativeSplashScreenAfterMinimumDisplay = async (): Promise<void> => {
  if (openApkSplashOverlay) {
    await SplashScreen.hide();
    openApkSplashShownAt = Date.now();
    await waitForMinimumSplashDisplay();
    openApkSplashOverlay.remove();
    openApkSplashOverlay = null;
    return;
  }

  await waitForMinimumSplashDisplay();
  await SplashScreen.hide();
};

const waitForMinimumSplashDisplay = async (): Promise<void> => {
  const startedAt = openApkSplashShownAt || nativeRuntimeStartedAt;
  const elapsedMs = Date.now() - startedAt;
  const remainingMs = Math.max(MIN_SPLASH_DISPLAY_MS - elapsedMs, 0);

  if (remainingMs <= 0) return;

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remainingMs);
  });
};

export const finalizeFirstRenderNativeRuntime = (): void => {
  void finalizeFirstRender();
};

const finalizeFirstRender = async (): Promise<void> => {
  const isRespectLessonLaunch = await isRespectLessonLaunchPending();
  if (!isRespectLessonLaunch) {
    hideNativeSplashScreen();
  }

  if (isNativePlatform) {
    void ScreenOrientation.lock({ orientation: 'landscape' }).catch((error) => {
      logger.error('ScreenOrientation lock failed', error);
    });
  }
};

const isRespectLessonLaunchPending = async (): Promise<boolean> => {
  if (!isNativePlatform) return false;

  try {
    const launchData = await respectLaunchPlugin.sendLaunchData();
    return Boolean(launchData.lessonId);
  } catch {
    return false;
  }
};

const startNativeInit = async () => {
  try {
    await checkNativeVersionAndReset();
    await LiveUpdate.ready();
  } catch (error) {
    logger.error(
      'Error in checkNativeVersionAndReset() or LiveUpdate.ready()',
      error,
    );
  }
};

const checkNativeVersionAndReset = async () => {
  const { versionName } = await LiveUpdate.getVersionName();
  const { value: storedVersion } = await Preferences.get({
    key: VERSION_KEY,
  });
  if (versionName !== storedVersion) {
    await LiveUpdate.reset();
    await Preferences.set({ key: VERSION_KEY, value: versionName });
  }
};
