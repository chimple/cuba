import {
  StudentAPIResponse,
  StudentInfo,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { SqliteApiUserLookups } from './SqliteApi.user.lookups';

export class SqliteApiUserStudentLists extends SqliteApiUserLookups {
  [key: string]: any;
  async getStudentInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
    classId?: string,
    classIds?: string[],
  ): Promise<StudentAPIResponse> {
    await this.ensureInitialized();
    if (!this._db) {
      logger.warn('Database not initialized, cannot fetch student info.');
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty page without querying.
    if (!classId && classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const classScopedId =
      typeof classId === 'string' && classId.trim() !== ''
        ? classId.trim()
        : undefined;
    // Applies program class scope while preserving the class-detail override.
    const scopedClassIds = !classScopedId && classIds ? classIds : undefined;
    const classScopePlaceholders =
      scopedClassIds?.map(() => '?').join(', ') ?? '';
    const classScopeClause = classScopedId
      ? `AND cu.class_id = ?`
      : scopedClassIds && scopedClassIds.length > 0
        ? `AND cu.class_id IN (${classScopePlaceholders})`
        : '';
    const baseParams = classScopedId
      ? [schoolId, classScopedId]
      : scopedClassIds && scopedClassIds.length > 0
        ? [schoolId, ...scopedClassIds]
        : [schoolId];

    // Step 1: Get total count
    const countQuery = `
    SELECT COUNT(DISTINCT cu.user_id) as total
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND c.school_id = ?
      ${classScopeClause}
      AND c.is_deleted = false;
  `;
    const countRes = await this._db.query(countQuery, baseParams);
    const total = countRes?.values?.[0]?.total ?? 0;

    if (total === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Fetch paginated data
    const query = `
    SELECT
      u.*,
      c.id as class_id,
      c.name as class_name,
      p.id as parent_id,
      p.name as parent_name,
      p.email as parent_email,
      p.phone as parent_phone
      -- Add any other parent fields you want here, aliased with 'parent_'
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    INNER JOIN ${TABLES.User} u ON cu.user_id = u.id
    LEFT JOIN ${TABLES.ParentUser} pu ON pu.student_id = u.id AND pu.is_deleted = false
    LEFT JOIN ${TABLES.User} p ON p.id = pu.parent_id AND p.is_deleted = false
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND c.school_id = ?
      ${classScopeClause}
      AND c.is_deleted = false
      AND u.is_deleted = false
    -- Important to group by student to avoid duplicates if a student is in multiple classes
    GROUP BY u.id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?;
  `;
    const res = await this._db.query(query, [...baseParams, limit, offset]);
    const rows = res?.values ?? [];
    const studentIds = rows
      .map((row: any) =>
        String((row as { id?: string | null })?.id ?? '').trim(),
      )
      .filter((id: string): id is string => id.length > 0);
    // Hydrate full parent contact list so UI can show merged phone/email entries.
    const parentRows = (await this.getParentsByStudentId('', {
      studentIds,
      activeOnly: true,
    })) as Array<TableTypes<'user'> & { linked_student_id?: string | null }>;

    const studentInfoList: StudentInfo[] = rows.map((row: any) => {
      const {
        class_id,
        class_name,
        parent_id,
        parent_name,
        parent_email,
        parent_phone,
        ...studentUser
      } = row;

      const { grade, section } = this.parseClassName(class_name || '');
      const parents = parentRows
        .filter(
          (parent) =>
            String(parent.linked_student_id ?? '').trim() ===
            String(studentUser.id ?? '').trim(),
        )
        .map(({ linked_student_id, ...parentUser }) => {
          void linked_student_id;
          return parentUser as TableTypes<'user'>;
        });
      const parentObject: TableTypes<'user'> | null = parent_id
        ? {
            id: parent_id,
            name: parent_name,
            email: parent_email,
            phone: parent_phone,
            age: null,
            avatar: null,
            created_at: new Date().toISOString(),
            curriculum_id: null,
            fcm_token: null,
            firebase_id: null,
            gender: null,
            grade_id: null,
            image: null,
            is_deleted: false,
            is_firebase: false,
            is_ops: false,
            is_tc_accepted: false,
            tc_agreed_version: 0,
            language_id: null,
            learning_path: null,
            locale_id: null,
            music_off: false,
            ops_created_by: null,
            reward: null,
            sfx_off: false,
            stars: null,
            is_wa_contact: null,
            student_id: null,
            updated_at: null,
          }
        : null;

      return {
        user: studentUser as TableTypes<'user'>,
        grade,
        classSection: section,
        parent: parentObject,
        parents:
          parents.length > 0 ? parents : parentObject ? [parentObject] : [],
        classWithidname: {
          id: class_id,
          class_name: class_name || '',
        },
      };
    });

    return {
      data: studentInfoList,
      total,
    };
  }

  async getStudentsAndParentsByClassId(
    classId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<StudentAPIResponse> {
    await this.ensureInitialized();
    if (!this._db) {
      logger.warn('Database not initialized, cannot fetch student info.');
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    // Step 1: Get total count for the specified class
    const countQuery = `
    SELECT COUNT(DISTINCT cu.user_id) as total
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND cu.class_id = ? -- Filter by class_id directly
      AND c.is_deleted = false;
  `;
    const countRes = await this._db.query(countQuery, [classId]);
    const total = countRes?.values?.[0]?.total ?? 0;

    if (total === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Fetch paginated data for the specified class
    const query = `
    SELECT
      u.*,
      c.name as class_name,
      p.id as parent_id,
      p.name as parent_name,
      p.email as parent_email,
      p.phone as parent_phone
      -- Add any other parent fields you want here, aliased with 'parent_'
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    INNER JOIN ${TABLES.User} u ON cu.user_id = u.id
    LEFT JOIN ${TABLES.ParentUser} pu ON pu.student_id = u.id AND pu.is_deleted = false
    LEFT JOIN ${TABLES.User} p ON p.id = pu.parent_id AND p.is_deleted = false
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND cu.class_id = ? -- Filter by class_id directly
      AND c.is_deleted = false
      AND u.is_deleted = false
    -- Important to group by student to avoid duplicates if a student is in multiple classes (though less likely when filtering by specific class)
    GROUP BY u.id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?;
  `;
    const res = await this._db.query(query, [classId, limit, offset]);
    const rows = res?.values ?? [];
    const studentIds = rows
      .map((row: any) =>
        String((row as { id?: string | null })?.id ?? '').trim(),
      )
      .filter((id: string): id is string => id.length > 0);
    // Hydrate full parent contact list so UI can show merged phone/email entries.
    const parentRows = (await this.getParentsByStudentId('', {
      studentIds,
      activeOnly: true,
    })) as Array<TableTypes<'user'> & { linked_student_id?: string | null }>;

    const studentInfoList: StudentInfo[] = rows.map((row: any) => {
      const {
        class_name,
        parent_id,
        parent_name,
        parent_email,
        parent_phone,
        ...studentUser
      } = row;

      const { grade, section } = this.parseClassName(class_name || '');
      const parents = parentRows
        .filter(
          (parent) =>
            String(parent.linked_student_id ?? '').trim() ===
            String(studentUser.id ?? '').trim(),
        )
        .map(({ linked_student_id, ...parentUser }) => {
          void linked_student_id;
          return parentUser as TableTypes<'user'>;
        });
      const parentObject: TableTypes<'user'> | null = parent_id
        ? {
            id: parent_id,
            name: parent_name,
            email: parent_email,
            phone: parent_phone,
            age: null, // Assuming these fields are nullable or have default values in your User table type
            avatar: null,
            created_at: new Date().toISOString(), // Example, adjust if you fetch this
            curriculum_id: null,
            fcm_token: null,
            firebase_id: null,
            gender: null,
            grade_id: null,
            image: null,
            is_deleted: false,
            is_firebase: false,
            is_ops: false,
            is_tc_accepted: false,
            tc_agreed_version: 0,
            language_id: null,
            learning_path: null,
            locale_id: null,
            music_off: false,
            ops_created_by: null,
            reward: null,
            sfx_off: false,
            stars: null,
            is_wa_contact: null,
            student_id: null,
            updated_at: null,
          }
        : null;

      return {
        user: studentUser as TableTypes<'user'>,
        grade,
        classSection: section,
        parent: parentObject,
        parents:
          parents.length > 0 ? parents : parentObject ? [parentObject] : [],
      };
    });

    return {
      data: studentInfoList,
      total,
    };
  }

  async getStudentAndParentByStudentId(
    studentId: string,
  ): Promise<{ user: any; parents: any[] }> {
    await this.ensureInitialized();
    if (!this._db) {
      logger.warn('Database not initialized.');
      return { user: null, parents: [] };
    }

    try {
      // Fetch student details
      const studentRes = await this._db.query(
        `SELECT * FROM user WHERE id = ? AND is_deleted = 0`,
        [studentId],
      );
      const studentRows = studentRes?.values ?? [];

      if (studentRows.length === 0) {
        return { user: null, parents: [] };
      }

      const student = studentRows[0];

      // Fetch parent details
      const parentRes = await this._db.query(
        `SELECT p.*
       FROM parent_user pu
       JOIN user p ON pu.parent_id = p.id
       WHERE pu.student_id = ? AND p.is_deleted = 0`,
        [studentId],
      );
      const parentRows = parentRes?.values ?? [];

      return {
        user: student,
        parents: parentRows,
      };
    } catch (error) {
      logger.error(
        'Error fetching student and parent by student ID (SQLite):',
        error,
      );
      return { user: null, parents: [] };
    }
  }

  async getParentsByStudentId(
    studentId: string,
    options?: {
      studentIds?: string[];
      activeOnly?: boolean;
    },
  ): Promise<TableTypes<'user'>[]> {
    await this.ensureInitialized();
    if (!this._db) {
      logger.warn('Database not initialized.');
      return [];
    }

    try {
      const requestedStudentIds =
        options?.studentIds?.filter((id: any) => id.trim() !== '') ??
        (studentId.trim() !== '' ? [studentId] : []);
      if (requestedStudentIds.length === 0) {
        return [];
      }

      const parentPlaceholders = requestedStudentIds.map(() => '?').join(', ');
      const activeOnlyClause =
        options?.activeOnly === true
          ? `
          AND pu.is_deleted = false
          AND p.is_deleted = false
        `
          : '';
      const parentRes = await this._db.query(
        `
          SELECT pu.student_id as linked_student_id, p.*
          FROM parent_user pu
          JOIN user p ON pu.parent_id = p.id
          WHERE pu.student_id IN (${parentPlaceholders})
          ${activeOnlyClause}
        `,
        requestedStudentIds,
      );

      return (parentRes?.values ?? []) as TableTypes<'user'>[];
    } catch (error) {
      logger.error('Error fetching parents by student ID', error);
      return [];
    }
  }
}
