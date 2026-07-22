import { MODES, TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { sortBySchoolSearchRelevance } from '../../../utility/schoolSearchUtil';
import { SupabaseApiResults } from './SupabaseApi.results';

const firstOrSelf = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export interface SupabaseApiUserLookups {
  [key: string]: any;
}
export class SupabaseApiUserLookups extends SupabaseApiResults {
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
    const { data, error } = await this.supabase
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

      // --- FIELD COORDINATOR ---
      if (role === RoleType.FIELD_COORDINATOR) {
        const { data: schoolUsers, error: schoolUserErr } = await this.supabase
          .from(TABLES.SchoolUser)
          .select('role, school:school_id(*)')
          .eq('user_id', userId)
          .eq('role', RoleType.FIELD_COORDINATOR)
          .eq('is_deleted', false);

        if (schoolUserErr) {
          logger.error(
            'Error fetching field coordinator school_user rows:',
            schoolUserErr,
          );
          return [];
        }

        const unique = new Map<
          string,
          { school: TableTypes<'school'>; role: RoleType }
        >();
        for (const row of schoolUsers ?? []) {
          const school = firstOrSelf(row.school);
          if (
            !school?.id ||
            school.is_deleted ||
            (search &&
              !String(school.name ?? '')
                .toLowerCase()
                .includes(search.toLowerCase()))
          ) {
            continue;
          }

          unique.set(String(school.id), {
            school: school as TableTypes<'school'>,
            role,
          });
        }

        return Array.from(unique.values())
          .sort((a, b) =>
            String(a.school.name ?? '').localeCompare(
              String(b.school.name ?? ''),
            ),
          )
          .slice(from, to + 1);
      }

      // --- PROGRAM MANAGER ---
      if (role === RoleType.PROGRAM_MANAGER) {
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
}
