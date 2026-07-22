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

import { SupabaseAuthEmailAuth } from './SupabaseAuth.emailAuth';
export class SupabaseAuthSessionRefresh extends SupabaseAuthEmailAuth {
  static [key: string]: any;
  [key: string]: any;
  protected async performRefreshSession(): Promise<void> {
    if (!navigator.onLine) {
      logAuthDebug('Skipping session refresh while device is offline.', {
        source: 'SupabaseAuth.doRefreshSession',
        reason: 'offline',
      });
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      try {
        const currentSession = await this._auth?.getSession();
        if (currentSession?.data?.session?.refresh_token) {
          Util.addRefreshTokenToStore(
            currentSession.data.session.refresh_token,
          );
          return;
        }
        if (currentSession?.error) {
          logger.error(
            'Unable to resolve web Supabase session:',
            currentSession.error,
          );
        }

        const stored = Util.getRefreshTokenFromStore();
        if (!stored?.token) return;

        const refreshToken = String(stored.token).replace(/"/g, '');
        const response = await this._auth?.refreshSession({
          refresh_token: refreshToken,
        });
        if (response?.error) {
          throw new Error(
            'Web session refresh failed: ' + response.error.message,
          );
        }
        if (response?.data?.session) {
          const { access_token, refresh_token } = response.data.session;
          await this._auth?.setSession({ access_token, refresh_token });
          Util.addRefreshTokenToStore(refresh_token);
        }
      } catch (error) {
        if (this.isInvalidRefreshTokenError(error)) {
          store.dispatch(setRefreshToken(null));
          logAuthDebug(
            'Cleared stale web refresh token after refresh failure.',
            {
              source: 'SupabaseAuth.doRefreshSession',
              reason: 'web_invalid_refresh_token',
            },
          );
          return;
        }
        logger.error('Unexpected error while resolving web session:', error);
      }
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
      const currentSession = await this._auth?.getSession();
      if (currentSession?.data?.session?.access_token) {
        logAuthDebug(
          'Ignoring refresh failure because an active session is available.',
          {
            source: 'SupabaseAuth.doRefreshSession',
            reason: 'refresh_failed_but_active_session_exists',
          },
        );
        return;
      }
      if (this.isInvalidRefreshTokenError(error)) {
        store.dispatch(setRefreshToken(null));
        logAuthDebug('Cleared stale refresh token after refresh failure.', {
          source: 'SupabaseAuth.doRefreshSession',
          reason: 'invalid_refresh_token',
        });
        return;
      }
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

  protected async resolveSessionWithRetryDeduped(): Promise<
    | {
        data: { session: AuthSession | null };
        error: unknown;
      }
    | undefined
  > {
    if (this._sessionResolvePromise) {
      return await this._sessionResolvePromise;
    }
    this._sessionResolvePromise = this.resolveSessionWithRetry();
    try {
      return await this._sessionResolvePromise;
    } finally {
      this._sessionResolvePromise = null;
    }
  }

  protected async resolveSessionWithRetry(
    attempts = 4,
    delayMs = 350,
  ): Promise<
    | {
        data: { session: AuthSession | null };
        error: unknown;
      }
    | undefined
  > {
    let authData:
      | {
          data: { session: AuthSession | null };
          error: unknown;
        }
      | undefined;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      authData = await this._auth?.getSession();
      if (authData?.data?.session?.user?.id) {
        return authData;
      }
      if (attempt < attempts) {
        // Native resume can report INITIAL_SESSION/SIGNED_IN a moment after
        // the first getSession() call, so wait briefly before deciding logout.
        logAuthDebug('Waiting for session to become available after resume.', {
          source: 'SupabaseAuth.resolveSessionWithRetry',
          reason: 'session_not_ready_retrying',
          attempt,
          attempts,
        });
        await this.sleep(delayMs);
      }
    }
    return authData;
  }

  protected isRecoverableDependencyError(error: unknown): boolean {
    return isRecoverableStorageError(error);
  }

  set currentUser(user: TableTypes<'user'>) {
    this._currentUser = user;
  }

  async isUserLoggedIn(): Promise<boolean> {
    if (this._currentUser) return true;
    if (this._emailPasswordLoginInProgress) {
      return true;
    }
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

  protected sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  protected beginEmailPasswordLogin(): void {
    this._emailPasswordLoginInProgress = true;
  }

  protected endEmailPasswordLogin(): void {
    this._emailPasswordLoginInProgress = false;
  }

  protected isInvalidRefreshTokenError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
      error.message.includes('Invalid Refresh Token') ||
      error.message.includes('Refresh Token Not Found')
    );
  }

  protected isNetworkError(err: any): boolean {
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

  protected async rpcRetry<T>(
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
}
