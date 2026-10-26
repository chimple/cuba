import { ServiceAuth } from './ServiceAuth';
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
import { Session, User, UserAttributes } from '@supabase/supabase-js';
import {
  CURRENT_STUDENT,
  LANGUAGE,
  LATEST_STARS,
  STUDENT_LESSON_SCORES,
  TableTypes,
  isRespectMode,
} from '../../common/constants';
import i18n from '../../i18n';
import { Util } from '../../utility/util';
import { SqliteApi } from '../api/SqliteApi';
import { APIMode, ServiceConfig } from '../ServiceConfig';
import { AuthHandler } from './AuthHandler';
import { SupabaseAuth } from './SupabaseAuth';

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;
  private _currentUser: TableTypes<'user'> | undefined;

  private constructor() {}
  refreshSession(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  loginWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<{ success: boolean; isSpl: boolean }> {
    throw new Error('Method not implemented.');
  }
  async logOut(): Promise<void> {
    localStorage.removeItem(isRespectMode);
    if (this._currentUser?.id) {
      localStorage.removeItem(LATEST_STARS(this._currentUser.id));
    }
    localStorage.removeItem(STUDENT_LESSON_SCORES);
    ServiceConfig.getI().switchMode(APIMode.SQLITE);
    this._currentUser = undefined;
    localStorage.removeItem(CURRENT_STUDENT);
  }

  async isUserLoggedIn(): Promise<boolean> {
    if (this._currentUser) return true;
    const isUser = localStorage.getItem(CURRENT_STUDENT);
    return !!isUser;
  }

  public static getInstance(): OneRosterAuth {
    if (!OneRosterAuth.i) {
      OneRosterAuth.i = new OneRosterAuth();
    }
    return OneRosterAuth.i;
  }

  public set currentUser(user: TableTypes<'user'>) {
    this._currentUser = user;
  }

  async googleSign(): Promise<any> {
    localStorage.setItem(isRespectMode, 'false');
    AuthHandler.i.switchMode(APIMode.SUPABASE);
    await SqliteApi.getInstance();
    const serviceInstance = ServiceConfig.getInstance(APIMode.SQLITE);
    serviceInstance.switchMode(APIMode.SQLITE);
    // root.render(
    //   <BrowserRouter>
    //     <App />
    //   </BrowserRouter>
    // );
    return await SupabaseAuth.i.googleSign();
  }

  phoneNumberSignIn(phoneNumber: any, recaptchaVerifier: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  generateOtp(
    phoneNumber: string,
    appName: string,
  ): Promise<{ success: boolean; error?: any }> {
    throw new Error('Method not implemented.');
  }
  resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    throw new Error('Method not implemented.');
  }
  proceedWithVerificationCode(
    verificationId: any,
    verificationCode: any,
  ): Promise<{ user: any; isUserExist: boolean; isSpl: boolean } | undefined> {
    throw new Error('Method not implemented.');
  }

  async getCurrentUser(): Promise<TableTypes<'user'> | undefined> {
    const isUser = localStorage.getItem(CURRENT_STUDENT);
    const {
      actor = { mbox: ['mailto:johndoe@example.com'] },
      registration = 'reg-12345',
      given_name = 'John',
    } = isUser ? JSON.parse(isUser) : {};
    let appLang = localStorage.getItem(LANGUAGE) ?? 'en';
    await i18n.changeLanguage(appLang);

    const user: TableTypes<'user'> = {
      age: null,
      avatar: 'Aligator',
      created_at: 'null',
      curriculum_id: '7d560737-746a-4931-a49f-02de1ca526bd',
      email: actor.mbox[0],
      fcm_token: null,
      gender: 'male',
      grade_id: 'c802dce7-0840-4baf-b374-ef6cb4272a76',
      id: registration,
      image: null,
      is_deleted: null,
      is_tc_accepted: true,
      language_id: appLang,
      music_off: Util.getCurrentMusic() === 0,
      name: given_name,
      phone: null,
      sfx_off: Util.getCurrentSound() === 0,
      student_id: registration,
      updated_at: null,
      learning_path: Util.getCurrentStudent()?.learning_path || null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
      stars: null,
      reward: null,
      is_wa_contact: null,
      locale_id: null,
      tc_agreed_version: 0,
    };
    return Promise.resolve(user);
  }

  doRefreshSession(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  signInWithEmail(
    email: string,
    password: string,
  ): Promise<{ success: boolean; isSpl: boolean }> {
    throw new Error('Method not implemented.');
  }
  sendResetPasswordEmail(email: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  updateUser(attributes: UserAttributes): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async getUser(): Promise<{ data: { user: User | null }; error: unknown }> {
    return { data: { user: null }, error: null };
  }

  async getSession(): Promise<{
    data: { session: Session | null };
    error: unknown;
  }> {
    return { data: { session: null }, error: null };
  }
}
