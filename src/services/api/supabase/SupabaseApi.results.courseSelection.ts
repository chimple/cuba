import { v4 as uuidv4 } from 'uuid';
import {
  CHIMPLE_MATHS,
  COURSES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiResultsStudentProfiles } from './SupabaseApi.results.studentProfiles';

type StudentProgressRowWithLesson = TableTypes<'result'> & {
  lesson?: {
    name?: string;
    chapter_lesson?:
      | {
          chapter?: {
            id?: string;
            name?: string;
            course_id?: string;
          } | null;
        }[]
      | null;
  } | null;
};
export interface SupabaseApiResultsCourseSelection {
  [key: string]: any;
}
export class SupabaseApiResultsCourseSelection extends SupabaseApiResultsStudentProfiles {
  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        // Check existing entry
        if (!this.supabase) return;
        const { data: existingEntry, error } = await this.supabase
          .from('class_course')
          .select('*')
          .eq('class_id', classId)
          .eq('course_id', courseId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching class_course:', error);
          throw error;
        }

        if (!existingEntry) {
          // Insert new
          const newEntry = {
            id: uuidv4(),
            class_id: classId,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          };
          const { error: insertError } = await this.supabase
            .from('class_course')
            .insert(newEntry);

          if (insertError) {
            logger.error('Error inserting class_course:', insertError);
            throw insertError;
          }
        } else if (existingEntry.is_deleted) {
          // Reactivate
          const { error: updateError } = await this.supabase
            .from('class_course')
            .update({ is_deleted: false, updated_at: now })
            .eq('id', existingEntry.id);

          if (updateError) {
            logger.error('Error updating class_course:', updateError);
            throw updateError;
          }
        } else {
          // Update timestamp
          const { error: timestampError } = await this.supabase
            .from('class_course')
            .update({ updated_at: now })
            .eq('id', existingEntry.id);

          if (timestampError) {
            logger.error('Error updating updated_at:', timestampError);
            throw timestampError;
          }
        }
      }),
    );
  }

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        if (!this.supabase) return;
        const { data: existingEntry, error } = await this.supabase
          .from('school_course')
          .select('id, course_id, is_deleted')
          .eq('school_id', schoolId)
          .eq('course_id', courseId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching school_course:', error);
          throw error;
        }

        if (!existingEntry) {
          // Insert new course assignment
          const newEntry = {
            id: uuidv4(),
            school_id: schoolId,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          };
          const { error: insertError } = await this.supabase
            .from('school_course')
            .insert(newEntry);

          if (insertError) {
            logger.error('Error inserting school_course:', insertError);
            throw insertError;
          }
        } else if (existingEntry.is_deleted) {
          // Reactivate the deleted entry
          const { error: updateError } = await this.supabase
            .from('school_course')
            .update({ is_deleted: false, updated_at: now })
            .eq('id', existingEntry.id);

          if (updateError) {
            logger.error('Error updating school_course:', updateError);
            throw updateError;
          }
        } else {
          // Update timestamp of existing active entry
          const { error: timestampError } = await this.supabase
            .from('school_course')
            .update({ updated_at: now })
            .eq('id', existingEntry.id);

          if (timestampError) {
            logger.error('Error updating updated_at:', timestampError);
            throw timestampError;
          }
        }
      }),
    );
  }

  async getSubject(id: string): Promise<TableTypes<'subject'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('subject')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching subject:', error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getCourse(id: string): Promise<TableTypes<'course'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('course')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching course:', error);
      return undefined;
    }
    return data ?? undefined;
  }

  async resolveMathCourseByLanguage(
    languageDocId?: string | null,
  ): Promise<TableTypes<'course'> | undefined> {
    if (!this.supabase) return undefined;

    const englishMathCourse = await this.getCourse(CHIMPLE_MATHS);
    if (!englishMathCourse?.subject_id) return englishMathCourse;

    if (!languageDocId) return englishMathCourse;

    const language = await this.getLanguageWithId(languageDocId);
    const languageCode = (language?.code ?? '').toLowerCase();
    if (!languageCode || languageCode === COURSES.ENGLISH) {
      return englishMathCourse;
    }

    const { data, error } = await this.supabase
      .from(TABLES.Course)
      .select('*')
      .eq('subject_id', englishMathCourse.subject_id)
      .eq('code', `maths-${languageCode}`)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching language-specific math course:', error);
      return englishMathCourse;
    }

    const matchingCourse =
      (data ?? []).find(
        (course) =>
          course.curriculum_id === englishMathCourse.curriculum_id &&
          course.grade_id === englishMathCourse.grade_id,
      ) ?? data?.[0];

    return matchingCourse ?? englishMathCourse;
  }
  async getCourses(ids: string[]): Promise<TableTypes<'course'>[]> {
    if (!this.supabase || !ids || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from('course')
      .select('*')
      .in('id', ids) // fetch all courses in one go
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching courses:', error);
      return [];
    }

    return data ?? [];
  }
}
