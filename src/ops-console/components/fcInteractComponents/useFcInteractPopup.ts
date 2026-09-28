import { useEffect, useState } from 'react';
import { EnumType } from '../../../common/constants';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import {
  readQuestionsCache,
  writeQuestionsCache,
} from '../../../services/offline/offlineCache';
import { readFcSchoolOfflineCache } from '../../../services/offline/fcSchoolOfflineCache';
import type { FcQuestion } from './fcInteractOptions';

type FcInteractPopupParams = {
  schoolId: string;
  status?: EnumType<'fc_support_level'>;
  initialUserType: EnumType<'fc_engagement_target'>;
  spokeWith: EnumType<'fc_engagement_target'>;
};

export const useFcInteractPopup = ({
  schoolId,
  status,
  initialUserType,
  spokeWith,
}: FcInteractPopupParams) => {
  const api = ServiceConfig.getI().apiHandler;
  const [localQuestions, setLocalQuestions] = useState<FcQuestion[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) {
        setIsQuestionsLoading(true);
        setLocalQuestions([]);
      }

      try {
        const target = spokeWith ?? initialUserType;
        const isBrowserOffline =
          typeof navigator !== 'undefined' && navigator.onLine === false;
        const cachedQuestions = isBrowserOffline
          ? await readQuestionsCache<{
              id: string;
              question_text: string;
            }>(status ?? null, target)
          : null;
        let questions = cachedQuestions ?? [];

        if (!cachedQuestions && isBrowserOffline) {
          const cachedSchool = await readFcSchoolOfflineCache(schoolId);
          questions =
            cachedSchool?.questionsByKey?.[`${target}:${status ?? 'none'}`] ??
            [];
        }

        if (!cachedQuestions && questions.length === 0) {
          if (isBrowserOffline) {
            questions = [];
          } else {
            questions = (await api.getFilteredFcQuestions(
              status ?? null,
              target,
            )) as {
              id: string;
              question_text: string;
            }[];
            await writeQuestionsCache(status ?? null, target, questions ?? []);
          }
        }

        const formattedQuestions =
          questions?.map((q) => ({
            id: q.id,
            question: q.question_text,
          })) ?? [];

        if (mounted) {
          setLocalQuestions(formattedQuestions);
        }
      } catch (err) {
        logger.error('Question fetch error', err);
      } finally {
        if (mounted) setIsQuestionsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [api, initialUserType, schoolId, spokeWith, status]);

  return {
    isQuestionsLoading,
    localQuestions,
  };
};
