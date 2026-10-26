import { ServiceConfig } from '../services/ServiceConfig';
import { TableTypes, LANGUAGE, COURSES } from '../common/constants';
import logger from '../utility/logger';
import type {
  CoursePath,
  LessonNode,
  LearningPathCourse,
} from './useLearningPath.helpers';

export const LANGUAGE_VARIANT_PATTERN = /^(.+?)-([a-z]{2,3})$/i;

export const normalizeCourseToken = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

export const getCourseCodeBase = (course?: TableTypes<'course'>) => {
  const normalizedCode = normalizeCourseToken(course?.code);
  const matches = normalizedCode.match(LANGUAGE_VARIANT_PATTERN);
  return matches?.[1] ?? normalizedCode;
};

export const isMathCourse = (course?: TableTypes<'course'>) =>
  getCourseCodeBase(course) === COURSES.MATHS;

export const isLanguageMatchedCourse = (
  course: TableTypes<'course'>,
  languageCode: string,
) => {
  const normalizedCode = normalizeCourseToken(course.code);
  const normalizedName = normalizeCourseToken(course.name);
  const normalizedLanguageCode = normalizeCourseToken(languageCode);

  if (!normalizedLanguageCode) return false;

  return (
    normalizedCode === normalizedLanguageCode ||
    normalizedCode.endsWith(`-${normalizedLanguageCode}`) ||
    normalizedName === normalizedLanguageCode ||
    normalizedName.endsWith(`-${normalizedLanguageCode}`)
  );
};

export const getMathCourseGroupKey = (course: TableTypes<'course'>) =>
  [
    course.subject_id ?? '',
    course.curriculum_id ?? '',
    course.grade_id ?? '',
    course.framework_id ?? '',
    getCourseCodeBase(course),
  ].join('|');

export const getMathCoursePreferenceScore = (
  course: TableTypes<'course'>,
  languageCode: string,
) => {
  if (isLanguageMatchedCourse(course, languageCode)) return 0;
  if (
    isLanguageMatchedCourse(course, COURSES.ENGLISH) ||
    normalizeCourseToken(course.code) === getCourseCodeBase(course)
  ) {
    return 1;
  }
  return 2;
};

export const preferStudentLanguageMathCourses = (
  courses: TableTypes<'course'>[],
  languageCode: string,
) => {
  if (!languageCode) return courses;

  const preferredByGroup = new Map<string, TableTypes<'course'>>();

  courses.forEach((course) => {
    if (!isMathCourse(course)) return;

    const groupKey = getMathCourseGroupKey(course);
    const current = preferredByGroup.get(groupKey);
    if (!current) {
      preferredByGroup.set(groupKey, course);
      return;
    }

    const courseScore = getMathCoursePreferenceScore(course, languageCode);
    const currentScore = getMathCoursePreferenceScore(current, languageCode);
    if (courseScore < currentScore) {
      preferredByGroup.set(groupKey, course);
    }
  });

  const emittedMathGroups = new Set<string>();
  const resolvedCourses: TableTypes<'course'>[] = [];

  courses.forEach((course) => {
    if (!isMathCourse(course)) {
      resolvedCourses.push(course);
      return;
    }

    const groupKey = getMathCourseGroupKey(course);
    const preferredCourse = preferredByGroup.get(groupKey) ?? course;

    // Emit preferred course first
    if (!emittedMathGroups.has(groupKey)) {
      emittedMathGroups.add(groupKey);
      resolvedCourses.push(preferredCourse);
    }

    // Allow additional variants too
    if (course.id !== preferredCourse.id) {
      resolvedCourses.push(course);
    }
  });

  return resolvedCourses;
};

export const resolveStudentLanguageCode = async (
  studentOrLanguageId?: TableTypes<'user'> | string | null,
) => {
  const localLanguageCode = normalizeCourseToken(
    localStorage.getItem(LANGUAGE),
  );
  if (localLanguageCode) return localLanguageCode;

  const languageId =
    typeof studentOrLanguageId === 'string'
      ? studentOrLanguageId
      : studentOrLanguageId?.language_id;
  if (!languageId) return '';

  try {
    const language =
      await ServiceConfig.getI().apiHandler.getLanguageWithId(languageId);
    return normalizeCourseToken(language?.code);
  } catch (e) {
    logger.error('Error resolving student language', e);
    return '';
  }
};

export const sortCoursesByStudentLanguage = async (
  courses: TableTypes<'course'>[],
  studentOrLanguageId?: TableTypes<'user'> | string | null,
) => {
  const languageCode = await resolveStudentLanguageCode(studentOrLanguageId);
  const languagePreferredCourses = preferStudentLanguageMathCourses(
    courses,
    languageCode,
  );

  if (languageCode) {
    const targetCourses = languagePreferredCourses.filter(
      (c) => normalizeCourseToken(c.code) === languageCode,
    );

    if (targetCourses.length > 0) {
      const otherCourses = languagePreferredCourses.filter(
        (c) => normalizeCourseToken(c.code) !== languageCode,
      );
      return [...targetCourses, ...otherCourses];
    }
  }

  if (typeof studentOrLanguageId !== 'object' || !studentOrLanguageId) {
    return languagePreferredCourses;
  }
  if (!studentOrLanguageId.language_id) {
    return languagePreferredCourses;
  }

  try {
    const language = await ServiceConfig.getI().apiHandler.getLanguageWithId(
      studentOrLanguageId.language_id,
    );
    if (!language) return languagePreferredCourses;

    const languageName = normalizeCourseToken(language.name);

    if (languageName) {
      const targetCourses = languagePreferredCourses.filter(
        (c) => normalizeCourseToken(c.name) === languageName,
      );
      if (targetCourses.length > 0) {
        const otherCourses = languagePreferredCourses.filter(
          (c) => normalizeCourseToken(c.name) !== languageName,
        );
        return [...targetCourses, ...otherCourses];
      }
    }
  } catch (e) {
    logger.error('Error sorting courses by language', e);
  }

  return languagePreferredCourses;
};
