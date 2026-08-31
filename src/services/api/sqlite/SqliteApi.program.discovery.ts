import {
  GeoDataParams,
  MUTATE_TYPES,
  RequestTypes,
  STATUS,
  SearchSchoolsParams,
  SearchSchoolsResult,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiProgramRequestReview } from './SqliteApi.program.requestReview';

export class SqliteApiProgramDiscovery extends SqliteApiProgramRequestReview {
  [key: string]: any;
  async getFieldCoordinatorsByProgram(
    programId: string,
  ): Promise<{ data: TableTypes<'user'>[] }> {
    return await this._serverApi.getFieldCoordinatorsByProgram(programId);
  }

  async getProgramsByRole(): Promise<{ data: TableTypes<'program'>[] }> {
    return await this._serverApi.getProgramsByRole();
  }

  async updateSchoolStatus(
    schoolId: string,
    schoolStatus: (typeof STATUS)[keyof typeof STATUS],
    address?: {
      state?: string;
      district?: string;
      block?: string;
      address?: string;
    },
    keyContacts?: any,
  ): Promise<void> {
    return await this._serverApi.updateSchoolStatus(
      schoolId,
      schoolStatus,
      address,
      keyContacts,
    );
  }

  async getGeoData(params: GeoDataParams): Promise<string[]> {
    return await this._serverApi.getGeoData(params);
  }

  async getClientCountryCode(): Promise<any> {
    return await this._serverApi.getClientCountryCode();
  }

  async getLocaleByIdOrCode(
    locale_id?: string,
    locale_code?: string,
  ): Promise<TableTypes<'locale'> | null> {
    if (!locale_id && !locale_code) {
      return null;
    }

    let query = `SELECT * FROM locale WHERE is_deleted = 0`;
    const params: any[] = [];

    if (locale_id) {
      query += ` AND id = ?`;
      params.push(locale_id);
    } else {
      query += ` AND code = ?`;
      params.push(locale_code);
    }
    query += ` LIMIT 1`;
    const res = await this.executeQuery(query, params);

    if (res?.values && res.values.length > 0) {
      return res.values[0] as TableTypes<'locale'>;
    }

    return null;
  }

  async searchSchools(
    params: SearchSchoolsParams,
  ): Promise<SearchSchoolsResult> {
    {
      return await this._serverApi.searchSchools(params);
    }
  }

  async sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string,
  ): Promise<void> {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw 'User is not Logged in';
    const ops_request_id = uuidv4();

    const now = new Date().toISOString();
    const newRequest = {
      id: ops_request_id,
      school_id: schoolId,
      class_id: classId ?? null,
      request_type: requestType,
      requested_by: currentUser.id,
      request_status: STATUS.REQUESTED,
      rejected_reason_description: '',
      rejected_reason_type: '',
      created_at: now,
      updated_at: now,
      is_deleted: false,
    };
    await this.executeQuery(
      `
      INSERT INTO ops_requests
        (id,school_id, class_id, request_type, requested_by, request_status, rejected_reason_description, rejected_reason_type, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newRequest.id,
        newRequest.school_id,
        newRequest.class_id,
        newRequest.request_type,
        newRequest.requested_by,
        newRequest.request_status,
        newRequest.rejected_reason_description,
        newRequest.rejected_reason_type,
        newRequest.created_at,
        newRequest.updated_at,
        newRequest.is_deleted,
      ],
    );
    await this.updatePushChanges(
      TABLES.OpsRequests,
      MUTATE_TYPES.INSERT,
      newRequest,
    );
  }

  async getAllClassesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'class'>[]> {
    return await this._serverApi.getAllClassesBySchoolId(schoolId);
  }

  async getRewardById(
    rewardId: string,
  ): Promise<TableTypes<'rive_reward'> | undefined> {
    if (this._cachedRewards) {
      const r = this._cachedRewards.find((x: any) => x.id === rewardId);
      if (r) return r;
    }
    try {
      const query = `SELECT * FROM rive_reward WHERE id = ? AND is_deleted = 0;`;
      const res = await this.executeQuery(query, [rewardId]);
      if (!res || !res.values || res.values.length === 0) {
        logger.warn(`No reward found for ID: ${rewardId}`);
        return undefined;
      }
      return res.values[0] as TableTypes<'rive_reward'>;
    } catch (error) {
      logger.error('Error fetching reward by ID', error);
      return undefined;
    }
  }

  async getAllRewards(): Promise<TableTypes<'rive_reward'>[] | []> {
    if (this._cachedRewards) return this._cachedRewards;
    try {
      const query = `SELECT * FROM rive_reward WHERE type='normal' AND is_deleted = 0 ORDER BY state_number_input ASC;`;
      const res = await this.executeQuery(query, []);
      if (!res || !res.values) {
        logger.warn(`No rewards found`);
        return [];
      }
      this._cachedRewards = res.values as TableTypes<'rive_reward'>[];
      return this._cachedRewards;
    } catch (error) {
      logger.error('Error fetching all rewards', error);
      return [];
    }
  }

  async updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string,
  ): Promise<void> {
    if (!rewardId) {
      logger.warn('No rewardId provided to updateUserReward');
      return;
    }

    try {
      const currentUser = (await this.getUserByDocId(
        userId,
      )) as TableTypes<'user'> | null;
      if (!currentUser) {
        logger.warn(`No user found`);
        return;
      }

      const timestamp = created_at ?? new Date().toISOString();

      const newReward = {
        reward_id: rewardId,
        timestamp: timestamp,
      };
      const rewardString = JSON.stringify(newReward);

      // Update the same currentUser object
      currentUser.reward = rewardString;

      const query = `UPDATE user SET reward = ?, updated_at= ? WHERE id = ? AND is_deleted = 0;`;
      await this.executeQuery(query, [rewardString, timestamp, userId]);
      await this.updatePushChanges(
        TABLES.User,
        MUTATE_TYPES.UPDATE,
        currentUser,
      );
      Util.setCurrentStudent(currentUser);
    } catch (error) {
      logger.error('❌ Error updating user reward:', error);
    }
  }

  async getActiveStudentsCountByClass(classId: string): Promise<string> {
    return await this._serverApi.getActiveStudentsCountByClass(classId);
  }

  async getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[],
  ): Promise<{ subject_id: string; completed_count: number }[]> {
    if (!studentId || !subjectIds.length) {
      return [];
    }
    // Generate a placeholder for each subjectId (e.g., "?,?,?").
    const placeholders = subjectIds.map(() => '?').join(',');

    const query = `
    SELECT l.subject_id, COUNT(r.lesson_id) AS completed_count
    FROM result r
    JOIN lesson l ON r.lesson_id = l.id
    WHERE r.student_id = ?
      AND r.is_deleted = 0
      AND l.subject_id IN (${placeholders})
    GROUP BY l.subject_id;
  `;

    // Create a single array of parameters in the correct order.
    const params = [studentId, ...subjectIds];

    try {
      // Execute the query with the safely bound parameters.
      const res = await this.executeQuery(query, params);
      return res?.values ?? [];
    } catch (err) {
      logger.error('Error fetching completed homework counts in SQLite:', err);
      return [];
    }
  }

  async deleteApprovedOpsRequestsForUser(
    requested_by: string,
    school_id?: string,
    class_id?: string,
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this._db) return;

    const query1 = `
    SELECT *
    FROM ${TABLES.OpsRequests}
    WHERE requested_by = ? AND class_id = ? AND school_id = ?`;

    const res1 = await this._db?.query(query1, [
      requested_by,
      class_id,
      school_id,
    ]);

    let ops_rq;
    if (res1 && res1.values && res1.values.length > 0) {
      ops_rq = res1.values[0];
    }
    if (!ops_rq) {
      return;
    }

    let query = `
    UPDATE ${TABLES.OpsRequests}
    SET is_deleted = 1,
        updated_at = ?
    WHERE requested_by = ?
      AND is_deleted = 0
  `;

    const params: any[] = [new Date().toISOString(), requested_by];

    if (school_id) {
      query += ` AND school_id = ?`;
      params.push(school_id);
    }

    if (class_id) {
      query += ` AND class_id = ?`;
      params.push(class_id);
    }

    // Execute the UPDATE
    await this._db.run(query, params);

    // Push sync mutation
    await this.updatePushChanges(TABLES.OpsRequests, MUTATE_TYPES.UPDATE, {
      id: ops_rq.id,
      requested_by,
      school_id: school_id ?? null,
      class_id: class_id ?? null,
      is_deleted: 1,
    });
  }
}
