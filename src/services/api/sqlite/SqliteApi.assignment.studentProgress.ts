import { MUTATE_TYPES, TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import {
  AssignmentBatchGroupRow,
  AssignmentDateRangeData,
  OpsStudentPerformanceBandRow,
  OpsStudentPerformanceBandsParams,
} from '../ServiceApi';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiAssignmentTeacherAssignments } from './SqliteApi.assignment.teacherAssignments';

export class SqliteApiAssignmentStudentProgress extends SqliteApiAssignmentTeacherAssignments {
  [key: string]: any;
  async getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    await this.ensureInitialized();
    const courseholders = courseIds.map(() => '?').join(', ');

    const query = `
    SELECT *
    FROM ${TABLES.Result}
    WHERE student_id = ?
    AND course_id IN (${courseholders})
    AND class_id = ?
    AND created_at BETWEEN ? AND ?
    ORDER BY created_at DESC;
  `;

    const params = [studentId, ...courseIds, classId, startDate, endDate];

    const res = await this._db?.query(query, params);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async getStudentPlayStatus(
    studentId: string,
    classId: string,
  ): Promise<{ hasPlayed: boolean; lastPlayedAt?: string }> {
    await this.ensureInitialized();
    const query = `
      SELECT created_at
      FROM ${TABLES.Result}
      WHERE student_id = ?
      AND class_id = ?
      AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const params = [studentId, classId];
    const res = await this._db?.query(query, params);
    const firstRow = res?.values?.[0] as { created_at?: string } | undefined;

    if (!firstRow?.created_at) {
      return { hasPlayed: false };
    }

    return { hasPlayed: true, lastPlayedAt: firstRow.created_at };
  }

  async getOpsStudentPerformanceBands(
    params: OpsStudentPerformanceBandsParams,
  ): Promise<OpsStudentPerformanceBandRow[]> {
    logger.warn(
      'getOpsStudentPerformanceBands is not supported in SQLite mode',
    );
    return this._serverApi.getOpsStudentPerformanceBands(params);
  }

  async getAssignmentDateRangeDataForClassAndSchool(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<AssignmentDateRangeData> {
    await this.ensureInitialized();

    const query = `
      SELECT
        *
      FROM ${TABLES.Assignment}
      WHERE created_by = ?
        AND created_at >= ?
        AND created_at <= ?
        AND (is_deleted = 0 OR is_deleted = false OR is_deleted IS NULL)
      ORDER BY created_at ASC;
    `;

    try {
      const res = await this.executeQuery(query, [userId, startDate, endDate]);

      const assignments = (res?.values ?? []) as TableTypes<'assignment'>[];
      const groupedByBatch = new Map<string, AssignmentBatchGroupRow>();

      assignments.forEach((assignment: any) => {
        const batchId = assignment.batch_id ?? null;
        const key = batchId ?? '__null_batch_id__';
        const existing = groupedByBatch.get(key);

        if (!existing) {
          groupedByBatch.set(key, {
            batchId,
            assignmentCount: 1,
            latestCreatedAt: assignment.created_at ?? null,
          });
          return;
        }

        existing.assignmentCount += 1;
        if (
          assignment.created_at &&
          (!existing.latestCreatedAt ||
            assignment.created_at > existing.latestCreatedAt)
        ) {
          existing.latestCreatedAt = assignment.created_at;
        }
      });

      const batchGroups = Array.from(groupedByBatch.values()).sort((a, b) => {
        const aTime = a.latestCreatedAt
          ? new Date(a.latestCreatedAt).getTime()
          : Number.NEGATIVE_INFINITY;
        const bTime = b.latestCreatedAt
          ? new Date(b.latestCreatedAt).getTime()
          : Number.NEGATIVE_INFINITY;
        return aTime - bTime;
      });

      return { assignments, batchGroups };
    } catch (error) {
      logger.error(
        'Error fetching assignment date range data from sqlite:',
        error,
      );
      return { assignments: [], batchGroups: [] };
    }
  }

  async getCoinAndStreakCount(
    userId: string,
    classId: string,
    schoolId: string,
  ): Promise<{ coins: number; streak: number } | undefined> {
    logger.warn('coming here....................');
    await this.ensureInitialized();
    const query = `
    SELECT coins , streak
    FROM ${TABLES.UserAchivements}
    where user_id = ?
    and (is_deleted = 0 OR is_deleted = false OR is_deleted IS NULL)
    ORDER BY created_at DESC`;

    try {
      const res = await this._db?.query(query, [userId]);
      logger.warn('data or result', res?.values);
      if (res?.values && res.values.length > 0) {
        const { coins, streak } = res.values[0];
        return { coins, streak };
      }
    } catch (error) {
      logger.error('Error fetching coin and streak count:', error);
    }
    return undefined;
  }

  async updateCoins(
    userId: string,
    schoolId: string,
    classId: string,
    coins: number,
    streakIncrement = 0,
  ): Promise<TableTypes<TABLES.UserAchivements>> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const coinsToAdd = Number(coins) || 0;
    const streakToAdd = Number(streakIncrement) || 0;

    try {
      const existingRes = await this.executeQuery(
        `
      SELECT *
      FROM ${TABLES.UserAchivements}
      WHERE user_id = ?
        AND (is_deleted = 0 OR is_deleted = false OR is_deleted IS NULL)
      ORDER BY created_at DESC
      LIMIT 1;
      `,
        [userId],
      );

      const existing = existingRes?.values?.[0] as
        | (TableTypes<TABLES.UserAchivements> & { id?: string })
        | undefined;

      if (existing) {
        const updatedCoins = Number(existing.coins ?? 1000) + coinsToAdd;
        const updatedStreak = Number(existing.streak ?? 0) + streakToAdd;

        await this.executeQuery(
          `
        UPDATE ${TABLES.UserAchivements}
        SET coins = ?, streak = ?, updated_at = ?, is_deleted = 0
        WHERE user_id = ?;
        `,
          [updatedCoins, updatedStreak, now, userId],
        );

        const updatedRow = {
          ...existing,
          coins: updatedCoins,
          streak: updatedStreak,
          updated_at: now,
          is_deleted: false,
        } as TableTypes<TABLES.UserAchivements>;

        await this.updatePushChanges(
          TABLES.UserAchivements,
          MUTATE_TYPES.UPDATE,
          updatedRow,
        );

        return updatedRow;
      }

      const id = uuidv4();
      const newRow = {
        id,
        user_id: userId,
        school_id: schoolId,
        class_id: classId,
        program_id: null,
        coins: 1000 + coinsToAdd,
        streak: streakToAdd,
        last_rewarded_week: null,
        last_penalty_week: null,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      } as TableTypes<TABLES.UserAchivements>;

      await this.executeQuery(
        `
      INSERT INTO ${TABLES.UserAchivements}
      (
        id, user_id, program_id, school_id, class_id, coins, streak,
        last_rewarded_week, last_penalty_week, is_deleted, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
        [
          id,
          userId,
          null,
          schoolId,
          classId,
          1000 + coinsToAdd,
          streakToAdd,
          null,
          null,
          0,
          now,
          now,
        ],
      );

      await this.updatePushChanges(
        TABLES.UserAchivements,
        MUTATE_TYPES.INSERT,
        newRow,
      );

      return newRow;
    } catch (error) {
      logger.error('Error updating/inserting user_achievements coins:', error);
      throw error;
    }
  }

  async getTeacherJoinedDate(
    userId: string,
    classId: string,
  ): Promise<TableTypes<'class_user'> | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT *
    FROM ${TABLES.ClassUser}
    WHERE user_id = $1
    AND role = $2 AND class_id = $3 AND is_deleted = 0
    LIMIT 1`;

    const values = [userId, RoleType.TEACHER, classId];

    try {
      const res = await this._db?.query(query, values);
      if (res?.values) {
        return res.values[0];
      }
    } catch (error) {
      logger.error('Error fetching teacher joined date:', error);
    }

    return undefined;
  }

  async getAssignedStudents(assignmentId: string): Promise<string[]> {
    await this.ensureInitialized();
    //getting the student ids for the individual assignments
    const query = `
    SELECT user_id
    FROM assignment_user
    WHERE assignment_id = '${assignmentId}';
  `;

    try {
      const res = await this._db?.query(query);
      let userIds: string[] = [];

      if (res?.values) {
        userIds = res?.values.map((row: { user_id: string }) => row.user_id);
      }

      return userIds ?? [];
    } catch (error) {
      logger.error('Error fetching user IDs:', error);
      return [];
    }
  }
}
