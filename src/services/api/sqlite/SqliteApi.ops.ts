import { v4 as uuidv4 } from 'uuid';
import {
  AVATARS,
  CACHETABLES,
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  CoordinatorAPIResponse,
  CoordinatorInfo,
  COURSES,
  EnumType,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  GeoDataParams,
  LATEST_LEARNING_PATH,
  LATEST_STARS,
  MUTATE_TYPES,
  PrincipalAPIResponse,
  PrincipalInfo,
  RequestTypes,
  STATUS,
  SchoolVisitAction,
  SchoolVisitType,
  SearchSchoolsParams,
  SearchSchoolsResult,
  StudentAPIResponse,
  StudentInfo,
  TABLES,
  TableTypes,
  TeacherAPIResponse,
  TeacherInfo,
} from '../../../common/constants';
import {
  PaginatedResponse,
  RoleType,
  SchoolNote,
} from '../../../interface/modelInterfaces';
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from '../../../ops-console/pages/NewUserPageOps';
import { FCSchoolStats } from '../../../ops-console/pages/SchoolDetailsPage';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { Json } from '../../database';
import { ServiceConfig } from '../../ServiceConfig';

import { SqliteApiCampaign } from './SqliteApi.campaign';
export interface SqliteApiOps {
  [key: string]: any;
}
export class SqliteApiOps extends SqliteApiCampaign {
  async deleteTeacher(classId: string, teacherId: string) {
    await this.ensureInitialized();
    try {
      const query = `
      SELECT *
      FROM ${TABLES.ClassUser}
      WHERE user_id = ? AND class_id = ?
      AND role = 'teacher' AND is_deleted = 0
    `;
      const res = await this._db?.query(query, [teacherId, classId]);
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1 WHERE user_id = ? AND class_id = ? AND role = 'teacher' AND is_deleted = 0`,
        [teacherId, classId],
      );

      let userData;

      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
      } else {
        throw new Error('Teacher not found after update.');
      }

      await this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });
    } catch (error) {
      logger.error('🚀 ~ SqliteApi ~ deleteTeacher ~ error:', error);
    }
  }
  async getClassCodeById(class_id: string): Promise<number | undefined> {
    await this.ensureInitialized();
    if (!class_id) return;
    const currentDate = new Date().toISOString(); // Convert to a proper format for SQL (ISO 8601)
    const query = `SELECT code
    FROM ${TABLES.ClassInvite_code}
    WHERE class_id='${class_id}'
    AND is_deleted = FALSE
    AND (expires_at >= '${currentDate}')`;

    try {
      const res = await this._db?.query(query);
      return res?.values?.[0]?.code;
    } catch (error) {
      logger.error('Error executing query:', error); // Log any errors
      return;
    }
  }

  async createClassCode(classId: string): Promise<number> {
    if (!classId) {
      throw new Error('Class ID is required to create a class code.');
    }
    const existingClassCode = await this.getClassCodeById(classId);

    if (existingClassCode) {
      return existingClassCode;
    }
    let classCode = await this._serverApi.createClassCode(classId);
    if (!classCode) {
      throw new Error(`A class code is not created`);
    }
    this.syncDB();
    return classCode;
  }
  async getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    await this.ensureInitialized();
    const query = `SELECT *
       FROM ${TABLES.Result}
       WHERE chapter_id = '${chapter_id}'
       AND course_id = '${course_id}'
       AND class_id ='${classId}'
       AND created_at BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY created_at DESC;`;

    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async getUniqueAssignmentIdsByCourseAndChapter(
    classId: string,
    courseId: string,
    chapterIdOrIds: string | string[],
  ): Promise<string[]> {
    await this.ensureInitialized();
    const chapterIds = Array.isArray(chapterIdOrIds)
      ? chapterIdOrIds.filter(Boolean)
      : [chapterIdOrIds].filter(Boolean);

    if (!chapterIds.length) return [];

    const idslst = chapterIds.map(() => '?').join(', ');
    const query = `
      SELECT DISTINCT id
      FROM ${TABLES.Assignment}
      WHERE class_id = ?
        AND course_id = ?
        AND chapter_id IN (${idslst})
        AND is_deleted = 0;
    `;

    const res = await this._db?.query(query, [
      classId,
      courseId,
      ...chapterIds,
    ]);
    if (!res?.values?.length) return [];

    return res.values
      .map((row: any) => row.id as string | undefined)
      .filter((id): id is string => Boolean(id));
  }

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
  async updateSchoolLastModified(schoolId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE school SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      schoolId,
    ]);
    this.updatePushChanges(TABLES.School, MUTATE_TYPES.UPDATE, {
      id: schoolId,
      updated_at: updatedAt,
    });
  }

  async updateClassLastModified(classId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE class SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      classId,
    ]);
    this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, {
      id: classId,
      updated_at: updatedAt,
    });
  }

  async updateUserLastModified(userId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE user SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      userId,
    ]);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      id: userId,
      updated_at: updatedAt,
    });
  }
  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    const validatedData = await this._serverApi.validateParentAndStudentInClass(
      schoolId,
      studentName,
      className,
      phoneNumber,
    );
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }
  async validateSchoolUdiseCode(
    schoolId: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData =
      await this._serverApi.validateSchoolUdiseCode(schoolId);
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }
  async validateProgramName(
    programName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData =
      await this._serverApi.validateProgramName(programName);
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }
  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData = await this._serverApi.validateClassNameWithSchoolID(
      schoolId,
      className,
    );
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }

  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    const validatedData =
      await this._serverApi.validateStudentInClassWithoutPhone(
        studentName,
        className,
        schoolId,
      );
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }

  async validateSchoolData(
    schoolId: string,
    schoolName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const schoolData = await this._serverApi.validateSchoolData(
      schoolId,
      schoolName,
    );
    if (schoolData.status === 'error') {
      return { status: 'error', errors: schoolData.errors };
    }
    return { status: 'success' };
  }

  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const ClassCurriculum =
      await this._serverApi.validateClassCurriculumAndSubject(
        curriculumName,
        subjectName,
        gradeName,
      );
    if (ClassCurriculum.status === 'error') {
      return {
        status: 'error',
        errors: ClassCurriculum.errors || ['Invalid class curriculum'],
      };
    }
    return { status: 'success' };
  }

  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const response = await this._serverApi.validateUserContacts(
      programManagerPhone,
      fieldCoordinatorPhone,
    );
    if (response.status === 'error') {
      return {
        status: 'error',
        errors: response.errors || ['Invalid user contacts'],
      };
    }
    return { status: 'success' };
  }
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

  async deleteOldDebugInfoData(): Promise<void> {
    const deleteQuery = `
      DELETE FROM debug_info
      WHERE DATE(created_at) < DATE('now', '-30 days')
    `;
    await this.executeQuery(deleteQuery);
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

  private async createDebugInfoTables() {
    const createDebugInfoTable = `
      CREATE TABLE IF NOT EXISTS debug_info (
        id TEXT NOT NULL PRIMARY KEY,
        parent_id TEXT NOT NULL,
        No_of_pushed INTEGER,
        No_of_pulled INTEGER,
        data_transferred INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
      )
    `;
    await this.executeQuery(createDebugInfoTable);
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
  parseClassName(className: string): { grade: number; section: string } {
    const cleanedName = className.trim();
    if (!cleanedName) {
      return { grade: 0, section: '' };
    }

    let grade = 0;
    let section = '';

    // Pattern 1: Just a number (e.g., "1", "5", "10")
    const numericMatch = cleanedName.match(/^(\d+)$/);
    if (numericMatch) {
      grade = parseInt(numericMatch[1], 10);
      return { grade: isNaN(grade) ? 0 : grade, section: '' };
    }

    // Pattern 2: Number followed by letters or words (e.g., "3A", "5 B")
    const alphanumericMatch = cleanedName.match(/(\d+)\s*(\w+)/i);
    if (alphanumericMatch) {
      grade = parseInt(alphanumericMatch[1], 10);
      section = alphanumericMatch[2];
      return { grade: isNaN(grade) ? 0 : grade, section };
    }

    logger.warn(
      `Could not parse grade from class name: "${cleanedName}". Assigning grade 0.`,
    );
    return { grade: 0, section: cleanedName };
  }

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
      .map((row) => String((row as { id?: string | null })?.id ?? '').trim())
      .filter((id): id is string => id.length > 0);
    // Hydrate full parent contact list so UI can show merged phone/email entries.
    const parentRows = (await this.getParentsByStudentId('', {
      studentIds,
      activeOnly: true,
    })) as Array<TableTypes<'user'> & { linked_student_id?: string | null }>;

    const studentInfoList: StudentInfo[] = rows.map((row) => {
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
      .map((row) => String((row as { id?: string | null })?.id ?? '').trim())
      .filter((id): id is string => id.length > 0);
    // Hydrate full parent contact list so UI can show merged phone/email entries.
    const parentRows = (await this.getParentsByStudentId('', {
      studentIds,
      activeOnly: true,
    })) as Array<TableTypes<'user'> & { linked_student_id?: string | null }>;

    const studentInfoList: StudentInfo[] = rows.map((row) => {
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
        options?.studentIds?.filter((id) => id.trim() !== '') ??
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

  public async updateFcUserFormsContactUserId(
    oldStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this._serverApi.updateFcUserFormsContactUserId(
      oldStudentId,
      newStudentId,
    );
  }

  async createAutoProfile(
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const studentProfile = await this.getParentStudentProfiles();
    if (studentProfile.length > 0) return studentProfile[0];
    const studentId = uuidv4();
    const newStudent: TableTypes<'user'> = {
      id: studentId,
      name: null,
      age: null,
      gender: null,
      avatar: randomAvatar,
      image: null,
      curriculum_id: null,
      grade_id: null,
      language_id: languageDocId ?? null,
      locale_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_tc_accepted: true,
      tc_agreed_version: tcVersion ?? 0,
      email: null,
      phone: null,
      fcm_token: null,
      music_off: false,
      reward: null,
      sfx_off: false,
      student_id: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      learning_path: null,
      ops_created_by: null,
      stars: null,
      is_wa_contact: null,
    };

    await this.executeQuery(
      `
      INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, grade_id, language_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newStudent.id,
        newStudent.name,
        newStudent.age,
        newStudent.gender,
        newStudent.avatar,
        newStudent.image,
        newStudent.curriculum_id,
        newStudent.grade_id,
        newStudent.language_id,
        newStudent.created_at,
        newStudent.updated_at,
      ],
    );

    const parentUserId = uuidv4();
    await this.executeQuery(
      `
      INSERT INTO parent_user (id, parent_id, student_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?);
      `,
      [
        parentUserId,
        _currentUser.id,
        studentId,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );

    // Find English, Maths, and language-dependent subject
    const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
    const mathsCourse = await this.resolveMathCourseByLanguage(languageDocId);
    const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);
    const language = await this.getLanguageWithId(languageDocId!);
    let langCourse;
    if (language && language.code !== COURSES.ENGLISH) {
      // Map language code to courseId
      const thirdLanguageCourseMap: Record<string, string> = {
        hi: CHIMPLE_HINDI,
        kn: GRADE1_KANNADA,
        mr: GRADE1_MARATHI,
      };

      const courseId = thirdLanguageCourseMap[language.code ?? ''];
      if (courseId) {
        langCourse = await this.getCourse(courseId);
      }
    }
    const coursesToAdd = [
      englishCourse,
      mathsCourse,
      langCourse,
      digitalSkillsCourse,
    ].filter(Boolean);

    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, newStudent);
    await this.updatePushChanges(TABLES.ParentUser, MUTATE_TYPES.INSERT, {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    for (const course of coursesToAdd) {
      if (!course) continue;
      const newUserCourse: TableTypes<'user_course'> = {
        course_id: course.id,
        created_at: new Date().toISOString(),
        id: uuidv4(),
        is_deleted: false,
        updated_at: new Date().toISOString(),
        user_id: studentId,
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

    return newStudent;
  }

  async isProgramUser(): Promise<boolean> {
    return await this._serverApi.isProgramUser();
  }
  async isSplUser(): Promise<boolean> {
    return await this._serverApi.isSplUser();
  }

  async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this._serverApi.program_activity_stats(programId);
  }

  async getManagersAndCoordinators(
    page: number = 1,
    search: string = '',
    limit: number = 10,
    sortBy: keyof TableTypes<'user'> = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    data: { user: TableTypes<'user'>; role: string }[];
    totalCount: number;
  }> {
    return await this._serverApi.getManagersAndCoordinators(
      page,
      search,
      limit,
      sortBy,
      sortOrder,
    );
  }

  async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this._serverApi.school_activity_stats(schoolId);
  }
  async isProgramManager(): Promise<boolean> {
    return await this._serverApi.isProgramManager();
  }

  async getUserSpecialRoles(userId: string): Promise<string[]> {
    return await this._serverApi.getUserSpecialRoles(userId);
  }
  async updateSpecialUserRole(userId: string, role: string): Promise<void> {
    return await this._serverApi.updateSpecialUserRole(userId, role);
  }
  async deleteSpecialUser(userId: string): Promise<void> {
    return await this._serverApi.deleteSpecialUser(userId);
  }
  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    return await this._serverApi.updateProgramUserRole(userId, role);
  }
  async deleteProgramUser(userId: string): Promise<void> {
    return await this._serverApi.deleteProgramUser(userId);
  }
  async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType,
  ): Promise<void> {
    return await this._serverApi.deleteUserFromSchoolsWithRole(userId, role);
  }
  /**
   * Fetches school login type and program model using UDISE code from SQLite
   * @param {string} udiseCode - The UDISE ID of the school
   * @returns An object with studentLoginType, programId, and programModel if found, else null
   */
  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    schoolId?: string;
    studentLoginType: string;
    schoolModel: string;
    whatsappBotNumber?: string;
  } | null> {
    // Step 1: Get school info by UDISE code
    const schoolRes = await this.executeQuery(
      `SELECT id, student_login_type, model, whatsapp_bot_number FROM school WHERE udise = ? AND is_deleted = 0`,
      [udiseCode],
    );

    if (!schoolRes?.values?.length) {
      return null;
    }

    const { id, student_login_type, model, whatsapp_bot_number } =
      schoolRes.values[0];

    return {
      schoolId: id || '',
      studentLoginType: student_login_type || '',
      schoolModel: model || '',
      whatsappBotNumber: whatsapp_bot_number || '',
    };
  }
  async getSchoolDataByUdise(
    udiseCode: string,
  ): Promise<TableTypes<'school_data'> | null> {
    const schoolRes = await this.executeQuery(
      `SELECT * FROM school_data WHERE udise = ?`,
      [udiseCode],
    );
    if (!schoolRes?.values?.length) {
      return null;
    }
    return schoolRes.values[0];
  }

  async getChaptersByIds(
    chapterIds: string[],
  ): Promise<TableTypes<'chapter'>[]> {
    if (!chapterIds || chapterIds.length === 0) {
      logger.warn('getChaptersByIds was called with no chapter IDs.');
      return [];
    }

    try {
      const placeholders = chapterIds.map(() => '?').join(', ');

      const query = `SELECT *
        FROM ${TABLES.Chapter}
        WHERE id IN (${placeholders})
          AND is_deleted = 0;`;

      const res = await this.executeQuery(query, chapterIds);

      if (!res || !res.values) {
        logger.warn('No chapters found for the provided ChapterIDs');
        return [];
      }

      return res.values as TableTypes<'chapter'>[];
    } catch (error) {
      logger.error('Error fetching chapters', error);
      return [];
    }
  }
  async addParentToNewClass(classID: string, studentId: string) {
    throw new Error('Method not implemented.');
  }
  async getOpsRequests(
    requestStatus: EnumType<'ops_request_status'>,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at',
    orderDir: 'asc' | 'desc' = 'asc',
    filters?: { request_type?: string[]; school?: string[] },
    searchTerm?: string,
  ): Promise<{
    data: Array<TableTypes<'ops_requests'> | Record<string, Json>>;
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    throw new Error('Method not implemented.');
  }
  async getRequestFilterOptions(): Promise<{
    requestType: Array<string | null>;
    school: { id: string; name: string }[];
  } | null> {
    throw new Error('Method not implemented.');
  }
  async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number,
    classId?: string,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    await this.ensureInitialized();
    if (!this._db) return { data: [], total: 0 };
    // Empty program class scopes should return an empty search result.
    if (!classId && classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }
    let whereClause = `
    cu.role = 'student'
    AND cu.is_deleted = 0
    AND c.school_id = ?
  `;
    let params: any[] = [schoolId];
    // Applies program class scope while preserving the class-detail override.
    if (classId) {
      whereClause += ` AND cu.class_id = ?`;
      params.push(classId);
    } else if (classIds && classIds.length > 0) {
      const classScopePlaceholders = classIds.map(() => '?').join(', ');
      whereClause += ` AND cu.class_id IN (${classScopePlaceholders})`;
      params.push(...classIds);
    }
    // ✅ SEARCH FILTER
    if (searchTerm && searchTerm.trim() !== '') {
      whereClause += `
      AND (
        u.name LIKE ?
        OR u.student_id LIKE ?
        OR u.phone LIKE ?
      )
    `;
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
    const offset = (page - 1) * limit;
    // ✅ COUNT QUERY
    const countQuery = `
    SELECT COUNT(*) as total
    FROM class_user cu
    JOIN user u ON cu.user_id = u.id
    JOIN class c ON cu.class_id = c.id
    WHERE ${whereClause}
  `;
    const countResult = await this._db.query(countQuery, params);
    const total = countResult?.values?.[0]?.total ?? 0;
    // ✅ DATA QUERY
    const query = `
    SELECT
      u.id,
      u.name,
      u.student_id,
      u.phone,
      cu.class_id,
      c.name as class_name,
      pu.parent_id,
      p.name as parent_name
    FROM class_user cu
    JOIN user u ON cu.user_id = u.id
    JOIN class c ON cu.class_id = c.id
    LEFT JOIN parent_user pu
      ON pu.student_id = u.id
      AND pu.is_deleted = 0
    LEFT JOIN user p
      ON pu.parent_id = p.id
    WHERE ${whereClause}
    ORDER BY u.name
    LIMIT ? OFFSET ?
  `;
    const result = await this._db.query(query, [...params, limit, offset]);
    return { data: result?.values ?? [], total };
  }

  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    await this.ensureInitialized();
    if (!this._db) return { data: [], total: 0 };
    // Empty program class scopes should return an empty search result.
    if (classIds && classIds.length === 0) return { data: [], total: 0 };
    let whereClause = `cu.role = 'teacher' AND cu.is_deleted = 0 AND c.school_id = ?`;
    let params: any[] = [schoolId];
    // Applies program class scope before searching teacher memberships.
    if (classIds && classIds.length > 0) {
      const classScopePlaceholders = classIds.map(() => '?').join(', ');
      whereClause += ` AND cu.class_id IN (${classScopePlaceholders})`;
      params.push(...classIds);
    }
    if (searchTerm && searchTerm.trim() !== '') {
      whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM class_user cu
      JOIN user u ON cu.user_id = u.id
      JOIN class c ON cu.class_id = c.id
      WHERE ${whereClause}
    `;
    const countResult = await this._db.query(countQuery, params);
    const total = countResult?.values?.[0]?.total ?? 0;
    // Paginated query
    const offset = (page - 1) * limit;
    const query = `
      SELECT u.id, u.name, u.email, u.phone, cu.class_id, c.name as class_name
      FROM class_user cu
      JOIN user u ON cu.user_id = u.id
      JOIN class c ON cu.class_id = c.id
      WHERE ${whereClause}
      ORDER BY u.name
      LIMIT ? OFFSET ?
    `;
    const result = await this._db.query(query, [...params, limit, offset]);
    return { data: result?.values ?? [], total };
  }
  async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    return await this._serverApi.respondToSchoolRequest(
      requestId,
      respondedBy,
      status,
      rejectedReasonType,
      rejectedReasonDescription,
    );
  }
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
  async clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void> {
    await this.ensureInitialized();
    if (!this._db) return;
    const query = `PRAGMA foreign_keys=OFF;`;
    const result = await this._db?.query(query);
    logger.warn(result);
    for (const table of tableNames) {
      const tableDel = `DELETE FROM "${table}";`;
      const res = await this._db.query(tableDel);
      logger.info(res);
    }
    const vaccum = `VACUUM;`;
    const resv = await this._db.query(vaccum);
    logger.info(resv);
  }
  async approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    return await this._serverApi.approveOpsRequest(
      requestId,
      respondedBy,
      role,
      schoolId,
      classId,
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
      const r = this._cachedRewards.find((x) => x.id === rewardId);
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
  public async getOrcreateschooluser(
    params: UserSchoolClassParams,
  ): Promise<UserSchoolClassResult> {
    return this._serverApi.getOrcreateschooluser(params);
  }

  public async createAtSchoolUser(
    id: string,
    schoolName: string,
    udise: string,
    role: RoleType,
    isEmailVerified: boolean,
  ): Promise<void> {
    logger.error('Method not implemented.');
  }
  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any,
  ): Promise<void> {
    try {
      let fields = 'model = ?';
      const values: any[] = [schoolModel];

      if (locationLink !== undefined && locationLink !== null) {
        fields += ', location_link = ?';
        values.push(locationLink);
      }

      if (keyContacts) {
        fields += ', key_contacts = ?';
        values.push(JSON.stringify(keyContacts));
      }

      const timestamp = new Date().toISOString();
      fields += ', updated_at = ?';
      values.push(timestamp);

      values.push(schoolId);

      const query = `
        UPDATE school
        SET ${fields}
        WHERE id = ? AND is_deleted = 0;
      `;
      await this.executeQuery(query, values);

      const pushObject = {
        id: schoolId,
        model: schoolModel,
        location_link: locationLink ?? null,
        key_contacts: JSON.stringify(keyContacts) ?? null,
        updated_at: timestamp,
      };

      await this.updatePushChanges(
        TABLES.School,
        MUTATE_TYPES.UPDATE,
        pushObject,
      );
    } catch (error) {
      logger.error('❌ Error inserting school details:', error);
    }
  }

  async recordSchoolVisit(
    schoolId: string,
    lat: number,
    lng: number,
    action: SchoolVisitAction,
    visitType?: SchoolVisitType,
    distanceFromSchool?: number,
    numberOfParents?: number,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    try {
      return await this._serverApi.recordSchoolVisit(
        schoolId,
        lat,
        lng,
        action,
        visitType,
        distanceFromSchool,
        numberOfParents,
      );
    } catch (error) {
      logger.error('❌ Error recording school visit:', error);
      return null;
    }
  }

  async getLastSchoolVisit(
    schoolId: string,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    if (this._serverApi) {
      return this._serverApi.getLastSchoolVisit(schoolId);
    }
    return Promise.resolve(null);
  }

  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const deleteQuery = `
        UPDATE class_course
        SET is_deleted = 1, updated_at = ?
        WHERE class_id = ? AND is_deleted = 0;
      `;
      await this.executeQuery(deleteQuery, [timestamp, classId]);
      for (const courseId of selectedCourseIds) {
        const id = uuidv4();

        const insertQuery = `
          INSERT INTO class_course (
            id,
            class_id,
            course_id,
            created_at,
            updated_at,
            is_deleted
          )
          VALUES (?, ?, ?, ?, ?, 0);
        `;

        await this.executeQuery(insertQuery, [
          id,
          classId,
          courseId,
          timestamp,
          timestamp,
        ]);
        this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.INSERT, {
          id,
          class_id: classId,
          course_id: courseId,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: 0,
        });
      }
    } catch (error) {
      logger.error('❌ Error replacing class courses:', error);
    }
  }
  public async addStudentWithParentValidation(params: {
    phone?: string;
    name: string;
    gender: string;
    age: string;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?: string;
    studentID?: string;
    atSchool?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return this._serverApi.addStudentWithParentValidation(params);
  }
  public async getFilteredFcQuestions(
    type: EnumType<'fc_support_level'> | null,
    targetType: EnumType<'fc_engagement_target'>,
  ): Promise<TableTypes<'fc_question'>[] | []> {
    throw new Error('Method not implemented.');
  }
  public async saveFcUserForm(payload: {
    visitId?: string | null;
    userId: string;
    schoolId: string;
    classId?: string | null;
    contactUserId?: string | null;
    contactTarget: EnumType<'fc_engagement_target'>;
    contactMethod: EnumType<'fc_contact_method'>;
    callStatus?: EnumType<'fc_call_result'> | null;
    supportLevel?: EnumType<'fc_support_level'> | null;
    questionResponse: Record<string, string>;
    techIssuesReported: boolean;
    comment?: string | null;
    techIssueComment?: string | null;
    mediaLinks?: string[] | null;
  }): Promise<{
    data: TableTypes<'fc_user_forms'> | null;
    error: object | null;
  }> {
    throw new Error('Method not implemented.');
  }
  public async getTodayVisitId(
    userId: string,
    schoolId: string,
  ): Promise<string | null> {
    throw new Error('Method not implemented.');
  }
  public async getActivitiesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'fc_user_forms'>[]> {
    return this._serverApi.getActivitiesBySchoolId(schoolId);
  }
  public async getSchoolVisitById(
    visitIds: string[],
  ): Promise<TableTypes<'fc_school_visit'>[]> {
    return this._serverApi.getSchoolVisitById(visitIds);
  }
  async getActivitiesFilterOptions(): Promise<{
    contactType: Array<string | null>;
    performance: Array<string | null>;
  } | null> {
    throw new Error('Method not implemented.');
  }

  async createNoteForSchool(params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  }): Promise<any> {
    logger.warn('createNoteForSchool is not supported in SQLite mode');
    return this._serverApi.createNoteForSchool(params);
  }

  async getNotesBySchoolId(
    schoolId: string,
    limit?: number,
    offset?: number,
    sortBy?: 'createdAt' | 'createdBy',
  ): Promise<PaginatedResponse<SchoolNote>> {
    logger.warn('getNotesBySchoolId is not supported in SQLite mode');

    return this._serverApi.getNotesBySchoolId(schoolId, limit, offset, sortBy);
  }

  async getRecentAssignmentCountByTeacher(
    teacherId: string,
    classId: string,
  ): Promise<number | null> {
    logger.warn(
      'getRecentAssignmentCountByTeacher is not supported in SQLite mode',
    );
    return this._serverApi.getRecentAssignmentCountByTeacher(
      teacherId,
      classId,
    );
  }
  public async getSchoolStatsForSchool(
    schoolId: string,
  ): Promise<FCSchoolStats> {
    return this._serverApi.getSchoolStatsForSchool(schoolId);
  }
  public async uploadSchoolVisitMediaFile(params: {
    schoolId: string;
    file: File;
  }): Promise<string> {
    return this._serverApi.uploadSchoolVisitMediaFile(params);
  }
}
