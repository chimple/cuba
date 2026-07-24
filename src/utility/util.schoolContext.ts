import {
  TableTypes,
  PAGES,
  SCHOOL,
  CLASS,
  HOMEHEADERLIST,
  CURRENT_CLASS,
} from '../common/constants';
import { RoleType } from '../interface/modelInterfaces';
import { ServiceConfig } from '../services/ServiceConfig';
import { URLOpenListenerEvent } from '@capacitor/app';
import { store } from '../redux/store';
import { addRole, setRefreshToken } from '../redux/slices/auth/authSlice';
import logger from './logger';
import { replaceWithNavigationTarget } from '../helper/navigation/NavigationHandler';
import { getAppSearchParams } from './routerLocation';
import { UtilSessionContext } from './util.sessionContext';

declare global {
  interface Window {
    __LIDO_COMMON_AUDIO_PATH__?: string;
  }
}

export interface HotUpdateState {
  status: string;
  progress: number;
  channel: string;
  lastChecked: string;
  lastUpdated: string;
  error: string;
  isAuto: boolean;
}
export class UtilSchoolContext extends UtilSessionContext {
  static [key: string]: any;

  public static async onAppUrlOpen(event: URLOpenListenerEvent) {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    const url = new URL(event.url);
    const slug = event.url.split('.cc').pop();
    // Determine target page for logging
    let destinationPage = '';
    const newSearchParams = new URLSearchParams(url.search);
    const currentParams = getAppSearchParams();
    currentParams.set('classCode', newSearchParams.get('classCode') ?? '');
    currentParams.set('page', PAGES.JOIN_CLASS);
    const currentStudent = this.getCurrentStudent();
    if (slug?.includes(PAGES.ASSIGNMENT)) {
      destinationPage = PAGES.HOME + '?tab=' + HOMEHEADERLIST.ASSIGNMENT;
    } else if (slug?.includes(PAGES.JOIN_CLASS)) {
      destinationPage = currentStudent
        ? PAGES.HOME + '?' + currentParams.toString()
        : PAGES.DISPLAY_STUDENT + '?' + currentParams.toString();
    } else {
      // Fallback for other deeplinks
      destinationPage = PAGES.HOME;
    }

    await this.handleDeeplinkClick(
      url,
      currentUser as TableTypes<'user'>,
      destinationPage,
    );
    if (destinationPage && currentStudent) {
      replaceWithNavigationTarget(destinationPage);
    } else {
      replaceWithNavigationTarget(
        PAGES.DISPLAY_STUDENT + '?' + currentParams.toString(),
      );
    }
  }

  public static addRefreshTokenToStore(refreshToken: string) {
    const data = {
      token: refreshToken,
      savedAt: new Date().toISOString(), // store current date/time in ISO format
    };
    try {
      // store refreshToken in Redux store as JSON string
      store.dispatch(setRefreshToken(JSON.stringify(data)));
    } catch (e) {
      logger.error('Unable to store refresh token to Redux store', e);
    }
  }

  // get refresh token from Redux store, if not available or error occurs return null

  public static getRefreshTokenFromStore(): {
    token?: string;
    savedAt?: string;
  } | null {
    try {
      const reduxVal = store.getState()?.auth?.refreshToken;
      if (!reduxVal) return null;
      const parsed = JSON.parse(reduxVal);
      return { token: parsed.token, savedAt: parsed.savedAt };
    } catch (e) {
      logger.error('Unable to read refresh token from Redux store', e);
      return null;
    }
  }

  public static setCurrentSchool = async (
    school: TableTypes<'school'>,
    role: RoleType,
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentSchool = school !== null ? school : undefined;
    localStorage.setItem(SCHOOL, JSON.stringify(school));
    store.dispatch(addRole(role));
  };

  public static getCurrentSchool(): TableTypes<'school'> | undefined {
    const api = ServiceConfig.getI().apiHandler;

    if (api.currentSchool) {
      return api.currentSchool;
    }

    const isSchoolConnected = async (schoolId: string): Promise<boolean> => {
      const roles = store.getState()?.auth?.roles ?? [];
      const isOpsUser = store.getState()?.auth?.isOpsUser === true;
      if (
        isOpsUser ||
        [
          RoleType.SUPER_ADMIN,
          RoleType.FIELD_COORDINATOR,
          RoleType.PROGRAM_MANAGER,
          RoleType.OPERATIONAL_DIRECTOR,
        ].some((role) => roles.includes(role))
      ) {
        return true;
      }
      try {
        const authHandler = ServiceConfig.getI().authHandler;
        const currentUser = await authHandler.getCurrentUser();
        if (!currentUser) return false;

        const userId = currentUser.id;
        const schools = await api.getSchoolsForUser(userId);

        return schools.some((item) => item.school.id === schoolId);
      } catch (error) {
        logger.error('Error checking school via user:', error);
        return false;
      }
    };

    const isClassConnected = async (
      schoolId: string,
      classId: string,
    ): Promise<{ classExists: boolean; classCount: number } | undefined> => {
      try {
        const authHandler = ServiceConfig.getI().authHandler;
        const currentUser = await authHandler.getCurrentUser();
        if (!currentUser) return;

        const userId = currentUser.id;

        const classes = await api.getClassesForSchool(schoolId, userId);

        return {
          classExists: classes.some((cls) => cls.id === classId),
          classCount: classes.length,
        };
      } catch (error) {
        logger.error('Error checking class via user:', error);
        return;
      }
    };

    const temp = localStorage.getItem(SCHOOL);
    if (!temp) return;

    const currentSchool = JSON.parse(temp) as TableTypes<'school'>;
    api.currentSchool = currentSchool;

    const storedClass = localStorage.getItem(CLASS);
    let classId: string | undefined;

    if (storedClass && storedClass !== 'undefined' && storedClass !== 'null') {
      try {
        classId =
          (JSON.parse(storedClass) as TableTypes<'class'> | null)?.id ??
          undefined;
      } catch (error) {
        logger.warn('Failed to parse stored class while validating school', {
          storedClass,
          error,
        });
      }
    }

    // SCHOOL CHECK
    isSchoolConnected(currentSchool.id).then((res) => {
      if (!res) {
        api.currentSchool = undefined;

        localStorage.removeItem(SCHOOL);
        localStorage.removeItem(CLASS);
        return;
      }

      // CLASS CHECK
      if (classId) {
        isClassConnected(currentSchool.id, classId).then((cls) => {
          if (!cls) return;

          const { classExists, classCount } = cls;

          if (!classExists) {
            localStorage.removeItem(CLASS);

            if (classCount === 1) {
              api.currentSchool = undefined;
              localStorage.removeItem(SCHOOL);
            }
          }
        });
      }
    });

    return currentSchool;
  }

  public static setCurrentClass = async (
    classDoc: TableTypes<'class'> | null,
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = classDoc !== null ? classDoc : undefined;
    localStorage.setItem(CLASS, JSON.stringify(classDoc));
  };

  public static getCurrentClass(): TableTypes<'class'> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentClass) return api.currentClass;
    // 🔹 Try CLASS first, then CURRENT_CLASS as fallback
    let temp = localStorage.getItem(CLASS);
    if ((!temp || temp === 'undefined') && CURRENT_CLASS) {
      temp = localStorage.getItem(CURRENT_CLASS) || null;
    }
    if (!temp || temp === 'undefined') return;

    try {
      const currentClass = JSON.parse(temp) as TableTypes<'class'>;
      api.currentClass = currentClass;
      return currentClass;
    } catch (err) {
      logger.error('Failed to parse currentClass from localStorage', err);
      return;
    }
  }

  public static async validateCurrentSchoolContext(): Promise<void> {
    const api = ServiceConfig.getI().apiHandler;
    const currentSchool = this.getCurrentSchool();
    const currentClass = this.getCurrentClass();

    if (!currentSchool) {
      return;
    }

    const isSchoolConnected = async (schoolId: string): Promise<boolean> => {
      const roles = store.getState()?.auth?.roles ?? [];
      const isOpsUser = store.getState()?.auth?.isOpsUser === true;
      if (
        isOpsUser ||
        [
          RoleType.SUPER_ADMIN,
          RoleType.FIELD_COORDINATOR,
          RoleType.PROGRAM_MANAGER,
          RoleType.OPERATIONAL_DIRECTOR,
        ].some((role) => roles.includes(role))
      ) {
        return true;
      }
      try {
        const authHandler = ServiceConfig.getI().authHandler;
        const currentUser = await authHandler.getCurrentUser();
        if (!currentUser) return false;

        const schools = await api.getSchoolsForUser(currentUser.id);
        return schools.some((item) => item.school.id === schoolId);
      } catch (error) {
        logger.error('Error checking school via user:', error);
        return false;
      }
    };

    const isClassConnected = async (
      schoolId: string,
      classId: string,
    ): Promise<{ classExists: boolean; classCount: number } | undefined> => {
      try {
        const authHandler = ServiceConfig.getI().authHandler;
        const currentUser = await authHandler.getCurrentUser();
        if (!currentUser) return;

        const classes = await api.getClassesForSchool(schoolId, currentUser.id);
        return {
          classExists: classes.some((cls) => cls.id === classId),
          classCount: classes.length,
        };
      } catch (error) {
        logger.error('Error checking class via user:', error);
        return;
      }
    };

    const schoolIsConnected = await isSchoolConnected(currentSchool.id);
    if (!schoolIsConnected) {
      api.currentSchool = undefined;
      api.currentClass = undefined;
      localStorage.removeItem(SCHOOL);
      localStorage.removeItem(CLASS);
      return;
    }

    if (!currentClass?.id) {
      return;
    }

    const classCheck = await isClassConnected(
      currentSchool.id,
      currentClass.id,
    );
    if (!classCheck) return;

    if (!classCheck.classExists) {
      localStorage.removeItem(CLASS);
      api.currentClass = undefined;
      if (classCheck.classCount === 1) {
        api.currentSchool = undefined;
        localStorage.removeItem(SCHOOL);
      }
    }
  }
}
