import { Preferences } from '@capacitor/preferences';

type CachedQuestion = {
  id: string;
  question_text: string;
};

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

type QuestionApi = {
  getFilteredFcQuestions: (
    status: QuestionStatus,
    target: QuestionTarget,
  ) => Promise<CachedQuestion[]>;
};

const questionKey = (status: string | null, target: string) =>
  `questions_${status ?? 'none'}_${target}`;

const schoolKey = (schoolId: string) => `school_header_${schoolId}`;

export const readQuestionsCache = async <T>(
  status: string | null,
  target: string,
): Promise<T[] | null> => {
  const result = await Preferences.get({ key: questionKey(status, target) });
  if (!result.value) return null;

  try {
    return JSON.parse(result.value) as T[];
  } catch {
    return null;
  }
};

export const writeQuestionsCache = async <T>(
  status: string | null,
  target: string,
  questions: T[],
) => {
  await Preferences.set({
    key: questionKey(status, target),
    value: JSON.stringify(questions),
  });
};

export const ensureQuestionsCached = async ({
  api,
  statuses,
  target,
}: {
  api: QuestionApi;
  statuses: QuestionStatus[];
  target: QuestionTarget;
}) => {
  for (const status of statuses) {
    const cachedQuestions = await readQuestionsCache<CachedQuestion>(
      status,
      target,
    );

    if (cachedQuestions) continue;

    const questions = await api.getFilteredFcQuestions(status, target);
    await writeQuestionsCache(status, target, questions ?? []);
  }
};

export const clearQuestionsCache = async () => {
  const { keys } = await Preferences.keys();
  const questionKeys = keys.filter((key) => key.startsWith('questions_'));

  await Promise.all(questionKeys.map((key) => Preferences.remove({ key })));
};

export const readSchoolHeaderCache = async <T>(
  schoolId: string,
): Promise<T | null> => {
  const result = await Preferences.get({ key: schoolKey(schoolId) });
  if (!result.value) return null;

  try {
    return JSON.parse(result.value) as T;
  } catch {
    return null;
  }
};

export const writeSchoolHeaderCache = async <T>(
  schoolId: string,
  school: T,
) => {
  await Preferences.set({
    key: schoolKey(schoolId),
    value: JSON.stringify(school),
  });
};

export const clearSchoolHeaderCache = async (schoolId: string) => {
  await Preferences.remove({ key: schoolKey(schoolId) });
};

export const clearAllSchoolHeaderCache = async () => {
  const { keys } = await Preferences.keys();
  const schoolHeaderKeys = keys.filter((key) =>
    key.startsWith('school_header_'),
  );

  await Promise.all(schoolHeaderKeys.map((key) => Preferences.remove({ key })));
};

export const clearOtherSchoolHeaderCache = async (schoolId: string) => {
  const { keys } = await Preferences.keys();
  const currentKey = schoolKey(schoolId);
  const otherSchoolHeaderKeys = keys.filter(
    (key) => key.startsWith('school_header_') && key !== currentKey,
  );

  await Promise.all(
    otherSchoolHeaderKeys.map((key) => Preferences.remove({ key })),
  );
};
