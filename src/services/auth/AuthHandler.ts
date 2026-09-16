import { ServiceAuth } from './ServiceAuth';
import { TableTypes } from '../../common/constants';
import { Session, User, UserAttributes } from '@supabase/supabase-js';
import { logAuthDebug } from '../../utility/authDebug';
import { APIMode } from '../ServiceConfig';
import { FirebaseAuth } from './FirebaseAuth';
import { SupabaseAuth } from './SupabaseAuth';
import { OneRosterAuth } from './OneRosterAuth';

export class AuthHandler implements ServiceAuth {
  public static i: AuthHandler;

  private s: ServiceAuth;

  private constructor(service: ServiceAuth) {
    this.s = service;
  }
  refreshSession(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public static getInstance(service: ServiceAuth): AuthHandler {
    // Only create a new instance if the service has changed
    if (!AuthHandler.i || AuthHandler.i.s !== service) {
      AuthHandler.i = new AuthHandler(service);
    }
    return AuthHandler.i;
  }

  async googleSign(tcAgreedVersion?: number): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    return await this.s.googleSign(tcAgreedVersion);
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
    tcAgreedVersion?: number,
  ): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    return await this.s.loginWithEmailAndPassword(
      email,
      password,
      tcAgreedVersion,
    );
  }

  public async proceedWithVerificationCode(
    verificationId: string,
    verificationCode: string,
    tcAgreedVersion?: number,
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
      tcAgreedVersion,
    );
  }
  async logOut(): Promise<void> {
    logAuthDebug('AuthHandler forwarding logout request to provider.', {
      source: 'AuthHandler.logOut',
      reason: 'logout_requested',
    });
    return await this.s.logOut();
  }

  async doRefreshSession(): Promise<void> {
    return await this.s.doRefreshSession();
  }
  public async signInWithEmail(
    email: string,
    password: string,
    tcAgreedVersion?: number,
  ): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    return await this.s.signInWithEmail(email, password, tcAgreedVersion);
  }
  public async sendResetPasswordEmail(email: string): Promise<boolean> {
    return await this.s.sendResetPasswordEmail(email);
  }
  public async updateUser(attributes: UserAttributes): Promise<boolean> {
    return await this.s.updateUser(attributes);
  }

  public switchMode(newMode: APIMode) {
    console.debug(
      `[AuthHandler] switchMode called. Switching to ${APIMode[newMode]}`,
    );
    switch (newMode) {
      case APIMode.FIREBASE:
        // this.s = FirebaseAuth.getInstance();
        break;
      case APIMode.ONEROSTER:
        this.s = OneRosterAuth.getInstance() as unknown as ServiceAuth;
        break;
      case APIMode.SUPABASE:
        this.s = SupabaseAuth.getInstance();
        break;
      default:
        // this.s = FirebaseAuth.getInstance();
        break;
    }
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
