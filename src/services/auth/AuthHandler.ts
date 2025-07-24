import { ServiceAuth } from "./ServiceAuth";
import { TableTypes } from "../../common/constants";
import { UserAttributes } from "@supabase/supabase-js";
import { CURRENT_USER } from "../../common/constants";
export class AuthHandler implements ServiceAuth {
  public static i: AuthHandler;
  private _currentUser?: TableTypes<"user">;

  private s: ServiceAuth;

  private constructor() {}

  public static getInstance(s: ServiceAuth): AuthHandler {
    if (!AuthHandler.i) {
      AuthHandler.i = new AuthHandler();
      AuthHandler.i.s = s;
      // hydrate cache from localStorage immediately
      const raw = localStorage.getItem(CURRENT_USER);
      if (raw) {
        try {
          AuthHandler.i._currentUser = JSON.parse(raw);
          // let delegate also know
          AuthHandler.i.s.currentUser = AuthHandler.i._currentUser!;
        } catch {
          /* ignore malformed */
        }
      }
     }
    return AuthHandler.i;
  }

  async googleSign(): Promise<boolean> {
    return await this.s.googleSign();
  }

  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    // return await this.s.getCurrentUser();
    // 1) in‑memory cache
    if (this._currentUser) return this._currentUser;
    // 2) delegate (might rehydrate)
    const d = await this.s.getCurrentUser();
    if (d) {
      this._currentUser = d;
      localStorage.setItem(CURRENT_USER, JSON.stringify(d));
      return d;
    }
    // 3) localStorage fallback
    const raw = localStorage.getItem(CURRENT_USER);
    if (!raw) return undefined;
    try {
      const u = JSON.parse(raw);
      this._currentUser = u;
      this.s.currentUser = u;
      return u;
    } catch {
      return undefined;
    }
  }

  public set currentUser(user: TableTypes<"user">) {
    this.s.currentUser = user;
    this._currentUser = user;
    localStorage.setItem(CURRENT_USER, JSON.stringify(user));
  }

  /** helper to clear both cache & storage */
  private clearUser() {
    this._currentUser = undefined;
    localStorage.removeItem(CURRENT_USER);
  }

  async isUserLoggedIn(): Promise<boolean> {
    // return await this.s.isUserLoggedIn();
    // if we already have a cache or localStorage entry, we're in
    if (this._currentUser) return true;
    if (localStorage.getItem(CURRENT_USER)) return true;
    // else delegate
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
    // return await this.s.logOut();
    await this.s.logOut();
    // wipe our cache
    this.clearUser();
  }

  async doRefreshSession(): Promise<void> {
    await this.s.doRefreshSession();
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
}
