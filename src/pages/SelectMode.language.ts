import { LANG, LANGUAGE, TableTypes } from '../common/constants';
import i18n from '../i18n';
import type { ServiceApi } from '../services/api/ServiceApi';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import logger from '../utility/logger';

type AutoUserModeLanguageApi = Pick<
  ServiceApi,
  'getLanguageWithId' | 'getSchoolById'
>;

const SUPPORTED_LANGUAGE_CODES = new Set<string>(Object.values(LANG));

const getLanguageCodeForId = async (
  apiHandler: AutoUserModeLanguageApi,
  languageId: string,
): Promise<string | undefined> => {
  if (SUPPORTED_LANGUAGE_CODES.has(languageId)) {
    return languageId;
  }

  try {
    const language = await apiHandler.getLanguageWithId(languageId);
    return language?.code ?? undefined;
  } catch (error) {
    logger.error('Failed to resolve auto user mode language:', error);
    return undefined;
  }
};

const resolveAutoUserModeLanguageCode = async (
  apiHandler: AutoUserModeLanguageApi,
  currentSchool?: TableTypes<'school'>,
): Promise<string> => {
  const candidateSchool =
    currentSchool ?? schoolUtil.getCurrentSchool() ?? Util.getCurrentSchool();

  if (candidateSchool?.language) {
    const schoolLanguageCode = await getLanguageCodeForId(
      apiHandler,
      candidateSchool.language,
    );

    if (schoolLanguageCode) {
      return schoolLanguageCode;
    }
  }

  if (candidateSchool?.id) {
    try {
      const freshSchool = await apiHandler.getSchoolById(candidateSchool.id);
      if (freshSchool?.language) {
        const freshSchoolLanguageCode = await getLanguageCodeForId(
          apiHandler,
          freshSchool.language,
        );

        if (freshSchoolLanguageCode) {
          return freshSchoolLanguageCode;
        }
      }
    } catch (error) {
      logger.error('Failed to refresh auto user school language:', error);
    }
  }

  const studentLanguageId = Util.getCurrentStudent()?.language_id;
  if (studentLanguageId) {
    const studentLanguageCode = await getLanguageCodeForId(
      apiHandler,
      studentLanguageId,
    );

    if (studentLanguageCode) {
      return studentLanguageCode;
    }
  }

  return LANG.ENGLISH;
};

export const applyAutoUserModeLanguage = async (
  apiHandler: AutoUserModeLanguageApi,
  school?: TableTypes<'school'>,
): Promise<void> => {
  const languageCode = await resolveAutoUserModeLanguageCode(
    apiHandler,
    school,
  );
  localStorage.setItem(LANGUAGE, languageCode);
  await i18n.changeLanguage(languageCode);
};
