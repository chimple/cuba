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

import { SupabaseAuthOtpAuth } from './SupabaseAuth.otpAuth';
export class SupabaseAuth extends SupabaseAuthOtpAuth implements ServiceAuth {
  static [key: string]: any;
  [key: string]: any;
}
