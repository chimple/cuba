import {
  CoordinatorAPIResponse,
  CoordinatorInfo,
  MUTATE_TYPES,
  PrincipalAPIResponse,
  PrincipalInfo,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiOpsClassOperations } from './SqliteApi.ops.classOperations';

export class SqliteApiOpsSchoolUsers extends SqliteApiOpsClassOperations {
  [key: string]: any;
  async getSchoolsWithRoleAutouser(
    schoolIds: string[],
    userId: string,
  ): Promise<TableTypes<'school'>[] | undefined> {
    await this.ensureInitialized();
    // Escape schoolIds array for use in the SQL query
    const placeholders = schoolIds.map(() => '?').join(', '); // Generates ?, ?, ? for query placeholders
    const query = `
      SELECT DISTINCT school.*
      FROM ${TABLES.SchoolUser} AS su
      JOIN ${TABLES.School} AS school ON su.school_id = school.id
      WHERE su.school_id IN (${placeholders})
        AND su.user_id = '${userId}'
        AND su.role = '${RoleType.AUTOUSER}'
        AND su.is_deleted = false;
    `;

    const res = await this._db?.query(query, schoolIds);
    return res?.values ?? [];
  }

  async getPrincipalsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.PRINCIPAL}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getPrincipalsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PrincipalAPIResponse> {
    await this.ensureInitialized();
    if (!this._db) {
      logger.warn('SQLite DB not initialized.');
      return { data: [], total: 0 };
    }

    // Define the common WHERE clause conditions for both queries
    const whereConditions = `
    su.school_id = ?
    AND su.role = ?
    AND su.is_deleted = false
  `;
    const queryParams = [schoolId, RoleType.PRINCIPAL];

    // --- Step 1: Get the TOTAL COUNT of all principals in one efficient query ---
    const countQuery = `
    SELECT COUNT(user.id) as total
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions};
  `;
    const countRes = await this._db.query(countQuery, queryParams);
    const totalCount = countRes?.values?.[0]?.total ?? 0;

    // If there are no principals, we can stop here.
    if (totalCount === 0) {
      return { data: [], total: 0 };
    }

    // --- Step 2: Get the PAGINATED data for the current page ---
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions}
    ORDER BY user.created_at ASC
    LIMIT ? OFFSET ?;
  `;

    // Add the LIMIT and OFFSET parameters to our query parameter array
    const dataRes = await this._db.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    // The result is already in the correct format, so we can cast it directly.
    const principals: PrincipalInfo[] =
      (dataRes?.values as PrincipalInfo[]) ?? [];

    // --- Step 3: Return the final object matching the PrincipalAPIResponse shape ---
    return {
      data: principals,
      total: totalCount,
    };
  }

  async getCoordinatorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.COORDINATOR}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<CoordinatorAPIResponse> {
    await this.ensureInitialized();
    if (!this._db) {
      logger.warn('SQLite DB not initialized.');
      return { data: [], total: 0 };
    }

    // Define the common WHERE clause conditions and parameters for both queries
    const whereConditions = `
    su.school_id = ?
    AND su.role = ?
    AND su.is_deleted = false
  `;
    const queryParams = [schoolId, RoleType.COORDINATOR];
    // --- Step 1: Get the TOTAL COUNT of all coordinators in one efficient query ---
    const countQuery = `
    SELECT COUNT(user.id) as total
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions};
  `;
    const countRes = await this._db.query(countQuery, queryParams);
    const totalCount = countRes?.values?.[0]?.total ?? 0;

    // If there are no coordinators, we can stop here.
    if (totalCount === 0) {
      return { data: [], total: 0 };
    }

    // --- Step 2: Get the PAGINATED data for the current page ---
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions}
    ORDER BY user.created_at ASC
    LIMIT ? OFFSET ?;
  `;

    // Add the LIMIT and OFFSET parameters to our query parameter array
    const dataRes = await this._db.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    // The result is already in the correct format, so we can cast it directly.
    const coordinators: CoordinatorInfo[] =
      (dataRes?.values as CoordinatorInfo[]) ?? [];

    // --- Step 3: Return the final object matching the CoordinatorAPIResponse shape ---
    return {
      data: coordinators,
      total: totalCount,
    };
  }

  async getSponsorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.SPONSOR}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async addUserToSchool(
    schoolId: string,
    user: TableTypes<'user'>,
    role: RoleType,
  ): Promise<void> {
    const schoolUserId = uuidv4();
    const schoolUser = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: user.id,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    // Check if a duplicate already exists
    const existing = await this.executeQuery(
      `
      SELECT 1 FROM school_user
      WHERE school_id = ? AND user_id = ? AND role = ? AND is_deleted = ?
      LIMIT 1
      `,
      [
        schoolUser.school_id,
        schoolUser.user_id,
        schoolUser.role,
        schoolUser.is_deleted,
      ],
    );

    // Only insert if not exists
    if (!existing || !existing.values || existing.values.length === 0) {
      await this.executeQuery(
        `
        INSERT INTO school_user (id, school_id, user_id, role, created_at, updated_at, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          schoolUser.id,
          schoolUser.school_id,
          schoolUser.user_id,
          schoolUser.role,
          schoolUser.created_at,
          schoolUser.updated_at,
          schoolUser.is_deleted,
        ],
      );

      await this.updatePushChanges(
        TABLES.SchoolUser,
        MUTATE_TYPES.INSERT,
        schoolUser,
      );
    }

    if (user) {
      await this.executeQuery(
        `
        INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id,created_at,updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          user.id,
          user.name,
          user.age,
          user.gender,
          user.avatar,
          user.image,
          user.curriculum_id,
          user.language_id,
          user.created_at,
          user.updated_at,
        ],
      );
    }
  }

  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType,
  ): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();
    try {
      const query = `
      SELECT *
      FROM ${TABLES.SchoolUser}
      WHERE user_id = ? AND school_id = ?
      AND role = '${role}' AND is_deleted = 0
    `;

      const res = await this._db?.query(query, [userId, schoolId]);
      const updatedAt = new Date().toISOString();

      await this.executeQuery(
        `UPDATE school_user
       SET is_deleted = 1, updated_at = ?
       WHERE user_id = ? AND school_id = ?
       AND role = '${role}' AND is_deleted = 0`,
        [updatedAt, userId, schoolId],
      );

      let userData;
      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
      } else {
        return { success: false, message: 'School user not found.' };
      }

      await this.updatePushChanges(TABLES.SchoolUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });

      // ✅ Success return added
      return {
        success: true,
        message: 'User removed from school successfully.',
      };
    } catch (error: any) {
      logger.error('🚀 ~ SqliteApi ~ deleteUserFromSchool ~ error:', error);

      // ✅ Error return added
      return {
        success: false,
        message: error?.message || 'Unexpected error occurred.',
      };
    }
  }
}
