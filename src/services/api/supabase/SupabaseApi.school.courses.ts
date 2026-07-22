import { TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiSchoolVisits } from './SupabaseApi.school.visits';
export interface SupabaseApiSchoolCourses {
  [key: string]: any;
}
export class SupabaseApiSchoolCourses extends SupabaseApiSchoolVisits {
  async getCoursesByClassId(
    classId: string,
  ): Promise<TableTypes<'class_course'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.ClassCourse)
      .select('*')
      .eq('class_id', classId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching class courses:', error);
      return [];
    }

    return data ?? [];
  }

  async getCoursesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'school_course'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.SchoolCourse)
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching school courses:', error);
      return [];
    }

    return data ?? [];
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    if (!this.supabase) return;
    const updatedAt = new Date().toISOString();
    try {
      if (ids.length === 0) {
        logger.warn('No course IDs provided for removal.');
        return;
      }

      const { error } = await this.supabase
        .from(TABLES.ClassCourse)
        .update({ is_deleted: true, updated_at: updatedAt })
        .in('id', ids);

      if (error) {
        logger.error('Error removing courses from class_course:', error);
      }
    } catch (err) {
      logger.error('Exception in removeCoursesFromClass:', err);
    }
  }

  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    if (!this.supabase) return;
    const updatedAt = new Date().toISOString();
    try {
      if (ids.length === 0) {
        logger.warn('No course IDs provided for removal.');
        return;
      }

      const { error } = await this.supabase
        .from(TABLES.SchoolCourse)
        .update({ is_deleted: true, updated_at: updatedAt })
        .in('id', ids);

      if (error) {
        logger.error('Error removing courses from school_course:', error);
      }
    } catch (err) {
      logger.error('Exception in removeCoursesFromSchool:', err);
    }
  }
  async checkCourseInClasses(
    classIds: string[],
    courseId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      if (classIds.length === 0) return false;

      const { data, error } = await this.supabase
        .from(TABLES.ClassCourse)
        .select('id')
        .in('class_id', classIds)
        .eq('course_id', courseId)
        .eq('is_deleted', false)
        .limit(1);

      if (error) {
        logger.error('Error checking course in classes:', error);
        return false;
      }

      return !!data && data.length > 0;
    } catch (err) {
      logger.error('Exception in checkCourseInClasses:', err);
      return false;
    }
  }

  // ServerApi.ts
  async deleteUserFromClass(
    userId: string,
    class_id: string,
  ): Promise<boolean | void> {
    if (!this.supabase) return false;

    try {
      const rpcRes = await this.supabase.rpc('delete_user_from_class', {
        p_user_id: userId,
        p_class_id: class_id,
      });

      if (!rpcRes || rpcRes.error) {
        if (rpcRes?.error) {
          logger.error('Error deleting user from class:', rpcRes.error);
        }
        return false;
      }

      await this.updateClassAndSchoolLastModified([class_id]);
      return true;
    } catch (error) {
      logger.error('SupabaseApi ~ deleteUserFromClass ~ error:', error);
      return false;
    }
  }
}
