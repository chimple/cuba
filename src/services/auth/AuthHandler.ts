import { ServiceAuth } from './ServiceAuth';
import { TableTypes } from '../../common/constants';
import { Session, User, UserAttributes } from '@supabase/supabase-js';

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

  async googleSign(): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    return await this.s.googleSign();
  }

  async getCurrentUser(): Promise<TableTypes<'user'> | undefined> {
    return await this.s.getCurrentUser();
  }

  public set currentUser(user: TableTypes<'user'>) {
    this.s.currentUser = user;
  }

  async isUserLoggedIn(): Promise<boolean> {
    return await this.s.isUserLoggedIn();
  }

  public async phoneNumberSignIn(
    phoneNumber: string,
    recaptchaVerifier: object,
  ): Promise<any> {
    return await this.s.phoneNumberSignIn(phoneNumber, recaptchaVerifier);
  }
  public async generateOtp(
    phoneNumber: string,
    appName: string,
  ): Promise<{ success: boolean; error?: any }> {
    return await this.s.generateOtp(phoneNumber, appName);
  }
  public async resendOtpMsg91(
    phoneNumber: string,
  ): Promise<boolean | undefined> {
    return await this.s.resendOtpMsg91(phoneNumber);
  }

  public async loginWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    return await this.s.loginWithEmailAndPassword(email, password);
  }

  public async proceedWithVerificationCode(
    verificationId: string,
    verificationCode: string,
  ): Promise<
    | {
        user: User | null;
        isUserExist: boolean;
        isSpl: boolean;
        userData?: TableTypes<'user'> | null;
      }
    | undefined
  > {
    return await this.s.proceedWithVerificationCode(
      verificationId,
      verificationCode,
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
    password: string,
  ): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'>;
  }> {
    return await this.s.signInWithEmail(email, password);
  }
  public async sendResetPasswordEmail(email: string): Promise<boolean> {
    return await this.s.sendResetPasswordEmail(email);
  }
  public async updateUser(attributes: UserAttributes): Promise<boolean> {
    return await this.s.updateUser(attributes);
  }
  public async getUser(): Promise<{ data: { user: User | null }; error: any }> {
    return await this.s.getUser();
  }
  public async getSession(): Promise<{
    data: { session: Session | null };
    error: any;
  }> {
    return this.s.getSession();
  }
}
