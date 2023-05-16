import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";
import { ServiceAuth } from "./ServiceAuth";
import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
import { ConfirmationResult } from "@firebase/auth";

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;

  private constructor() {}

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

  public set currentUser(user: User) {
    throw new Error("Method not implemented.");
  }

  googleSign(): Promise<any> {
    throw new Error("Method not implemented.");
  }

  phoneNumberSignIn(
    phoneNumber: any,
    recaptchaVerifier: any
  ): Promise<ConfirmationResult | SignInWithPhoneNumberResult | undefined> {
    throw new Error("Method not implemented.");
  }
  proceedWithVerificationCode(
    verificationId: any,
    verificationCode: any
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getCurrentUser(): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }
}
