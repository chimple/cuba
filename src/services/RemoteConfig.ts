import { FirebaseRemoteConfig } from "@capacitor-firebase/remote-config";

export class RemoteConfig {
  private constructor() {}
  public static async getString(key: REMOTE_CONFIG_KEYS): Promise<string> {
    try {
      const { value } = await FirebaseRemoteConfig.getString({
        key: key,
      });
      return value == null ? REMOTE_CONFIG_DEFAULTS[key] : value;
    } catch (error) {
      console.log(
        "🚀 ~ file: RemoteConfig.ts:9 ~ RemoteConfig ~ getString ~ error:",
        JSON.stringify(error)
      );
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
      console.log(
        "🚀 ~ file: RemoteConfig.ts:27 ~ RemoteConfig ~ getNumber ~ error:",
        JSON.stringify(error)
      );
      return REMOTE_CONFIG_DEFAULTS[key];
    }
  }

  public static async getJSON(key: REMOTE_CONFIG_KEYS): Promise<any> {
    try {
      const { value } = await FirebaseRemoteConfig.getString({ key: key });
      return JSON.parse(value) || REMOTE_CONFIG_DEFAULTS[key];
    } catch (error) {
      console.log(
        "🚀 ~ file: RemoteConfig.ts:39 ~ RemoteConfig ~ getJSON ~ error:",
        error
      );
      return REMOTE_CONFIG_DEFAULTS[key];
    }
  }

  public static async getBoolean(key: REMOTE_CONFIG_KEYS): Promise<boolean> {
    try {
      const { value } = await FirebaseRemoteConfig.getBoolean({
        key: key,
      });
      console.log(
        "🚀 ~ file: RemoteConfig.ts:53 ~ RemoteConfig ~ getBoolean ~ value:",
        key,
        value,
        value || REMOTE_CONFIG_DEFAULTS[key]
      );
      return value == null ? REMOTE_CONFIG_DEFAULTS[key] : value;
    } catch (error) {
      console.log(
        "🚀 ~ file: RemoteConfig.ts:50 ~ RemoteConfig ~ getBoolean ~ error:",
        JSON.stringify(error)
      );
      return REMOTE_CONFIG_DEFAULTS[key];
    }
  }
}

export enum REMOTE_CONFIG_KEYS {
  CAN_HOT_UPDATE = "can_hot_update",
  BUNDLE_ZIP_URLS = "bundle_zip_urls",
  CAN_SHOW_AVATAR = "can_show_avatar",
  CAN_UPDATED_AVATAR_SUGGESTION_URL = "can_updated_avatar_suggestion_url",
  // TERMS_AND_CONDITIONS_URL = "termsAndConditionsUrl",
}

export const REMOTE_CONFIG_DEFAULTS: { [key: string]: any } = {
  [REMOTE_CONFIG_KEYS.CAN_HOT_UPDATE]: false,
  [REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS]: [
    "https://cdn.jsdelivr.net/gh/chimple/chimple-zips@main/",
    "https://cuba-stage-zip-bundle.web.app/",
    "https://raw.githubusercontent.com/chimple/chimple-zips/main/",
  ],
  [REMOTE_CONFIG_KEYS.CAN_SHOW_AVATAR]: false,
  // [REMOTE_CONFIG_KEYS.TERMS_AND_CONDITIONS_URL]: [
  //   "https://www.chimple.org/privacy-policy"
  // ],
};
