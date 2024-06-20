import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";
import { ServiceAuth } from "./ServiceAuth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
import { ConfirmationResult } from "@firebase/auth";
import { Database } from "../database";
import { TableTypes } from "../../common/constants";

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;

  private constructor() {}
  loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

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
}
