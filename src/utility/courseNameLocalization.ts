import { t } from 'i18next';
import { COURSES, TableTypes } from '../common/constants';

const LANGUAGE_COURSES = new Set<string>([
  COURSES.ENGLISH,
  COURSES.HINDI,
  COURSES.KANNADA,
  COURSES.MARATHI,
  COURSES.SIERRA_LEONE_ENGLISH,
]);

const DB_LOCALIZED_COURSE_NAMES_BY_CODE = new Map<string, string>([
  [COURSES.MATHS_HINDI, '\u0917\u0923\u093f\u0924'],
  [COURSES.MATHS_KANNADA, '\u0c97\u0ca3\u0cbf\u0ca4'],
]);

const DB_LOCALIZED_COURSE_NAMES = new Set<string>(
  DB_LOCALIZED_COURSE_NAMES_BY_CODE.values(),
);

export const getCourseDisplayName = (course?: TableTypes<'course'>) => {
  if (!course?.name) return '';

  const dbLocalizedName = DB_LOCALIZED_COURSE_NAMES_BY_CODE.get(
    course.code ?? '',
  );
  if (dbLocalizedName) return dbLocalizedName;

  if (
    LANGUAGE_COURSES.has(course.code ?? '') ||
    DB_LOCALIZED_COURSE_NAMES.has(course.name)
  ) {
    return course.name;
  }

  if (!course.name.includes('-')) {
    return t(course.name);
  }

  return course.name
    .split('-')
    .map((part) => t(part.trim()))
    .join('-');
};
