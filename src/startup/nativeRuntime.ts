import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { Preferences } from '@capacitor/preferences';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { VERSION_KEY } from '../common/constants';
import { ensureSocialLoginInitialized } from '../services/auth/SocialLoginInit';
import logger from '../utility/logger';

export const isNativePlatform = Capacitor.isNativePlatform();

export const initializeNativeRuntime = () => {
  if (!isNativePlatform) return;

  void startNativeInit();
  void ensureSocialLoginInitialized().catch((error) => {
    logger.error('SocialLogin initialize failed', error);
  });
};

export const finalizeFirstRenderNativeRuntime = () => {
  SplashScreen.hide();
  if (isNativePlatform) {
    void ScreenOrientation.lock({ orientation: 'landscape' }).catch((error) => {
      logger.error('ScreenOrientation lock failed', error);
    });
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
