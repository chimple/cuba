import { OneRosterUser, ServiceAuth } from "./ServiceAuth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
import { CURRENT_USER, LANGUAGE, TableTypes } from "../../common/constants";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Util } from "../../utility/util";
import i18n from "../../i18n";
export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;
  private _currentUser: TableTypes<"user"> | undefined;

  private static NativeSSOPlugin = registerPlugin("NativeSSOPlugin");

  private constructor() { }
  loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async loginWithRespect(): Promise<OneRosterUser | boolean | undefined> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await (
          OneRosterAuth.NativeSSOPlugin as any
        ).requestLogin();
        if (!result) {
          return false;
        }
        const urlObj = new URL(result.url);
        const params = new URLSearchParams(urlObj.search);
        const json = {} as OneRosterUser;

        params.forEach((value, key) => {
          try {
            // Attempt to parse JSON values if applicable
            json[key] = JSON.parse(value);
          } catch {
            json[key] = value;
          }
        });

        // this._currentUser = json;
        return json;
      } else {
        const mockWebResult = {
          respectLaunchVersion: 1.1,
          auth: ["OAuth2", "SSO"],
          given_name: "John Doe",
          locale: "en-US",
          http_proxy: "http://proxy.example.com",
          endpoint_lti_ags: "https://lti.example.com/ags",
          endpoint: "https://api.example.com",
          actor: {
            name: ["John Doe"],
            mbox: ["mailto:johndoe@example.com"],
          },
          registration: "reg-12345",
          activity_id: "activity-67890",
        };

        // this._currentUser = mockWebResult;
        return mockWebResult;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async logOut(): Promise<void> {
    localStorage.removeItem(CURRENT_USER)
    this._currentUser = undefined;
  }

  async isUserLoggedIn(): Promise<boolean> {
    console.log(
      "OneRosterAuth ~ isUserLoggedIn ~ this._currentUser",
      this._currentUser
    );
    if (this._currentUser) return true;
    const isUser = localStorage.getItem(CURRENT_USER);
    return !!isUser;
  }

  public static getInstance(): OneRosterAuth {
    if (!OneRosterAuth.i) {
      OneRosterAuth.i = new OneRosterAuth();
    }
    return OneRosterAuth.i;
  }

  public set currentUser(user: TableTypes<"user">) {
    this._currentUser = user
  }

  googleSign(): Promise<any> {
    throw new Error("Method not implemented.");
  }

  phoneNumberSignIn(phoneNumber: any, recaptchaVerifier: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  generateOtp(
    phoneNumber: string,
    appName: string
  ): Promise<boolean | undefined> {
    throw new Error("Method not implemented.");
  }
  resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    throw new Error("Method not implemented.");
  }
  proceedWithVerificationCode(
    verificationId: any,
    verificationCode: any
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    throw new Error("Method not implemented.");
  }

  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    const isUser = localStorage.getItem(CURRENT_USER);
    const {
      actor = { mbox: ["mailto:johndoe@example.com"] },
      registration = "reg-12345",
      given_name = "John",
    } = isUser ? JSON.parse(isUser) : {};
    let appLang = localStorage.getItem(LANGUAGE) ?? 'en'
    await i18n.changeLanguage(appLang);
    console.log("let appLang = ", LANGUAGE, appLang);

    const user: TableTypes<"user"> = {
      age: null,
      avatar: "Aligator",
      created_at: "null",
      curriculum_id: "7d560737-746a-4931-a49f-02de1ca526bd",
      email: actor.mbox[0],
      fcm_token: null,
      gender: "male",
      grade_id: "c802dce7-0840-4baf-b374-ef6cb4272a76",
      id: registration,
      image: null,
      is_deleted: null,
      is_tc_accepted: true,
      language_id: appLang,
      music_off: (Util.getCurrentMusic() === 0),
      name: given_name,
      phone: null,
      sfx_off: (Util.getCurrentSound() === 0),
      student_id: registration,
      updated_at: null,
    };
    return Promise.resolve(user);
  }

  refreshSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
