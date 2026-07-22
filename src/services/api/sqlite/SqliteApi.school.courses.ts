import { MUTATE_TYPES, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SqliteApiSchoolVisits } from './SqliteApi.school.visits';

export class SqliteApiSchoolCourses extends SqliteApiSchoolVisits {
  [key: string]: any;
  protected async upsertJoinLookupRow(
    tableName: TABLES.Class | TABLES.School | TABLES.ClassUser,
    row: TableTypes<'class'> | TableTypes<'school'> | TableTypes<'class_user'>,
  ): Promise<void> {
    const existingColumns = await this.getTableColumns(tableName);
    if (!existingColumns?.length) {
      return;
    }

    const rowData = row as Record<string, unknown>;
    const columns = existingColumns.filter((column: any) =>
      Object.prototype.hasOwnProperty.call(rowData, column),
    );

    if (!columns.length) {
      return;
    }

    const placeholders = columns.map(() => '?').join(', ');
    const updates = columns
      .filter((column: any) => column !== 'id')
      .map((column: any) => `${column} = excluded.${column}`)
      .join(', ');
    const statement = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates};
    `;
    const values = columns.map((column: any) => rowData[column]);

    await this.executeQuery(statement, values);
  }

  async getCoursesByClassId(
    classId: string,
  ): Promise<TableTypes<'class_course'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT *
    FROM ${TABLES.ClassCourse}
    WHERE class_id = ? AND is_deleted = 0
  `;
    const res = await this._db?.query(query, [classId]);
    return res?.values ?? [];
  }

  async getCoursesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'school_course'>[]> {
    try {
      await this.ensureInitialized();
      const query = `
      SELECT *
      FROM ${TABLES.SchoolCourse}
      WHERE school_id = ? AND is_deleted = 0
    `;
      const res = await this._db?.query(query, [schoolId]);
      return res?.values ?? [];
    } catch (e) {
      logger.error('Error in getCoursesBySchoolId', e);
      return [];
    }
  }

  async checkCourseInClasses(
    classIds: string[],
    courseId: string,
  ): Promise<boolean> {
    try {
      if (classIds.length === 0) {
        return false; // No classes to check
      }

      const placeholders = classIds.map(() => '?').join(', ');
      const result = await this.executeQuery(
        `SELECT 1 FROM class_course
         WHERE class_id IN (${placeholders}) AND course_id = ? AND is_deleted = 0
         LIMIT 1`,
        [...classIds, courseId],
      );

      if (!result?.values) return false;
      return result.values.length > 0; // Return true if at least one match is found
    } catch (error) {
      logger.error('Error checking course in classes:', error);
      throw error;
    }
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        logger.warn('No course IDs provided for removal.');
        return;
      }

      const placeholders = ids.map(() => '?').join(', ');
      await this.executeQuery(
        `UPDATE class_course SET is_deleted = 1 WHERE id IN (${placeholders})`,
        ids,
      );

      ids.forEach((id: any) => {
        this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
          id: id,
          is_deleted: true,
        });
      });
    } catch (error) {
      logger.error('Error removing courses from class_course', error);
    }
  }

  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        logger.warn('No course IDs provided for removal.');
        return;
      }

      const placeholders = ids.map(() => '?').join(', ');
      await this.executeQuery(
        `UPDATE school_course SET is_deleted = 1 WHERE id IN (${placeholders})`,
        ids,
      );

      ids.forEach((id: any) => {
        this.updatePushChanges(TABLES.SchoolCourse, MUTATE_TYPES.UPDATE, {
          id: id,
          is_deleted: true,
        });
      });
    } catch (error) {
      logger.error('Error removing courses from school_course', error);
    }
  }

  async deleteUserFromClass(
    userId: string,
    class_id: string,
  ): Promise<boolean | void> {
    if (!userId || !class_id) {
      throw new Error('User ID and Class ID are required');
    }

    // 1️⃣ Call server (RPC)
    const res = await this._serverApi.deleteUserFromClass(userId, class_id);
    if (res === false) {
      throw new Error('Failed to delete user from class');
    }

    // 2️⃣ Sync local DB (pull latest)
    this.syncDB();
  }
}
