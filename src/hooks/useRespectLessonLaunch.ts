import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { PAGES } from '../common/constants';
import {
  prepareRespectLessonLaunch,
  returnToRespectIfNeeded,
  wasRespectLessonLaunchReceived,
} from '../services/respect/RespectLessonLaunchService';
import { hideNativeSplashScreen } from '../startup/nativeRuntime';

const RESPECT_LAUNCH_RETRY_COUNT = 20;
const RESPECT_LAUNCH_RETRY_DELAY_MS = 500;
const RESPECT_LAUNCH_ROUTE_GUARD_COUNT = 10;

export const useRespectLessonLaunch = (): void => {
  const history = useHistory();
  const isLaunchingRef = useRef(false);

  useEffect(() => {
    const launchLesson = async (): Promise<void> => {
      if (isLaunchingRef.current) return;

      isLaunchingRef.current = true;
      let lessonLaunched = false;
      let launch = await prepareRespectLessonLaunch();

      // Cuba restores its last route on startup. A RESPECT deep link must still
      // be prepared when that route is the Lido player, otherwise the player
      // tries to open a bundle before the RESPECT launch has downloaded it.
      if (!launch && !wasRespectLessonLaunchReceived()) {
        isLaunchingRef.current = false;
        return;
      }

      for (let attempt = 0; attempt < RESPECT_LAUNCH_RETRY_COUNT; attempt += 1) {
        if (launch) {
          lessonLaunched = true;
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
      if (!lessonLaunched && wasRespectLessonLaunchReceived()) {
        const returnedToRespect = await returnToRespectIfNeeded();
        if (returnedToRespect) return;
      }
      hideNativeSplashScreen();
      isLaunchingRef.current = false;
    };

    document.addEventListener('sendLaunch', launchLesson);
    void launchLesson();
    return () => document.removeEventListener('sendLaunch', launchLesson);
  }, [history]);
};
