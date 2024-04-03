import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";
import { ServiceAuth } from "./ServiceAuth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
import { ConfirmationResult } from "@firebase/auth";

export class AuthHandler implements ServiceAuth {
  public static i: AuthHandler;

  private s: ServiceAuth;

  private constructor() {}

  public static getInstance(s: ServiceAuth): AuthHandler {
    if (!AuthHandler.i) {
      AuthHandler.i = new AuthHandler();
      AuthHandler.i.s = s;
    }
    return AuthHandler.i;
  }

  async googleSign(): Promise<boolean> {
    return await this.s.googleSign();
  }

  async getCurrentUser(): Promise<User | undefined> {
    return await this.s.getCurrentUser();
  }

  public set currentUser(user: User) {
    this.s.currentUser = user;
  }

  async isUserLoggedIn(): Promise<boolean> {
    return await this.s.isUserLoggedIn();
  }

  public async phoneNumberSignIn(phoneNumber, recaptchaVerifier): Promise<any> {
    return await this.s.phoneNumberSignIn(phoneNumber, recaptchaVerifier);
  }

  public async loginWithStudentCredentials(email: any, password: any) {
    return await this.s.loginWithStudentCredentials(email, password);
  }

  public async proceedWithVerificationCode(
    verificationId,
    verificationCode
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    return await this.s.proceedWithVerificationCode(
      verificationId,
      verificationCode
    );
  }

  async logOut(): Promise<void> {
    return await this.s.logOut();
  }
}
