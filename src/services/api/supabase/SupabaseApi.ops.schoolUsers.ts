import { v4 as uuidv4 } from 'uuid';
import {
  CoordinatorAPIResponse,
  CoordinatorInfo,
  PrincipalAPIResponse,
  PrincipalInfo,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import { SupabaseApiOpsClassOperations } from './SupabaseApi.ops.classOperations';

export interface SupabaseApiOpsSchoolUsers {
  [key: string]: any;
}
export class SupabaseApiOpsSchoolUsers extends SupabaseApiOpsClassOperations {
  async getSchoolsWithRoleAutouser(
    schoolIds: string[],
    userId: string,
  ): Promise<TableTypes<'school'>[] | undefined> {
    if (!this.supabase || !schoolIds.length) return;

    try {
      const { data, error } = await this.supabase
        .from(TABLES.SchoolUser)
        .select('school(*)')
        .in('school_id', schoolIds)
        .eq('role', RoleType.AUTOUSER)
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Supabase error in getSchoolsWithRoleAutouser:', error);
        return;
      }

      const schools = (data ?? [])
        .map((item) => item.school)
        .filter((school): school is TableTypes<'school'> => !!school);

      return schools ?? [];
    } catch (err) {
      logger.error('Error in getSchoolsWithRoleAutouser:', err);
      return;
    }
  }
  async getPrincipalsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from('school_user')
      .select('user:user!school_user_user_id_fkey(*)')
      .eq('school_id', schoolId)
      .eq('role', RoleType.PRINCIPAL)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    if (error) {
      logger.error('Error fetching principals:', error);
      return;
    }

    const users = (data ?? [])
      .map((item) => item.user)
      .filter((user): user is TableTypes<'user'> => !!user);

    return users;
  }

  async getPrincipalsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PrincipalAPIResponse> {
    if (!this.supabase) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from('school_user')
      .select('user:user!school_user_user_id_fkey(*)', { count: 'exact' }) // Get count and data
      .eq('school_id', schoolId)
      .eq('role', RoleType.PRINCIPAL)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1); // Apply pagination

    if (error) {
      logger.error('Error fetching principals:', error);
      return { data: [], total: 0 };
    }

    if (!data || !count) {
      return { data: [], total: 0 };
    }

    // Extract the user data from the join result
    const users: PrincipalInfo[] = data
      .map((item) => item.user)
      .filter((user): user is PrincipalInfo => !!user);

    return {
      data: users,
      total: count,
    };
  }

  // In your API handler (e.g., SupabaseApi.ts)
  async getCoordinatorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from('school_user')
      .select('user:user!school_user_user_id_fkey(*)')
      .eq('school_id', schoolId)
      .eq('role', RoleType.COORDINATOR)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching coordinators:', error);
      return;
    }

    const coordinators = (data ?? [])
      .map((item) => item.user)
      .filter((user): user is TableTypes<'user'> => !!user);

    return coordinators;
  }

  async getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<CoordinatorAPIResponse> {
    if (!this.supabase) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from('school_user')
      .select('user:user!school_user_user_id_fkey(*)', { count: 'exact' }) // Get count and data
      .eq('school_id', schoolId)
      .eq('role', RoleType.COORDINATOR) // The only change from the principal query
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1); // Apply pagination

    if (error) {
      logger.error('Error fetching coordinators:', error);
      return { data: [], total: 0 };
    }

    if (!data || !count) {
      return { data: [], total: 0 };
    }

    const users: CoordinatorInfo[] = data
      .map((item) => item.user)
      .filter((user): user is CoordinatorInfo => !!user);

    return {
      data: users,
      total: count,
    };
  }
  async getSponsorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from('school_user')
      .select('user:user!user_id(*)')
      .eq('school_id', schoolId)
      .eq('role', RoleType.SPONSOR)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching sponsors:', error);
      return;
    }

    const sponsors = (data as { user: TableTypes<'user'> | null }[])
      .map((item) => item.user)
      .filter((u): u is TableTypes<'user'> => !!u);

    return sponsors;
  }
  async addUserToSchool(
    schoolId: string,
    user: TableTypes<'user'>,
    role: RoleType,
  ): Promise<void> {
    if (!this.supabase) return;

    const schoolUserId = uuidv4();
    const timestamp = new Date().toISOString();

    if (role === RoleType.PRINCIPAL) {
      const { data: teacherRows, error: teacherRowsError } = await this.supabase
        .from(TABLES.ClassUser)
        .select('class_id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .in('role', [RoleType.TEACHER, 'teacher']);

      if (teacherRowsError) {
        logger.error(
          'Error checking teacher role in class_user:',
          teacherRowsError,
        );
        return;
      }

      const teacherClassIds = Array.from(
        new Set(
          (teacherRows ?? []).map((row: any) => row.class_id).filter(Boolean),
        ),
      );

      if (teacherClassIds.length > 0) {
        const { data: schoolClassMatch, error: classMatchError } =
          await this.supabase
            .from(TABLES.Class)
            .select('id')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .in('id', teacherClassIds)
            .limit(1);

        if (classMatchError) {
          logger.error(
            'Error checking teacher class membership against school:',
            classMatchError,
          );
          return;
        }

        if (schoolClassMatch && schoolClassMatch.length > 0) {
          throw new Error(
            'This user is already a Teacher in this school and cannot be made Principal for the same school.',
          );
        }
      }
    }

    const { data: existing, error: selectError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('id')
      .eq('school_id', schoolId)
      .eq('user_id', user.id)
      .eq('role', role)
      .eq('is_deleted', false)
      .limit(1);

    if (selectError) {
      logger.error('Error checking existing school_user:', selectError);
      return;
    }
    if (existing && existing.length > 0) return;

    const schoolUser = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: user.id,
      role: role as Database['public']['Enums']['role'],
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };

    const { error: insertError } = await this.supabase
      .from(TABLES.SchoolUser)
      .insert([schoolUser]);

    if (insertError) {
      logger.error('Error inserting into school_user:', insertError);
      return;
    }
    const { error: schoolUpdateError } = await this.supabase
      .from(TABLES.School)
      .update({ updated_at: timestamp })
      .eq('id', schoolId)
      .eq('is_deleted', false);
    // 🔹 Update 'school_course' table
    const { error: schoolCourseUpdateError } = await this.supabase
      .from(TABLES.SchoolCourse)
      .update({ updated_at: timestamp })
      .eq('school_id', schoolId)
      .eq('is_deleted', false);
    // const user_doc = await this.getUserByDocId(user.id);

    if (user) {
      const cleanUserDoc = {
        id: user.id,
        name: user.name ?? null,
        age: user.age ?? null,
        gender: user.gender ?? null,
        avatar: user.avatar ?? null,
        image: user.image ?? null,
        curriculum_id: user.curriculum_id ?? null,
        language_id: user.language_id ?? null,
        created_at: user.created_at ?? timestamp,
        updated_at: user.updated_at ?? timestamp,
      };

      const { error: userInsertError } = await this.supabase
        .from(TABLES.User)
        .upsert([cleanUserDoc], { onConflict: 'id' });

      if (userInsertError) {
        logger.error('Error upserting user:', userInsertError);
      }
    }
  }
  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      return { success: false, message: 'Database not available.' };
    }

    try {
      const { data, error: selectError } = await this.supabase
        .from('school_user')
        .select('id')
        .eq('school_id', schoolId)
        .eq('user_id', userId)
        .eq('role', role)
        .eq('is_deleted', false)
        .maybeSingle();

      if (selectError) {
        logger.error('Error selecting school_user:', selectError);
        return { success: false, message: selectError.message };
      }

      if (!data) {
        return { success: false, message: 'school_user not found.' };
      }

      const updatedAt = new Date().toISOString();

      const { error: updateError } = await this.supabase
        .from('school_user')
        .update({ is_deleted: true, updated_at: updatedAt })
        .eq('id', data.id);

      if (updateError) {
        logger.error('Error updating school_user:', updateError);
        return { success: false, message: updateError.message };
      }

      return {
        success: true,
        message: 'User removed from school successfully.',
      };
    } catch (error: any) {
      logger.error('SupabaseApi ~ deleteUserFromSchool ~ error:', error);
      return {
        success: false,
        message: error?.message || 'Unexpected error occurred.',
      };
    }
  }
}
