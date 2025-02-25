import { ServiceAuth } from "./ServiceAuth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
import { CURRENT_USER, TableTypes } from "../../common/constants";
import { registerPlugin } from "@capacitor/core";

interface User {
  respectLaunchVersion: number;
  auth: Array<string>;
  given_name: string;
  locale: string;
  http_proxy: string;
  endpoint_lti_ags: string;
  endpoint: string;
  actor: {
    name: Array<string>;
    mbox: Array<string>;
  };
  registration: string;
  activity_id: string;
}

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;
  private static _currentUser: User;

  private static NativeSSOPlugin = registerPlugin("NativeSSOPlugin");

  private constructor() {}
  loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public static loginWithRespect: any = async () => {
    try {
      const result = await (
        OneRosterAuth.NativeSSOPlugin as any
      ).requestLogin();
      if (!result) {
        return false;
      }
      const urlObj = new URL(result.url);
      const params = new URLSearchParams(urlObj.search);
      const json = {} as User;
      params.forEach((value, key) => {
        try {
          // Attempt to parse JSON values if applicable
          json[key] = JSON.parse(value);
        } catch {
          json[key] = value;
        }
      });

      this._currentUser = json;
      return json;
    } catch (error) {
      console.log(error);
    }
  };

  logOut(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async isUserLoggedIn(): Promise<boolean> {
    console.log(
      "OneRosterAuth ~ isUserLoggedIn ~ this._currentUser",
      OneRosterAuth._currentUser
    );
    if (OneRosterAuth._currentUser) return true;
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
    throw new Error("Method not implemented.");
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

  getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    const { actor, registration, given_name } = OneRosterAuth._currentUser;
    const user: TableTypes<"user"> = {
      age: null,
      avatar: "/assets/avatar/Aligator.png",
      created_at: "null",
      curriculum_id: null,
      email: actor.mbox[0],
      fcm_token: null,
      gender: "male",
      grade_id: null,
      id: registration,
      image: null,
      is_deleted: null,
      is_tc_accepted: true,
      language_id: "en",
      music_off: null,
      name: given_name,
      phone: null,
      sfx_off: null,
      student_id: registration,
      updated_at: null,
    };
    // throw new Error("Method not implemented.");
    return Promise.resolve(user);
  }

  refreshSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
