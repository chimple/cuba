import { v4 as uuidv4 } from 'uuid';
import {
  AVATARS,
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiProgramClassMetrics } from './SupabaseApi.program.classMetrics';

export interface SupabaseApiProgramUserRoles {
  [key: string]: any;
}
export class SupabaseApiProgramUserRoles extends SupabaseApiProgramClassMetrics {
  async createAutoProfile(
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) throw new Error('Supabase instance is not initialized');

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const studentProfile = await this.getParentStudentProfiles();
    if (studentProfile.length > 0) return studentProfile[0];

    const studentId = uuidv4();
    const now = new Date().toISOString();

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
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_tc_accepted: true,
      tc_agreed_version: tcVersion ?? 0,
      email: null,
      phone: null,
      fcm_token: null,
      music_off: false,
      sfx_off: false,
      student_id: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      learning_path: null,
      ops_created_by: null,
      reward: null,
      stars: null,
      is_wa_contact: null,
    };

    // Insert user
    const { error: userInsertError } = await this.supabase
      .from(TABLES.User)
      .insert([newStudent]);
    if (userInsertError) {
      logger.error('Error inserting auto profile user:', userInsertError);
      throw userInsertError;
    }

    // Insert parent_user
    const parentUserId = uuidv4();
    const parentUserData: TableTypes<'parent_user'> = {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
    };
    const { error: parentInsertError } = await this.supabase
      .from(TABLES.ParentUser)
      .insert([parentUserData]);
    if (parentInsertError) {
      logger.error(
        'Error inserting parent_user for auto profile:',
        parentInsertError,
      );
      throw parentInsertError;
    }

    // Find English, Maths, and language-dependent subject
    const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
    const mathsCourse = await this.resolveMathCourseByLanguage(languageDocId);
    const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);
    const language = languageDocId
      ? await this.getLanguageWithId(languageDocId)
      : undefined;
    let langCourse: TableTypes<'course'> | undefined;
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
    // Add only these three courses to the student
    const coursesToAdd = [
      englishCourse,
      mathsCourse,
      langCourse,
      digitalSkillsCourse,
    ].filter(Boolean) as TableTypes<'course'>[];

    // Insert user_course entries
    for (const course of coursesToAdd) {
      const newUserCourse: TableTypes<'user_course'> = {
        id: uuidv4(),
        user_id: studentId,
        course_id: course.id,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        is_firebase: null,
      };
      const { error: userCourseInsertError } = await this.supabase
        .from(TABLES.UserCourse)
        .insert([newUserCourse]);
      if (userCourseInsertError) {
        logger.error(
          'Error inserting user_course for auto profile:',
          userCourseInsertError,
        );
      }
    }

    return newStudent;
  }

  async isProgramUser(): Promise<boolean> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return false;
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');

    const userId = _currentUser.id;

    const { data, error } = await this.supabase
      .from('program_user')
      .select('id')
      .eq('user', userId)
      .in('role', [RoleType.PROGRAM_MANAGER, RoleType.FIELD_COORDINATOR])
      .eq('is_deleted', false)
      .limit(1);

    if (error) {
      logger.error('Error checking program_user table', error);
      return false;
    }

    return !!(data && data.length > 0);
  }
  async isSplUser(): Promise<boolean> {
    if (!this.supabase) return false;
    try {
      const { data, error } = await this.supabase.rpc(
        'is_special_or_program_user',
      );
      if (error) {
        logger.error('Error checking special user status:', error);
        return false;
      }
      return !!data;
    } catch (e) {
      logger.error('Exception in isSplUser:', e);
      return false;
    }
  }

  async getManagersAndCoordinators(
    page: number = 1,
    search: string = '',
    limit: number = 20,
    sortBy: keyof TableTypes<'user'> = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    data: { user: TableTypes<'user'>; role: string }[];
    totalCount: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return { data: [], totalCount: 0 };
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User not logged in');
    const userId = _currentUser.id;
    const roles: string[] = store.getState().auth.roles || [];
    const isSuperAdmin = roles.includes(RoleType.SUPER_ADMIN);
    const isOpsDirector = roles.includes(RoleType.OPERATIONAL_DIRECTOR);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    if (isSuperAdmin || isOpsDirector) {
      let specialUsersQuery = this.supabase
        .from('special_users')
        .select('user_id, role')
        .eq('is_deleted', false)
        .not('user_id', 'is', null);
      if (isOpsDirector && !isSuperAdmin) {
        specialUsersQuery = specialUsersQuery.neq('role', RoleType.SUPER_ADMIN);
      }
      const { data: specialUsers, error: specialUsersError } =
        await specialUsersQuery;
      if (specialUsersError) {
        logger.error('Error fetching special users:', specialUsersError);
        return { data: [], totalCount: 0 };
      }
      if (!specialUsers || specialUsers.length === 0) {
        return { data: [], totalCount: 0 };
      }
      const roleByUserId = new Map<string, string>();
      specialUsers.forEach((specialUser) => {
        if (specialUser.user_id && specialUser.role) {
          roleByUserId.set(specialUser.user_id, specialUser.role);
        }
      });
      const userIds = Array.from(roleByUserId.keys());
      let query = this.supabase
        .from('user')
        .select('*', search ? { count: 'exact' } : undefined)
        .in('id', userIds)
        .eq('is_deleted', false);
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);
      if (error) {
        logger.error('Supabase fetch error:', error);
        return { data: [], totalCount: 0 };
      }
      if (!data) return { data: [], totalCount: 0 };
      const result = data.map((userObject) => {
        const role = roleByUserId.get(userObject.id) || '';
        return {
          user: userObject as TableTypes<'user'>,
          role,
        };
      });
      return { data: result, totalCount: search ? count || 0 : userIds.length };
    }
    if (roles.includes(RoleType.PROGRAM_MANAGER)) {
      const { data: programs, error: programsError } = await this.supabase
        .from('program_user')
        .select('program_id')
        .eq('user', userId)
        .eq('role', RoleType.PROGRAM_MANAGER)
        .eq('is_deleted', false);
      if (programsError) {
        logger.error(
          "Error fetching program manager's programs:",
          programsError,
        );
        return { data: [], totalCount: 0 };
      }
      if (!programs || programs.length === 0) {
        return { data: [], totalCount: 0 };
      }
      const programIds = programs.map((p) => p.program_id);
      const { data: coordinatorLinks, error: coordinatorLinksError } =
        await this.supabase
          .from('program_user')
          .select('user')
          .in('program_id', programIds)
          .eq('role', RoleType.FIELD_COORDINATOR)
          .eq('is_deleted', false)
          .not('user', 'is', null);

      if (coordinatorLinksError) {
        logger.error(
          'Error fetching field coordinator program links:',
          coordinatorLinksError,
        );
        return { data: [], totalCount: 0 };
      }

      const coordinatorUserIds = Array.from(
        new Set(
          (coordinatorLinks ?? [])
            .map((link) => link.user)
            .filter((id): id is string => !!id),
        ),
      );

      if (coordinatorUserIds.length === 0) {
        return { data: [], totalCount: 0 };
      }

      let query = this.supabase
        .from('user')
        .select('*', { count: 'exact' })
        .in('id', coordinatorUserIds)
        .eq('is_deleted', false);
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const {
        data: users,
        count,
        error,
      } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);
      if (error) {
        logger.error('Error fetching field coordinators:', error);
        return { data: [], totalCount: 0 };
      }
      if (!users) {
        return { data: [], totalCount: 0 };
      }
      const result = users.map((userObject) => ({
        user: userObject as TableTypes<'user'>,
        role: RoleType.FIELD_COORDINATOR,
      }));
      return { data: result, totalCount: count || 0 };
    }
    return { data: [], totalCount: 0 };
  }
}
