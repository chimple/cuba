import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  TableTypes,
  PAGES,
  PortPlugin,
  School_Creation_Stages,
  SCHOOL_LOGIN,
  SHOULD_SHOW_REMOTE_ASSETS,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import CryptoJS from 'crypto-js';
import logger from './logger';
import { parsePath } from 'history';
import { UtilFileStorage } from './util.fileStorage';

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
export class UtilDataAndRewards extends UtilFileStorage {
  static [key: string]: any;

  public static async triggerSaveProceesedXlsxFile(data: {
    fileData: string;
    fileName?: string;
  }) {
    try {
      if (!this.port) {
        this.port = registerPlugin<PortPlugin>('Port');
      }
      await this.port.saveProceesedXlsxFile({
        fileData: data.fileData,
        fileName: data.fileName,
      });
    } catch (error) {
      logger.error('Download failed:', error);
    }
  }

  public static handleMissingEntities(
    history: any,
    redirectPage: string,
    origin: PAGES,
    classId?: string,
  ) {
    history.replace({
      ...parsePath(redirectPage),
      state: {
        classId: classId,
        origin: origin,
        isSelect: true,
      },
    });
  }

  public static async handleClassAndSubjects(
    schoolId: string,
    userId: string,
    history: any,
    originPage: PAGES,
  ) {
    if (schoolId === undefined) return;
    const api = ServiceConfig.getI().apiHandler;
    const schoolCourses = await api.getCoursesBySchoolId(schoolId);
    if (schoolCourses.length === 0) {
      this.setNavigationState(School_Creation_Stages.SCHOOL_COURSE);
      history.replace({
        ...parsePath(PAGES.SUBJECTS_PAGE),
        state: {
          schoolId: schoolId,
          origin: originPage,
          isSelect: true,
        },
      });
      return;
    }
    const fetchedClasses = await api.getClassesForSchool(schoolId, userId);
    if (fetchedClasses.length === 0) {
      history.replace({
        ...parsePath(PAGES.ADD_CLASS),
        state: {
          school: { id: schoolId },
          origin: originPage,
        },
      });
      return;
    }

    const currentClass = this.getCurrentClass();
    const validCurrentClass = currentClass
      ? fetchedClasses.find((classItem) => classItem.id === currentClass.id)
      : undefined;

    if (!validCurrentClass) {
      await this.setCurrentClass(fetchedClasses[0]);
    }

    const classCoursesData = await Promise.all(
      fetchedClasses.map((classItem) =>
        api.getCoursesByClassId(classItem.id).then((courses) => ({
          classId: classItem.id,
          courses,
        })),
      ),
    );

    const classWithoutSubjects = classCoursesData.find(
      (data) => data.courses.length === 0,
    );

    if (classWithoutSubjects) {
      this.setNavigationState(School_Creation_Stages.CLASS_COURSE);
      this.handleMissingEntities(
        history,
        PAGES.SUBJECTS_PAGE,
        originPage,
        classWithoutSubjects.classId,
      );
      return;
    }
  }

  public static async encryptData(data: object): Promise<string | null> {
    try {
      const stringData = JSON.stringify(data);
      const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

      if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not set.');
      }
      return CryptoJS.AES.encrypt(stringData, ENCRYPTION_KEY).toString();
    } catch (error) {
      logger.error('Encryption failed:', error);
      return null;
    }
  }

  public static async decryptData(
    ciphertext: string,
  ): Promise<{ email: string; password: string } | null> {
    try {
      const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
      if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not set.');
      }

      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption failed:', error);
      return null;
    }
  }

  public static async storeLoginDetails(
    email: string,
    password: string,
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const encryptedData = await this.encryptData({ email, password });
      if (encryptedData) {
        localStorage.setItem(SCHOOL_LOGIN, encryptedData);
      }
    } catch (error) {
      logger.error('Failed to encrypt and store login details:', error);
    }
  }

  public static async downloadFileFromUrl(fileUrl: string): Promise<void> {
    try {
      const response = await fetch(fileUrl);

      // ✅ Validate content type to avoid corrupted files
      const contentType = response.headers.get('content-type') || '';
      if (
        contentType.includes('text/html') ||
        contentType.includes('application/json')
      ) {
        const text = await response.text();
        logger.error(
          'Unexpected content instead of a file:',
          text.slice(0, 100),
        );
        throw new Error(
          'Invalid file download. Check if the link is direct and the file is public.',
        );
      }
      const blob = await response.blob();
      this.handleBlobDownloadAndSave(blob, 'BulkUploadTemplate.xlsx');
    } catch (error) {
      logger.error('Download failed:', error);
    }
  }

  public static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        resolve(base64Data.split(',')[1]);
      };
      reader.onerror = reject;
    });
  }

  public static async handleBlobDownloadAndSave(blob: Blob, fileName?: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const base64 = await this.blobToBase64(blob);
        await this.triggerSaveProceesedXlsxFile({
          fileData: base64,
          fileName: fileName,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'ProcessedFile.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('Failed to save or download file:', error);
    }
  }

  public static mergeStudentsByUpdatedAt(
    apiStudents: TableTypes<'user'>[],
    storedMapStr: string | null,
  ): TableTypes<'user'>[] {
    const studentsMap: Record<string, TableTypes<'user'>> = storedMapStr
      ? JSON.parse(storedMapStr)
      : {};

    const mergedStudents = apiStudents.map((studentFromAPI) => {
      const localStudent = studentsMap[studentFromAPI.id];

      if (localStudent) {
        const apiUpdatedAt = new Date(studentFromAPI.updated_at ?? 0).getTime();
        const localUpdatedAt = new Date(localStudent.updated_at ?? 0).getTime();
        return localUpdatedAt > apiUpdatedAt ? localStudent : studentFromAPI;
      }
      return studentFromAPI;
    });

    return mergedStudents;
  }

  public static async loadBackgroundImage() {
    const body = document.querySelector('body');
    if (
      Capacitor.isNativePlatform() &&
      localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === 'true'
    ) {
      try {
        const result = await Filesystem.readFile({
          path: 'remoteAsset/remoteBackground.svg',
          directory: Directory.External,
        });
        const res = await this.blobToString(result.data);
        const svgData = atob(res); // decode base64

        if (body) {
          body.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(
            svgData,
          )}')`;
          body.style.backgroundRepeat = 'no-repeat';
          body.style.backgroundSize = 'cover';
          body.style.backgroundPosition = 'center center';
        }
      } catch (e) {
        body?.style.setProperty(
          'background-image',
          'url(/pathwayAssets/pathwayBackground.svg)',
        );
        body?.style.setProperty('background-repeat', 'no-repeat');
        body?.style.setProperty('background-size', 'cover');
        body?.style.setProperty('background-position', 'center center');
        logger.error('Failed to load remote background image:', e);
      }
    } else {
      body?.style.setProperty(
        'background-image',
        'url(/pathwayAssets/pathwayBackground.svg)',
      );
      body?.style.setProperty('background-repeat', 'no-repeat');
      body?.style.setProperty('background-size', 'cover');
      body?.style.setProperty('background-position', 'center center');
    }
  }
}
