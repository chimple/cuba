import { v4 as uuidv4 } from 'uuid';
import {
  EnumType,
  LEARNING_PATHWAY_MODE,
  LeaderboardDropdownList,
  MODES,
  RequestTypes,
  STATUS,
  StudentAPIResponse,
  StudentInfo,
  TABLES,
  TableTypes,
  TeacherAPIResponse,
  TeacherInfo,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { sortBySchoolSearchRelevance } from '../../../utility/schoolSearchUtil';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import {
  JoinClassInviteLookupResult,
  LeaderboardInfo,
  StudentLeaderboardInfo,
} from '../ServiceApi';
import { SupabaseApiResults } from './SupabaseApi.results';

const GENERIC_LEADERBOARD_LIMIT = 50;

type LeaderboardDataType = 'weekly' | 'monthly' | 'allTime';

const emptyLeaderboardInfo = (): LeaderboardInfo => ({
  weekly: [],
  allTime: [],
  monthly: [],
});

const getLeaderboardDataType = (
  leaderboardDropdownType: LeaderboardDropdownList,
): LeaderboardDataType =>
  leaderboardDropdownType === LeaderboardDropdownList.WEEKLY
    ? 'weekly'
    : leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
      ? 'monthly'
      : 'allTime';

const mapLeaderboardRow = (result: any): StudentLeaderboardInfo => ({
  name: result.name || '',
  score: result.total_score || 0,
  timeSpent: result.total_time_spent || 0,
  lessonsPlayed: result.lessons_played || 0,
  userId: result.student_id || '',
});

const pushLeaderboardRow = (leaderBoardList: LeaderboardInfo, result: any) => {
  const leaderboardEntry = mapLeaderboardRow(result);
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
};

export interface SupabaseApiUser {
  [key: string]: any;
}
export class SupabaseApiUser extends SupabaseApiResults {
  async getClassById(id: string): Promise<TableTypes<'class'> | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from(TABLES.Class)
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      logger.error('Error in getting class', error);
      return;
    }
    return data ?? undefined;
  }
  async getSchoolById(id: string): Promise<TableTypes<'school'> | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from(TABLES.School)
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error in getting school', error);
      return;
    }
    return data ?? undefined;
  }

  async isStudentLinked(
    studentId: string,
    fromCache: boolean,
  ): Promise<boolean> {
    if (!this.supabase) return false;
    const { error } = await this.supabase
      .from(TABLES.ClassUser)
      .select('*')
      .eq('user_id', studentId)
      .eq('role', RoleType.STUDENT)
      .eq('is_deleted', false)
      .single();

    if (error) {
      logger.error('Error in isStudentLinked', error);
      return false;
    }
    return true;
  }
  async getPendingAssignments(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    if (!this.supabase) return [];
    const nowIso = new Date().toISOString();

    // Fetch assignments with left joins to assignment_user and result
    const { data: allAssignments, error } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
      *,
      assignment_user:assignment_user!left(user_id),
      result:result!left(assignment_id,student_id)
    `,
      )
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .neq('type', 'assessment')
      .or(`starts_at.is.null,starts_at.lte."${nowIso}"`)
      .or(`ends_at.is.null,ends_at.gt."${nowIso}"`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching assignments:', error);
      return [];
    }

    // Filter: (is_class_wise === true OR assignment_user.user_id === studentId)
    // AND result for this student is null
    const filtered = (allAssignments ?? []).filter((a: any) => {
      const isClassWise = a.is_class_wise === true;
      const isAssignedToStudent = Array.isArray(a.assignment_user)
        ? a.assignment_user.some((au: any) => au.user_id === studentId)
        : a.assignment_user?.user_id === studentId;
      const hasResultForStudent = Array.isArray(a.result)
        ? a.result.some((r: any) => r.student_id === studentId)
        : a.result?.student_id === studentId;
      return (isClassWise || isAssignedToStudent) && !hasResultForStudent;
    });

    return filtered;
  }
  async getSchoolsForUser(
    userId: string,
    options?: { page?: number; page_size?: number; search?: string },
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    if (!this.supabase) return [];

    const search = options?.search?.trim();
    const page = options?.page ?? 1;
    const page_size = options?.page_size ?? 20;
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;

    // --- Special users ---
    const { data: specialUser, error: specialError } = await this.supabase
      .from(TABLES.SpecialUsers)
      .select('role')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (specialError) {
      logger.error('Error fetching special_users:', specialError);
    } else if (specialUser) {
      const role = specialUser.role as RoleType;

      // --- SUPER ADMIN / OPERATIONAL DIRECTOR ---
      if (
        role === RoleType.SUPER_ADMIN ||
        role === RoleType.OPERATIONAL_DIRECTOR
      ) {
        let query = this.supabase
          .from(TABLES.School)
          .select('*')
          .eq('is_deleted', false)
          .order('name', { ascending: true })
          .range(from, to);

        if (search) query = query.ilike('name', `%${search}%`);

        const { data: allSchools, error: allErr } = await query;
        if (allErr) {
          logger.error('Error fetching all schools:', allErr);
          return [];
        }
        return (allSchools ?? []).map((school) => ({ school, role }));
      }

      // --- PROGRAM MANAGER / FIELD COORDINATOR ---
      if (
        role === RoleType.PROGRAM_MANAGER ||
        role === RoleType.FIELD_COORDINATOR
      ) {
        const { data: progUsers, error: puErr } = await this.supabase
          .from(TABLES.ProgramUser)
          .select('program_id')
          .eq('user', userId)
          .eq('is_deleted', false);

        if (puErr) {
          logger.error('Error fetching program_user:', puErr);
          return [];
        }

        if (progUsers?.length) {
          const programIds = progUsers.map((pu) => pu.program_id);
          let query = this.supabase
            .from(TABLES.School)
            .select('*')
            .in('program_id', programIds)
            .eq('is_deleted', false)
            .order('name', { ascending: true })
            .range(from, to);

          if (search) query = query.ilike('name', `%${search}%`);

          const { data: progSchools, error: psErr } = await query;
          if (psErr) {
            logger.error('Error fetching program schools:', psErr);
            return [];
          }

          // Deduplicate by school id
          const unique = new Map<string, { school: any; role: RoleType }>();
          for (const school of progSchools ?? []) {
            unique.set(school.id, { school, role });
          }
          return Array.from(unique.values());
        }
        return [];
      }
    }

    // --- Fallback to original logic ---
    const finalData: { school: TableTypes<'school'>; role: RoleType }[] = [];
    const schoolIds: Set<string> = new Set();

    // Teacher-linked schools
    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('class_id')
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false);

    if (classUserError) {
      logger.error('Error fetching class users:', classUserError);
    } else if (classUsers?.length) {
      const classIds = classUsers.map((cu) => cu.class_id);
      const { data: classes } = await this.supabase
        .from(TABLES.Class)
        .select('school_id')
        .in('id', classIds)
        .eq('is_deleted', false);

      if (classes?.length) {
        const schoolIdList = classes.map((c) => c.school_id);
        let query = this.supabase
          .from(TABLES.School)
          .select('*')
          .in('id', schoolIdList)
          .eq('is_deleted', false);

        if (search) query = query.ilike('name', `%${search}%`);

        const { data: schools, error: schoolError } = await query;
        if (!schoolError && schools?.length) {
          for (const school of schools) {
            if (!schoolIds.has(school.id)) {
              schoolIds.add(school.id);
              finalData.push({ school, role: RoleType.TEACHER });
            }
          }
        }
      }
    }

    // Schools linked via school_user (non-parent)
    const { data: schoolUsers } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('role, school_id')
      .eq('user_id', userId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false);

    if (schoolUsers?.length) {
      const schoolUserIds = schoolUsers.map((su) => su.school_id);
      let query = this.supabase
        .from(TABLES.School)
        .select('*')
        .in('id', schoolUserIds)
        .eq('is_deleted', false);

      if (search) query = query.ilike('name', `%${search}%`);

      const { data: schools } = await query;
      for (const su of schoolUsers) {
        const school = schools?.find((s) => s.id === su.school_id);
        if (school && !schoolIds.has(school.id)) {
          schoolIds.add(school.id);
          finalData.push({ school, role: su.role as RoleType });
        }
      }
    }

    return finalData;
  }

  public async getSchoolsForUserBySearchTerm(
    userId: string,
    searchTerm: string,
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    const query = searchTerm.trim();
    if (!query) return [];

    const pageSize = 100;
    let page = 1;
    const allResults: { school: TableTypes<'school'>; role: RoleType }[] = [];

    while (true) {
      const pageResults = await this.getSchoolsForUser(userId, {
        page,
        page_size: pageSize,
        search: query,
      });

      allResults.push(...pageResults);

      if (pageResults.length < pageSize) break;
      page += 1;
    }

    const uniqueBySchool = new Map<
      string,
      { school: TableTypes<'school'>; role: RoleType }
    >();
    for (const item of allResults) {
      uniqueBySchool.set(item.school.id, item);
    }

    return sortBySchoolSearchRelevance(
      Array.from(uniqueBySchool.values()),
      query,
      (item) => item.school.name ?? '',
    );
  }

  public set currentMode(value: MODES) {
    this._currentMode = value;
  }
  public get currentMode(): MODES {
    return this._currentMode;
  }
  async isUserTeacher(userId: string): Promise<boolean> {
    const schools = await this.getSchoolsForUser(userId);
    return schools.length > 0;
  }
  async getClassesForSchool(
    schoolId: string,
    userId: string,
  ): Promise<TableTypes<'class'>[]> {
    if (!this.supabase) return [];

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select(
        `
      role,
      class:class_id (
        *
      )
    `,
      )
      .eq('user_id', userId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false)
      .eq('class.school_id', schoolId)
      .eq('class.is_deleted', false);

    if (classUserError) {
      logger.error('Error fetching class users:', classUserError);
    }

    if (classUsers && classUsers.length > 0) {
      const classes = classUsers
        .map((cu) => (Array.isArray(cu.class) ? cu.class[0] : cu.class))
        .filter((cls): cls is TableTypes<'class'> => !!cls);

      if (classes.length > 0) return classes;
    }

    const { data: allClasses, error: allClassesError } = await this.supabase
      .from(TABLES.Class)
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (allClassesError) {
      logger.error('Error fetching all classes:', allClassesError);
    }

    return allClasses || [];
  }
  async getClassesBySchoolId(schoolId: string): Promise<TableTypes<'class'>[]> {
    if (!this.supabase) return [];

    const { data: classes, error } = await this.supabase
      .from(TABLES.Class)
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching classes by school ID:', error);
      return [];
    }

    return classes || [];
  }

  async getUsersByIds(userIds: string[]): Promise<TableTypes<'user'>[]> {
    if (!this.supabase || userIds.length === 0) return [];

    const { data: users, error } = await this.supabase
      .from(TABLES.User)
      .select('*')
      .in('id', userIds)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching users by IDs:', error);
      return [];
    }

    return users || [];
  }

  async getStudentInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
    classId?: string,
    classIds?: string[],
  ): Promise<StudentAPIResponse> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty page without querying.
    if (!classId && classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    // Query classes first and filter class_user by class_id list.
    // This avoids expensive class_user -> class join scans that can timeout.
    const { data: schoolClasses, error: classFetchError } = await this.supabase // fetch classes for the school
      .from(TABLES.Class)
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (classFetchError) {
      logger.error(
        'Error fetching classes for school student query:',
        classFetchError,
      );
      return { data: [], total: 0 };
    }

    const classMap = new Map<string, string>(
      (schoolClasses || []).map((c) => [String(c.id), String(c.name || '')]), // store clsId and clsName in a map of that particular school
    );
    const allowedClassIds = classId
      ? classMap.has(classId)
        ? [classId]
        : []
      : classIds && classIds.length > 0
        ? classIds
            .map((classIdItem) => String(classIdItem).trim())
            .filter((classIdItem) => classMap.has(classIdItem))
        : Array.from(classMap.keys()); // if classId is provided, use it only if it's valid for the school; otherwise use all class IDs for the school

    if (allowedClassIds.length === 0) {
      return { data: [], total: 0 };
    }

    const {
      data: pagedStudentRows,
      error: pagedStudentsError,
      count: totalStudentsRaw,
    } = await this.supabase
      .from(TABLES.ClassUser)
      .select(
        `
      class_id,
      user:user!class_user_user_id_fkey!inner (
        age,
        avatar,
        created_at,
        curriculum_id,
        fcm_token,
        firebase_id,
        grade_id,
        image,
        is_deleted,
        is_firebase,
        is_ops,
        language_id,
        is_tc_accepted,
        student_id,
        reward,
        updated_at,
        learning_path,
        id,
        name,
        phone,
        gender,
        email
      )
    `,
        { count: 'exact' },
      )
      .eq('role', 'student')
      .eq('is_deleted', false)
      .in('class_id', allowedClassIds)
      .eq('user.is_deleted', false)
      .order('name', { ascending: true, foreignTable: TABLES.User })
      .order('id', { ascending: true, foreignTable: TABLES.User })
      .range(offset, offset + limit - 1);

    const totalStudents =
      typeof totalStudentsRaw === 'number' ? totalStudentsRaw : 0;

    if (pagedStudentsError) {
      logger.error(
        'Error fetching paged students for school:',
        pagedStudentsError,
      );
      return { data: [], total: totalStudents };
    }

    const normalizedPagedRows = (
      (pagedStudentRows || []) as Array<{
        class_id?: string | null;
        user?: TableTypes<'user'> | TableTypes<'user'>[] | null;
      }>
    ).map((row) => {
      const user = Array.isArray(row?.user) ? row.user[0] : row?.user;
      const classIdValue = String(row?.class_id || '').trim();
      const studentId = String(user?.id || '').trim();
      return {
        classIdValue,
        studentId,
        user,
      };
    });

    const pagedStudentIds = normalizedPagedRows
      .map((row) => row.studentId)
      .filter((studentId) => studentId.length > 0);

    if (pagedStudentIds.length === 0) {
      return {
        data: [],
        total: totalStudents,
      };
    }

    const parentsByStudentId = new Map<
      string,
      Array<{
        id?: string;
        phone?: string;
        email?: string;
        is_wa_contact?: string | boolean | null;
      }>
    >();
    if (pagedStudentIds.length > 0) {
      const { data: parentLinks, error: parentError } = await this.supabase
        .from(TABLES.ParentUser)
        .select('student_id, parent_id')
        .in('student_id', pagedStudentIds)
        .eq('is_deleted', false);

      if (parentError) {
        logger.error('Error fetching parent links for students:', parentError);
      } else {
        const parentIds = [
          ...new Set(
            (parentLinks || [])
              .map((link) => String(link?.parent_id || '').trim())
              .filter((parentId) => parentId.length > 0),
          ),
        ];

        const parentById = new Map<
          string,
          {
            id?: string;
            phone?: string;
            email?: string;
            is_wa_contact?: string | boolean | null;
          }
        >();

        if (parentIds.length > 0) {
          type ParentUserWithWhatsapp = {
            id?: string | null;
            name?: string | null;
            phone?: string | null;
            email?: string | null;
            is_wa_contact?: string | boolean | null;
          };
          const { data: parentUsersRaw, error: parentUsersError } =
            await (this.supabase
              .from(TABLES.User)
              .select('id, name, phone, email, is_wa_contact')
              .in('id', parentIds)
              .eq('is_deleted', false) as any);
          const parentUsers = (parentUsersRaw ??
            []) as ParentUserWithWhatsapp[];

          if (parentUsersError) {
            logger.error(
              'Error fetching parent users for students:',
              parentUsersError,
            );
          } else {
            parentUsers.forEach((parentUser) => {
              const parentId = String(parentUser?.id || '').trim();
              if (!parentId) return;

              parentById.set(parentId, {
                id: parentId,
                phone:
                  typeof parentUser?.phone === 'string'
                    ? parentUser.phone
                    : undefined,
                email:
                  typeof parentUser?.email === 'string'
                    ? parentUser.email
                    : undefined,
                is_wa_contact:
                  typeof parentUser?.is_wa_contact === 'string' ||
                  typeof parentUser?.is_wa_contact === 'boolean'
                    ? parentUser.is_wa_contact
                    : null,
              });
            });
          }
        }

        (parentLinks || []).forEach((link) => {
          const sid = String(link?.student_id || '').trim();
          const parentId = String(link?.parent_id || '').trim();
          const parent = parentById.get(parentId);
          if (!sid || !parent) return;

          const currentParents = parentsByStudentId.get(sid) ?? [];
          // Deduplicate by contact values to keep merged contacts clean.
          const alreadyAdded = currentParents.some(
            (existingParent) =>
              (existingParent.id && existingParent.id === parent.id) ||
              (existingParent.phone &&
                parent.phone &&
                existingParent.phone === parent.phone) ||
              (existingParent.email &&
                parent.email &&
                existingParent.email === parent.email),
          );
          if (alreadyAdded) return;

          parentsByStudentId.set(sid, [...currentParents, parent]);
        });
      }
    }

    const studentInfoList: StudentInfo[] = normalizedPagedRows
      .map((row) => {
        const user = row.user;
        if (!user) return null;

        const studentId = row.studentId;
        const classIdValue = row.classIdValue;
        const className = classMap.get(classIdValue) || '';
        const { grade, section } = this.parseClassName(className);
        const parents =
          (parentsByStudentId.get(studentId) as TableTypes<'user'>[]) ?? [];
        const parent = parents[0] || null;
        const updatedUser = {
          ...user,
          phone: user?.phone || parent?.phone || '',
          email: user?.email || parent?.email || '',
        };

        return {
          user: updatedUser,
          grade,
          classSection: section,
          parent,
          parents,
          // Needed by student detail flows that rely on class id/name shape.
          classWithidname: {
            id: classIdValue,
            class_name: className,
          },
        } as StudentInfo;
      })
      .filter((row): row is StudentInfo => row !== null);

    return {
      data: studentInfoList,
      total: totalStudents,
    };
  }
  async getStudentsAndParentsByClassId(
    classId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<StudentAPIResponse> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('class_user')
      .select(
        `
      class:class_id!inner (
        id,
        name
      ),
      user:user_id (
        *,
        parent_links:parent_user!student_id (
          parent:parent_id (
            *
          )
        )
      )
    `,
        { count: 'exact' },
      )
      .eq('role', 'student')
      .eq('is_deleted', false)
      .eq('class_id', classId); // Filter by classId

    const { data, error, count } = await query
      .order('user(name)', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching students and parents by class ID:', error);
      return { data: [], total: 0 };
    }

    type StudentParentLinkRow = {
      user?:
        | (TableTypes<'user'> & {
            parent_links?: Array<{ parent?: TableTypes<'user'> | null }>;
          })
        | null;
      class?: { id?: string | null; name?: string | null } | null;
    };
    const studentRows = (data ?? []) as object[] as StudentParentLinkRow[];
    const studentInfoList = studentRows.reduce<StudentInfo[]>((list, row) => {
      const { user, class: cls } = row;
      if (!user) return list;

      const className = cls?.name || '';
      const { grade, section } = this.parseClassName(className);

      const parents = (user.parent_links || [])
        .map((link) => link?.parent)
        .filter((parent): parent is TableTypes<'user'> => Boolean(parent));
      const parent = parents[0] || null;

      list.push({
        user,
        grade,
        classSection: section,
        parent,
        parents,
        classWithidname: cls?.id
          ? {
              id: cls.id,
              class_name: className,
            }
          : undefined,
      });
      return list;
    }, []);
    return {
      data: studentInfoList,
      total: count ?? 0,
    };
  }
  async getStudentAndParentByStudentId(studentId: string): Promise<{
    user: TableTypes<'user'> | null;
    parents: TableTypes<'user'>[];
  }> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { user: null, parents: [] };
    }

    const { data, error } = await this.supabase
      .from('user')
      .select(
        `
      *,
      parent_links:parent_user!student_id (
        parent:parent_id (
          *
        )
      )
      `,
      )
      .eq('id', studentId)
      .eq('is_deleted', false)
      .single();

    if (error || !data) {
      logger.error('Error fetching student and parent by student ID:', error);
      return { user: null, parents: [] };
    }
    const parentLinks = (data.parent_links ?? []) as object[] as Array<{
      parent?: TableTypes<'user'> | null;
    }>;
    const parents = parentLinks
      .map((link) => link.parent)
      .filter((parent): parent is TableTypes<'user'> => Boolean(parent));

    return {
      user: data,
      parents,
    };
  }
  async getParentsByStudentId(
    studentId: string,
    options?: {
      studentIds?: string[];
      activeOnly?: boolean;
    },
  ): Promise<TableTypes<'user'>[]> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return [];
    }

    const requestedStudentIds =
      options?.studentIds?.filter((id) => id.trim() !== '') ??
      (studentId.trim() !== '' ? [studentId] : []);
    if (requestedStudentIds.length === 0) {
      return [];
    }

    let query = this.supabase.from('parent_user').select(
      `
          parent:parent_id (
            *
          )
        `,
    );

    if (requestedStudentIds.length === 1) {
      query = query.eq('student_id', requestedStudentIds[0]);
    } else {
      query = query.in('student_id', requestedStudentIds);
    }

    if (options?.activeOnly) {
      query = query.eq('is_deleted', false);
    }

    const { data, error } = await query;

    if (error || !data) {
      logger.error('Error fetching parents by student ID:', error);
      return [];
    }

    return data.map((row: any) => row.parent).filter(Boolean);
  }

  async mergeStudentRequest(
    existingStudentId: string,
    newStudentId: string,
    requestId?: string,
    respondedBy?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      throw new Error('Supabase not initialized.');
    }

    const AUTO_REJECT_REASON_TYPE = 'Verification Failed';
    const AUTO_REJECT_REASON_DESCRIPTION =
      'Auto-rejected because a duplicate student request was merged and approved.';
    const now = new Date().toISOString();

    // 1. Get destination student (record to keep)
    const { data: newStudentData, error: newStudentError } = await this.supabase
      .from('user')
      .select(
        `
      *,
      parent_links:parent_user!student_id (
        parent:parent_id (*)
      )
    `,
      )
      .eq('id', newStudentId)
      .eq('is_deleted', false)
      .single();

    if (newStudentError || !newStudentData) {
      throw new Error('New student not found');
    }

    const newParents = (newStudentData.parent_links || []).map(
      (link: any) => link.parent,
    );

    // 2. Get source student (record to merge and delete)
    const { data: existingStudentData, error: existingStudentError } =
      await this.supabase
        .from('user')
        .select(
          `
        *,
        parent_links:parent_user!student_id (
          parent:parent_id (*)
        )
      `,
        )
        .eq('id', existingStudentId)
        .eq('is_deleted', false)
        .single();
    if (existingStudentError || !existingStudentData) {
      throw new Error('Existing student not found');
    }

    const existingParents = (existingStudentData.parent_links || []).map(
      (link: any) => link.parent,
    );

    // 3. Transfer results
    const { data: results } = await this.supabase
      .from('result')
      .select('*')
      .eq('student_id', existingStudentId)
      .eq('is_deleted', false);

    if (results && results.length > 0) {
      const { error: resultTransferError } = await this.supabase
        .from('result')
        .update({
          student_id: newStudentId,
          updated_at: now,
        })
        .eq('student_id', existingStudentId)
        .eq('is_deleted', false);

      if (resultTransferError) {
        throw new Error(
          `Failed to transfer results: ${resultTransferError.message}`,
        );
      }
    }

    // 4. Update active FC interactions to point to the merged student.
    const fcFormsUpdateResult = await this.updateFcUserFormsContactUserId(
      existingStudentId,
      newStudentId,
    );
    if (!fcFormsUpdateResult.success) {
      throw new Error(fcFormsUpdateResult.message);
    }

    // 5. Merge parents
    const allParents = [...existingParents, ...newParents];
    const uniqueParents: any[] = [];

    for (const parent of allParents) {
      const alreadyExists = uniqueParents.some((p) => {
        const phoneMatch = p.phone && parent.phone && p.phone === parent.phone;
        const emailMatch = p.email && parent.email && p.email === parent.email;
        return phoneMatch || emailMatch;
      });

      if (!alreadyExists) {
        uniqueParents.push(parent);
      }
    }

    for (const parent of uniqueParents) {
      const { data: existingLink } = await this.supabase
        .from('parent_user')
        .select('id')
        .eq('student_id', newStudentId)
        .eq('parent_id', parent.id)
        .maybeSingle();

      if (!existingLink) {
        const { error: parentInsertError } = await this.supabase
          .from('parent_user')
          .insert({
            student_id: newStudentId,
            parent_id: parent.id,
            is_deleted: false,
            updated_at: now,
          });
        if (parentInsertError) {
          throw new Error(
            `Failed to merge parent link: ${parentInsertError.message}`,
          );
        }
      }
    }

    // 6. Merge learning pathway before soft deleting source student.
    const pathwayMergeResult = await this.mergeUserPathway(
      existingStudentId,
      newStudentId,
    );
    if (!pathwayMergeResult.success) {
      throw new Error(
        pathwayMergeResult.message || 'Failed to merge learning pathway.',
      );
    }

    // 7. Merge stars from users table

    const { data: oldUser, error: oldError } = await this.supabase
      .from('user')
      .select('stars')
      .eq('id', existingStudentId)
      .eq('is_deleted', false)
      .single();

    const { data: newUser, error: newError } = await this.supabase
      .from('user')
      .select('stars')
      .eq('id', newStudentId)
      .eq('is_deleted', false)
      .single();

    if (oldError || newError) {
      throw new Error('Failed to fetch student stars.');
    }

    const oldStars = oldUser?.stars ?? 0;
    const newStars = newUser?.stars ?? 0;
    const totalStars = oldStars + newStars;

    const { error: starUpdateError } = await this.supabase
      .from('user')
      .update({
        stars: totalStars,
        updated_at: now,
      })
      .eq('id', newStudentId);

    if (starUpdateError) {
      throw new Error(
        `Failed to update merged stars: ${starUpdateError.message}`,
      );
    }

    // ?? FIX: Force class_user update so other devices sync it
    const { error: classUserSyncError } = await this.supabase
      .from('class_user')
      .update({ updated_at: now })
      .eq('user_id', newStudentId)
      .eq('is_deleted', false);
    if (classUserSyncError) {
      logger.warn(
        'class_user sync touch failed after merge:',
        classUserSyncError,
      );
    }

    // 8. Soft delete source student records
    const { error: classUserDeleteError } = await this.supabase
      .from('class_user')
      .update({ is_deleted: true, updated_at: now })
      .eq('user_id', existingStudentId);
    if (classUserDeleteError) {
      throw new Error(
        `Failed to soft delete source class_user rows: ${classUserDeleteError.message}`,
      );
    }

    const { error: parentUserDeleteError } = await this.supabase
      .from('parent_user')
      .update({ is_deleted: true, updated_at: now })
      .eq('student_id', existingStudentId);
    if (parentUserDeleteError) {
      throw new Error(
        `Failed to soft delete source parent_user rows: ${parentUserDeleteError.message}`,
      );
    }

    const { error: sourceUserDeleteError } = await this.supabase
      .from('user')
      .update({ is_deleted: true, updated_at: now })
      .eq('id', existingStudentId);
    if (sourceUserDeleteError) {
      throw new Error(
        `Failed to soft delete source user: ${sourceUserDeleteError.message}`,
      );
    }

    // 9. Update related requests for merged profiles.
    type MergeRequestStatusRow = {
      id: string;
      request_id: string | null;
      requested_by: string | null;
      school_id: string | null;
      class_id: string | null;
      request_type: EnumType<'ops_request_type'> | null;
      created_at?: string | null;
    };

    let resolvedRespondedBy: string | null = respondedBy ?? null;
    if (!resolvedRespondedBy) {
      try {
        const currentUser =
          await ServiceConfig.getI().authHandler.getCurrentUser();
        resolvedRespondedBy = currentUser?.id ?? null;
      } catch (error) {
        logger.warn(
          'Unable to resolve current user while updating merge request statuses:',
          error,
        );
      }
    }

    let approvedRequestRow: MergeRequestStatusRow | null = null;
    if (requestId) {
      const { data: updatedRequest, error: requestUpdateError } =
        await this.supabase
          .from('ops_requests')
          .update({
            request_status: STATUS.APPROVED,
            updated_at: now,
            responded_by: resolvedRespondedBy,
          })
          .eq('request_id', requestId)
          .eq('is_deleted', false)
          .select(
            'id, request_id, requested_by, school_id, class_id, request_type',
          )
          .maybeSingle();

      if (requestUpdateError) {
        throw new Error(
          `Failed to update merge request: ${requestUpdateError.message}`,
        );
      }
      if (!updatedRequest) {
        throw new Error('Merge request not found while updating approval.');
      }
      approvedRequestRow = updatedRequest as MergeRequestStatusRow;
    } else {
      const { data: pendingMergeRequests, error: pendingMergeRequestsError } =
        await this.supabase
          .from('ops_requests')
          .select(
            'id, request_id, requested_by, school_id, class_id, request_type, created_at',
          )
          .eq('is_deleted', false)
          .eq('request_status', STATUS.REQUESTED)
          .eq('request_type', RequestTypes.STUDENT)
          .in('requested_by', [existingStudentId, newStudentId])
          .order('created_at', { ascending: false });

      if (pendingMergeRequestsError) {
        throw new Error(
          `Failed to fetch pending merge requests: ${pendingMergeRequestsError.message}`,
        );
      }

      const pendingRows = (pendingMergeRequests ??
        []) as MergeRequestStatusRow[];
      const pendingRequestForKeptProfile =
        pendingRows.find((row) => row.requested_by === newStudentId) ?? null;

      if (pendingRequestForKeptProfile) {
        const { error: approveKeptProfileRequestError } = await this.supabase
          .from('ops_requests')
          .update({
            request_status: STATUS.APPROVED,
            responded_by: resolvedRespondedBy,
            updated_at: now,
          })
          .eq('id', pendingRequestForKeptProfile.id)
          .eq('is_deleted', false);

        if (approveKeptProfileRequestError) {
          throw new Error(
            `Failed to approve kept profile request after merge: ${approveKeptProfileRequestError.message}`,
          );
        }

        approvedRequestRow = pendingRequestForKeptProfile;
      } else {
        const { error: rejectMergedAwayRequestError } = await this.supabase
          .from('ops_requests')
          .update({
            request_status: STATUS.REJECTED,
            rejected_reason_type: AUTO_REJECT_REASON_TYPE,
            rejected_reason_description: AUTO_REJECT_REASON_DESCRIPTION,
            responded_by: resolvedRespondedBy,
            updated_at: now,
          })
          .eq('is_deleted', false)
          .eq('request_status', STATUS.REQUESTED)
          .eq('request_type', RequestTypes.STUDENT)
          .eq('requested_by', existingStudentId);

        if (rejectMergedAwayRequestError) {
          throw new Error(
            `Failed to reject merged-away profile requests: ${rejectMergedAwayRequestError.message}`,
          );
        }
      }
    }

    if (
      approvedRequestRow?.request_type === RequestTypes.STUDENT &&
      approvedRequestRow?.requested_by
    ) {
      const duplicateRequestedByIds = Array.from(
        new Set(
          [approvedRequestRow.requested_by, existingStudentId, newStudentId]
            .map((value) => value?.trim())
            .filter(
              (value): value is string =>
                typeof value === 'string' && value.length > 0,
            ),
        ),
      );

      if (duplicateRequestedByIds.length === 0) {
        throw new Error(
          'Missing duplicate request user ids while rejecting sibling requests.',
        );
      }

      let siblingRequestsUpdate = this.supabase
        .from('ops_requests')
        .update({
          request_status: STATUS.REJECTED,
          rejected_reason_type: AUTO_REJECT_REASON_TYPE,
          rejected_reason_description: AUTO_REJECT_REASON_DESCRIPTION,
          responded_by: resolvedRespondedBy,
          updated_at: now,
        })
        .eq('is_deleted', false)
        .eq('request_status', STATUS.REQUESTED)
        .eq('request_type', RequestTypes.STUDENT)
        .in('requested_by', duplicateRequestedByIds)
        .neq('id', approvedRequestRow.id);

      if (approvedRequestRow.school_id) {
        siblingRequestsUpdate = siblingRequestsUpdate.eq(
          'school_id',
          approvedRequestRow.school_id,
        );
      } else {
        siblingRequestsUpdate = siblingRequestsUpdate.is('school_id', null);
      }

      if (approvedRequestRow.class_id) {
        siblingRequestsUpdate = siblingRequestsUpdate.eq(
          'class_id',
          approvedRequestRow.class_id,
        );
      } else {
        siblingRequestsUpdate = siblingRequestsUpdate.is('class_id', null);
      }

      const { error: siblingRequestsError } = await siblingRequestsUpdate;
      if (siblingRequestsError) {
        throw new Error(
          `Failed to reject duplicate pending requests after merge: ${siblingRequestsError.message}`,
        );
      }
    }

    return {
      success: true,
      message: 'Students merged successfully',
    };
  }
  async updateFcUserFormsContactUserId(
    oldStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase not initialized.' };
    }
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from(TABLES.FcUserForms)
      .update({
        contact_user_id: newStudentId,
        updated_at: now,
      })
      .eq('contact_user_id', oldStudentId)
      .eq('is_deleted', false);

    if (error) {
      return {
        success: false,
        message: `Failed to update fc_user_forms contact_user_id: ${error.message}`,
      };
    }
    return { success: true, message: 'fc_user_forms updated successfully.' };
  }
  async mergeUserPathway(
    existingStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      throw new Error('Supabase not initialized.');
    }

    try {
      const now = new Date().toISOString();

      /**
       * Safely parse learning_path JSON
       */
      const parseLearningPath = (value: unknown): any => {
        if (!value) return {};
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        }
        if (typeof value === 'object') return value;
        return {};
      };

      /**
       * Get lesson path safely
       */
      const getPath = (course: any): any[] =>
        Array.isArray(course?.path) ? course.path : [];

      /**
       * Get currently active lesson
       */
      const getActiveLesson = (course: any): any | undefined => {
        const path = getPath(course);
        return (
          path.find((lesson: any) => lesson?.isPlayed === false) ?? path[0]
        );
      };

      /**
       * Get active chapter id
       */
      const getActiveChapterId = (course: any): string | undefined => {
        const chapterId = getActiveLesson(course)?.chapter_id;
        return chapterId ? String(chapterId) : undefined;
      };

      /**
       * Get course id
       */
      const getCourseId = (course: any): string | undefined => {
        const courseId = course?.course_id;
        return courseId !== undefined && courseId !== null
          ? String(courseId)
          : undefined;
      };

      /**
       * Count played lessons
       */
      const getPlayedCount = (course: any): number =>
        getPath(course).filter((l: any) => l?.isPlayed === true).length;

      /**
       * Count remaining lessons
       */
      const getRemainingCount = (course: any): number =>
        getPath(course).filter((l: any) => l?.isPlayed === false).length;

      const hasAssignedAssessment = (course: any): boolean =>
        getPath(course).some(
          (lesson: any) =>
            lesson?.is_assessment === true && lesson?.isPlayed === false,
        );

      const hasCompletedAssessment = (course: any): boolean =>
        getPath(course).some(
          (lesson: any) =>
            lesson?.is_assessment === true && lesson?.isPlayed === true,
        );

      /**
       * Fetch both students learning_path
       */
      const { data: oldUser, error: oldUserError } = await this.supabase
        .from(TABLES.User)
        .select('learning_path')
        .eq('id', existingStudentId)
        .eq('is_deleted', false)
        .single();
      if (oldUserError) {
        throw new Error(
          `Failed to fetch source learning_path: ${oldUserError.message}`,
        );
      }

      const { data: newUser, error: newUserError } = await this.supabase
        .from(TABLES.User)
        .select('learning_path')
        .eq('id', newStudentId)
        .eq('is_deleted', false)
        .single();
      if (newUserError) {
        throw new Error(
          `Failed to fetch destination learning_path: ${newUserError.message}`,
        );
      }

      const oldPathway = parseLearningPath(oldUser?.learning_path);
      const newPathway = parseLearningPath(newUser?.learning_path);

      const oldPathMode = oldPathway?.pathMode;
      const newPathMode = newPathway?.pathMode;

      /**
       * -----------------------------
       * MODE MERGE RULES
       * -----------------------------
       *
       * Priority:
       * PAL > AssessmentOnly > Disabled
       */

      const mergedPathMode = (() => {
        if (
          oldPathMode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE ||
          newPathMode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE
        ) {
          return LEARNING_PATHWAY_MODE.FULL_ADAPTIVE;
        }

        if (
          oldPathMode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY ||
          newPathMode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY
        ) {
          return LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY;
        }

        if (
          oldPathMode === LEARNING_PATHWAY_MODE.DISABLED &&
          newPathMode === LEARNING_PATHWAY_MODE.DISABLED
        ) {
          return LEARNING_PATHWAY_MODE.DISABLED;
        }

        return newPathMode ?? oldPathMode;
      })();

      /**
       * Extract courses
       */
      const oldCourses = Array.isArray(oldPathway?.courses?.courseList)
        ? oldPathway.courses.courseList
        : [];

      const newCourses = Array.isArray(newPathway?.courses?.courseList)
        ? newPathway.courses.courseList
        : [];

      /**
       * Edge case:
       * both pathways empty
       */
      if (!oldCourses.length && !newCourses.length) {
        return {
          success: true,
          message: 'Both pathways empty.',
        };
      }

      /**
       * Fetch chapter sort indexes
       */
      const chapterIds: string[] = Array.from(
        new Set(
          [...oldCourses, ...newCourses]
            .map((course) => getActiveChapterId(course))
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const chapterSortMap = new Map<string, number>();

      if (chapterIds.length) {
        const { data: chapters, error: chaptersError } = await this.supabase
          .from(TABLES.Chapter)
          .select('id, sort_index')
          .in('id', chapterIds);
        if (chaptersError) {
          throw new Error(
            `Failed to fetch chapter sort indexes: ${chaptersError.message}`,
          );
        }

        for (const c of chapters ?? []) {
          chapterSortMap.set(String(c.id), c.sort_index ?? -1);
        }
      }

      const getActiveSortIndex = (course: any): number => {
        const chapterId = getActiveChapterId(course);
        if (!chapterId) return -1;
        return chapterSortMap.get(chapterId) ?? -1;
      };

      /**
       * ----------------------------------------
       * Decide which course is more progressed
       * ----------------------------------------
       */

      const pickMoreProgressedCourse = (
        oldCourse: any,
        newCourse: any,
      ): any => {
        if (!oldCourse) return newCourse;
        if (!newCourse) return oldCourse;

        const oldPlayed = getPlayedCount(oldCourse);
        const newPlayed = getPlayedCount(newCourse);

        const oldRemaining = getRemainingCount(oldCourse);
        const newRemaining = getRemainingCount(newCourse);

        const oldChapterSort = getActiveSortIndex(oldCourse);
        const newChapterSort = getActiveSortIndex(newCourse);

        /**
         * PAL
         */
        if (mergedPathMode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE) {
          return newCourse ?? oldCourse;
        }

        /**
         * AssessmentOnly rules
         */
        if (mergedPathMode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY) {
          const chooseByProgress = (): any => {
            if (oldPlayed !== newPlayed) {
              return oldPlayed > newPlayed ? oldCourse : newCourse;
            }

            if (oldRemaining !== newRemaining) {
              return oldRemaining < newRemaining ? oldCourse : newCourse;
            }

            return newCourse;
          };

          const oldAssessmentCompleted = hasCompletedAssessment(oldCourse);
          const newAssessmentCompleted = hasCompletedAssessment(newCourse);
          const oldHasAssignedAssessment = hasAssignedAssessment(oldCourse);
          const newHasAssignedAssessment = hasAssignedAssessment(newCourse);

          /**
           * If assessment completed ? prefer that student
           */
          if (oldAssessmentCompleted !== newAssessmentCompleted) {
            return oldAssessmentCompleted ? oldCourse : newCourse;
          }

          /**
           * If both have assigned assessment ? choose more progress.
           */
          if (oldHasAssignedAssessment && newHasAssignedAssessment) {
            return chooseByProgress();
          }

          /**
           * If only one has assigned assessment:
           * - if student without assessment already started lessons, keep them
           * - else choose the assigned-assessment pathway
           */
          if (oldHasAssignedAssessment !== newHasAssignedAssessment) {
            const studentWithoutAssessmentCourse = oldHasAssignedAssessment
              ? newCourse
              : oldCourse;
            const hasStartedWithoutAssessment =
              getPlayedCount(studentWithoutAssessmentCourse) > 0;

            if (hasStartedWithoutAssessment) {
              return studentWithoutAssessmentCourse;
            }

            return oldHasAssignedAssessment ? oldCourse : newCourse;
          }

          /**
           * Fallback for AssessmentOnly: choose more progress.
           */
          return chooseByProgress();
        }

        /**
         * Disabled mode
         * compare chapter progress
         */
        if (mergedPathMode === LEARNING_PATHWAY_MODE.DISABLED) {
          if (oldChapterSort !== newChapterSort) {
            return oldChapterSort > newChapterSort ? oldCourse : newCourse;
          }

          return oldPlayed > newPlayed ? oldCourse : newCourse;
        }

        return newCourse;
      };

      /**
       * Merge courses by course_id
       */

      const mergedByCourseId = new Map<string, any>();

      for (const course of newCourses) {
        const id = getCourseId(course);
        if (id) mergedByCourseId.set(id, course);
      }

      for (const oldCourse of oldCourses) {
        const id = getCourseId(oldCourse);
        if (!id) continue;

        const existing = mergedByCourseId.get(id);

        if (!existing) {
          mergedByCourseId.set(id, oldCourse);
          continue;
        }

        mergedByCourseId.set(id, pickMoreProgressedCourse(oldCourse, existing));
      }

      const mergedCourses = Array.from(mergedByCourseId.values());

      /**
       * Safe currentCourseIndex
       */

      const safeIndex = Math.max(
        0,
        Math.min(
          newPathway?.courses?.currentCourseIndex ??
            oldPathway?.courses?.currentCourseIndex ??
            0,
          mergedCourses.length - 1,
        ),
      );

      /**
       * Final merged pathway
       */

      const updatedPathway = {
        ...oldPathway,
        ...newPathway,
        pathMode: mergedPathMode,
        updated_at: now,
        courses: {
          ...(oldPathway?.courses || {}),
          ...(newPathway?.courses || {}),
          courseList: mergedCourses,
          currentCourseIndex: safeIndex,
        },
      };

      /**
       * Update destination student
       */

      const { error: pathwayUpdateError } = await this.supabase
        .from(TABLES.User)
        .update({
          learning_path: JSON.stringify(updatedPathway),
          updated_at: now,
        })
        .eq('id', newStudentId);
      if (pathwayUpdateError) {
        throw new Error(
          `Failed to update merged learning_path: ${pathwayUpdateError.message}`,
        );
      }

      return {
        success: true,
        message: 'Learning pathway merged successfully.',
      };
    } catch (error: any) {
      logger.error('MERGE PATHWAY ERROR:', error);

      return {
        success: false,
        message: error?.message || 'Failed to merge pathway.',
      };
    }
  }
  async getUserRoleForSchool(
    userId: string,
    schoolId: string,
  ): Promise<RoleType | undefined> {
    if (!this.supabase) return;

    // Program roles apply only to schools in the user's mapped program.
    // This prevents program permissions from leaking into unrelated schools.
    const getUserProgramRoleForSchool = async (
      fallbackRole?: RoleType,
    ): Promise<RoleType | undefined> => {
      const { data: school } = await this.supabase!.from(TABLES.School)
        .select('program_id')
        .eq('id', schoolId)
        .eq('is_deleted', false)
        .maybeSingle();

      if (!school?.program_id) return undefined;

      const { data: programUser } = await this.supabase!.from(
        TABLES.ProgramUser,
      )
        .select('role')
        .eq('user', userId)
        .eq('program_id', school.program_id)
        .eq('is_deleted', false)
        .in('role', [RoleType.PROGRAM_MANAGER, RoleType.FIELD_COORDINATOR])
        .limit(1)
        .maybeSingle();

      if (!programUser) return undefined;

      return (programUser.role as RoleType | null) ?? fallbackRole;
    };

    // Check special users
    const { data: specialUser } = await this.supabase
      .from(TABLES.SpecialUsers)
      .select('role')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (specialUser?.role) {
      const specialRole = specialUser.role as RoleType;
      if (
        specialRole === RoleType.SUPER_ADMIN ||
        specialRole === RoleType.OPERATIONAL_DIRECTOR ||
        specialRole === RoleType.EXTERNAL_USER
      ) {
        return specialRole;
      }

      if (
        specialRole === RoleType.PROGRAM_MANAGER ||
        specialRole === RoleType.FIELD_COORDINATOR
      ) {
        const programScopedRole =
          await getUserProgramRoleForSchool(specialRole);
        if (programScopedRole) return programScopedRole;
      } else {
        return specialRole;
      }
    }

    const programScopedRole = await getUserProgramRoleForSchool();
    if (programScopedRole) return programScopedRole;

    // Check school_user (not parent)
    const { data: schoolUser } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('role')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false)
      .single();
    if (schoolUser?.role) return schoolUser.role as RoleType;

    // Check class_user ? teacher
    const { data: classUsers } = await this.supabase
      .from(TABLES.ClassUser)
      .select('class_id')
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false);
    if (classUsers?.length) {
      const classIds = classUsers.map((cu) => cu.class_id);
      const { data: classes } = await this.supabase
        .from(TABLES.Class)
        .select('id, school_id')
        .in('id', classIds)
        .eq('is_deleted', false);
      if (classes?.some((c) => c.school_id === schoolId)) {
        return RoleType.TEACHER;
      }
    }

    return undefined;
  }

  async getTeacherInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
    classIds?: string[],
  ): Promise<TeacherAPIResponse> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty page without querying.
    if (classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const offset = (safePage - 1) * safeLimit;

    const { data: schoolClasses, error: classFetchError } = await this.supabase
      .from(TABLES.Class)
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (classFetchError) {
      logger.error(
        'Error fetching classes for school teacher query:',
        classFetchError,
      );
      return { data: [], total: 0 };
    }

    const classMap = new Map<string, string>();
    (schoolClasses || []).forEach((schoolClass) => {
      const classId = String(schoolClass?.id || '').trim();
      if (!classId) return;
      classMap.set(classId, String(schoolClass?.name || '').trim());
    });
    const allowedClassIds =
      classIds && classIds.length > 0
        ? classIds
            .map((classId) => String(classId).trim())
            .filter((classId) => classMap.has(classId))
        : Array.from(classMap.keys());

    if (allowedClassIds.length === 0) {
      return { data: [], total: 0 };
    }

    const { data: allTeacherLinks, error: teacherLinksError } =
      await this.supabase
        .from(TABLES.ClassUser)
        .select(
          `
      class_id,
      user_id
    `,
        )
        .eq('role', 'teacher')
        .eq('is_deleted', false)
        .in('class_id', allowedClassIds);

    if (teacherLinksError) {
      logger.error('Error fetching teacher info:', teacherLinksError);
      return { data: [], total: 0 };
    }

    const teacherClassLinks = new Map<
      string,
      { teacherId: string; classId: string }
    >();
    (allTeacherLinks || []).forEach((row) => {
      const teacherId = String(row?.user_id || '').trim();
      const candidateClassId = String(row?.class_id || '').trim();
      if (!teacherId || !candidateClassId) return;

      teacherClassLinks.set(`${teacherId}:${candidateClassId}`, {
        teacherId,
        classId: candidateClassId,
      });
    });

    const teacherClassLinkList = Array.from(teacherClassLinks.values());
    const allTeacherIds = Array.from(
      new Set(teacherClassLinkList.map((link) => link.teacherId)),
    );
    if (allTeacherIds.length === 0) {
      return {
        data: [],
        total: 0,
      };
    }

    const { data: teacherUsers, error: userError } = await this.supabase
      .from(TABLES.User)
      .select('*')
      .in('id', allTeacherIds)
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .order('id', { ascending: true });

    if (userError) {
      logger.error('Error fetching teacher user rows:', userError);
      return { data: [], total: 0 };
    }

    if (!teacherUsers?.length) {
      return {
        data: [],
        total: 0,
      };
    }

    const teacherUserById = new Map(
      teacherUsers.map((teacherUser) => [teacherUser.id, teacherUser]),
    );
    const sortedTeacherClassLinks = teacherClassLinkList
      .filter((link) => teacherUserById.has(link.teacherId))
      .sort((leftLink, rightLink) => {
        const leftTeacher = teacherUserById.get(leftLink.teacherId);
        const rightTeacher = teacherUserById.get(rightLink.teacherId);
        const leftName = String(leftTeacher?.name || '');
        const rightName = String(rightTeacher?.name || '');
        const leftClassName =
          classMap.get(leftLink.classId) || leftLink.classId;
        const rightClassName =
          classMap.get(rightLink.classId) || rightLink.classId;

        return (
          leftName.localeCompare(rightName, undefined, {
            sensitivity: 'base',
          }) ||
          leftLink.teacherId.localeCompare(rightLink.teacherId) ||
          leftClassName.localeCompare(rightClassName, undefined, {
            sensitivity: 'base',
          }) ||
          leftLink.classId.localeCompare(rightLink.classId)
        );
      });

    const totalTeachers = sortedTeacherClassLinks.length;
    const teacherInfoList: TeacherInfo[] = sortedTeacherClassLinks
      .slice(offset, offset + safeLimit)
      .map((teacherClassLink) => {
        const teacherUser = teacherUserById.get(teacherClassLink.teacherId);
        if (!teacherUser) return null;

        const classIdValue = teacherClassLink.classId;
        const className = classMap.get(classIdValue) || '';
        const { grade, section } = this.parseClassName(className);

        return {
          user: teacherUser,
          grade: grade,
          classSection: section,
          classWithidname: {
            id: classIdValue,
            name: className,
          },
        };
      })
      .filter((row): row is TeacherInfo => row !== null);

    return {
      data: teacherInfoList,
      total: totalTeachers,
    };
  }

  parseClassName(className: string): { grade: number; section: string } {
    const cleanedName = className.trim();
    if (!cleanedName) {
      return { grade: 0, section: '' };
    }

    let grade = 0;
    let section = '';

    const numericMatch = cleanedName.match(/^(\d+)$/);
    if (numericMatch) {
      grade = parseInt(numericMatch[1], 10);
      return { grade: isNaN(grade) ? 0 : grade, section: '' };
    }

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

  async getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]> {
    if (!this.supabase) return [];

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('user_id')
      .eq('class_id', classId)
      .eq('role', RoleType.STUDENT)
      .eq('is_deleted', false);

    if (classUserError) {
      logger.error('Error fetching class users:', classUserError);
    }

    if (classUsers && classUsers.length > 0) {
      const studentIds = classUsers.map((cu) => cu.user_id);
      const { data: students, error: studentError } = await this.supabase
        .from(TABLES.User)
        .select('*')
        .in('id', studentIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (studentError) {
        logger.error('Error fetching students:', studentError);
      }

      return students || [];
    }
    return [];
  }
  async subscribeToClassTopic(): Promise<void> {
    var students: TableTypes<'user'>[] = await this.getParentStudentProfiles();
    for (const student of students) {
      const linkedData = await this.getStudentClassesAndSchools(student.id);
      if (
        !!linkedData &&
        !!linkedData.classes &&
        linkedData.classes.length > 0
      ) {
        Util.subscribeToClassTopic(
          linkedData.classes[0].id,
          linkedData.schools[0].id,
        );
      }
    }
  }
  async getDataByInviteCode(inviteCode: number): Promise<any> {
    try {
      const rpcRes = await this.supabase?.rpc('getDataByInviteCode', {
        invite_code: inviteCode,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? '';
      }
      const data = rpcRes.data;
      return data;
    } catch (e) {
      throw new Error('Invalid inviteCode');
    }
  }

  async getDataByInviteCodeNew(
    inviteCode: number,
  ): Promise<JoinClassInviteLookupResult> {
    try {
      logger.warn('Join class lookup RPC started', {
        file_name: 'SupabaseApi.ts',
        function_name: 'getDataByInviteCodeNew',
        inviteCode,
      });
      const rpcRes = await this.supabase?.rpc('getDataByInviteCodeNew', {
        invite_code: inviteCode,
      });

      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        logger.warn('Join class lookup RPC returned empty/error response', {
          file_name: 'SupabaseApi.ts',
          function_name: 'getDataByInviteCodeNew',
          inviteCode,
          rpcError: rpcRes?.error ?? null,
          hasData: !!rpcRes?.data,
        });
        throw rpcRes?.error ?? '';
      }

      const { inviteData, classData, schoolData } =
        rpcRes.data as JoinClassInviteLookupResult;

      if (!classData) {
        throw new Error('Class data could not be fetched.');
      }

      if (!schoolData) {
        throw new Error('School data could not be fetched.');
      }

      logger.warn('Join class lookup RPC succeeded', {
        file_name: 'SupabaseApi.ts',
        function_name: 'getDataByInviteCodeNew',
        inviteCode,
        classId: inviteData?.class_id,
        schoolId: inviteData?.school_id,
        className: inviteData?.class_name,
        schoolName: inviteData?.school_name,
      });

      return {
        inviteData,
        classData,
        schoolData,
      };
    } catch (error) {
      logger.warn('Join class lookup RPC failed', {
        file_name: 'SupabaseApi.ts',
        function_name: 'getDataByInviteCodeNew',
        inviteCode,
        rawError: error,
      });
      logger.error('Error in getDataByInviteCodeNew', error);
      throw new Error('Invalid inviteCode');
    }
  }

  async storeJoinClassLookupDataLocally(
    classData: TableTypes<'class'>,
    schoolData: TableTypes<'school'>,
  ): Promise<void> {
    return;
  }

  async createClass(
    schoolId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
    gradeId?: string,
    standard?: string,
  ): Promise<TableTypes<'class'>> {
    if (!this.supabase) throw new Error('Supabase instance is not initialized');

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');

    const classId = uuidv4();
    const timestamp = new Date().toISOString();

    const newClass: TableTypes<'class'> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      grade_id: gradeId ?? null,
      group_id: groupId ?? null,
      created_at: timestamp,
      updated_at: timestamp,
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

    const { error } = await this.supabase.from('class').insert(newClass);
    if (error) {
      logger.error('Error inserting class:', error);
      throw error;
    }
    return newClass;
  }
  async deleteClass(classId: string) {
    if (!this.supabase) return;

    try {
      // Soft-delete class_user (only teachers)
      const { error: classUserUpdateError } = await this.supabase
        .from('class_user')
        .update({ is_deleted: true })
        .eq('class_id', classId)
        .eq('role', RoleType.TEACHER);

      if (classUserUpdateError) {
        logger.error('Error updating class_user:', classUserUpdateError);
        throw classUserUpdateError;
      }

      // Get affected class_user IDs (teachers)
      const { data: deletedClassUsers, error: classUserFetchError } =
        await this.supabase
          .from('class_user')
          .select('id')
          .eq('class_id', classId)
          .eq('role', RoleType.TEACHER)
          .eq('is_deleted', true);

      if (classUserFetchError) {
        logger.error(
          'Error fetching updated class_user records:',
          classUserFetchError,
        );
        throw classUserFetchError;
      }

      if (!deletedClassUsers || deletedClassUsers.length === 0) {
      }

      // Soft-delete class_course for this class
      const { error: classCourseUpdateError } = await this.supabase
        .from('class_course')
        .update({ is_deleted: true })
        .eq('class_id', classId);

      if (classCourseUpdateError) {
        logger.error('Error updating class_course:', classCourseUpdateError);
        throw classCourseUpdateError;
      }

      // Get affected class_course IDs
      const { data: deletedClassCourses, error: classCourseFetchError } =
        await this.supabase
          .from('class_course')
          .select('id')
          .eq('class_id', classId)
          .eq('is_deleted', true);

      if (classCourseFetchError) {
        logger.error(
          'Error fetching updated class_course records:',
          classCourseFetchError,
        );
        throw classCourseFetchError;
      }

      if (!deletedClassCourses || deletedClassCourses.length === 0) {
      }

      // Soft-delete the class itself
      const { error: classUpdateError } = await this.supabase
        .from('class')
        .update({ is_deleted: true })
        .eq('id', classId)
        .eq('is_deleted', false);

      if (classUpdateError) {
        logger.error('Error soft-deleting class:', classUpdateError);
        throw classUpdateError;
      }
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
    if (!this.supabase) return;

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');

    const updateData: any = {
      name: className,
      updated_at: new Date().toISOString(),
    };
    if (groupId !== undefined) updateData.group_id = groupId;
    if (whatsapp_invite_link !== undefined)
      updateData.whatsapp_invite_link = whatsapp_invite_link;

    const { error } = await this.supabase
      .from('class')
      .update(updateData)
      .eq('id', classId);

    if (error) {
      logger.error('Error updating class name:', error);
      throw error;
    }
  }
  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    try {
      if (!studentId) {
        throw Error('Student Not Found');
      }
      logger.warn('Join class link RPC started', {
        file_name: 'SupabaseApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
      });
      const rpcRes = await this.supabase?.rpc('new_link_student', {
        invite_code: inviteCode,
        student_id: studentId,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        const error = rpcRes?.error;
        logger.warn('Join class link RPC returned empty/error response', {
          file_name: 'SupabaseApi.ts',
          function_name: 'linkStudent',
          inviteCode,
          studentId,
          rpcError: error ?? null,
          hasData: !!rpcRes?.data,
        });
        if (error) {
          if (error.code === '23503') {
            logger.warn('Join class link RPC detected missing backend user', {
              file_name: 'SupabaseApi.ts',
              function_name: 'linkStudent',
              inviteCode,
              studentId,
              errorCode: error.code,
              errorMessage: error.message,
              errorDetails: error.details,
              errorHint: error.hint,
            });
          }
          const normalizedMessage = [error.details, error.message, error.hint]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .find(Boolean);

          if (normalizedMessage) {
            throw new Error(normalizedMessage);
          }
        }

        throw new Error('Failed to join class.');
      }
      const data = rpcRes.data;
      logger.warn('Join class link RPC succeeded', {
        file_name: 'SupabaseApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        responseType: Array.isArray(data) ? 'array' : typeof data,
        responseCount: Array.isArray(data) ? data.length : undefined,
      });
      return data;
    } catch (e) {
      logger.warn('Join class link RPC failed', {
        file_name: 'SupabaseApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        rawError: e,
      });
      if (e instanceof Error) {
        throw e;
      }
      throw new Error('Failed to join class.');
    }
  }
  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList,
  ): Promise<LeaderboardInfo | undefined> {
    try {
      if (!this.supabase)
        throw new Error('Supabase instance is not initialized');

      const leaderBoardList = emptyLeaderboardInfo();

      if (!sectionId) {
        const leaderboardType = getLeaderboardDataType(leaderboardDropdownType);
        const { data, error } = await this.supabase
          .from('get_leaderboard_generic_data')
          .select(
            'type, student_id, name, lessons_played, total_score, total_time_spent',
          )
          .eq('type', leaderboardType)
          .order('total_score', { ascending: false, nullsFirst: false })
          .limit(GENERIC_LEADERBOARD_LIMIT);

        if (error) {
          throw error;
        }

        data?.forEach((result) => pushLeaderboardRow(leaderBoardList, result));
        return leaderBoardList;
      }

      const rpcRes = await this.supabase.rpc('get_class_leaderboard', {
        current_class_id: sectionId,
      });

      // Check if the response is valid
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? new Error('Failed to fetch leaderboard data');
      }

      // Initialize the leaderboard structure
      const data: any = rpcRes.data;

      // Process the data and populate the leaderboard lists
      for (let i = 0; i < data.length; i++) {
        const result = data[i];
        pushLeaderboardRow(leaderBoardList, result);
      }

      return leaderBoardList;
    } catch (e) {
      logger.error('Error in getLeaderboardResults: ', e);
      // Return an empty leaderboard structure in case of error
      return emptyLeaderboardInfo();
    }
  }

  async getLeaderboardStudentResultFromB2CCollection(
    studentId?: string,
  ): Promise<LeaderboardInfo | undefined> {
    try {
      // Initialize leaderboard structure
      let leaderBoardList = emptyLeaderboardInfo();

      if (!this.supabase) {
        logger.error('Supabase instance is not initialized');
        return;
      }

      if (!studentId) {
        logger.warn(
          'getLeaderboardStudentResultFromB2CCollection called without studentId',
        );
        return leaderBoardList;
      }

      // Execute the query
      const { data, error } = await this.supabase
        .from('get_leaderboard_generic_data')
        .select(
          'type, student_id, name, lessons_played, total_score, total_time_spent',
        )
        .eq('student_id', studentId)
        .limit(3);

      // Handle errors in the query execution
      if (error) {
        logger.error('Error fetching leaderboard data: ', error);
        return;
      }

      // Handle case where no data is returned
      if (!data) {
        logger.warn('No data returned from get_leaderboard_generic_data');
        return;
      }

      // Process the results
      data.forEach((result) => {
        if (!result) return;
        pushLeaderboardRow(leaderBoardList, result);
      });

      return leaderBoardList;
    } catch (error) {
      logger.error(
        'Error in getLeaderboardStudentResultFromB2CCollection: ',
        error,
      );
    }
  }
}
