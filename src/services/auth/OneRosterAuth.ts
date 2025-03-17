import { ServiceAuth } from "./ServiceAuth";
import { CURRENT_USER } from "../../common/constants";
import { Capacitor, registerPlugin } from "@capacitor/core";
import ORUser from "../../models/OneRoster/ORUser";
import { RoleType } from "../../interface/modelInterfaces";
export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;
  private static _currentUser: ORUser;

  private static NativeSSOPlugin = registerPlugin("NativeSSOPlugin");

  private constructor() { }
  loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async loginWithRespect(): Promise<ORUser | boolean | undefined> {
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
        const json = {} as ORUser;

        params.forEach((value, key) => {
          try {
            // Attempt to parse JSON values if applicable
            json[key] = JSON.parse(value);
          } catch {
            json[key] = value;
          }
        });

        OneRosterAuth._currentUser = json;
        return json;
      } else {
        const mockWebResult: ORUser = new ORUser(
          1.1,
          ["OAuth2", "SSO"],
          "John Doe",
          "en-US",
          "http://proxy.example.com",
          "https://lti.example.com/ags",
          "https://api.example.com",
          "John Doe",
          "mailto:johndoe@example.com",
          "reg-12345",
          "",
          "OAuth2",
          [],
          RoleType.PARENT,
          "reg-12345",
          [],
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          0,
          0,
          false,
          {
            badges: [],
            bonus: [],
            sticker: [],
          },
        )

        OneRosterAuth._currentUser = mockWebResult;
        return mockWebResult;
      }
    } catch (error) {
      console.log(error);
    }
  }

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

  public set currentUser(user: ORUser) {
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

  getCurrentUser(): Promise<ORUser | undefined> {
    const isUser = localStorage.getItem(CURRENT_USER);
    const {
      actor = { mbox: ["mailto:johndoe@example.com"] },
      registration = "reg-12345",
      given_name = "John",
    } = isUser ? JSON.parse(isUser) : {};
    const user: ORUser = new ORUser(
      1.1,
      ["OAuth2", "SSO"],
      "John Doe",
      "en-US",
      "http://proxy.example.com",
      "https://lti.example.com/ags",
      "https://api.example.com",
      "John Doe",
      "mailto:johndoe@example.com",
      "reg-12345",
      "",
      "OAuth2",
      [],
      RoleType.PARENT,
      "reg-12345",
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      0,
      0,
      true,
      {
        badges: [],
        bonus: [],
        sticker: [],
      },
    )
    return Promise.resolve(user);
  }

  refreshSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
