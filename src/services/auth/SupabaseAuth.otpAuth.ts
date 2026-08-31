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

import { SupabaseAuthSessionRefresh } from './SupabaseAuth.sessionRefresh';
export class SupabaseAuthOtpAuth extends SupabaseAuthSessionRefresh {
  static [key: string]: any;
  [key: string]: any;
  async proceedWithVerificationCode(
    phoneNumber: string,
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
    try {
      if (!this._auth) return;
      const api = ServiceConfig.getI().apiHandler;
      const agreedVersion = normalizeTcVersion(tcAgreedVersion) ?? 0;

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
          tc_agreed_version: agreedVersion,
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
          is_wa_contact: null,
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

  protected async initializeUserRecord(
    session: Session,
    tcAgreedVersion?: number,
  ): Promise<{ user: TableTypes<'user'>; isSpl: boolean } | null> {
    try {
      if (!this._supabaseDb || !session.user) return null;
      let api = ServiceConfig.getI().apiHandler;
      const agreedVersion = normalizeTcVersion(tcAgreedVersion) ?? 0;
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
          tc_agreed_version: agreedVersion,
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
          is_wa_contact: null,
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
