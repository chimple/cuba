import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';
import {
  TableTypes,
  PortPlugin,
  CURRENT_COURSE,
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  NAVIGATION_STATE,
  GAME_URL,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { t } from 'i18next';
import logger from './logger';
import { UtilSchoolContext } from './util.schoolContext';

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
export class UtilFileStorage extends UtilSchoolContext {
  static [key: string]: any;
  public static async sendContentToAndroidOrWebShare(
    text: string,
    title: string,
    url?: string,
    imageFile?: File[],
  ) {
    if (Capacitor.isNativePlatform()) {
      await this.port
        .shareContentWithAndroidShare({
          text: t(text),
          title: t(title),
          url: url,
          imageFile: imageFile, // Pass the File object for Android
        })
        .then(() => {})
        .catch((error) => logger.error('Error sharing content:', error));
    } else {
      // Web sharing
      const shareData: ShareData = {
        text: t(text) || '',
        title: t(title) || '',
        url: url,
        files: imageFile,
      };

      await navigator
        .share(shareData)
        .then(() => {})
        .catch((error) => logger.error('Error sharing content:', error));
    }
  }

  public static async saveImage(file: File) {
    // Native builds save images to the public gallery via MediaStore.
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.blobToString(file);

        if (!this.port) {
          this.port = registerPlugin<PortPlugin>('Port');
        }

        await this.port.saveImageToGallery({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type || 'image/png',
        });
      } catch (error) {
        logger.error('Error saving file natively:', error);
        await Toast.show({ text: t('Failed to save image') });
      }
    } else {
      try {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (error) {
        logger.error('Error saving file in web:', error);
      }
    }
  }

  public static setCurrentCourse = async (
    classId: string | undefined,
    courseDoc: TableTypes<'course'> | null,
  ) => {
    if (!classId) return;
    const api = ServiceConfig.getI().apiHandler;
    const courseMap: Map<string, TableTypes<'course'> | undefined> = new Map();
    courseMap.set(classId, courseDoc ?? undefined);
    api.currentCourse = courseMap;
    const mapObject = Object.fromEntries(courseMap);
    localStorage.setItem(CURRENT_COURSE, JSON.stringify(mapObject));
  };

  public static getCurrentCourse(
    classId: string | undefined,
  ): TableTypes<'course'> | undefined {
    if (!classId) return;
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentCourse) return api.currentCourse.get(classId);
    const temp = localStorage.getItem(CURRENT_COURSE);
    if (!temp) return;
    const tempObject = JSON.parse(temp);
    const currentCourse = new Map(Object.entries(tempObject)) as Map<
      string,
      TableTypes<'course'>
    >;
    return currentCourse.get(classId);
  }

  public static dispatchClassOrSchoolChangeEvent = () => {
    const customEvent = new CustomEvent(CLASS_OR_SCHOOL_CHANGE_EVENT);
    window.dispatchEvent(customEvent);
  };

  public static getNavigationState(): {
    stage: string;
  } | null {
    return JSON.parse(localStorage.getItem(NAVIGATION_STATE) || 'null');
  }

  public static setNavigationState(stage: string) {
    const navigationState = { stage };
    localStorage.setItem(NAVIGATION_STATE, JSON.stringify(navigationState));
  }

  public static clearNavigationState() {
    localStorage.removeItem(NAVIGATION_STATE);
  }

  public static async getAndroidBundlePath(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      try {
        const path = await Filesystem.getUri({
          directory: Directory.External,
          path: '',
        });

        if (path && path.uri) {
          const uri = Capacitor.convertFileSrc(path.uri);
          return uri + '/'; // file:///data/user/0/org.chimple.bahama/cache
        }
      } catch (error) {
        logger.error('path error', error);
      }
      throw new Error('Failed to retrieve Android bundle path.');
    }
    throw new Error('Not running on a native platform.');
  }

  public static setGameUrl(path: string) {
    localStorage.setItem(GAME_URL, path);
  }
}
