import { useEffect } from 'react';
import {
  CLASS_JOINED_EVENT,
  COURSE_CHANGED,
  EVENTS,
  LidoActivityEndKey,
  LidoGameCompletedKey,
  LidoGameExitKey,
  LidoGameStartKey,
} from '../common/constants';
import { useAppSelector } from '../redux/hooks';
import { PredictiveDownloadService } from '../services/offline/PredictiveDownloadService';
import { logger } from '../utility/logger';

const PREDICTIVE_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export const usePredictiveDownloads = (): void => {
  const student = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!student?.id) {
      logger.info('[***] Waiting for authenticated student');
      return;
    }

    logger.info('[***] Hook active', {
      page: window.location.pathname,
    });

    const refresh = (): void => {
      void PredictiveDownloadService.refresh();
    };
    refresh();
    const interval = window.setInterval(
      refresh,
      PREDICTIVE_REFRESH_INTERVAL_MS,
    );
    window.addEventListener(EVENTS.LESSON_END, refresh);
    window.addEventListener(COURSE_CHANGED, refresh);
    window.addEventListener(CLASS_JOINED_EVENT, refresh);
    window.addEventListener(LidoGameStartKey, refresh);
    window.addEventListener(LidoGameCompletedKey, refresh);
    window.addEventListener(LidoGameExitKey, refresh);
    window.addEventListener(LidoActivityEndKey, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(EVENTS.LESSON_END, refresh);
      window.removeEventListener(COURSE_CHANGED, refresh);
      window.removeEventListener(CLASS_JOINED_EVENT, refresh);
      window.removeEventListener(LidoGameStartKey, refresh);
      window.removeEventListener(LidoGameCompletedKey, refresh);
      window.removeEventListener(LidoGameExitKey, refresh);
      window.removeEventListener(LidoActivityEndKey, refresh);
    };
  }, [student]);
};
