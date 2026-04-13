import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';
import { SupabaseApi } from '../api/SupabaseApi';
import { ServiceAuth } from './ServiceAuth';
import { Database } from '../database';
import {
  REFRESH_TABLES_ON_LOGIN,
  TABLES,
  TableTypes,
} from '../../common/constants';
import {
  SupabaseClient,
  UserAttributes,
  Session,
  AuthSession,
  User,
} from '@supabase/supabase-js';
import { APIMode, ServiceConfig } from '../ServiceConfig';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Util } from '../../utility/util';
import { schoolUtil } from '../../utility/schoolUtil';
import { Capacitor } from '@capacitor/core';
import { store } from '../../redux/store';
import {
  logout,
  setIsOpsUser,
  setRoles,
} from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';
import { logAuthDebug } from '../../utility/authDebug';

export class SupabaseAuth implements ServiceAuth {
  public static i: SupabaseAuth;
  private _currentUser: TableTypes<'user'> | undefined;

  private _auth: SupabaseAuthClient | undefined;
  private _supabaseDb: SupabaseClient<Database> | undefined;
  // private _auth = getAuth();

  private constructor() {}
  public static getInstance(): SupabaseAuth {
    if (!SupabaseAuth.i) {
      SupabaseAuth.i = new SupabaseAuth();
      SupabaseAuth.i._supabaseDb = SupabaseApi.getInstance().supabase;
      SupabaseAuth.i._auth = SupabaseAuth.i._supabaseDb?.auth;
      SupabaseAuth?.i?._auth?.onAuthStateChange((event, session) => {
        logAuthDebug('Supabase auth state changed.', {
          source: 'SupabaseAuth.onAuthStateChange',
          event,
          has_session: !!session,
          has_refresh_token: !!session?.refresh_token,
        });
        if (event === 'TOKEN_REFRESHED') {
          if (session?.refresh_token)
            Util.addRefreshTokenToStore(session?.refresh_token);
        }
      });
    }

    return SupabaseAuth.i;
  }
  async loginWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    let isSpl = false;
    try {
      if (!this._auth) return { success: false, isSpl };
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }
      const api = ServiceConfig.getI().apiHandler;
      const { data, error } = await this._auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        throw new Error(error.message || 'Authentication failed.');
      }
      if (data.session?.refresh_token) {
        Util.addRefreshTokenToStore(data.session?.refresh_token);
      }
      if (this._supabaseDb) {
        try {
          isSpl = await this.rpcRetry<boolean>(async () => {
            const { data, error } = await this._supabaseDb!.rpc(
              'is_special_or_program_user',
            ).maybeSingle();

            return { data: Boolean(data), error, userData: data } as {
              data: boolean;
              error: any;
              userData: any;
            };
          });
        } catch (err) {
          logger.error('Error checking special/program user:', err);
        }
        if (isSpl) {
          logger.info('User is a special or program user');
        } else {
          logger.info('User is NOT a special or program user');
        }
      } else {
        logger.error('Supabase DB client is not initialized.');
      }
      if (!isSpl) {
        let isFirstSync = true;
        await api.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN,
          isFirstSync,
        );
      } else {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      }
      await api.updateFcmToken(data?.user?.id ?? '');
      Util.storeLoginDetails(email, password);
      await api.subscribeToClassTopic();
      const userData = await api.getUserByDocId(data.user.id);
      return { user: data.user, success: true, isSpl, userData };
    } catch (error) {
      logger.error(
        '🚀 ~ file: SupabaseAuth.ts:143 ~ SupabaseAuth ~ Emailsignin ~ error:',
        error,
      );
      return { success: false, isSpl, userData: null };
    }
  }
  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    let isSplValue = false;
    try {
      if (!this._auth) return { success: false, isSpl: isSplValue };
      const { data, error } = await this._auth.signInWithPassword({
        email,
        password,
      });
      const api = ServiceConfig.getI().apiHandler;
      if (error) {
        throw new Error(error.message || 'Authentication failed.');
      }
      if (data.session?.refresh_token) {
        Util.addRefreshTokenToStore(data.session?.refresh_token);
      }
      const isSpl = await this._supabaseDb?.rpc('is_special_or_program_user');
      isSplValue = isSpl?.data === true;
      if (isSplValue) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        await ServiceConfig.getI().apiHandler.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN,
        );
      }
      await api.updateFcmToken(data?.user?.id ?? '');
      Util.storeLoginDetails(email, password);
      const userData = await api.getUserByDocId(data?.user?.id ?? '');
      return {
        user: data.user,
        success: true,
        isSpl: isSplValue,
        userData,
      };
    } catch (error) {
      logger.error(
        '🚀 ~ file: SupabaseAuth.ts:166 ~ SupabaseAuth ~ Emailsignin ~ error:',
        error,
      );
      return { success: false, isSpl: isSplValue, userData: undefined };
    }
  }
  async sendResetPasswordEmail(email: string): Promise<boolean> {
    try {
      if (!this._auth) return false;
      const { data, error } = await this._auth.resetPasswordForEmail(email);

      if (error) {
        logger.error('Reset password error:', error.message);
        return false;
      }

      return true;
    } catch (err: any) {
      logger.error('Unexpected error in resetPasswordForEmail:', err.message);
      return false;
    }
  }
  async updateUser(attributes: UserAttributes): Promise<boolean> {
    if (!this._auth) return false;

    const { data, error } = await this._auth.updateUser(attributes);

    if (error) {
      logger.error('Error updating user:', error.message);
      return false;
    }
    return true;
  }

  async googleSign(): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    try {
      if (!this._auth) return { success: false, isSpl: false };

      const api = ServiceConfig.getI().apiHandler;
      let response;
      if (Capacitor.isNativePlatform()) {
        response = await SocialLogin.login({
          provider: 'google',
          options: {
            scopes: ['profile', 'email'],
            forceRefreshToken: true,
          },
        });
      } else {
        const { data, error } = await this._auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });

        if (error) {
          logger.error('Web Google login failed:', error);
          return { success: false, isSpl: false, userData: null };
        }
        return { success: true, isSpl: false, userData: null };
      }
      if (response.result?.responseType !== 'online') {
        return { success: false, isSpl: false, userData: null };
      }
      const authentication = response.result;
      const authUser = authentication.profile;

      if (
        authentication.idToken === null ||
        authUser.email === null ||
        authUser.id === null
      ) {
        return { success: false, isSpl: false, userData: null };
      }
      const { data, error } = await this._auth.signInWithIdToken({
        provider: 'google',
        token: authentication.idToken,
        access_token: authentication.accessToken?.token,
      });

      if (data.session?.refresh_token) {
        Util.addRefreshTokenToStore(data.session?.refresh_token);
      }

      if (!data.session)
        return { success: false, isSpl: false, userData: null };

      const initResult = await this.initializeUserRecord(data.session);
      const userData = await api.getUserByDocId(data.user?.id ?? '');
      return {
        user: data.user,
        success: !!initResult,
        isSpl: initResult?.isSpl ?? false,
        userData,
      };
    } catch (error: any) {
      logger.error(
        '🚀 ~ SupabaseAuth ~ googleSign ~ error:',
        error?.stack || error,
      );
      return { success: false, isSpl: false, userData: null };
    }
  }

  async getCurrentUser(): Promise<TableTypes<'user'> | undefined> {
    if (this._currentUser) return this._currentUser;
    if (!navigator.onLine) {
      const api = ServiceConfig.getI().apiHandler;
      let user = store.getState()?.auth?.user as TableTypes<'user'>;
      if (user) this._currentUser = user;
      return this._currentUser;
    } else {
      logger.info('Refreshing session');
      // Recover session on cold app reopen before deciding user is logged out.
      await this.doRefreshSession();
      const authData = await this._auth?.getSession();
      if (!authData || !authData.data.session?.user?.id) {
        logAuthDebug('Unable to resolve current user from session.', {
          source: 'SupabaseAuth.getCurrentUser',
          reason: 'missing_session_or_user_id',
          has_auth_data: !!authData,
          has_session: !!authData?.data?.session,
        });
        return;
      }
      const session = authData.data.session;

      const api = ServiceConfig.getI().apiHandler;
      const roles = store.getState()?.auth?.roles;
      if (!roles || roles.length === 0) {
        const userRole = await api.getUserSpecialRoles(
          authData.data.session?.user.id,
        );
        if (userRole.length > 0) {
          store.dispatch(setRoles(userRole));
        }
      }
      let user = await api.getUserByDocId(authData.data.session?.user.id);
      if (user) {
        this._currentUser = user;
        return this._currentUser;
      } else {
        // If user is not found in DB but we have a session (e.g. fresh OAuth login), try to create/init them
        const initResult = await this.initializeUserRecord(session);
        if (initResult && initResult.user) {
          this._currentUser = initResult.user;
          return this._currentUser;
        }
        // If still fails, sign out
        logAuthDebug('Signing out because user record initialization failed.', {
          source: 'SupabaseAuth.getCurrentUser',
          reason: 'user_record_missing_after_initialize',
          user_id: session?.user?.id,
        });
        this._auth?.signOut();
        return;
      }
    }
  }
  async doRefreshSession(): Promise<void> {
    if (!navigator.onLine) {
      logAuthDebug('Skipping session refresh while device is offline.', {
        source: 'SupabaseAuth.doRefreshSession',
        reason: 'offline',
      });
      return;
    }
    // Read refresh token from Redux (preferred) with localStorage fallback
    const stored = Util.getRefreshTokenFromStore();
    if (!stored || !stored.token) return;

    try {
      const refreshToken = String(stored.token).replace(/"/g, '');
      const savedAt = new Date(
        stored.savedAt?.toString() ?? new Date().toISOString(),
      );
      const now = new Date();

      const daysDiff = Math.floor(
        (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const currentSession = await this._auth?.getSession();
      const hasActiveSession = !!currentSession?.data?.session?.access_token;
      if (daysDiff < 1 && hasActiveSession) {
        logAuthDebug('Skipping session refresh because token is still fresh.', {
          source: 'SupabaseAuth.doRefreshSession',
          reason: 'token_recent',
          token_age_days: daysDiff,
        });
        return;
      }

      const response = await this._auth?.refreshSession({
        refresh_token: refreshToken,
      });
      if (response) {
        const { error, data } = response;
        if (error) {
          throw new Error('Session refresh failed: ' + error.message);
        } else if (data?.session) {
          const { access_token, refresh_token } = data.session;
          this._auth?.setSession({ access_token, refresh_token });
          Util.addRefreshTokenToStore(refresh_token);
          logAuthDebug('Session refresh completed successfully.', {
            source: 'SupabaseAuth.doRefreshSession',
            reason: 'refresh_success',
          });
        }
      }
    } catch (error) {
      logger.error('Unexpected error while refreshing session:', error);
      logAuthDebug('Session refresh failed, attempting school relogin.', {
        source: 'SupabaseAuth.doRefreshSession',
        reason: 'refresh_failed_try_school_relogin',
      });

      try {
        await schoolUtil.trySchoolRelogin();
      } catch (retryError) {
        logger.error('trySchoolRelogin failed:', retryError);
      }
    }
  }

  set currentUser(user: TableTypes<'user'>) {
    this._currentUser = user;
  }

  async isUserLoggedIn(): Promise<boolean> {
    if (this._currentUser) return true;
    if (navigator.onLine) {
      await this.doRefreshSession();
      const user = await this.getCurrentUser();

      return !!user;
    } else {
      try {
        const state = store.getState();
        const reduxUser = state?.auth?.authUser;
        return !!reduxUser;
      } catch (e) {
        logger.error('Error accessing Redux store for auth state:', e);
        logAuthDebug('Logging out because auth state access failed offline.', {
          source: 'SupabaseAuth.isUserLoggedIn',
          reason: 'redux_auth_state_read_failed',
        });
        await this.logOut();
        return false;
      }
    }
  }

  phoneNumberSignIn(phoneNumber: any, recaptchaVerifier: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    try {
      const result = await this.generateOtp(phoneNumber, '');
      return result.success;
    } catch (error) {
      logger.error('Resend OTP failed: ', error);
      return false;
    }
  }
  async generateOtp(
    phoneNumber: string,
    appName: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this._auth)
        return { success: false, error: 'Auth service not initialized' };
      const { data, error } = await this._auth.signInWithOtp({
        phone: phoneNumber,
      });
      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to generate OTP',
        };
      }
      return { success: true };
    } catch (error: any) {
      logger.error('Failed with ', error);
      return {
        success: false,
        error:
          error.message ||
          String(error) ||
          'An unknown error occurred during OTP generation.',
      };
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
  private isNetworkError(err: any): boolean {
    const code = String(err?.code ?? '');
    const msg = String(err?.message ?? '');
    return (
      code === 'ERR_NETWORK_CHANGED' ||
      code === 'ERR_NETWORK' ||
      /ERR_NETWORK_CHANGED|ERR_NETWORK|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|Failed to fetch|networkerror|offline|dns|socket/i.test(
        msg,
      )
    );
  }
  // helper stays the same
  private async rpcRetry<T>(
    fn: () => Promise<{ data: T; error: any }>,
    max = 5,
  ): Promise<T> {
    let attempt = 1;
    for (;;) {
      try {
        const { data, error } = await fn();
        if (error) throw error;
        return data;
      } catch (err) {
        const burn = !this.isNetworkError(err);
        const nextAttempt = burn ? attempt + 1 : attempt;
        if (nextAttempt > max) throw err;
        const backoff = Math.min(2000 * (burn ? attempt : 1), 8000);
        logger.warn(
          `RPC attempt ${attempt}/${max} failed${
            burn ? '' : ' (not counting)'
          }; retrying in ${backoff}ms`,
          err,
        );
        await this.sleep(backoff);
        attempt = nextAttempt;
      }
    }
  }

  async proceedWithVerificationCode(
    phoneNumber: string,
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
    try {
      if (!this._auth) return;
      const api = ServiceConfig.getI().apiHandler;

      const { data: user, error } = await this._auth.verifyOtp({
        phone: phoneNumber,
        token: verificationCode,
        type: 'sms',
      });
      if (error) throw new Error('OTP verification failed');

      if (user.session?.refresh_token)
        Util.addRefreshTokenToStore(user.session.refresh_token);

      // ✅ RETRY: isUserExists
      const isUserExist = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc('isUserExists', {
          user_email: '',
          user_phone: user?.user?.phone ?? '',
        }).maybeSingle(); // returns { data: unknown | null, error }

        return { data: !!data, error } as { data: boolean; error: any };
      });

      if (!isUserExist) {
        const createdUser = await api.createUserDoc({
          age: null,
          avatar: null,
          created_at: new Date().toISOString(),
          curriculum_id: null,
          gender: null,
          grade_id: null,
          id: user.user?.id ?? '',
          image: null,
          is_deleted: false,
          is_tc_accepted: true,
          language_id: null,
          // locale_id: null,
          locale_id: null,
          name: null,
          updated_at: new Date().toISOString(),
          email: null,
          phone: user?.user?.phone ?? '',
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
          firebase_id: null,
          is_firebase: null,
          is_ops: null,
          learning_path: null,
          ops_created_by: null,
          reward: null,
          stars: null,
        });
        this._currentUser = createdUser;
      }

      // ✅ RETRY: is_special_or_program_user
      const isSpl = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc(
          'is_special_or_program_user',
        ).maybeSingle();

        return { data: !!data, error, userData: data } as {
          data: boolean;
          error: any;
          userData: any;
        };
      });

      if (isSpl) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        let isFirstSync = true;
        await api.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN,
          isFirstSync,
        );
      }
      try {
        await api.updateFcmToken(user.user?.id ?? '');
      } catch (err) {}
      if (isUserExist) await api.subscribeToClassTopic();

      const userData = await api.getUserByDocId(user.user?.id ?? '');
      // OTP verification is considered successful only when we can fully resolve
      // the app-level user record. Otherwise we treat it as a failure to avoid
      // partial auth/sync state leaking into the session.
      if (!userData || !userData.id) {
        throw new Error(
          'OTP verification flow failed to resolve app user data',
        );
      }
      return {
        user: user.user ?? null,
        isUserExist: !!isUserExist,
        isSpl,
        userData,
      };
    } catch (err) {
      logger.error(
        'OTP verification flow failed. Rolling back session to prevent partial login state.',
        err,
      );
      try {
        // Ensure any partially established auth/session state is fully cleared.
        await this.logOut();
      } catch (logoutErr) {
        logger.error(
          'Failed to rollback auth session after OTP failure',
          logoutErr,
        );
      }
      return { user: null, isUserExist: false, isSpl: false, userData: null };
    }
  }

  private async initializeUserRecord(
    session: Session,
  ): Promise<{ user: TableTypes<'user'>; isSpl: boolean } | null> {
    try {
      if (!this._supabaseDb || !session.user) return null;
      let api = ServiceConfig.getI().apiHandler;
      const user = session.user;
      const email = user.email;
      const id = user.id;
      // Map metadata. logic handles both Google and potentially other providers if standardized
      const meta = user.user_metadata || {};
      const name = meta.full_name || meta.name || meta.given_name || '';
      const avatarUrl = meta.avatar_url || meta.picture || null;

      const isUserExists = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc('isUserExists', {
          user_email: email || '',
          user_phone: '',
        }).maybeSingle();
        return { data: !!data, error };
      });

      let createdUser: TableTypes<'user'> | undefined;

      if (!isUserExists) {
        createdUser = await api.createUserDoc({
          age: null,
          avatar: null,
          created_at: new Date().toISOString(),
          curriculum_id: null,
          gender: null,
          grade_id: null,
          id: id,
          image: avatarUrl,
          is_deleted: false,
          is_tc_accepted: true,
          language_id: null,
          // locale_id: null,
          locale_id: null,
          name: name,
          updated_at: new Date().toISOString(),
          email: email || null,
          phone: user.phone || null,
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
          firebase_id: null,
          is_firebase: null,
          is_ops: null,
          learning_path: null,
          ops_created_by: null,
          reward: null,
          stars: null,
        });
      }

      const isSplQuery = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc(
          'is_special_or_program_user',
        ).maybeSingle();

        return { data: !!data, error } as { data: boolean; error: any };
      });

      store.dispatch(setIsOpsUser(isSplQuery));
      if (isSplQuery) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        let isFirstSync = true;
        await api.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN,
          isFirstSync,
        );
      }

      api = ServiceConfig.getI().apiHandler;
      if (isUserExists) {
        createdUser = await api.getUserByDocId(id);
      }
      if (!createdUser) {
        logger.error(
          'Failed to initialize user record: User could not be created or retrieved.',
        );
        return null;
      }
      this._currentUser = createdUser;

      await api.updateFcmToken(id);
      if (isUserExists) {
        await api.subscribeToClassTopic();
      }

      return { user: createdUser, isSpl: isSplQuery };
    } catch (error) {
      logger.error('initializeUserRecord failed:', error);
      return null;
    }
  }

  async getSession(): Promise<{
    data: { session: AuthSession | null };
    error: any;
  }> {
    if (!this._auth)
      return { data: { session: null }, error: 'Auth not initialized' };
    return await this._auth.getSession();
  }

  async getUser(): Promise<{ data: { user: User | null }; error: any }> {
    if (!this._auth)
      return { data: { user: null }, error: 'Auth not initialized' };
    return await this._auth.getUser();
  }

  async logOut(): Promise<void> {
    logAuthDebug('Executing auth logout.', {
      source: 'SupabaseAuth.logOut',
      reason: 'explicit_or_upstream_logout',
      has_current_user: !!this._currentUser,
    });
    await this._auth?.signOut();
    // Clear redux store items related to auth and user data
    store.dispatch(logout());
    this._currentUser = undefined;
  }
}
