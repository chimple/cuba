import {
  TableTypes,
  HOT_UPDATE_STATE_KEY,
  LIDO_ASSESSMENT,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import logger from './logger';
import { UtilHomeworkRefresh } from './util.homeworkRefresh';

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
export class UtilHomeworkAudio extends UtilHomeworkRefresh {
  static [key: string]: any;
  static async ensureLidoCommonAudioForStudent(student: TableTypes<'user'>) {
    try {
      if (!student?.language_id) {
        logger.warn('[LidoCommonAudio] Student has no language');
        return;
      }

      const api = ServiceConfig.getI().apiHandler;

      const audioConfig = await api.getLidoCommonAudioUrl(
        student.language_id,
        student.locale_id ?? null,
      );

      if (!audioConfig?.lido_common_audio_url) {
        logger.warn('[LidoCommonAudio] No audio config found');
        return;
      }
      await this.downloadLidoCommonAudio(
        audioConfig.lido_common_audio_url,
        student.language_id,
      );
    } catch (err) {
      logger.error('[LidoCommonAudio] ensure failed:', err);
    }
  }

  public static getHotUpdateState(): HotUpdateState {
    const raw = localStorage.getItem(HOT_UPDATE_STATE_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          status: 'Idle',
          progress: 0,
          channel: 'N/A',
          lastChecked: 'N/A',
          lastUpdated: 'N/A',
          error: '',
          isAuto: false,
        };
  }

  public static setHotUpdateState(partial: Partial<HotUpdateState>) {
    const current = this.getHotUpdateState();
    const updated = { ...current, ...partial };
    localStorage.setItem(HOT_UPDATE_STATE_KEY, JSON.stringify(updated));

    window.dispatchEvent(new Event('hot-update-progress'));
  }

  static async removeCourseScopedKey(
    baseKey: string,
    userId: string,
    courseId: string,
  ) {
    if (!baseKey || !userId || !courseId) return;

    const storageKey = `${baseKey}_${userId}`;

    let map: Record<string, any> = {};
    try {
      map = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      map = {};
    }

    if (!map || typeof map !== 'object') return;

    delete map[courseId];

    Object.keys(map).length === 0
      ? localStorage.removeItem(storageKey)
      : localStorage.setItem(storageKey, JSON.stringify(map));
  }

  static upsertResultWithAggregation(
    resultsBucket: any[],
    result: any,
    lesson?: TableTypes<'lesson'>,
  ) {
    // LIDO → aggregate per lesson
    if (lesson?.plugin_type === LIDO_ASSESSMENT) {
      const existing = resultsBucket.find(
        (r) => r.lesson_id === result.lesson_id,
      );

      if (existing) {
        const total =
          (existing._totalScore ?? existing.score ?? 0) + (result.score ?? 0);

        const count = (existing._count ?? 1) + 1;

        existing._totalScore = total;
        existing._count = count;
        existing.score = Math.round(total / count);
      } else {
        resultsBucket.push({
          ...result,
          score: result.score ?? 0,
          _totalScore: result.score ?? 0,
          _count: 1,
        });
      }
    } else {
      // Non-LIDO → keep all attempts
      resultsBucket.push(result);
    }
  }
}
