import {
  DELETED_CLASSES,
  MODES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SqliteApiCorePushSync } from './SqliteApi.core.pushSync';

export class SqliteApiUserLookups extends SqliteApiCorePushSync {
  [key: string]: any;
  async getClassesBySchoolId(schoolId: string): Promise<TableTypes<'class'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT *
    FROM ${TABLES.Class}
    WHERE school_id = ?
      AND is_deleted = false;
  `;

    const res = await this._db?.query(query, [schoolId]);

    return res?.values ?? [];
  }

  async getClassById(id: string): Promise<TableTypes<'class'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Class} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getSchoolById(id: string): Promise<TableTypes<'school'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.School} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async isStudentLinked(
    studentId: string,
    fromCache: boolean,
  ): Promise<boolean> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.ClassUser}
      where user_id = "${studentId}"
      and role = "${RoleType.STUDENT}" and is_deleted = 0`,
    );
    logger.info('🚀 ~ SqliteApi ~ isStudentLinked ~ res:', res);
    if (!res || !res.values || res.values.length < 1) return false;
    return true;
  }

  async getPendingAssignments(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    await this.ensureInitialized();
    const nowIso = new Date().toISOString();

    const query = `
  SELECT a.*
  FROM ${TABLES.Assignment} a
  LEFT JOIN ${TABLES.Assignment_user} au
    ON a.id = au.assignment_id
    AND au.user_id = "${studentId}"
    AND au.is_deleted = 0
  LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
  WHERE a.class_id = '${classId}'
    AND a.is_deleted = 0
    AND (a.is_class_wise = 1 OR au.user_id = "${studentId}")
    AND r.assignment_id IS NULL
    AND a.type <> 'assessment'
    AND (
      a.ends_at IS NULL OR
      TRIM(a.ends_at) = '' OR
      datetime(a.ends_at) > datetime('${nowIso}')
    )
    AND (
      a.starts_at IS NULL OR
      TRIM(a.starts_at) = '' OR
      datetime(a.starts_at) <= datetime('${nowIso}')
    )
  ORDER BY a.created_at DESC;
`;

    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getSchoolsForUser(
    userId: string,
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    await this.ensureInitialized();
    const finalData: { school: TableTypes<'school'>; role: RoleType }[] = [];
    const schoolIds: Set<string> = new Set();
    let query = `
    SELECT cu.class_id, c.school_id
    FROM ${TABLES.ClassUser} cu
    JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.user_id = "${userId}" AND cu.role = "${RoleType.TEACHER}" AND cu.is_deleted = 0 AND c.is_deleted = 0
  `;
    const classUserRes = await this._db?.query(query);

    if (classUserRes && classUserRes.values && classUserRes.values.length > 0) {
      for (const classData of classUserRes.values) {
        const schoolId = classData.school_id;

        if (!schoolIds.has(schoolId)) {
          schoolIds.add(schoolId);

          query = `
          SELECT JSON_OBJECT(
            'id', s.id,
            'name', s.name,
            'group1', s.group1,
            'group2', s.group2,
            'group3', s.group3,
            'image', s.image,
            'created_at', s.created_at,
            'updated_at', s.updated_at,
            'is_deleted', s.is_deleted
          ) AS school
          FROM ${TABLES.School} s
          WHERE s.id = "${schoolId}" AND s.is_deleted = 0
          ORDER BY s.name ASC;
        `;
          const schoolRes = await this._db?.query(query);
          if (schoolRes && schoolRes.values && schoolRes.values.length > 0) {
            finalData.push({
              school: JSON.parse(schoolRes.values[0].school),
              role: RoleType.TEACHER,
            });
          }
        }
      }
    }

    query = `
    SELECT su.*,
    JSON_OBJECT(
      'id', s.id,
      'name', s.name,
      'group1', s.group1,
      'group2', s.group2,
      'group3', s.group3,
      'image', s.image,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'is_deleted', s.is_deleted
    ) AS school
    FROM ${TABLES.SchoolUser} su
    JOIN ${TABLES.School} s ON su.school_id = s.id
    WHERE su.user_id = "${userId}"
    AND su.role != "${RoleType.PARENT}"
    AND su.is_deleted = 0
    AND s.is_deleted = 0
    ORDER BY s.name ASC;
  `;
    const schoolUserRes = await this._db?.query(query);

    if (
      schoolUserRes &&
      schoolUserRes.values &&
      schoolUserRes.values.length > 0
    ) {
      for (const data of schoolUserRes.values) {
        const schoolId = JSON.parse(data.school).id;

        if (!schoolIds.has(schoolId)) {
          schoolIds.add(schoolId);
          finalData.push({
            school: JSON.parse(data.school),
            role: data.role, // "autouser"
          });
        } else {
          // Update role if already exists in finalData
          const existingEntry = finalData.find(
            (entry) => entry.school.id === schoolId,
          );
          if (existingEntry) {
            existingEntry.role = data.role; // Override role
          }
        }
      }
    }
    return finalData;
  }

  async getSchoolsForUserBySearchTerm(
    userId: string,
    searchTerm: string,
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    throw new Error('Method not implemented.');
  }

  public get currentMode(): MODES {
    return this._currentMode;
  }

  public set currentMode(value: MODES) {
    this._currentMode = value;
  }

  async isUserTeacher(userId: string): Promise<boolean> {
    const schools = await this.getSchoolsForUser(userId);
    return schools.length > 0;
  }

  async getClassesForSchool(
    schoolId: string,
    userId: string,
  ): Promise<TableTypes<'class'>[]> {
    await this.ensureInitialized();
    let query = `
    SELECT DISTINCT cu.class_id, cu.role, c.*
    FROM ${TABLES.ClassUser} cu
    JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.user_id = '${userId}'
    AND c.school_id = '${schoolId}'
    AND cu.role != '${RoleType.PARENT}'
    AND cu.is_deleted = 0
    AND c.is_deleted = 0
  `;
    const res = await this._db?.query(query);

    if (res && res.values && res.values.length > 0) {
      const teacherClasses = res.values.map((classData: any) => classData);
      return teacherClasses.length > 0 ? teacherClasses : [];
    }

    query = `
    SELECT *
    FROM ${TABLES.Class}
    WHERE school_id = '${schoolId}' AND is_deleted = 0
  `;
    const allClassesRes = await this._db?.query(query);

    if (
      !allClassesRes ||
      !allClassesRes.values ||
      allClassesRes.values.length < 1
    ) {
      return [];
    }
    const deletedClass = sessionStorage.getItem(DELETED_CLASSES);
    if (deletedClass) {
      const deletedClasses = JSON.parse(deletedClass);
      const filteredClassList = allClassesRes.values.filter(
        (item: any) => !deletedClasses.includes(item.id),
      );
      return filteredClassList;
    }
    return allClassesRes.values;
  }
}
