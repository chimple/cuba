import type { ServiceApi } from '../api/ServiceApi';

type QuestionStatus =
  | 'need_help'
  | 'still_learning'
  | 'doing_good'
  | 'not_tracked'
  | 'not_assigning'
  | 'once_to_two'
  | 'three_to_four'
  | 'four_plus'
  | null;

type QuestionTarget =
  | 'class'
  | 'school'
  | 'principal'
  | 'teacher'
  | 'parent'
  | 'student';

export type FcOfflineQuestion = {
  id: string;
  question_text: string;
};

const questionKey = (target: QuestionTarget, status: QuestionStatus) =>
  `${target}:${status ?? 'none'}`;

export const fetchFcQuestionsForOffline = async (api: ServiceApi) => {
  const targets: QuestionTarget[] = [
    'school',
    'class',
    'student',
    'parent',
    'teacher',
    'principal',
  ];
  const statuses: QuestionStatus[] = [
    null,
    'need_help',
    'still_learning',
    'doing_good',
    'not_tracked',
    'not_assigning',
    'once_to_two',
    'three_to_four',
    'four_plus',
  ];
  const questionEntries = await Promise.all(
    targets.flatMap((target) =>
      statuses.map(async (status) => {
        const questions = (await api.getFilteredFcQuestions(
          status,
          target,
        )) as FcOfflineQuestion[];
        return [questionKey(target, status), questions ?? []] as const;
      }),
    ),
  );

  return Object.fromEntries(questionEntries);
};
