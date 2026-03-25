import { FirebaseRemoteConfig } from '@capacitor-firebase/remote-config';
import { APP_ENV } from '../env';

const getAppEnvironment = (): 'dev' | 'prod' => {
  return APP_ENV;
};

export type AppEnvironment = 'dev' | 'prod';

const APP_ENVIRONMENT: AppEnvironment = getAppEnvironment();

const BUNDLE_ZIP_URLS_BY_ENV = {
  dev: [
    'https://cuba-zip-bundle-dev.web.app/',
    'https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/',
    'https://raw.githubusercontent.com/chimple/chimple-zips/main/',
  ],
  prod: [
    'https://cuba-stage-zip-bundle.web.app/',
    'https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/',
    'https://raw.githubusercontent.com/chimple/chimple-zips/main/',
  ],
} as const;

export const LIDO_BUNDLE_ZIP_URLS_BY_ENV = {
  dev: ['https://chimple-zip-bundles-dev.web.app/'],
  prod: ['https://chimple-bundles.web.app/'],
} as const;

export const getBundleZipUrlsForEnv = (
  env: AppEnvironment = APP_ENVIRONMENT,
) => [...BUNDLE_ZIP_URLS_BY_ENV[env]];

export const getLidoBundleZipUrlsForEnv = (
  env: AppEnvironment = APP_ENVIRONMENT,
) => [...LIDO_BUNDLE_ZIP_URLS_BY_ENV[env]];

export const getLidoBundleBaseUrlForEnv = (
  env: AppEnvironment = APP_ENVIRONMENT,
) => LIDO_BUNDLE_ZIP_URLS_BY_ENV[env][0];

export class RemoteConfig {
  private constructor() {}
  public static async getString(key: REMOTE_CONFIG_KEYS): Promise<string> {
    try {
      const { value } = await FirebaseRemoteConfig.getString({
        key: key,
      });
      return value == null ? REMOTE_CONFIG_DEFAULTS[key] : value;
    } catch (error) {
      return REMOTE_CONFIG_DEFAULTS[key];
    }
  }

  public static async getNumber(key: REMOTE_CONFIG_KEYS): Promise<number> {
    try {
      const { value } = await FirebaseRemoteConfig.getNumber({
        key: key,
      });
      return value == null ? REMOTE_CONFIG_DEFAULTS[key] : value;
    } catch (error) {
      return REMOTE_CONFIG_DEFAULTS[key];
    }
  }

  public static async getJSON(key: REMOTE_CONFIG_KEYS): Promise<any> {
    try {
      const { value } = await FirebaseRemoteConfig.getString({ key: key });
      return JSON.parse(value) || REMOTE_CONFIG_DEFAULTS[key];
    } catch (error) {
      return REMOTE_CONFIG_DEFAULTS[key];
    }
  }

  public static async getBoolean(key: REMOTE_CONFIG_KEYS): Promise<boolean> {
    try {
      const { value } = await FirebaseRemoteConfig.getBoolean({
        key: key,
      });
      return value == null ? REMOTE_CONFIG_DEFAULTS[key] : value;
    } catch (error) {
      return REMOTE_CONFIG_DEFAULTS[key];
    }
  }
}

export enum REMOTE_CONFIG_KEYS {
  CAN_HOT_UPDATE = 'can_hot_update',
  BUNDLE_ZIP_URLS = 'bundle_zip_urls',
  LIDO_BUNDLE_ZIP_URLS = 'lido_bundle_zip_urls',
  CAN_SHOW_AVATAR = 'can_show_avatar',
  CAN_UPDATED_AVATAR_SUGGESTION_URL = 'can_updated_avatar_suggestion_url',
  // TERMS_AND_CONDITIONS_URL = "termsAndConditionsUrl",
}

export const REMOTE_CONFIG_DEFAULTS: { [key: string]: any } = {
  [REMOTE_CONFIG_KEYS.CAN_HOT_UPDATE]: false,
  [REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS]: getBundleZipUrlsForEnv(),
  [REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS]: getLidoBundleZipUrlsForEnv(),
  // [REMOTE_CONFIG_KEYS.TERMS_AND_CONDITIONS_URL]: [
  //   "https://www.chimple.org/privacy-policy"
  // ],
};
