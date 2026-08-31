import { MUTATE_TYPES, TABLES, TableTypes } from '../../../common/constants';
import Lesson from '../../../models/Lesson';
import logger from '../../../utility/logger';
import { SqliteApiProgramFieldCoordinator } from './SqliteApi.program.fieldCoordinator';

export class SqliteApiOpsClassOperations extends SqliteApiProgramFieldCoordinator {
  [key: string]: any;
  async getLessonsBylessonIds(
    lessonIds: string[], // Expect an array of strings
  ): Promise<TableTypes<'lesson'>[] | undefined> {
    await this.ensureInitialized();
    if (!lessonIds || lessonIds.length === 0) return;

    const placeholders = lessonIds.map(() => '?').join(', ');
    const query = `SELECT *
      FROM ${TABLES.Lesson}
      WHERE id IN (${placeholders}) AND is_deleted = 0;`;

    const res = await this._db?.query(query, lessonIds);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async deleteTeacher(classId: string, teacherId: string) {
    await this.ensureInitialized();
    try {
      const query = `
      SELECT *
      FROM ${TABLES.ClassUser}
      WHERE user_id = ? AND class_id = ?
      AND role = 'teacher' AND is_deleted = 0
    `;
      const res = await this._db?.query(query, [teacherId, classId]);
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1 WHERE user_id = ? AND class_id = ? AND role = 'teacher' AND is_deleted = 0`,
        [teacherId, classId],
      );

      let userData;

      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
      } else {
        throw new Error('Teacher not found after update.');
      }

      await this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });
    } catch (error) {
      logger.error('🚀 ~ SqliteApi ~ deleteTeacher ~ error:', error);
    }
  }

  async getClassCodeById(class_id: string): Promise<number | undefined> {
    await this.ensureInitialized();
    if (!class_id) return;
    const currentDate = new Date().toISOString(); // Convert to a proper format for SQL (ISO 8601)
    const query = `SELECT code
    FROM ${TABLES.ClassInvite_code}
    WHERE class_id='${class_id}'
    AND is_deleted = FALSE
    AND (expires_at >= '${currentDate}')`;

    try {
      const res = await this._db?.query(query);
      return res?.values?.[0]?.code;
    } catch (error) {
      logger.error('Error executing query:', error); // Log any errors
      return;
    }
  }

  async createClassCode(classId: string): Promise<number> {
    if (!classId) {
      throw new Error('Class ID is required to create a class code.');
    }
    const existingClassCode = await this.getClassCodeById(classId);

    if (existingClassCode) {
      return existingClassCode;
    }
    let classCode = await this._serverApi.createClassCode(classId);
    if (!classCode) {
      throw new Error(`A class code is not created`);
    }
    this.syncDB();
    return classCode;
  }

  async getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    await this.ensureInitialized();
    const query = `SELECT *
       FROM ${TABLES.Result}
       WHERE chapter_id = '${chapter_id}'
       AND course_id = '${course_id}'
       AND class_id ='${classId}'
       AND created_at BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY created_at DESC;`;

    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async getUniqueAssignmentIdsByCourseAndChapter(
    classId: string,
    courseId: string,
    chapterIdOrIds: string | string[],
  ): Promise<string[]> {
    await this.ensureInitialized();
    const chapterIds = Array.isArray(chapterIdOrIds)
      ? chapterIdOrIds.filter(Boolean)
      : [chapterIdOrIds].filter(Boolean);

    if (!chapterIds.length) return [];

    const idslst = chapterIds.map(() => '?').join(', ');
    const query = `
      SELECT DISTINCT id
      FROM ${TABLES.Assignment}
      WHERE class_id = ?
        AND course_id = ?
        AND chapter_id IN (${idslst})
        AND is_deleted = 0;
    `;

    const res = await this._db?.query(query, [
      classId,
      courseId,
      ...chapterIds,
    ]);
    if (!res?.values?.length) return [];

    return res.values
      .map((row: any) => row.id as string | undefined)
      .filter((id: string | undefined): id is string => Boolean(id));
  }
}
