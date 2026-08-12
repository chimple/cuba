import {
  LATEST_LEARNING_PATH,
  LATEST_STARS,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import Course from '../../../models/Course';
import logger from '../../../utility/logger';
import { SqliteApiOpsValidation } from './SqliteApi.ops.validation';
import { ServiceConfig } from '../../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';

export class SqliteApiOpsLearningPath extends SqliteApiOpsValidation {
  [key: string]: any;
  async setStarsForStudents(
    studentId: string,
    starsCount: number,
  ): Promise<void> {
    if (!studentId) return;
    try {
      const be = await this.getUserByDocId(studentId);
      const latestStarsKey = LATEST_STARS(studentId);
      const currentLocalStars = parseInt(
        localStorage.getItem(latestStarsKey) || '0',
        10,
      );

      const nextLocalStars = currentLocalStars + starsCount;
      logger.info('zuzu 2', { studentId, stars: nextLocalStars });

      localStorage.setItem(latestStarsKey, nextLocalStars.toString());

      await this.executeQuery(
        `UPDATE ${TABLES.User} SET stars = COALESCE(stars, 0) + ? WHERE id = ?;`,
        [starsCount, studentId],
      );

      const updatedStudent = await this.getUserByDocId(studentId);
      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: studentId,
        stars: updatedStudent?.stars,
      });
    } catch (error) {
      logger.error('Error setting stars for student:', error);
    }
  }

  async getCoursesForPathway(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const query = `
      SELECT *
      FROM ${TABLES.UserCourse} AS uc
      JOIN ${TABLES.Course} AS course ON uc.course_id = course.id
      WHERE uc.user_id = "${studentId}"  AND uc.is_deleted = 0
      ORDER BY course.sort_index ASC;
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async updateLearningPath(
    student: TableTypes<'user'>,
    learningPath: string,
  ): Promise<TableTypes<'user'>> {
    let updatedStudent = student;
    try {
      const now = new Date().toISOString();
      const updateUserQuery = `UPDATE ${TABLES.User}
      SET learning_path = ?, updated_at = ?
      WHERE id = ?;`;
      await this.executeQuery(updateUserQuery, [learningPath, now, student.id]);
      updatedStudent = { ...student, learning_path: learningPath };
      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: student.id,
        learning_path: learningPath,
      });
      const latestPathToSave = {
        studentId: student.id,
        learningPath,
        updated_at: new Date(Date.now() + 10000).toISOString(),
      };
      const latestLearningPathKey = `${LATEST_LEARNING_PATH}:${student.id}`;
      localStorage.setItem(
        latestLearningPathKey,
        JSON.stringify(latestPathToSave),
      );
    } catch (error) {
      logger.error('Error updating learning path:', error);
    }
    return updatedStudent;
  }

  async getClassByUserId(
    userId: string,
  ): Promise<TableTypes<'class'> | undefined> {
    await this.ensureInitialized();
    // Step 1: Get class_id from class_user
    const classUserRes = await this._db?.query(
      `SELECT class_id FROM ${TABLES.ClassUser} WHERE user_id = "${userId}" AND is_deleted = false`,
    );
    if (!classUserRes || !classUserRes.values || classUserRes.values.length < 1)
      return;
    const classId = classUserRes.values[0].class_id;

    // Step 2: Get class from class table using class_id
    const classRes = await this._db?.query(
      `SELECT * FROM ${TABLES.Class} WHERE id = "${classId}" AND is_deleted = false`,
    );

    if (!classRes || !classRes.values || classRes.values.length < 1) return;
    return classRes.values[0];
  }

  async countAllPendingPushes(): Promise<number> {
    await this.ensureInitialized();
    if (!this._db) return 0;
    const tableNames = Object.values(TABLES);
    const tables = "'" + tableNames.join("', '") + "'";

    const tablePushSync = `SELECT * FROM push_sync_info WHERE table_name IN (${tables}) ORDER BY created_at;`;
    let res: any[] = [];
    try {
      res = (await this._db.query(tablePushSync)).values ?? [];
      return res.length;
    } catch (error) {
      logger.error('❌ Failed to count pending changes:', error);
      return 0;
    }
  }

  async getDebugInfoLast30Days(parentId: string): Promise<any[]> {
    await this.createDebugInfoTables();
    this.deleteOldDebugInfoData();

    const query = `
    SELECT
      parent_id,
      SUM(No_of_pushed) AS total_pushed,
      SUM(No_of_pulled) AS total_pulled,
      SUM(data_transferred) AS total_transferred,
      DATE(updated_at) AS date
    FROM debug_info
    WHERE parent_id = ?
      AND DATE(updated_at) >= DATE('now', '-30 days')
    GROUP BY DATE(updated_at)
    ORDER BY DATE(updated_at) DESC
  `;
    const result = await this.executeQuery(query, [parentId]);
    return result?.values || [];
  }

  async updateDebugInfo(
    noOfPushed?: number,
    noOfPulled?: number,
    dataTransferred?: number,
  ) {
    await this.createDebugInfoTables();

    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    const parentId = currentUser?.id;
    const today = new Date().toISOString().split('T')[0];
    if (!parentId) {
      return;
    }

    const selectQuery = `
      SELECT * FROM debug_info
      WHERE parent_id = ? AND DATE(updated_at) = ?
    `;
    const existingRows = await this.executeQuery(selectQuery, [
      parentId,
      today,
    ]);

    if (existingRows?.values?.length && existingRows.values.length > 0) {
      // Update existing row
      const updateParts: string[] = ['updated_at = CURRENT_TIMESTAMP'];
      const params: any[] = [];

      if (noOfPushed !== undefined) {
        updateParts.push('No_of_pushed = No_of_pushed + ?');
        params.push(noOfPushed);
      }
      if (noOfPulled !== undefined) {
        updateParts.push('No_of_pulled = No_of_pulled + ?');
        params.push(noOfPulled);
      }
      if (dataTransferred !== undefined) {
        updateParts.push('data_transferred = data_transferred + ?');
        params.push(dataTransferred);
      }
      const updateQuery = `
        UPDATE debug_info SET ${updateParts.join(', ')}
        WHERE parent_id = ? AND DATE(updated_at) = ?
      `;
      params.push(parentId, today);
      await this.executeQuery(updateQuery, params);
    } else {
      // Insert new row
      const insertQuery = `
        INSERT INTO debug_info (
          id, parent_id,
          No_of_pushed, No_of_pulled, data_transferred,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      await this.executeQuery(insertQuery, [
        uuidv4(),
        parentId,
        noOfPushed ?? 0,
        noOfPulled ?? 0,
        dataTransferred ?? 0,
      ]);
    }
  }
}
