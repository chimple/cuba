import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_LOCALE_ID,
  DELETED_CLASSES,
  LIDO_ASSESSMENT,
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODES,
  MUTATE_TYPES,
  STUDENT_RESULT,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';
import {
  readAssignmentCartFromStorage,
  writeAssignmentCartToStorage,
} from '../../../teachers-module/pages/AssignmentCartStorage';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import {
  AssignmentCartData,
  JoinClassInviteLookupResult,
  LeaderboardInfo,
} from '../ServiceApi';
import { SqliteApiResults } from './SqliteApi.results';

export interface SqliteApiSchool {
  [key: string]: any;
}
export class SqliteApiSchool extends SqliteApiResults {
  async getStudentResult(
    studentId: string,
    fromCache?: boolean,
  ): Promise<TableTypes<'result'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT * FROM ${TABLES.Result}
    where student_id = '${studentId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getStudentResultInMap(
    studentId: string,
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'> }> {
    await this.ensureInitialized();
    const query = `
    SELECT *
    FROM ${TABLES.Result}
    WHERE (student_id = '${studentId}')
    AND (lesson_id, updated_at) IN (
    SELECT lesson_id, MAX(updated_at)
    FROM ${TABLES.Result}
    WHERE student_id = '${studentId}'
    GROUP BY lesson_id
  );
    `;
    const res = await this._db?.query(query);
    logger.info('🚀 ~ SqliteApi ~ getStudentResultInMap ~ res:', res?.values);
    if (!res || !res.values || res.values.length < 1) return {};
    const resultMap: { [lessonDocId: string]: TableTypes<'result'> } = {};
    for (const data of res.values) {
      resultMap[data.lesson_id] = data;
    }
    return resultMap;
  }

  async hasStudentResult(studentId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const { classes } = await this.getStudentClassesAndSchools(studentId);
      const classId = this.currentClass?.id ?? classes[0]?.id;

      if (classes.length > 0) {
        if (!classId) {
          logger.warn(
            '[SqliteApi] Unable to resolve class for linked student result check',
            { studentId },
          );
          return false;
        }

        const res = await this._db?.query(
          `SELECT 1
         FROM ${TABLES.Result}
         WHERE student_id = "${studentId}"
           AND class_id = "${classId}"
           AND is_deleted = 0
         LIMIT 1`,
        );
        return (res?.values?.length ?? 0) > 0;
      }

      const res = await this._db?.query(
        `SELECT 1
       FROM ${TABLES.Result}
       WHERE student_id = "${studentId}"
         AND is_deleted = 0
       LIMIT 1`,
      );
      return (res?.values?.length ?? 0) > 0;
    } catch (error) {
      logger.error('Error checking student result', error);
      return true;
    }
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
  public async getUserRoleForSchool(
    userId: string,
    schoolId: string,
  ): Promise<RoleType | undefined> {
    return await this._serverApi.getUserRoleForSchool(userId, schoolId);
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
      const teacherClasses = res.values.map((classData) => classData);
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
        (item) => !deletedClasses.includes(item.id),
      );
      return filteredClassList;
    }
    return allClassesRes.values;
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

      ids.forEach((id) => {
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

      ids.forEach((id) => {
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

  async getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]> {
    await this.ensureInitialized();
    const query = `
      SELECT user.*
      FROM ${TABLES.ClassUser} AS cu
      JOIN ${TABLES.User} AS user ON cu.user_id = user.id
      WHERE cu.class_id = ?
        AND cu.role = ?
        AND cu.is_deleted = 0
        ORDER BY name ASC ;
    `;
    const res = await this._db?.query(query, [classId, RoleType.STUDENT]);
    return res?.values ?? [];
  }

  async getDataByInviteCode(inviteCode: number): Promise<any> {
    let inviteData = await this._serverApi.getDataByInviteCode(inviteCode);
    return inviteData;
  }

  async getDataByInviteCodeNew(
    inviteCode: number,
  ): Promise<JoinClassInviteLookupResult> {
    logger.warn('Join class lookup requested through SQLite API', {
      file_name: 'SqliteApi.ts',
      function_name: 'getDataByInviteCodeNew',
      inviteCode,
      syncInProgress: this._syncInProgress,
    });
    const { inviteData, classData, schoolData } =
      await this._serverApi.getDataByInviteCodeNew(inviteCode);

    if (!classData) {
      throw new Error('Class data could not be fetched.');
    }

    if (!schoolData) {
      throw new Error('School data could not be fetched.');
    }

    return {
      inviteData,
      classData,
      schoolData,
    };
  }

  private async upsertJoinLookupRow(
    tableName: TABLES.Class | TABLES.School | TABLES.ClassUser,
    row: TableTypes<'class'> | TableTypes<'school'> | TableTypes<'class_user'>,
  ): Promise<void> {
    const existingColumns = await this.getTableColumns(tableName);
    if (!existingColumns?.length) {
      return;
    }

    const rowData = row as Record<string, unknown>;
    const columns = existingColumns.filter((column) =>
      Object.prototype.hasOwnProperty.call(rowData, column),
    );

    if (!columns.length) {
      return;
    }

    const placeholders = columns.map(() => '?').join(', ');
    const updates = columns
      .filter((column) => column !== 'id')
      .map((column) => `${column} = excluded.${column}`)
      .join(', ');
    const statement = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates};
    `;
    const values = columns.map((column) => rowData[column]);

    await this.executeQuery(statement, values);
  }

  async storeJoinClassLookupDataLocally(
    classData: TableTypes<'class'>,
    schoolData: TableTypes<'school'>,
  ): Promise<void> {
    logger.warn('Storing join lookup data in local SQLite', {
      file_name: 'SqliteApi.ts',
      function_name: 'storeJoinClassLookupDataLocally',
      classId: classData.id,
      schoolId: schoolData.id,
    });
    await this.upsertJoinLookupRow(TABLES.School, schoolData);
    await this.upsertJoinLookupRow(TABLES.Class, classData);
    logger.warn('Stored join lookup data in local SQLite successfully', {
      file_name: 'SqliteApi.ts',
      function_name: 'storeJoinClassLookupDataLocally',
      classId: classData.id,
      schoolId: schoolData.id,
    });
  }

  async createClass(
    schoolId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
    gradeId?: string,
    standard?: string,
  ): Promise<TableTypes<'class'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const classId = uuidv4();
    const newClass: TableTypes<'class'> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      grade_id: gradeId ?? null,
      group_id: groupId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      is_deleted: false,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
      standard: standard ?? null,
      status: null,
      whatsapp_invite_link: whatsapp_invite_link ?? null,
      migrated_count: 0,
    };

    await this.executeQuery(
      `
      INSERT INTO class (id, name , image, school_id, grade_id, standard, created_at, updated_at, is_deleted, group_id, whatsapp_invite_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newClass.id,
        newClass.name,
        newClass.image,
        newClass.school_id,
        newClass.grade_id,
        newClass.standard,
        newClass.created_at,
        newClass.updated_at,
        newClass.is_deleted,
        newClass.group_id,
        newClass.whatsapp_invite_link,
      ],
    );

    await this.updatePushChanges(TABLES.Class, MUTATE_TYPES.INSERT, newClass);
    return newClass;
  }
  async deleteClass(classId: string) {
    await this.ensureInitialized();
    try {
      // Update is_deleted to true for all class_user records where role is teacher
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1 WHERE class_id = ? AND role = ?`,
        [classId, RoleType.TEACHER],
      );

      // Retrieve the ids of the affected class_user rows
      const classUserQuery = `
      SELECT id
      FROM ${TABLES.ClassUser}
      WHERE class_id = ? AND role = ? AND is_deleted = 1
    `;
      const classUserRes = await this._db?.query(classUserQuery, [
        classId,
        RoleType.TEACHER,
      ]);

      if (
        classUserRes &&
        classUserRes.values &&
        classUserRes.values.length > 0
      ) {
        for (const row of classUserRes.values) {
          // Push changes for each affected class_user (teachers)
          this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
            id: row.id,
            is_deleted: true,
          });
        }
      }

      //Update is_deleted to true for all class_course records where class_id matches
      await this.executeQuery(
        `UPDATE class_course SET is_deleted = 1 WHERE class_id = ?`,
        [classId],
      );

      // Retrieve the ids of the affected class_course rows
      const classCourseQuery = `
      SELECT id
      FROM ${TABLES.ClassCourse}
      WHERE class_id = ? AND is_deleted = 1
    `;
      const classCourseRes = await this._db?.query(classCourseQuery, [classId]);

      if (
        classCourseRes &&
        classCourseRes.values &&
        classCourseRes.values.length > 0
      ) {
        for (const row of classCourseRes.values) {
          // Push changes for each affected class_course
          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: row.id,
            is_deleted: true,
          });
        }
      }

      // Update is_deleted to true for the class itself
      await this.executeQuery(
        `UPDATE class SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
        [classId],
      );

      // Push changes for the class itself
      this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, {
        id: classId,
        is_deleted: true,
      });
    } catch (error) {
      logger.error('Failed to delete class:', error);
      throw error;
    }
  }
  async updateClass(
    classId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
  ) {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    let updatedClassQuery = `UPDATE class SET name = "${className}"`;
    if (groupId !== undefined) {
      updatedClassQuery += `, group_id = "${groupId}"`;
    }
    if (whatsapp_invite_link !== undefined) {
      updatedClassQuery += `, whatsapp_invite_link = "${whatsapp_invite_link}"`;
    }
    updatedClassQuery += `, updated_at = "${new Date().toISOString()}"`;
    updatedClassQuery += ` WHERE id = "${classId}";`;

    const res = await this.executeQuery(updatedClassQuery);
    logger.info('🚀 ~ SqliteApi ~ updateClass ~ res:', res);

    // Include group_id in push only if provided
    const updatedData: any = { id: classId, name: className };
    if (groupId !== undefined) updatedData.group_id = groupId;

    this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, updatedData);
  }
  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    logger.warn('Join class link requested through SQLite API', {
      file_name: 'SqliteApi.ts',
      function_name: 'linkStudent',
      inviteCode,
      studentId,
      syncInProgress: this._syncInProgress,
    });

    try {
      const linkData = await this._serverApi.linkStudent(inviteCode, studentId);

      logger.warn('Join class link completed on server API', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        responseType: Array.isArray(linkData) ? 'array' : typeof linkData,
        responseCount: Array.isArray(linkData) ? linkData.length : undefined,
      });

      if (Array.isArray(linkData) && linkData.length > 0) {
        for (const row of linkData as TableTypes<'class_user'>[]) {
          await this.upsertJoinLookupRow(TABLES.ClassUser, row);
        }
        logger.warn('Stored returned class_user rows in local SQLite', {
          file_name: 'SqliteApi.ts',
          function_name: 'linkStudent',
          inviteCode,
          studentId,
          rowCount: linkData.length,
        });
      }

      logger.warn('Starting SQLite sync after join class', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
      });
      await this.syncDbNow(Object.values(TABLES), [
        TABLES.Assignment,
        TABLES.Class,
        TABLES.School,
        TABLES.ClassCourse,
      ]);
      logger.warn('Completed SQLite sync after join class', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
      });

      try {
        const studentResultStr = sessionStorage.getItem(STUDENT_RESULT);
        const studentResultObj = studentResultStr
          ? JSON.parse(studentResultStr)
          : {};
        studentResultObj[studentId] = false;
        sessionStorage.setItem(
          STUDENT_RESULT,
          JSON.stringify(studentResultObj),
        );
      } catch (e) {
        logger.error('Failed to reset studentResult in sessionStorage', e);
      }

      return linkData;
    } catch (error) {
      logger.warn('Join class link failed through SQLite API', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        syncInProgress: this._syncInProgress,
        rawError: error,
      });
      throw error;
    }
  }

  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList,
  ): Promise<LeaderboardInfo | undefined> {
    if (sectionId) {
      // Getting Class wise Leaderboard
      let classLeaderboard = await this._serverApi.getLeaderboardResults(
        sectionId,
        leaderboardDropdownType,
      );
      return classLeaderboard;
    } else {
      // Getting Generic Leaderboard
      let genericQueryResult = await this._serverApi.getLeaderboardResults(
        '',
        leaderboardDropdownType,
      );
      if (!genericQueryResult) {
        return;
      }
      return genericQueryResult;
    }
  }

  async getLeaderboardStudentResultFromB2CCollection(
    studentId: string,
  ): Promise<LeaderboardInfo | undefined> {
    await this.ensureInitialized();
    try {
      // Ensure the database instance is initialized
      if (!this._db) throw new Error('Database is not initialized');

      // Define the query to fetch the leaderboard data for the given student
      const currentStudentQuery = `
        SELECT 'allTime' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(res.score) as total_score,
               sum(res.time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        JOIN ${TABLES.Lesson} l ON l.id = res.lesson_id
        WHERE res.student_id = '${studentId}'
          AND COALESCE(res.is_deleted, 0) = 0
          AND COALESCE(u.is_deleted, 0) = 0
          AND COALESCE(l.plugin_type, '') <> '${LIDO_ASSESSMENT}'
        GROUP BY res.student_id, u.name
        UNION ALL
        SELECT 'monthly' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(res.score) as total_score,
               sum(res.time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        JOIN ${TABLES.Lesson} l ON l.id = res.lesson_id
        WHERE res.student_id = '${studentId}'
          AND strftime('%m', res.created_at) = strftime('%m', datetime('now'))
          AND COALESCE(res.is_deleted, 0) = 0
          AND COALESCE(u.is_deleted, 0) = 0
          AND COALESCE(l.plugin_type, '') <> '${LIDO_ASSESSMENT}'
        GROUP BY res.student_id, u.name
        UNION ALL
        SELECT 'weekly' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(res.score) as total_score,
               sum(res.time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        JOIN ${TABLES.Lesson} l ON l.id = res.lesson_id
        WHERE res.student_id = '${studentId}'
          AND strftime('%W', res.created_at) = strftime('%W', datetime('now'))
          AND COALESCE(res.is_deleted, 0) = 0
          AND COALESCE(u.is_deleted, 0) = 0
          AND COALESCE(l.plugin_type, '') <> '${LIDO_ASSESSMENT}'
        GROUP BY res.student_id, u.name
      `;

      // Execute the query
      const currentUserResult = await this._db.query(currentStudentQuery);

      // Handle case where no data is returned
      if (!currentUserResult.values) {
        return;
      }

      // Initialize the leaderboard structure
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      // Process the results
      currentUserResult.values.forEach((result) => {
        if (!result) return;

        const leaderboardEntry = {
          name: result.name || '',
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: studentId,
        };

        switch (result.type) {
          case 'allTime':
            leaderBoardList.allTime.push(leaderboardEntry);
            break;
          case 'monthly':
            leaderBoardList.monthly.push(leaderboardEntry);
            break;
          case 'weekly':
            leaderBoardList.weekly.push(leaderboardEntry);
            break;
          default:
            logger.warn('Unknown leaderboard type: ', result.type);
        }
      });

      return leaderBoardList;
    } catch (error) {
      logger.error(
        'Error in getLeaderboardStudentResultFromB2CCollection: ',
        error,
      );
    }
  }

  async getAllLessonsForCourse(
    courseId: string,
  ): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT l.* FROM ${TABLES.Chapter} as c
    JOIN ${TABLES.ChapterLesson} cl ON cl.chapter_id = c.id
    JOIN ${TABLES.Lesson} l ON l.id = cl.lesson_id
    WHERE c.course_id = '${courseId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string,
  ): Promise<Lesson | undefined> {
    throw new Error('Method not implemented.');
  }

  async getLessonFromChapter(
    chapterId: string,
    lessonId: string,
  ): Promise<{
    lesson: TableTypes<'lesson'>[];
    course: TableTypes<'course'>[];
  }> {
    await this.ensureInitialized();
    const data: {
      lesson: TableTypes<'lesson'>[];
      course: TableTypes<'course'>[];
    } = {
      lesson: [],
      course: [],
    };
    const query = `
    SELECT l.*,JSON_OBJECT(
          'id',co.id,
          'code',co.code,
          'color',co.color,
          'created_at',co.created_at,
          'curriculum_id',co.curriculum_id,
          'description',co.description,
          'grade_id',co.grade_id,
          'image',co.image,
          'is_deleted',co.is_deleted,
          'name',co.name,
          'sort_index',co.sort_index,
          'subject_id',co.subject_id,
          'updated_at',co.updated_at
      ) AS course FROM ${TABLES.Lesson} as l
    JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
    JOIN ${TABLES.Chapter} c ON c.id = cl.chapter_id
    JOIN ${TABLES.Course} co ON co.id = c.course_id
    WHERE c.id='${chapterId}' and c.is_deleted = 0 and l.id = '${lessonId}' and l.is_deleted = 0
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return data;
    data.lesson = res.values;
    data.course = res.values.map((val) => JSON.parse(val.course));
    return data;
  }

  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    try {
      const gradeCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE grade_id = "${gradeDocId}" AND is_deleted = 0`,
      );

      const puzzleCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE name = "Digital Skills"  AND is_deleted = 0`,
      );

      const courses = [
        ...(gradeCoursesRes?.values ?? []),
        ...(puzzleCoursesRes?.values ?? []),
      ];
      return courses;
    } catch (error) {
      logger.error('Error fetching courses by grade:', error);
      return [];
    }
  }

  async getAllCourses(): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Course} ORDER BY sort_index ASC`,
    );
    return res?.values ?? [];
  }
  deleteAllUserData(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getCoursesFromLesson(
    lessonId: string,
  ): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT co.* FROM ${TABLES.Lesson} as l
    JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
    JOIN ${TABLES.Chapter} c ON c.id = cl.chapter_id
    JOIN ${TABLES.Course} co ON co.id = c.course_id
    WHERE l.id = '${lessonId} and l.is_deleted = 0'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  async assignmentListner(
    studentId: string,
    onDataChange: (assignment: TableTypes<'assignment'> | undefined) => void,
  ) {
    const handleDataChange = async (
      assignmet: TableTypes<'assignment'> | undefined,
    ) => {
      if (assignmet) {
        await this.executeQuery(
          `
          INSERT INTO assignment (id, created_by, starts_at,ends_at,is_class_wise,class_id,school_id,lesson_id,type,created_at,updated_at,is_deleted,chapter_id,course_id, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
          [
            assignmet.id,
            assignmet.created_by,
            assignmet.starts_at,
            assignmet.ends_at,
            assignmet.is_class_wise,
            assignmet.class_id,
            assignmet.school_id,
            assignmet.lesson_id,
            assignmet.type,
            assignmet.created_at,
            assignmet.updated_at,
            assignmet.is_deleted,
            assignmet.chapter_id,
            assignmet.course_id,
            assignmet.source,
          ],
        );
        onDataChange(assignmet);
      }
    };
    return await this._serverApi.assignmentListner(studentId, handleDataChange);
  }

  async removeAssignmentChannel() {
    return await this._serverApi.removeAssignmentChannel();
  }
  async assignmentUserListner(
    studentId: string,
    onDataChange: (
      assignment_user: TableTypes<'assignment_user'> | undefined,
    ) => void,
  ) {
    const handleDataChange = async (
      assignment_user: TableTypes<'assignment_user'> | undefined,
    ) => {
      if (assignment_user) {
        await this.executeQuery(
          `
          INSERT INTO assignment_user (id, assignment_id, user_id, created_at, updated_at, is_deleted)
          VALUES (?, ?, ?, ?, ?, ?);
          `,
          [
            assignment_user.id,
            assignment_user.assignment_id,
            assignment_user.user_id,
            assignment_user.created_at,
            assignment_user.updated_at,
            assignment_user.is_deleted,
          ],
        );
        onDataChange(assignment_user);
      }
    };

    return await this._serverApi.assignmentUserListner(
      studentId,
      handleDataChange,
    );
  }

  async liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<'live_quiz_room'> | undefined) => void,
  ) {
    return await this._serverApi.liveQuizListener(
      liveQuizRoomDocId,
      onDataChange,
    );
  }
  async removeLiveQuizChannel() {
    return await this._serverApi.removeLiveQuizChannel();
  }
  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number,
  ): Promise<void> {
    await this._serverApi.updateLiveQuiz(
      roomDocId,
      studentId,
      questionId,
      timeSpent,
      score,
    );
  }

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string,
  ): Promise<string | undefined> {
    const data = await this._serverApi.joinLiveQuiz(assignmentId, studentId);
    return data;
  }
  async getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<'result'>[];
      user_data: TableTypes<'user'>[];
    }[]
  > {
    const res =
      await this._serverApi.getStudentResultsByAssignmentId(assignmentId);
    return res;
  }
  async getAssignmentById(
    id: string,
  ): Promise<TableTypes<'assignment'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Assignment} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getAssignmentsByIds(
    ids: string[],
  ): Promise<TableTypes<'assignment'>[]> {
    await this.ensureInitialized();
    if (!ids.length) return [];

    const idslst = ids.map(() => '?').join(', ');
    const query = `
      SELECT *
      FROM ${TABLES.Assignment}
      WHERE id IN (${idslst})
        AND is_deleted = 0;
    `;

    const res = await this._db?.query(query, ids);
    if (!res?.values?.length) return [];

    return res.values as TableTypes<'assignment'>[];
  }

  async getUserByDocId(
    studentId: string,
  ): Promise<TableTypes<'user'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.User} where id = "${studentId}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async addCourseForParentsStudent(
    courses: TableTypes<'course'>[],
    student: TableTypes<'user'>,
  ) {
    const courseIds = courses?.map((course) => course.id);
    for (const courseId of courseIds) {
      const newUserCourse: TableTypes<'user_course'> = {
        course_id: courseId,
        created_at: new Date().toISOString(),
        id: uuidv4(),
        is_deleted: false,
        updated_at: new Date().toISOString(),
        user_id: student.id,
        is_firebase: null,
      };
      await this.executeQuery(
        `
        INSERT INTO user_course (id, user_id, course_id)
      VALUES (?, ?, ?);
    `,
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id],
      );
      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse,
      );
    }
  }

  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error('Method not implemented.');
  }

  async getChaptersForCourse(
    courseId: string,
  ): Promise<TableTypes<'chapter'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT * FROM ${TABLES.Chapter}
    WHERE course_id = "${courseId}" AND is_deleted = 0
    ORDER BY sort_index ASC;
    `;
    const res = await this._db?.query(query);
    (res?.values ?? []).forEach((chapter) => {
      this.chapterCourseIdCache.set(chapter.id, chapter.course_id ?? courseId);
    });
    return res?.values ?? [];
  }
  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'> | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au
      ON a.id = au.assignment_id
      AND au.user_id = '${studentId}'
      AND au.is_deleted = 0
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = '${studentId}'
    WHERE a.lesson_id = '${lessonId}'
      AND a.class_id = '${classId}'
      AND a.is_deleted = 0
      AND (a.is_class_wise = 1 or au.user_id = '${studentId}')
      AND r.assignment_id IS NULL
    ORDER BY a.updated_at DESC
    LIMIT 1;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getFavouriteLessons(userId: string): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    const query = `
      SELECT DISTINCT l.*
      FROM ${TABLES.FavoriteLesson} fl
      JOIN ${TABLES.Lesson} l
        ON fl.lesson_id = l.id
      WHERE fl.user_id = '${userId}'
      ORDER BY fl.created_at DESC
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  }> {
    await this.ensureInitialized();
    const data: {
      classes: TableTypes<'class'>[];
      schools: TableTypes<'school'>[];
    } = {
      classes: [],
      schools: [],
    };
    const res = await this._db?.query(
      `select c.*,
      JSON_OBJECT(
        'id',s.id,
        'name',s.name,
        'group1',s.group1,
        'group2',s.group2,
        'group3',s.group3,
        'image',s.image,
        'created_at',s.created_at,
        'updated_at',s.updated_at,
        'is_deleted',s.is_deleted
      ) AS school
       from ${TABLES.ClassUser} cu
      join ${TABLES.Class} c
      ON cu.class_id = c.id
      join ${TABLES.School} s
      ON c.school_id = s.id
      where c.is_deleted = 0 and user_id = "${userId}" and role = "${RoleType.STUDENT}" and cu.is_deleted = 0 order by cu.updated_at desc`,
    );
    if (!res || !res.values || res.values.length < 1) return data;
    data.classes = res.values;
    data.schools = res.values.map((val) => JSON.parse(val.school));
    return data;
  }
  async updateFcmToken(userId: string) {
    const token = await Util.getToken();
    const query = `
    UPDATE "user"
    SET fcm_token = "${token}"
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    logger.info('🚀 ~ SqliteApi ~ updateFCM Token:', res);
    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      fcm_token: token,
      id: userId,
    });
  }

  async createOrUpdateAssignmentCart(
    userId: string,
    lessons: string,
  ): Promise<boolean | undefined> {
    const now = new Date().toISOString();
    const existing = readAssignmentCartFromStorage(userId);
    writeAssignmentCartToStorage(userId, {
      lessons,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });
    return true;
  }

  async createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string,
    set_number?: number,
  ): Promise<void> {
    const assignmentUUid = uuidv4();
    const timestamp = new Date().toISOString(); // Cache timestamp for reuse

    try {
      // Insert into assignment table
      await this.executeQuery(
        `INSERT INTO assignment
          (id, created_by, starts_at, ends_at, is_class_wise, class_id, school_id, lesson_id, type, created_at, updated_at, is_deleted, chapter_id, course_id, source, batch_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          assignmentUUid,
          userId,
          starts_at,
          ends_at,
          is_class_wise,
          class_id,
          school_id,
          lesson_id,
          type,
          created_at ?? timestamp,
          timestamp,
          false,
          chapter_id,
          course_id,
          source ?? null,
          batch_id,
        ],
      );

      // Prepare assignment data for push changes
      const assignment_data: TableTypes<'assignment'> = {
        id: assignmentUUid,
        created_by: userId,
        starts_at: starts_at,
        ends_at: ends_at,
        is_class_wise: is_class_wise,
        class_id: class_id,
        school_id: school_id,
        lesson_id: lesson_id,
        type: type,
        created_at: created_at ?? timestamp,
        updated_at: timestamp,
        is_deleted: false,
        chapter_id: chapter_id,
        course_id: course_id,
        batch_id: batch_id ?? null,
        source: source ?? null,
        firebase_id: null,
        is_firebase: null,
        set_number: null,
      };

      this.updatePushChanges(
        TABLES.Assignment,
        MUTATE_TYPES.INSERT,
        assignment_data,
      );

      // If the assignment is not class-wide, assign it to individual students

      if (!is_class_wise && student_list.length > 0) {
        for (const student of student_list) {
          const assignment_user_UUid = uuidv4();
          const newAssignmentUser: TableTypes<'assignment_user'> = {
            assignment_id: assignmentUUid,
            created_at: new Date().toISOString(),
            id: assignment_user_UUid,
            is_deleted: false,
            updated_at: new Date().toISOString(),
            user_id: student,
            is_firebase: null,
          };
          await this.executeQuery(
            `
          INSERT INTO assignment_user (id, assignment_id, user_id,created_at,updated_at,is_deleted)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
            [
              assignment_user_UUid,
              assignmentUUid,
              student,
              new Date().toISOString(),
              new Date().toISOString(),
              false,
            ],
          );
          this.updatePushChanges(
            TABLES.Assignment_user,
            MUTATE_TYPES.INSERT,
            newAssignmentUser,
          );
        }
      }
    } catch (error) {
      logger.error('Error in createAssignment:', error);
    }
  }

  async createUserDoc(
    user: TableTypes<'user'>,
  ): Promise<TableTypes<'user'> | undefined> {
    const countryCode = await this.getClientCountryCode();
    let locale: TableTypes<'locale'> | null = await this.getLocaleByIdOrCode(
      undefined,
      countryCode,
    );
    const localeId = locale?.id ?? DEFAULT_LOCALE_ID;
    const tcAgreedVersion = user.tc_agreed_version ?? 0;
    user.tc_agreed_version = tcAgreedVersion;

    await this.executeQuery(
      `
      INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id, locale_id, tc_agreed_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
        (user.locale_id = localeId),
        tcAgreedVersion,
      ],
    );
    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, user);

    return user;
  }

  async syncDB(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
    isFirstSync?: boolean,
  ): Promise<boolean> {
    try {
      await this.syncDbNow(tableNames, refreshTables, isFirstSync);
      return true;
    } catch (error) {
      logger.error('🚀 ~ SqliteApi ~ syncDB ~ error:', error);
      return false;
    }
  }

  isSyncInProgress(): boolean {
    return this._syncInProgress;
  }
  async getUserAssignmentCart(
    userId: string,
  ): Promise<AssignmentCartData | undefined> {
    const cart = readAssignmentCartFromStorage(userId);
    return cart;
  }

  async updateSchoolProgram(
    schoolId: string,
    programId: string,
  ): Promise<boolean> {
    return this._serverApi.updateSchoolProgram(schoolId, programId);
  }
  async computeSchoolMetricsForSchool(schoolId: string): Promise<boolean> {
    return this._serverApi.computeSchoolMetricsForSchool(schoolId);
  }
}
