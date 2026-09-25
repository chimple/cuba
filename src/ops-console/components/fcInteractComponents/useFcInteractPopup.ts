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
    let loadId = 0;

    const load = async () => {
      const currentLoadId = ++loadId;
      if (mounted && currentLoadId === loadId) {
        setIsQuestionsLoading(true);
        setLocalQuestions([]);
      }

      try {
        const target = spokeWith ?? initialUserType;
        const isBrowserOffline =
          typeof navigator !== 'undefined' && navigator.onLine === false;
        const [cachedQuestions, cachedSchool] = await Promise.all([
          readQuestionsCache<{
            id: string;
            question_text: string;
          }>(status ?? null, target),
          readFcSchoolOfflineCache(schoolId),
        ]);
        const schoolQuestions =
          cachedSchool?.questionsByKey?.[`${target}:${status ?? 'none'}`] ?? [];
        const cachedQuestionList =
          schoolQuestions.length >= (cachedQuestions?.length ?? 0)
            ? schoolQuestions
            : (cachedQuestions ?? []);
        let questions = cachedQuestionList;

        if (!isBrowserOffline) {
          try {
            const fetchedQuestions =
              ((await api.getFilteredFcQuestions(status ?? null, target)) as {
                id: string;
                question_text: string;
              }[]) ?? [];
            if (fetchedQuestions.length > 0 || questions.length === 0) {
              questions = fetchedQuestions;
              await writeQuestionsCache(status ?? null, target, questions);
            }
          } catch (error) {
            logger.error('Question fetch error', error);
          }
        }

        const formattedQuestions =
          questions?.map((q) => ({
            id: q.id,
            question: q.question_text,
          })) ?? [];

        if (mounted && currentLoadId === loadId) {
          setLocalQuestions(formattedQuestions);
        }
      } catch (err) {
        logger.error('Question fetch error', err);
      } finally {
        if (mounted && currentLoadId === loadId) {
          setIsQuestionsLoading(false);
        }
      }
    };

    const retryWhenOnline = () => {
      void load();
    };

    void load();
    window.addEventListener('online', retryWhenOnline);
    return () => {
      mounted = false;
      window.removeEventListener('online', retryWhenOnline);
    };
  }, [api, initialUserType, schoolId, spokeWith, status]);

  return {
    isQuestionsLoading,
    localQuestions,
  };
};
