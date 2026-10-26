import { STARS_COUNT, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiOpsValidation } from './SupabaseApi.ops.validation';

export interface SupabaseApiOpsLearningPath {
  [key: string]: any;
}
export class SupabaseApiOpsLearningPath extends SupabaseApiOpsValidation {
  async setStarsForStudents(
    studentId: string,
    starsCount: number,
  ): Promise<void> {
    if (!this.supabase || !studentId) return;

    try {
      // Read existing stars map from localStorage
      const previousStarsRaw = localStorage.getItem(STARS_COUNT);
      const previousStars = previousStarsRaw
        ? JSON.parse(previousStarsRaw)
        : {};

      // Get current stars for this student from localStorage or default 0
      const currentStars = previousStars[studentId] ?? 0;

      // Calculate new total stars
      const totalStars = currentStars + starsCount;

      // Update stars count in Supabase DB
      const { error: updateError } = await this.supabase
        .from('user')
        .update({ stars: totalStars })
        .eq('id', studentId);

      if (updateError) {
        logger.error('Error updating stars in Supabase:', updateError);
      }
    } catch (error) {
      logger.error('Error in setStarsForStudents:', error);
    }
  }
  async countAllPendingPushes(): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async getDebugInfoLast30Days(parentId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  async getClassByUserId(userId: string): Promise<TableTypes<'class'>> {
    if (!this.supabase) return {} as TableTypes<'class'>;

    // Get class_id from class_user
    const { data: classUserData, error: classUserError } = await this.supabase
      .from('class_user')
      .select('class_id')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .limit(1)
      .single();

    if (classUserError || !classUserData) {
      logger.error('Error fetching class_user:', classUserError);
      return {} as TableTypes<'class'>;
    }

    const classId = classUserData.class_id;
    if (!classId) return {} as TableTypes<'class'>;

    // Get class from class table using class_id
    const { data: classData, error: classError } = await this.supabase
      .from('class')
      .select('*')
      .eq('id', classId)
      .eq('is_deleted', false)
      .limit(1)
      .single();

    if (classError || !classData) {
      logger.error('Error fetching class:', classError);
      return {} as TableTypes<'class'>;
    }
    return classData;
  }

  async getCoursesForPathway(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];

    // Get course IDs from user_course for the student
    const { data: userCourses, error: userCoursesError } = await this.supabase
      .from(TABLES.UserCourse)
      .select('course_id')
      .eq('user_id', studentId)
      .eq('is_deleted', false);

    if (userCoursesError) {
      logger.error('Error fetching user courses:', userCoursesError);
      return [];
    }
    if (!userCourses || userCourses.length === 0) {
      return [];
    }

    // Extract course IDs as array of strings
    const courseIds = userCourses.map((uc) => uc.course_id);

    // Fetch course details ordered by sort_index
    const { data: courses, error: coursesError } = await this.supabase
      .from(TABLES.Course)
      .select('*')
      .in('id', courseIds)
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (coursesError) {
      logger.error('Error fetching courses:', coursesError);
      return [];
    }

    return courses ?? [];
  }
  async updateLearningPath(
    student: TableTypes<'user'>,
    learning_path: string,
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) return student;

    const { error } = await this.supabase
      .from(TABLES.User)
      .update({ learning_path: learning_path })
      .eq('id', student.id)
      .single();

    if (error) {
      logger.error('Error updating learning path:', error);
      throw error;
    }
    return { ...student, learning_path: learning_path };
  }
}
