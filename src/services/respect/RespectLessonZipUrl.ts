import {
  getBundleZipUrlsForEnv,
  getLidoBundleZipUrlsForEnv,
} from '../RemoteConfig';

const TRUSTED_LESSON_BUNDLE_BASE_URLS = (['dev', 'prod'] as const)
  .flatMap((environment) => [
    ...getBundleZipUrlsForEnv(environment),
    ...getLidoBundleZipUrlsForEnv(environment),
  ])
  .map((baseUrl) => new URL(baseUrl));

export const getOpenEelLessonZipUrl = (
  zipUrl: string | undefined,
  lessonId: string,
): string | undefined => {
  if (!zipUrl?.trim() || !lessonId) return undefined;

  try {
    const parsedUrl = new URL(zipUrl.trim());
    const isTrustedLessonUrl = TRUSTED_LESSON_BUNDLE_BASE_URLS.some(
      (baseUrl) => {
        const expectedUrl = new URL(
          `${encodeURIComponent(lessonId)}.zip`,
          baseUrl,
        );
        return (
          parsedUrl.origin === expectedUrl.origin &&
          parsedUrl.pathname === expectedUrl.pathname
        );
      },
    );

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.hash ||
      !isTrustedLessonUrl
    ) {
      return undefined;
    }

    return zipUrl.trim();
  } catch {
    return undefined;
  }
};
