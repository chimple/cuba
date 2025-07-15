import { ServiceAuth, OneRosterUser } from "./ServiceAuth";
import { TableTypes } from "../../common/constants";
import { UserAttributes } from "@supabase/supabase-js";

export class AuthHandler implements ServiceAuth {
  public static i: AuthHandler;

  private s: ServiceAuth;

  private constructor(service: ServiceAuth) {
    this.s = service;
  }
  refreshSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public static getInstance(service: ServiceAuth): AuthHandler {
    // Only create a new instance if the service has changed
    if (!AuthHandler.i || AuthHandler.i.s !== service) {
      AuthHandler.i = new AuthHandler(service);
    }
    return AuthHandler.i;
  }

  async googleSign(): Promise<boolean> {
    return await this.s.googleSign();
  }

  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    return await this.s.getCurrentUser();
  }

  public set currentUser(user: TableTypes<"user">) {
    this.s.currentUser = user;
  }

  async isUserLoggedIn(): Promise<boolean> {
    return await this.s.isUserLoggedIn();
  }

  public async phoneNumberSignIn(phoneNumber, recaptchaVerifier): Promise<any> {
    return await this.s.phoneNumberSignIn(phoneNumber, recaptchaVerifier);
  }
  public async generateOtp(
    phoneNumber: string,
    appName: string
  ): Promise<boolean | undefined> {
    return await this.s.generateOtp(phoneNumber, appName);
  }
  public async resendOtpMsg91(
    phoneNumber: string
  ): Promise<boolean | undefined> {
    return await this.s.resendOtpMsg91(phoneNumber);
  }

  public async loginWithEmailAndPassword(email: any, password: any) {
    return await this.s.loginWithEmailAndPassword(email, password);
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

  async doRefreshSession(): Promise<void> {
    return await this.s.doRefreshSession();
  }
  public async signInWithEmail(
    email: string,
    password: string
  ): Promise<boolean> {
    return await this.s.signInWithEmail(email, password);
  }
  public async sendResetPasswordEmail(email: string): Promise<boolean> {
    return await this.s.sendResetPasswordEmail(email);
  }
  public async updateUser(attributes: UserAttributes): Promise<boolean> {
    return await this.s.updateUser(attributes);
  }

  async loginWithRespect(): Promise<OneRosterUser | boolean | undefined> {
    return await this.s.loginWithRespect();
  }
}
