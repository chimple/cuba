import {
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { v4 as uuidv4 } from 'uuid';
import Lesson from '../../../models/Lesson';
import logger from '../../../utility/logger';
import { SqliteApiResultsCourseSelection } from './SqliteApi.results.courseSelection';

export class SqliteApiResultsProgress extends SqliteApiResultsCourseSelection {
  [key: string]: any;
  protected async assignCoursesToStudent(
    studentId: string,
    gradeDocId?: string,
    boardDocId?: string,
    languageDocId?: string,
  ) {
    const now = new Date().toISOString();
    let coursesToAdd: TableTypes<'course'>[] = [];

    // Grade + Board based courses
    if (gradeDocId && boardDocId) {
      coursesToAdd = await this.getCourseByUserGradeId(gradeDocId, boardDocId);
    }
    // Fallback default courses
    else {
      const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
      const mathsCourse = await this.resolveMathCourseByLanguage(languageDocId);
      const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);

      let langCourse: TableTypes<'course'> | undefined;

      if (languageDocId) {
        const language = await this.getLanguageWithId(languageDocId);

        if (language && language.code !== COURSES.ENGLISH) {
          const thirdLanguageCourseMap: Record<string, string> = {
            hi: CHIMPLE_HINDI,
            kn: GRADE1_KANNADA,
            mr: GRADE1_MARATHI,
          };

          const courseId = thirdLanguageCourseMap[language.code ?? ''];
          if (courseId) {
            langCourse = await this.getCourse(courseId);
          }
        }
      }

      coursesToAdd = [
        englishCourse,
        mathsCourse,
        langCourse,
        digitalSkillsCourse,
      ].filter(Boolean) as TableTypes<'course'>[];
    }

    // Insert only if not exists
    for (let idx = 0; idx < coursesToAdd.length; idx++) {
      const course = coursesToAdd[idx];
      const isLast = idx === coursesToAdd.length - 1;

      // Prevent duplicates
      const result = await this.executeQuery(
        `
        SELECT COUNT(*) as count
        FROM user_course
        WHERE user_id = ?
          AND course_id = ?
          AND is_deleted = false;
      `,
        [studentId, course.id],
      );

      const count = result?.values?.[0]?.count ?? 0;
      if (count > 0) continue;

      const newUserCourse: TableTypes<'user_course'> = {
        id: uuidv4(),
        user_id: studentId,
        course_id: course.id,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        is_firebase: null,
      };

      await this.executeQuery(
        `
        INSERT INTO user_course (id, user_id, course_id)
        VALUES (?, ?, ?);
      `,
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id],
      );

      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse,
      );
    }
  }

  async getStudentProgress(studentId: string): Promise<
    Record<
      string,
      (TableTypes<'result'> & {
        lesson_name?: string;
        chapter_name?: string;
      })[]
    >
  > {
    await this.ensureInitialized();
    const query = `
      SELECT r.*, l.name AS lesson_name, c.course_id AS course_id, c.name AS chapter_name
      FROM ${TABLES.Result} r
      JOIN ${TABLES.Lesson} l ON r.lesson_id = l.id
      JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id and r.chapter_id=cl.chapter_id
      JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id and r.course_id=c.course_id
      WHERE r.student_id = '${studentId}'
    `;
    const res = await this._db?.query(query);
    const resultMap: Record<
      string,
      (TableTypes<'result'> & { lesson_name?: string; chapter_name?: string })[]
    > = {};
    if (res && res.values) {
      res.values.forEach((result: any) => {
        const courseId = result.course_id;
        if (!resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        resultMap[courseId].push(
          result as TableTypes<'result'> & {
            lesson_name?: string;
            chapter_name?: string;
          },
        );
      });
    }
    return resultMap;
  }

  async getStudentResult(
    studentId: string,
    fromCache?: boolean,
  ): Promise<TableTypes<'result'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT * FROM ${TABLES.Result}
    where student_id = '${studentId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getStudentResultInMap(
    studentId: string,
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'> }> {
    await this.ensureInitialized();
    const query = `
    SELECT *
    FROM ${TABLES.Result}
    WHERE (student_id = '${studentId}')
    AND (lesson_id, updated_at) IN (
    SELECT lesson_id, MAX(updated_at)
    FROM ${TABLES.Result}
    WHERE student_id = '${studentId}'
    GROUP BY lesson_id
  );
    `;
    const res = await this._db?.query(query);
    logger.info('🚀 ~ SqliteApi ~ getStudentResultInMap ~ res:', res?.values);
    if (!res || !res.values || res.values.length < 1) return {};
    const resultMap: { [lessonDocId: string]: TableTypes<'result'> } = {};
    for (const data of res.values) {
      resultMap[data.lesson_id] = data;
    }
    return resultMap;
  }

  async hasStudentResult(studentId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const { classes } = await this.getStudentClassesAndSchools(studentId);
      const classId = this.currentClass?.id ?? classes[0]?.id;

      if (classes.length > 0) {
        if (!classId) {
          logger.warn(
            '[SqliteApi] Unable to resolve class for linked student result check',
            { studentId },
          );
          return false;
        }

        const res = await this._db?.query(
          `SELECT 1
         FROM ${TABLES.Result}
         WHERE student_id = "${studentId}"
           AND class_id = "${classId}"
           AND is_deleted = 0
         LIMIT 1`,
        );
        return (res?.values?.length ?? 0) > 0;
      }

      const res = await this._db?.query(
        `SELECT 1
       FROM ${TABLES.Result}
       WHERE student_id = "${studentId}"
         AND is_deleted = 0
       LIMIT 1`,
      );
      return (res?.values?.length ?? 0) > 0;
    } catch (error) {
      logger.error('Error checking student result', error);
      return true;
    }
  }
}
