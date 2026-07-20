import { v4 as uuidv4 } from 'uuid';
import {
  AVATARS,
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  EnumType,
  FilteredSchoolsForSchoolListingOps,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  GeoDataParams,
  MUTATE_TYPES,
  RequestTypes,
  STATUS,
  SchoolRoleMap,
  SearchSchoolsParams,
  SearchSchoolsResult,
  TABLES,
  TabType,
  TableTypes,
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
import {
  ClassMetricsForClassListingRow,
  GetSchoolsWithProgramAccessParams,
  ProgramListingProgramRow,
  SchoolProgramAccessResponse,
} from '../ServiceApi';
import { SqliteApiCampaign } from './SqliteApi.campaign';

export interface SqliteApiProgram {
  [key: string]: any;
}
export class SqliteApiProgram extends SqliteApiCampaign {
  async insertProgram(payload: any): Promise<boolean | null> {
    return await this._serverApi.insertProgram(payload);
  }

  async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    return await this._serverApi.getUniqueGeoData();
  }

  async getProgramForSchool(
    schoolId: string,
  ): Promise<TableTypes<'program'> | undefined> {
    const prog = await this._serverApi.getProgramForSchool(schoolId);
    return prog;
  }

  async getProgramManagersForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    const users = await this._serverApi.getProgramManagersForSchool(schoolId);
    return users;
  }
  async updateStudentStars(
    studentId: string,
    totalStars: number,
  ): Promise<void> {
    if (!studentId) return;
    try {
      await this.executeQuery(
        `UPDATE ${TABLES.User} SET stars = ? WHERE id = ?;`,
        [totalStars, studentId],
      );

      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: studentId,
        stars: totalStars,
      });
    } catch (error) {
      logger.error('Error setting stars for student:', error);
    }
  }
  async getChapterIdbyQrLink(
    link: string,
  ): Promise<TableTypes<'chapter_links'> | undefined> {
    await this.ensureInitialized();
    if (!link) return;
    try {
      const res = await this._db?.query(
        `SELECT * FROM ${TABLES.ChapterLinks} WHERE link = ? AND is_deleted = 0 LIMIT 1;`,
        [link],
      );

      if (!res || !res.values || res.values.length < 1) return;
      return res.values[0];
    } catch (error) {
      logger.error('Error fetching chapter by QR link:', error);
      return;
    }
  }
  async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this._serverApi.getSchoolsForAdmin(limit, offset);
  }
  async getSchoolsByModel(
    model: EnumType<'program_model'>,
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this._serverApi.getSchoolsByModel(model, limit, offset);
  }
  async getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getTeachersForSchools(schoolIds);
  }
  async getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getStudentsForSchools(schoolIds);
  }
  async getProgramManagersForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getProgramManagersForSchools(schoolIds);
  }
  async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: {
      name: string;
      role: string;
      phone: string;
      email: string;
    }[];
  } | null> {
    return await this._serverApi.getProgramData(programId);
  }

  public async getProgramsFromProgramMetrics(params: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    tab?: TabType;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
  }): Promise<{
    data: ProgramListingProgramRow[];
    total: number;
  }> {
    return await this._serverApi.getProgramsFromProgramMetrics(params);
  }

  async getFieldCoordinatorsForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getFieldCoordinatorsForSchools(schoolIds);
  }

  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    return await this._serverApi.getSchoolFilterOptionsForSchoolListing();
  }

  async getSchoolFilterOptionsForProgram(
    programId: string,
  ): Promise<Record<string, string[]>> {
    return await this._serverApi.getSchoolFilterOptionsForProgram(programId);
  }

  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, 'low' | 'mid' | 'high'>;
    school_performance_filter?: string | null;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this._serverApi.getFilteredSchoolsForSchoolListing(params);
  }

  async getSchoolMetricsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, 'low' | 'mid' | 'high'>;
    school_performance_filter?: string | null;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this._serverApi.getSchoolMetricsForSchoolListing(params);
  }

  async getClassMetricsForClassListing(params: {
    schoolId: string;
    date_range?: string;
  }): Promise<ClassMetricsForClassListingRow[]> {
    return await this._serverApi.getClassMetricsForClassListing(params);
  }

  async getSchoolsWithProgramAccess(
    params: GetSchoolsWithProgramAccessParams,
  ): Promise<SchoolProgramAccessResponse> {
    return await this._serverApi.getSchoolsWithProgramAccess(params);
  }

  async createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }> {
    return await this._serverApi.createOrAddUserOps(payload);
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

  async getParentsReachedBySchoolIds(
    schoolIds: string[],
  ): Promise<Record<string, number>> {
    return await this._serverApi.getParentsReachedBySchoolIds(schoolIds);
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
