import { Device } from '@capacitor/device';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { CURRENT_CLASS, TableTypes } from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { updateLocalAttributes } from '../growthbook/Growthbook';
import logger from './logger';
import { UtilHomeworkAudio } from './util.homeworkAudio';

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
export class Util extends UtilHomeworkAudio {
  static [key: string]: any;
  public static async updateSchStdAttb(): Promise<any[]> {
    try {
      const student = Util.getCurrentStudent();
      if (!student?.id) return [];
      const api = ServiceConfig.getI().apiHandler;
      const linkedData = await api.getStudentClassesAndSchools(student.id);
      if (!linkedData) {
        api.currentClass = undefined;
        localStorage.removeItem(CURRENT_CLASS);
        // Clear school targeting when the active student has no linkage data.
        updateLocalAttributes({
          student_id: student.id,
          school_ids: [],
          schools: [],
          classes: [],
          school_name: null,
        });
        return [];
      }
      const device = await Util.logDeviceInfo();
      const resolvedSchoolIds = linkedData.schools.map(
        (item: TableTypes<'school'>) => item.id,
      );
      if (linkedData.classes.length === 0) {
        api.currentClass = undefined;
        localStorage.removeItem(CURRENT_CLASS);
      }
      const attributeParams = {
        studentDetails: student,
        schools: resolvedSchoolIds,
        school_ids: resolvedSchoolIds,
        school_name: linkedData.schools[0]?.name,
        classes: linkedData.classes.map((item: any) => item.id),
        ...device,
      };
      updateLocalAttributes(attributeParams);
      return [];
    } catch (error) {
      logger.error('[Util.updateSchStdAttb] failed:', error);
      return [];
    }
  }

  public static async logDeviceInfo(): Promise<any> {
    const info = await Device.getInfo();
    const device_language = await Device.getLanguageCode();
    const device = {
      model: info.model,
      manufacturer: info.manufacturer,
      platform: info.platform,
      os_version: info.osVersion,
      operating_system: info.operatingSystem,
      is_virtual: info.isVirtual,
      device_language: device_language.value,
    };
    return device;
  }

  public static migrateSupabaseSession() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        logger.warn('Supabase URL missing, skipping session migration');
        return;
      }

      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
      if (!projectRef) {
        logger.warn('Invalid Supabase URL format, skipping session migration');
        return;
      }

      const newKey = `sb-${projectRef}-auth-token`;
      const oldKey = Object.keys(localStorage).find(
        (key) => key.endsWith('auth-token') && key !== newKey,
      );

      if (oldKey) {
        const oldSession = localStorage.getItem(oldKey);

        if (oldSession && !localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldSession);
          localStorage.removeItem(oldKey);
        }
      }
    } catch (error) {
      logger.error('Session migration failed', error);
    }
  }

  public static async getLocalLessonVersion(lessonId: string): Promise<number> {
    try {
      const file = await Filesystem.readFile({
        path: `${lessonId}/.version`,
        directory: Directory.External,
      });

      let versionStr: string;

      if (typeof file.data === 'string') {
        // 🔥 Try decode base64 safely
        try {
          versionStr = atob(file.data);
        } catch {
          versionStr = file.data; // fallback if already plain text
        }
      } else {
        versionStr = await this.blobToString(file.data as Blob);
      }

      const cleaned = versionStr.trim(); // 🔥 IMPORTANT
      const version = parseInt(cleaned, 10);

      logger.warn(`[Version] Raw: "${versionStr}" Parsed: ${version}`);

      return isNaN(version) ? 1 : version;
    } catch (err) {
      logger.warn(
        `[Version] No .version file for ${lessonId}, defaulting to 1`,
      );
      return 1;
    }
  }
}
