import { SqliteApiUserStudentMerge } from './SqliteApi.user.studentMerge';
import {
  TABLES,
  TableTypes,
  TeacherAPIResponse,
  TeacherInfo,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';

export class SqliteApiUserSchoolRoles extends SqliteApiUserStudentMerge {
  [key: string]: any;
  public async updateFcUserFormsContactUserId(
    oldStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this._serverApi.updateFcUserFormsContactUserId(
      oldStudentId,
      newStudentId,
    );
  }
  /**
   * Fetches school login type and program model using UDISE code from SQLite
   * @param {string} udiseCode - The UDISE ID of the school
   * @returns An object with studentLoginType, programId, and programModel if found, else null
   */

  mergeUserPathway(
    existingStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this._serverApi.mergeUserPathway(existingStudentId, newStudentId);
  }

  async getTeacherInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
    classIds?: string[],
  ): Promise<TeacherAPIResponse> {
    await this.ensureInitialized();
    if (!this._db) {
      logger.warn('SQLite DB not initialized.');
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty page without querying.
    if (classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    // Applies program class scope to the teacher list queries.
    const classScopePlaceholders = classIds?.map(() => '?').join(', ') ?? '';
    const classScopeClause =
      classIds && classIds.length > 0
        ? `AND cu.class_id IN (${classScopePlaceholders})`
        : '';
    const baseParams =
      classIds && classIds.length > 0 ? [schoolId, ...classIds] : [schoolId];

    // STEP 1: Get the total count of unique teachers for the school.
    const countQuery = `
    SELECT COUNT(DISTINCT cu.user_id) as total
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE c.school_id = ?
      AND cu.role = 'teacher'
      AND cu.is_deleted = false
      ${classScopeClause}
      AND c.is_deleted = false;
  `;

    const countRes = await this._db.query(countQuery, baseParams);
    const total = countRes?.values?.[0]?.total || 0;

    if (total === 0) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const dataQuery = `
    SELECT
      u.*,
      c.id   AS class_id,
      c.name as class_name
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.User} u ON cu.user_id = u.id
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE c.school_id = ?
      AND cu.role = 'teacher'
      AND cu.is_deleted = false
      ${classScopeClause}
      AND c.is_deleted = false
      AND u.is_deleted = false
    -- Group by teacher to handle cases where a teacher has multiple classes,
    -- ensuring we only get one row per teacher for pagination.
    GROUP BY u.id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?;
  `;

    const dataRes = await this._db.query(dataQuery, [
      ...baseParams,
      limit,
      offset,
    ]);
    const rows = dataRes?.values ?? [];

    // STEP 3: Map the flat SQL result into the nested TeacherInfo structure.
    const teacherInfoList: TeacherInfo[] = rows.map((row: any) => {
      const { class_id, class_name, ...teacherUser } = row;

      const { grade, section } = this.parseClassName(class_name || '');

      return {
        user: teacherUser as TableTypes<'user'>,
        grade,
        classSection: section ?? '',
        classWithidname: {
          id: class_id,
          name: class_name,
        },
      };
    });

    return {
      data: teacherInfoList,
      total: total,
    };
  }

  public async getUserRoleForSchool(
    userId: string,
    schoolId: string,
  ): Promise<RoleType | undefined> {
    return await this._serverApi.getUserRoleForSchool(userId, schoolId);
  }
}
