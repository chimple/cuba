import { TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiProgramUserRoles } from './SupabaseApi.program.userRoles';

export interface SupabaseApiProgramActivityStats {
  [key: string]: any;
}
export class SupabaseApiProgramActivityStats extends SupabaseApiProgramUserRoles {
  async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return {
        total_students: 0,
        total_teachers: 0,
        total_schools: 0,
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
    try {
      const { data, error } = await this.supabase.rpc(
        'get_program_activity_stats',
        {
          p_program_id: programId,
        },
      );

      if (error || !data) {
        logger.error('RPC error:', error);
        return {
          total_students: 0,
          total_teachers: 0,
          total_schools: 0,
          active_student_percentage: 0,
          active_teacher_percentage: 0,
          avg_weekly_time_minutes: 0,
        };
      }
      const stats = data as unknown as {
        total_students: number;
        total_teachers: number;
        total_schools: number;
        active_student_percentage: number;
        active_teacher_percentage: number;
        avg_weekly_time_minutes: number;
      };

      return {
        total_students: stats.total_students ?? 0,
        total_teachers: stats.total_teachers ?? 0,
        total_schools: stats.total_schools ?? 0,
        active_student_percentage: stats.active_student_percentage ?? 0,
        active_teacher_percentage: stats.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: stats.avg_weekly_time_minutes ?? 0,
      };
    } catch (err) {
      logger.error('Unexpected error:', err);
      return {
        total_students: 0,
        total_teachers: 0,
        total_schools: 0,
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
  }

  async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return {
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'get_school_activity_stats',
        {
          p_school_id: schoolId,
        },
      );

      if (error) {
        logger.error('RPC error:', error);
        return {
          active_student_percentage: 0,
          active_teacher_percentage: 0,
          avg_weekly_time_minutes: 0,
        };
      }
      const stats = data as unknown as {
        active_student_percentage: number;
        active_teacher_percentage: number;
        avg_weekly_time_minutes: number;
      };
      return {
        active_student_percentage: stats?.active_student_percentage ?? 0,
        active_teacher_percentage: stats?.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: stats?.avg_weekly_time_minutes ?? 0,
      };
    } catch (err) {
      logger.error('Unexpected error:', err);
      return {
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
  }

  async isProgramManager(): Promise<boolean> {
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
      .in('role', ['program_manager'])
      .eq('is_deleted', false)
      .limit(1);
    if (error) {
      logger.error('Error checking program_user table', error);
      return false;
    }
    return !!(data && data.length > 0);
  }

  async getUserSpecialRoles(userId: string): Promise<string[]> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return [];
    }

    if (!userId) {
      logger.warn('userId is missing. Cannot fetch roles.');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('special_users')
        .select('role')
        .eq('user_id', userId)
        .in('role', [
          RoleType.SUPER_ADMIN,
          RoleType.PROGRAM_MANAGER,
          RoleType.FIELD_COORDINATOR,
          RoleType.OPERATIONAL_DIRECTOR,
          RoleType.EXTERNAL_USER,
        ])
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching roles from special_users:', error.message);
        return [];
      }

      const roles = (data ?? [])
        .map((item) => item.role)
        .filter((role): role is NonNullable<typeof role> => role !== null);

      return roles;
    } catch (e) {
      logger.error('Unexpected error while fetching user special roles:', e);
      return [];
    }
  }

  async updateSpecialUserRole(userId: string, role: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await this.supabase
        .from('special_users')
        .update({
          role: role as RoleType.PROGRAM_MANAGER | RoleType.FIELD_COORDINATOR,
          updated_at: updatedAt,
        })
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error updating role in special_users:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while updating user role:', e);
    }
  }
  async deleteSpecialUser(userId: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await this.supabase
        .from('special_users')
        .update({ is_deleted: true })
        .eq('user_id', userId)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error deleting user in special_users:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while deleting user:', e);
    }
  }

  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await this.supabase
        .from('program_user')
        .update({
          role: role as RoleType.PROGRAM_MANAGER | RoleType.FIELD_COORDINATOR,
          updated_at: updatedAt,
        })
        .eq('user', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error updating role in program_user:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while updating user role:', e);
    }
  }

  async deleteProgramUser(userId: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await this.supabase
        .from('program_user')
        .update({ is_deleted: true })
        .eq('user', userId)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error deleting user in program_user:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while deleting user:', e);
    }
  }

  async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType,
  ): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await this.supabase
        .from('school_user')
        .update({ is_deleted: true })
        .eq('user_id', userId)
        .eq('role', role)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error deleting user in program_user:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while deleting user:', e);
    }
  }
  async getChaptersByIds(
    chapterIds: string[],
  ): Promise<TableTypes<'chapter'>[]> {
    if (!this.supabase) {
      logger.error('getChaptersByIds failed: Supabase client not initialized.');
      return [];
    }

    if (!chapterIds || chapterIds.length === 0) {
      logger.warn('getChaptersByIds was called with no chapter IDs.');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from(TABLES.Chapter)
        .select('*')
        .in('id', chapterIds)
        .eq('is_deleted', false);

      if (error) {
        logger.warn('Error fetching chapters by IDs:', chapterIds);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching chapters', error);
      return [];
    }
  }
  async getChapterIdbyQrLink(
    link: string,
  ): Promise<TableTypes<'chapter_links'> | undefined> {
    throw new Error('Method not implemented.');
  }
  async addParentToNewClass(classID: string, studentId: string) {
    try {
      if (!this.supabase) return;
      const { error } = await this.supabase.rpc('add_parent_to_newclass', {
        _class_id: classID,
        _student_id: studentId,
      });

      if (error) {
        logger.error('Failed to add parent to class:', error.message);
      }
    } catch (error) {
      logger.error('Error in addParentToNewClass:', error);
    }
  }
}
