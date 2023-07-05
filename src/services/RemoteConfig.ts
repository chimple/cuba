import { FirebaseRemoteConfig } from "@capacitor-firebase/remote-config";

export class RemoteConfig {
  private constructor() {}
  public static async getString(key: REMOTE_CONFIG_KEYS): Promise<string> {
    try {
      const { value } = await FirebaseRemoteConfig.getString({
        key: key,
      });
      return value || REMOTE_CONFIG_DEFAULTS[key];
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
      return value || REMOTE_CONFIG_DEFAULTS[key];
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
      return value ?? REMOTE_CONFIG_DEFAULTS[key];
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
  TEST_NUM = "test_num",
}

export const REMOTE_CONFIG_DEFAULTS: { [key: string]: any } = {
  [REMOTE_CONFIG_KEYS.TEST_NUM]: 60,
};
