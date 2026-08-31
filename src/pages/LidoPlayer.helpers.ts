import { SOURCE } from '../common/constants';
import { palUtil } from '../utility/palUtil';
import logger from '../utility/logger';

export const HOMEWORK_REWARD_COMPLETED_INDEX_KEY =
  'homework_reward_completed_index';
export const PENDING_HOMEWORK_REWARD_TRANSITION_KEY =
  'pending_homework_reward_transition';

const LEARNING_PATH_ASSESSMENT_FINALIZATION_SETTLE_MS = 100;

export const waitForLearningPathAssessmentFinalizationSettle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, LEARNING_PATH_ASSESSMENT_FINALIZATION_SETTLE_MS);
  });

export type AbilityUpdates = Awaited<
  ReturnType<typeof palUtil.updateAndGetAbilities>
>;

export const getSourceFromState = (source: unknown): SOURCE | undefined =>
  Object.values(SOURCE).includes(source as SOURCE)
    ? (source as SOURCE)
    : undefined;

export const resolveLessonZipUrl = async (
  zipBaseUrls: string[],
  lessonId: string,
): Promise<string | null> => {
  for (const baseUrl of Array.from(
    new Set(zipBaseUrls.map((zipUrl) => zipUrl.trim()).filter(Boolean)),
  )) {
    try {
      const zipUrl = new URL(
        `${lessonId}.zip`,
        baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      ).toString();
      logger.warn('[LidoPlayer] Trying ZIP URL', { lessonId, baseUrl, zipUrl });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(zipUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (response.ok) {
          logger.warn('[LidoPlayer] Using ZIP URL', {
            lessonId,
            baseUrl,
            zipUrl,
          });
          return zipUrl;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      logger.warn('[LidoPlayer] Invalid ZIP base URL skipped', {
        baseUrl,
        lessonId,
        error,
      });
    }
  }

  return null;
};
