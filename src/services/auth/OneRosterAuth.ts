import { ServiceAuth } from "./ServiceAuth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
import { PortPlugin, TableTypes } from "../../common/constants";
import { registerPlugin } from "@capacitor/core";
import { Util } from "../../utility/util";

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;
  // private static NativeSSOPlugin: any = registerPlugin("NativeSSOPlugin");

  private constructor() { }
  loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public static loginWithRespect: any = async () => {
    try {
      if (!Util.port) {
        Util.port = registerPlugin<PortPlugin>("Port");
      }
      // const port = await Util.port.getMigrateUsers();
      const result: any = await Util.port.requestLogin();
      // const result = await (
      //   OneRosterAuth.NativeSSOPlugin as any
      // ).requestLogin();
      if (!result) {
        return false;
      }
      const urlParams = new URLSearchParams(JSON.stringify(result.url));
      const name = urlParams.get("given_name");

      localStorage.setItem("respectData", JSON.stringify(result.url));
      return name;
    } catch (error) {
      console.log(error);
    }
  };

  logOut(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  isUserLoggedIn(): Promise<boolean> {
    throw new Error("Method not implemented.");
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
    throw new Error("Method not implemented.");
  }

  refreshSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
