import { SupabaseApi } from '../api/SupabaseApi';
import { ServiceAuth } from './ServiceAuth';
import { Database } from '../database';
import {
  REFRESH_TABLES_ON_LOGIN,
  BASE_NAME,
  PAGES,
  TABLES,
  TableTypes,
} from '../../common/constants';
import {
  SupabaseClient,
  UserAttributes,
  Session,
  AuthSession,
  User,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { APIMode, ServiceConfig } from '../ServiceConfig';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { ensureSocialLoginInitialized } from './SocialLoginInit';
import { Util } from '../../utility/util';
import { schoolUtil } from '../../utility/schoolUtil';
import { Capacitor } from '@capacitor/core';
import { store } from '../../redux/store';
import {
  logout,
  setRefreshToken,
  setIsOpsUser,
  setRoles,
} from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';
import { isRecoverableStorageError } from '../../utility/recoverableStorageError';
import { logAuthDebug } from '../../utility/authDebug';
import { normalizeTcVersion } from '../../utility/termsAndConditions';
import {
  clearWebGoogleLoginPending,
  markWebGoogleLoginPending,
} from './webGoogleLoginLoading';

export class SupabaseAuthEmailAuth {
  static [key: string]: any;
  [key: string]: any;
  public static i: any;

  protected _currentUser: TableTypes<'user'> | undefined;

  protected _refreshPromise: Promise<void> | null = null;

  protected _sessionResolvePromise: Promise<
    | {
        data: { session: AuthSession | null };
        error: unknown;
      }
    | undefined
  > | null = null;

  protected _emailPasswordLoginInProgress = false;

  protected _auth: SupabaseClient<Database>['auth'] | undefined;

  protected _supabaseDb: SupabaseClient<Database> | undefined;

  protected static readonly PASSWORD_LOGIN_SESSION_MISSING_ERROR =
    'Password login completed without a Supabase session.';
  // protected _auth = getAuth();

  protected constructor() {}

  public static getInstance(): any {
    if (!this.i) {
      this.i = new this();
      this.i._supabaseDb = SupabaseApi.getInstance().supabase;
      this.i._auth = this.i._supabaseDb?.auth;
      this.i?._auth?.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          logAuthDebug('Supabase auth state changed.', {
            source: 'SupabaseAuth.onAuthStateChange',
            event,
            has_session: !!session,
            has_refresh_token: !!session?.refresh_token,
          });
          if (session?.refresh_token) {
            Util.addRefreshTokenToStore(session.refresh_token);
          }
        },
      );
    }

    return this.i;
  }

  async loginWithEmailAndPassword(
    email: string,
    password: string,
    _tcAgreedVersion?: number,
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
      this.beginEmailPasswordLogin();
      let api = ServiceConfig.getI().apiHandler;
      store.dispatch(setRefreshToken(null));
      const { data, error } = await this._auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message || 'Authentication failed.');
      }
      if (!data.session) {
        throw new Error(this.PASSWORD_LOGIN_SESSION_MISSING_ERROR);
      }
      Util.addRefreshTokenToStore(data.session.refresh_token);
      const { user } = data.session;
      this._currentUser = { id: user.id } as TableTypes<'user'>;
      if (this._supabaseDb) {
        try {
          isSpl = await this.rpcRetry(async () => {
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
        api = ServiceConfig.getInstance(APIMode.SUPABASE).apiHandler;
      }
      await api.updateFcmToken(user.id);
      Util.storeLoginDetails(email, password);
      await api.subscribeToClassTopic();
      const userData = await api.getUserByDocId(user.id);
      if (userData?.id) {
        this._currentUser = userData;
      }
      return { user, success: true, isSpl, userData };
    } catch (error) {
      logger.error(
        '🚀 ~ file: SupabaseAuth.ts:143 ~ SupabaseAuth ~ Emailsignin ~ error:',
        error,
      );
      return { success: false, isSpl, userData: null };
    } finally {
      this.endEmailPasswordLogin();
    }
  }

  async signInWithEmail(
    email: string,
    password: string,
    _tcAgreedVersion?: number,
  ): Promise<{
    user?: User;
    success: boolean;
    isSpl: boolean;
    userData?: TableTypes<'user'> | null;
  }> {
    let isSplValue = false;
    try {
      if (!this._auth) return { success: false, isSpl: isSplValue };
      this.beginEmailPasswordLogin();
      store.dispatch(setRefreshToken(null));
      const { data, error } = await this._auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message || 'Authentication failed.');
      }
      if (!data.session) {
        throw new Error(this.PASSWORD_LOGIN_SESSION_MISSING_ERROR);
      }
      Util.addRefreshTokenToStore(data.session.refresh_token);
      const { user } = data.session;
      this._currentUser = { id: user.id } as TableTypes<'user'>;
      let api = ServiceConfig.getI().apiHandler;
      const isSpl = await this._supabaseDb?.rpc('is_special_or_program_user');
      isSplValue = isSpl?.data === true;
      if (isSplValue) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
        api = ServiceConfig.getInstance(APIMode.SUPABASE).apiHandler;
      } else {
        await api.syncDB(Object.values(TABLES), REFRESH_TABLES_ON_LOGIN);
      }
      await api.updateFcmToken(user.id);
      Util.storeLoginDetails(email, password);
      const userData = await api.getUserByDocId(user.id);
      if (userData?.id) {
        this._currentUser = userData;
      }
      return {
        user,
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
    } finally {
      this.endEmailPasswordLogin();
    }
  }

  async sendResetPasswordEmail(email: string): Promise<boolean> {
    try {
      if (!this._auth) return false;
      const { error } = await this._auth.resetPasswordForEmail(email);

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

    const { error } = await this._auth.updateUser(attributes);

    if (error) {
      logger.error('Error updating user:', error.message);
      return false;
    }
    return true;
  }

  async googleSign(tcAgreedVersion?: number): Promise<{
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
        await ensureSocialLoginInitialized();
        response = await SocialLogin.login({
          provider: 'google',
          options: {
            scopes: ['profile', 'email'],
            forceRefreshToken: true,
          },
        });
      } else {
        const redirectTo = `${window.location.origin}${BASE_NAME}`;
        markWebGoogleLoginPending();
        const { error } = await this._auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });

        if (error) {
          clearWebGoogleLoginPending();
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
      const { data, error: signInError } = await this._auth.signInWithIdToken({
        provider: 'google',
        token: authentication.idToken,
        access_token: authentication.accessToken?.token,
      });

      if (signInError) {
        logger.error('Google sign in failed:', signInError);
        return { success: false, isSpl: false, userData: null };
      }

      if (data.session?.refresh_token) {
        Util.addRefreshTokenToStore(data.session?.refresh_token);
      }

      if (!data.session)
        return { success: false, isSpl: false, userData: null };

      const initResult = await this.initializeUserRecord(
        data.session,
        tcAgreedVersion,
      );
      const userData = await api.getUserByDocId(data.user?.id ?? '');
      return {
        user: data.user,
        success: !!initResult,
        isSpl: initResult?.isSpl ?? false,
        userData,
      };
    } catch (error: any) {
      if (!Capacitor.isNativePlatform()) clearWebGoogleLoginPending();
      logger.error(
        '🚀 ~ SupabaseAuth ~ googleSign ~ error:',
        error?.stack || error,
      );
      return { success: false, isSpl: false, userData: null };
    }
  }

  async getCurrentUser(): Promise<TableTypes<'user'> | undefined> {
    if (this._currentUser) return this._currentUser;
    if (this._emailPasswordLoginInProgress) {
      return store.getState()?.auth?.user as TableTypes<'user'> | undefined;
    }
    if (!navigator.onLine) {
      const user = store.getState()?.auth?.user as TableTypes<'user'>;
      if (user) this._currentUser = user;
      return this._currentUser;
    } else {
      logger.info('Refreshing session');
      // Recover session on cold app reopen before deciding user is logged out.
      await this.doRefreshSession();
      const authData = await this.resolveSessionWithRetryDeduped();
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
      let user: TableTypes<'user'> | undefined;
      try {
        const roles = store.getState()?.auth?.roles;
        if (!roles || roles.length === 0) {
          const userRole = await api.getUserSpecialRoles(
            authData.data.session?.user.id,
          );
          if (userRole.length > 0) {
            store.dispatch(setRoles(userRole));
          }
        }
        user = await api.getUserByDocId(authData.data.session?.user.id);
      } catch (error) {
        if (this.isRecoverableDependencyError(error)) {
          const persistedUser = store.getState()?.auth?.user as
            | TableTypes<'user'>
            | undefined;
          if (persistedUser?.id) {
            // A temporary SQLite lock during resume should not look like a
            // real logout while the last known app user is still available.
            this._currentUser = persistedUser;
            logAuthDebug(
              'Using persisted app user because local data store is temporarily unavailable during resume.',
              {
                source: 'SupabaseAuth.getCurrentUser',
                reason: 'recoverable_storage_failure_using_persisted_user',
                user_id: persistedUser.id,
              },
            );
            return this._currentUser;
          }
        }
        throw error;
      }
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
        const persistedUser = store.getState()?.auth?.user as
          | TableTypes<'user'>
          | undefined;
        if (persistedUser?.id) {
          this._currentUser = persistedUser;
          logAuthDebug(
            'User record lookup failed after resume; keeping persisted app user to avoid false logout.',
            {
              source: 'SupabaseAuth.getCurrentUser',
              reason:
                'user_record_missing_after_initialize_using_persisted_user',
              user_id: persistedUser.id,
            },
          );
          return this._currentUser;
        }
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
    if (this._emailPasswordLoginInProgress) {
      logAuthDebug('Skipping session refresh during password login.', {
        source: 'SupabaseAuth.doRefreshSession',
        reason: 'email_password_login_in_progress',
      });
      return;
    }
    if (this._refreshPromise) {
      await this._refreshPromise;
      return;
    }
    this._refreshPromise = this.performRefreshSession();
    try {
      await this._refreshPromise;
    } finally {
      this._refreshPromise = null;
    }
  }
}
