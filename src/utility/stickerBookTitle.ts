import i18n from '../i18n';

type TitleTranslations = Record<string, string>;

const parseTitleTranslations = (
  value: unknown,
): TitleTranslations | undefined => {
  if (!value) return undefined;

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as TitleTranslations;
    }
  } catch {
    // Invalid or legacy values fall through to the existing translations.
  }

  return undefined;
};

export const resolveStickerBookTitle = (
  title: string,
  titleTranslations?: unknown,
  languageCode = i18n.language,
): string => {
  const language = languageCode.toLowerCase().split('-')[0];
  const translations = parseTitleTranslations(titleTranslations);
  const dynamicTitle = translations?.[language];
  const uppercaseTitle = title.toUpperCase();
  const bundledTitle = i18n.exists(title)
    ? i18n.t(title)
    : i18n.exists(uppercaseTitle)
      ? i18n.t(uppercaseTitle)
      : title;

  // Dynamic database value → exact locale key → uppercase legacy locale key → title.
  return dynamicTitle || bundledTitle || title;
};
