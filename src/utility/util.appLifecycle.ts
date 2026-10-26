import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  LAST_PERMISSION_CHECKED,
  LAST_UPDATE_CHECKED,
  PAGES,
  PortPlugin,
  IS_MIGRATION_CHECKED,
  MODES,
  HOMEHEADERLIST,
  ASSIGNMENT_TYPE,
  ASSIGNMENT_POPUP_SHOWN,
  QUIZ_POPUP_SHOWN,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from '@capawesome/capacitor-app-update';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { schoolUtil } from './schoolUtil';
import { InAppReview } from '@capacitor-community/in-app-review';
import logger from './logger';
import { replaceWithNavigationTarget } from '../helper/navigation/NavigationHandler';
import { UtilNotifications } from './util.notifications';

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
export class UtilAppLifecycle extends UtilNotifications {
  static [key: string]: any;

  public static async startFlexibleUpdate(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const canCheckUpdate = this.canCheckUpdate(LAST_UPDATE_CHECKED);

      if (!canCheckUpdate) return;
      const result = await AppUpdate.getAppUpdateInfo();

      if (
        result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE
      ) {
        return;
      }
      if (result.flexibleUpdateAllowed) {
        const appUpdateResult = await AppUpdate.startFlexibleUpdate();

        if (appUpdateResult.code === AppUpdateResultCode.OK) {
          await AppUpdate.completeFlexibleUpdate();
        }
      }
    } catch (error) {
      logger.error(
        '🚀 ~ file: util.ts:482 ~ startFlexibleUpdate ~ error:',
        JSON.stringify(error),
      );
    }
  }

  public static notificationsCount = 0;

  public static async notificationListener(
    onNotification: (extraData?: object) => void,
  ) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      FirebaseMessaging.addListener(
        'notificationReceived',
        async ({ notification }) => {
          try {
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: this.notificationsCount++,
                  body: notification.body ?? '',
                  title: notification.title ?? 'Chimple',
                  attachments: !!notification.image
                    ? [{ id: notification.image, url: notification.image }]
                    : undefined,
                  extra: notification.data,
                },
              ],
            });
            LocalNotifications.addListener(
              'localNotificationActionPerformed',
              (notification) => {
                const extraData = notification.notification.extra;
                onNotification(extraData);
              },
            );
          } catch (error) {
            logger.error(
              '🚀 ~ file: util.ts:630 ~ error:',
              JSON.stringify(error),
            );
          }
        },
      );
      const canCheckPermission = this.canCheckUpdate(LAST_PERMISSION_CHECKED);
      if (!canCheckPermission) return;
      const result = await FirebaseMessaging.checkPermissions();
      if (result.receive === 'granted') return;
      await FirebaseMessaging.requestPermissions();
    } catch (error) {
      logger.error(
        '🚀 ~ file: util.ts:514 ~ checkNotificationPermissionsAndType ~ error:',
        JSON.stringify(error),
      );
    }
  }

  public static async navigateTabByNotificationData(data: any) {
    const currentStudent = this.getCurrentStudent();
    const api = ServiceConfig.getI().apiHandler;
    if (data && data.notificationType === ASSIGNMENT_TYPE.REWARD) {
      const rewardProfileId = data.rewardProfileId;
      if (rewardProfileId)
        if (currentStudent?.id === rewardProfileId) {
          replaceWithNavigationTarget(
            PAGES.HOME + '?tab=' + HOMEHEADERLIST.HOME,
          );
        } else {
          await this.setCurrentStudent(null);
          const students = await api.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => user.id === rewardProfileId) || students[0];
          if (matchingUser) {
            await this.setCurrentStudent(matchingUser, undefined, true);
            replaceWithNavigationTarget(
              PAGES.HOME + '?tab=' + HOMEHEADERLIST.HOME,
            );
          } else {
            return;
          }
        }
    } else if (data && data.notificationType === ASSIGNMENT_TYPE.ASSIGNMENT) {
      sessionStorage.setItem(ASSIGNMENT_POPUP_SHOWN, 'false');
      if (data.classId) {
        const classId = data.classId;
        if (!classId) return;
        const studentsData = await api.getStudentsForClass(classId);
        let tempStudentIds: string[] = [];
        for (let student of studentsData) {
          tempStudentIds.push(student.id);
        }
        let foundMatch = false;
        for (let studentId of tempStudentIds) {
          if (currentStudent?.id === studentId) {
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) {
          await this.setCurrentStudent(null);
          const students = await api.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => tempStudentIds.includes(user.id)) ||
            students[0];
          if (matchingUser) {
            await this.setCurrentStudent(matchingUser, undefined, true);
            replaceWithNavigationTarget(
              PAGES.HOME + '?tab=' + HOMEHEADERLIST.ASSIGNMENT,
            );
          }
        } else {
          replaceWithNavigationTarget(
            PAGES.HOME + '?tab=' + HOMEHEADERLIST.ASSIGNMENT,
          );
          return;
        }
      }
    } else if (data && data.notificationType === ASSIGNMENT_TYPE.LIVEQUIZ) {
      sessionStorage.setItem(QUIZ_POPUP_SHOWN, 'false');
      if (data.classId) {
        const classId = data.classId;
        const studentsData = await api.getStudentsForClass(classId);
        let tempStudentIds: string[] = [];
        for (let student of studentsData) {
          tempStudentIds.push(student.id);
        }
        let foundMatch = false;
        for (let studentId of tempStudentIds) {
          if (currentStudent?.id === studentId) {
            replaceWithNavigationTarget(
              data.assignmentId
                ? PAGES.LIVE_QUIZ_JOIN + `?assignmentId=${data.assignmentId}`
                : PAGES.HOME + '?tab=' + HOMEHEADERLIST.LIVEQUIZ,
            );
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) {
          await this.setCurrentStudent(null);
          const students = await api.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => tempStudentIds.includes(user.id)) ||
            students[0];
          if (matchingUser) {
            await this.setCurrentStudent(matchingUser, undefined, true);
            replaceWithNavigationTarget(
              PAGES.HOME + '?tab=' + HOMEHEADERLIST.LIVEQUIZ,
            );
          }
        }
      } else {
        replaceWithNavigationTarget(
          PAGES.HOME + '?tab=' + HOMEHEADERLIST.LIVEQUIZ,
        );
        return;
      }
    }
  }

  public static canCheckUpdate(updateFor: string) {
    const tempLastUpdateChecked = localStorage.getItem(updateFor);
    const now = new Date();
    let lastUpdateChecked: Date | undefined;
    if (!!tempLastUpdateChecked) {
      lastUpdateChecked = new Date(tempLastUpdateChecked);
    }
    if (!lastUpdateChecked) {
      localStorage.setItem(updateFor, now.toString());
      return true;
    }
    const lessThanOneHourAgo = (date: Date): boolean => {
      const now = new Date();
      const ONE_HOUR = 60 * 60 * 1000; /* ms */
      const res = now.getTime() - date.getTime() < ONE_HOUR;
      return res;
    };
    const _canCheckUpdate = !lessThanOneHourAgo(lastUpdateChecked);
    if (_canCheckUpdate) {
      localStorage.setItem(updateFor, now.toString());
    }
    return _canCheckUpdate;
  }

  public static listenToNetwork() {}

  public static async showInAppReview() {
    try {
      await InAppReview.requestReview();
    } catch (error) {
      logger.error(
        '🚀 ~ file: util.ts:694 ~ showInAppReview ~ error:',
        JSON.stringify(error),
      );
    }
  }

  public static async fetchNotificationData() {
    if (!this.port) this.port = registerPlugin<PortPlugin>('Port');
    return this.port.fetchNotificationData();
  }

  public static async migrate() {
    if (
      !Capacitor.isNativePlatform() ||
      !!localStorage.getItem(IS_MIGRATION_CHECKED)
    )
      return { migrated: false };
    const path = await Filesystem.getUri({
      directory: Directory.Data,
      path: '',
    });
    const filePath = path.uri.replace('/files', '/databases/') + 'jsb.sqlite';
    const url = Capacitor.convertFileSrc(filePath);
    const res = await fetch(url);
    const isExists = res.ok;
    if (!isExists) return { migrated: false };

    if (!this.port) {
      this.port = registerPlugin<PortPlugin>('Port');
    }
    try {
      const port = await this.port.getMigrateUsers();
      const functions = getFunctions();
      const migrateUsers = httpsCallable(functions, 'MigrateUsers');
      const result = await migrateUsers({
        users: port.users,
      });
      void result.data;
    } catch (error) {
      logger.error('🚀 ~ file: util.ts:707 ~ migrate ~ error:', error);
      return { migrated: false };
    }
  }

  public static async getCanShowAvatar(): Promise<boolean> {
    try {
      const currMode = await schoolUtil.getCurrMode();

      if (currMode === MODES.SCHOOL) {
        return true;
      }

      const student = await this.getCurrentStudent();

      if (!student) {
        logger.error('Student is undefined or null');
        return false;
      }

      const api = ServiceConfig.getI().apiHandler;
      const studentResult = await api.getStudentClassesAndSchools(student.id);

      if (
        studentResult &&
        studentResult.classes &&
        studentResult.classes.length > 0
      ) {
        return true;
      }

      // If Remote Config allows showing avatar, return true
      const canShowAvatarValue = false;

      return canShowAvatarValue;
    } catch (error) {
      logger.error('Error in getCanShowAvatar:', error);
      return false;
    }
  }
}
