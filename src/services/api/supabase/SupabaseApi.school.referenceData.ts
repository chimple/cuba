import { TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiSchoolProfiles } from './SupabaseApi.school.profiles';

export interface SupabaseApiSchoolReferenceData {
  [key: string]: any;
}
export class SupabaseApiSchoolReferenceData extends SupabaseApiSchoolProfiles {
  async getAllCurriculums(): Promise<TableTypes<'curriculum'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Curriculum)
      .select('*')
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching curriculums:', error);
      return [];
    }
    return data ?? [];
  }

  async getAllGrades(): Promise<TableTypes<'grade'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Grade)
      .select('*')
      .eq('is_deleted', false)
      .order('sort_index', {
        ascending: true,
      });

    if (error) {
      logger.error('Error fetching grades:', error);
      return [];
    }

    return data ?? [];
  }

  async getAllLanguages(): Promise<TableTypes<'language'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Language)
      .select('*')
      .eq('is_deleted', false)
      .order('code', { ascending: true });

    if (error) {
      logger.error('Error fetching languages:', error);
      return [];
    }

    return data ?? [];
  }
  async getParentStudentProfiles(): Promise<TableTypes<'user'>[]> {
    if (!this.supabase) return [];

    const currentUser =
      await ServiceConfig.getI()?.authHandler?.getCurrentUser();
    if (!currentUser) throw new Error('User is not Logged in');

    const { data, error } = await this.supabase
      .from(TABLES.ParentUser)
      .select('student:student_id(*)')
      .eq('parent_id', currentUser.id)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching parent-student profiles:', error);
      return [];
    }

    // Extract only the student profiles from the joined result
    const students = (data ?? [])
      .map((item: any) => item.student)
      .filter((student: TableTypes<'user'>) => student && !student.is_deleted);

    return students;
  }
  async updateSchoolProgram(
    schoolId: string,
    programId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false; // <-- guard

    const { error } = await this.supabase // <-- await
      .from('school')
      .update({ program_id: programId })
      .eq('id', schoolId);

    if (error) {
      logger.error('Error updating school program:', error);
      return false;
    }

    return true;
  }
}
