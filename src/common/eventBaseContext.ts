import { Capacitor } from '@capacitor/core';
import { CURRENT_MODE, MODES } from './constants';
import { RootState, store } from '../redux/store';
import { schoolUtil } from '../utility/schoolUtil';

const UNKNOWN_CONTEXT_VALUE = 'unknown';
const USER_ROLES_SEPARATOR = ',';

export interface GlobalEventBaseContext {
  user_id: string;
  user_roles: string;
  school_id: string;
  current_app_mode: string;
  device_platform: string;
}

const getCurrentModeValue = (): string => {
  const storedMode = localStorage.getItem(CURRENT_MODE);
  if (!storedMode) {
    return UNKNOWN_CONTEXT_VALUE;
  }
  return MODES[storedMode as keyof typeof MODES] ?? UNKNOWN_CONTEXT_VALUE;
};

const getUserRolesValue = (roles: string[]): string => {
  if (!roles || roles.length === 0) {
    return UNKNOWN_CONTEXT_VALUE;
  }
  return roles.join(USER_ROLES_SEPARATOR);
};

export const buildGlobalEventBaseContext = (): GlobalEventBaseContext => {
  const state: RootState = store.getState();
  const userId = state.auth.user?.id ?? state.auth.authUser?.id;
  const roles = state.auth.roles ?? [];
  const schoolId = schoolUtil.getCurrentSchool()?.id;

  return {
    user_id: userId ?? UNKNOWN_CONTEXT_VALUE,
    user_roles: getUserRolesValue(roles),
    school_id: schoolId ?? UNKNOWN_CONTEXT_VALUE,
    current_app_mode: getCurrentModeValue(),
    device_platform: Capacitor.getPlatform(),
  };
};
