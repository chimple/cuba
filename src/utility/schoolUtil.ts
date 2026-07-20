import { reinitializeHardwareBackButton } from '../common/backButtonRegistry';
import {
  CURRENT_CLASS,
  CURRENT_MODE,
  CURRENT_SCHOOL,
  LAST_MODE,
  MODES,
  PAGES,
  SCHOOL_LOGIN,
  TableTypes,
} from '../common/constants';
import { setAuthUser, setUser } from '../redux/slices/auth/authSlice';
import { store } from '../redux/store';
import { ServiceConfig } from '../services/ServiceConfig';
import { logAuthDebug } from './authDebug';
import logger from './logger';
import { getAppPathname, replaceAppUrl } from './routerLocation';
import { Util } from './util';

export class schoolUtil {
  //   public static port: PortPlugin;

  public static getCurrentClass(): TableTypes<'class'> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentClass) return api.currentClass;
    const temp = localStorage.getItem(CURRENT_CLASS);

    if (!temp) return;
    try {
      const currentClass = JSON.parse(temp) as TableTypes<'class'>;

      return currentClass;
    } catch (error) {
      logger.error('Failed to parse CURRENT_SCHOOL from localStorage:', error);
      return undefined;
    }
  }

  public static setCurrentClass = async (
    currClass: TableTypes<'class'> | undefined,
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = currClass;

    localStorage.setItem(CURRENT_CLASS, JSON.stringify(currClass));
  };
  public static removeCurrentClass = () => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = undefined;
    localStorage.removeItem(CURRENT_CLASS);
  };
  public static getCurrentSchool(): TableTypes<'school'> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentSchool) return api.currentSchool;
    const temp = localStorage.getItem(CURRENT_SCHOOL);

    if (!temp) return;
    const currentSchool = JSON.parse(temp) as TableTypes<'school'>;

    return currentSchool;
  }
  public static setCurrentSchool = async (currSchool: TableTypes<'school'>) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentSchool = currSchool;

    localStorage.setItem(CURRENT_SCHOOL, JSON.stringify(currSchool));
  };

  public static async getCurrMode(): Promise<MODES | undefined> {
    const api = ServiceConfig.getI().apiHandler;
    const auth = ServiceConfig.getI().authHandler;

    if (!!api.currentMode) return api.currentMode;
    const currMode = localStorage.getItem(CURRENT_MODE);
    if (!currMode) {
      const isOpsUser = store.getState()?.auth?.isOpsUser === true;
      if (isOpsUser) {
        this.setCurrMode(MODES.OPS_CONSOLE);
        return MODES.OPS_CONSOLE;
      }
      const currUser = await auth.getCurrentUser();
      if (!currUser) return undefined;
      const allSchool = await api.getSchoolsForUser(currUser.id);
      if (!allSchool || allSchool.length < 1) {
        this.setCurrMode(MODES.PARENT);
        return MODES.PARENT;
      } else {
        this.setCurrMode(MODES.SCHOOL);
        return MODES.SCHOOL;
      }
    }
    const tempMode: MODES = MODES[currMode as keyof typeof MODES];
    api.currentMode = tempMode;
    return tempMode;
  }
  public static setCurrMode = async (currMode: MODES) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentMode = currMode;
    const previousMode = localStorage.getItem(CURRENT_MODE);
    const modeChanged = previousMode !== currMode;
    if (previousMode && modeChanged) {
      localStorage.setItem(LAST_MODE, previousMode);
    }
    localStorage.setItem(CURRENT_MODE, currMode);
    if (modeChanged) {
      reinitializeHardwareBackButton();
    }
  };

  public static isTeacherSchoolMode = (): boolean => {
    const api = ServiceConfig.getI().apiHandler;
    if (api.currentMode) {
      return api.currentMode === MODES.TEACHER_SCHOOL;
    }

    return localStorage.getItem(CURRENT_MODE) === MODES.TEACHER_SCHOOL;
  };

  public static restoreKidsModeFromTeacherSchool = async (): Promise<void> => {
    const previousMode = localStorage.getItem(LAST_MODE);
    await this.setCurrMode(
      previousMode === MODES.SCHOOL ? MODES.SCHOOL : MODES.TEACHER_SCHOOL,
    );
  };

  public static async trySchoolRelogin(): Promise<boolean> {
    try {
      const currentMode = localStorage.getItem(CURRENT_MODE);
      if (currentMode !== MODES.SCHOOL) return false;
      const savedSchoolData = localStorage.getItem(SCHOOL_LOGIN);
      if (!savedSchoolData) return false;
      const credentials = await Util.decryptData(savedSchoolData);
      if (!credentials || !credentials.email || !credentials.password)
        return false;
      const authInstance = ServiceConfig.getI().authHandler;
      const result = await authInstance.loginWithEmailAndPassword(
        credentials.email,
        credentials.password,
      );
      if (result && result.userData) {
        store.dispatch(setAuthUser(result?.user));
        store.dispatch(setUser(result?.userData));
        logAuthDebug('School relogin succeeded, redirecting to select mode.', {
          source: 'schoolUtil.trySchoolRelogin',
          reason: 'school_relogin_success',
          from_page: getAppPathname(),
          to_page: PAGES.SELECT_MODE,
        });
        replaceAppUrl({ pathname: PAGES.SELECT_MODE, search: '', hash: '' });

        return true;
      } else {
        logger.warn('User not found. Please verify your credentials.');
        logAuthDebug('School relogin failed, redirecting to login.', {
          source: 'schoolUtil.trySchoolRelogin',
          reason: 'school_relogin_failed_user_not_found',
          from_page: getAppPathname(),
          to_page: PAGES.LOGIN,
        });
        replaceAppUrl({ pathname: PAGES.LOGIN, search: '', hash: '' });
        return false;
      }
    } catch (error) {
      logger.error('Login unsuccessful. Please try again later.', error);
      return false;
    }
  }
}
