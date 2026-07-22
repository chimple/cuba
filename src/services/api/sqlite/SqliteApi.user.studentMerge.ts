import logger from '../../../utility/logger';
import { SqliteApiUserStudentLists } from './SqliteApi.user.studentLists';

export class SqliteApiUserStudentMerge extends SqliteApiUserStudentLists {
  [key: string]: any;
  async mergeStudentRequest(
    existingStudentId: string,
    newStudentId: string,
    requestId?: string,
    respondedBy?: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();
    if (!this._db) {
      return { success: false, message: 'SQLite DB not initialized.' };
    }

    const now = new Date().toISOString();

    try {
      // 1. Get new student
      const newStudentRes = await this._db.query(
        `SELECT * FROM user WHERE id = ? AND is_deleted = 0`,
        [newStudentId],
      );
      const newStudent = newStudentRes?.values?.[0];
      if (!newStudent) {
        return { success: false, message: 'New student not found' };
      }

      const newParentsRes = await this._db.query(
        `SELECT p.* FROM parent_user pu
       JOIN user p ON pu.parent_id = p.id
       WHERE pu.student_id = ? AND pu.is_deleted = 0 AND p.is_deleted = 0`,
        [newStudentId],
      );
      const newParents = newParentsRes?.values || [];

      // 2. Get existing student
      const existingStudentRes = await this._db.query(
        `SELECT * FROM user WHERE id = ? AND is_deleted = 0`,
        [existingStudentId],
      );
      const existingStudent = existingStudentRes?.values?.[0];
      if (!existingStudent) {
        return { success: false, message: 'Existing student not found' };
      }

      const existingParentsRes = await this._db.query(
        `SELECT p.* FROM parent_user pu
       JOIN user p ON pu.parent_id = p.id
       WHERE pu.student_id = ? AND pu.is_deleted = 0 AND p.is_deleted = 0`,
        [existingStudentId],
      );
      const existingParents = existingParentsRes?.values || [];

      // 3. Compare contacts
      const existingContact =
        existingParents?.[0]?.phone || existingParents?.[0]?.email || null;
      const newContact =
        newParents?.[0]?.phone || newParents?.[0]?.email || null;

      // 4. Transfer results (⚠️ FIXED: you had reversed IDs before)
      const resultRes = await this._db.query(
        `SELECT * FROM result WHERE student_id = ? AND is_deleted = 0`,
        [existingStudentId],
      );
      const results = resultRes?.values || [];

      if (results.length > 0) {
        await this._db.run(
          `UPDATE result SET student_id = ?, updated_at = ?
         WHERE student_id = ? AND is_deleted = 0`,
          [newStudentId, now, existingStudentId],
        );
      }

      // 4. Update active FC interactions to point to the merged student.
      const fcFormsUpdateResult = await this.updateFcUserFormsContactUserId(
        existingStudentId,
        newStudentId,
      );
      if (!fcFormsUpdateResult.success) {
        throw new Error(fcFormsUpdateResult.message);
      }

      // 5. Link parents if different
      if (newContact && newContact !== existingContact) {
        for (const parent of newParents) {
          const alreadyLinked = existingParents.some(
            (p: any) =>
              (p.phone && parent.phone && p.phone === parent.phone) ||
              (p.email && parent.email && p.email === parent.email),
          );

          if (!alreadyLinked) {
            await this._db.run(
              `INSERT INTO parent_user
             (student_id, parent_id, is_deleted, created_at, updated_at)
             VALUES (?, ?, 0, ?, ?)`,
              [existingStudentId, parent.id, now, now],
            );
          }
        }
      }

      // 6. Soft delete merged student
      await this._db.run(
        `UPDATE class_user SET is_deleted = 1, updated_at = ? WHERE user_id = ?`,
        [now, existingStudentId],
      );

      await this._db.run(
        `UPDATE parent_user SET is_deleted = 1, updated_at = ? WHERE student_id = ?`,
        [now, existingStudentId],
      );

      await this._db.run(
        `UPDATE user SET is_deleted = 1, updated_at = ? WHERE id = ?`,
        [now, existingStudentId],
      );

      // 7. Optional ops request update
      if (requestId) {
        await this._db.run(
          `UPDATE ops_requests
         SET status = 'approved', merged_to = ?, updated_at = ?, responded_by = ?
         WHERE request_id = ?`,
          [newStudentId, now, respondedBy ?? null, requestId],
        );
      }

      // ✅ SUCCESS RETURN
      return {
        success: true,
        message: 'Students merged successfully.',
      };
    } catch (error: any) {
      logger.error(
        'Error merging student in SQLite (mergeStudentRequestSqlite):',
        error,
      );

      return {
        success: false,
        message: error?.message || 'Failed to merge students.',
      };
    }
  }
}
