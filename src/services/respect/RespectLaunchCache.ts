import logger from '../../utility/logger';

export interface RespectLessonLaunchState {
  courseDocId: string;
  lesson: string;
  lessonId: string;
}

const RESPECT_LESSON_LAUNCH_STATE_KEY = 'respectLessonLaunchState';

export const getPreparedRespectLessonLaunchState = ():
  | RespectLessonLaunchState
  | undefined => {
  if (typeof sessionStorage === 'undefined') return undefined;

  try {
    const rawState = sessionStorage.getItem(RESPECT_LESSON_LAUNCH_STATE_KEY);
    if (!rawState) return undefined;

    const state = JSON.parse(rawState) as Partial<RespectLessonLaunchState>;
    if (
      typeof state.courseDocId !== 'string' ||
      typeof state.lesson !== 'string' ||
      typeof state.lessonId !== 'string'
    ) {
      return undefined;
    }

    return {
      courseDocId: state.courseDocId,
      lesson: state.lesson,
      lessonId: state.lessonId,
    };
  } catch (error) {
    logger.warn('[RespectLessonLaunch] Invalid cached route state', error);
    return undefined;
  }
};

export const cachePreparedRespectLessonLaunchState = (
  state: RespectLessonLaunchState,
): void => {
  if (typeof sessionStorage === 'undefined') return;

  try {
    sessionStorage.setItem(
      RESPECT_LESSON_LAUNCH_STATE_KEY,
      JSON.stringify(state),
    );
  } catch (error) {
    logger.warn('[RespectLessonLaunch] Failed to cache route state', error);
  }
};
