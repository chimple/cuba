import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { PAGES } from '../common/constants';
import {
  prepareRespectLessonLaunch,
  wasRespectLessonLaunchReceived,
} from '../services/respect/RespectLessonLaunchService';
import { hideNativeSplashScreen } from '../startup/nativeRuntime';

const RESPECT_LAUNCH_RETRY_COUNT = 20;
const RESPECT_LAUNCH_RETRY_DELAY_MS = 500;
const RESPECT_LAUNCH_ROUTE_GUARD_COUNT = 10;

export const useRespectLessonLaunch = (): boolean => {
  const history = useHistory();
  const isLaunchingRef = useRef(false);
  const [isPreparing, setIsPreparing] = useState(true);

  useEffect(() => {
    const launchLesson = async (): Promise<void> => {
      if (isLaunchingRef.current) return;

      isLaunchingRef.current = true;
      setIsPreparing(true);

      try {
        let launch = await prepareRespectLessonLaunch();

        // Cuba restores its last route on startup. A RESPECT deep link must
        // still be prepared before the route tree mounts, otherwise the
        // normal auth guard can show the login screen during lesson loading.
        if (!launch && !wasRespectLessonLaunchReceived()) return;

        for (
          let attempt = 0;
          attempt < RESPECT_LAUNCH_RETRY_COUNT;
          attempt += 1
        ) {
          if (launch) {
            history.replace(launch.pathname + launch.search, launch.state);
            window.requestAnimationFrame(() => {
              window.requestAnimationFrame(hideNativeSplashScreen);
            });
            for (
              let guardAttempt = 0;
              guardAttempt < RESPECT_LAUNCH_ROUTE_GUARD_COUNT;
              guardAttempt += 1
            ) {
              await new Promise<void>((resolve) => {
                window.setTimeout(resolve, RESPECT_LAUNCH_RETRY_DELAY_MS);
              });

              if (history.location.pathname !== PAGES.LIDO_PLAYER) {
                history.replace(launch.pathname + launch.search, launch.state);
              }
            }
            break;
          }

          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, RESPECT_LAUNCH_RETRY_DELAY_MS);
          });
          launch = await prepareRespectLessonLaunch();
        }
      } finally {
        hideNativeSplashScreen();
        isLaunchingRef.current = false;
        setIsPreparing(false);
      }
    };

    document.addEventListener('sendLaunch', launchLesson);
    void launchLesson();
    return () => document.removeEventListener('sendLaunch', launchLesson);
  }, [history]);

  return isPreparing;
};
