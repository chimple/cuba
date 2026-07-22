import { TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SupabaseApiSchool } from './SupabaseApi.school';

export interface SupabaseApiOpsClassOperations {
  [key: string]: any;
}
export class SupabaseApiOpsClassOperations extends SupabaseApiSchool {
  async getLessonsBylessonIds(
    lessonIds: string[], // Expect an array of strings
  ): Promise<TableTypes<'lesson'>[] | undefined> {
    if (!this.supabase || !lessonIds || lessonIds.length === 0) return;

    const { data, error } = await this.supabase
      .from(TABLES.Lesson)
      .select('*')
      .in('id', lessonIds)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching lessons by IDs:', error);
      return;
    }

    return data?.length ? data : undefined;
  }
  async deleteTeacher(classId: string, teacherId: string) {
    if (!this.supabase) return;

    try {
      const updatedAt = new Date().toISOString();
      // Step 1: Fetch class_user entry
      const { data: existingEntries, error: fetchError } = await this.supabase
        .from(TABLES.ClassUser)
        .select('*')
        .eq('user_id', teacherId)
        .eq('class_id', classId)
        .eq('role', RoleType.TEACHER)
        .eq('is_deleted', false);

      if (fetchError) {
        logger.error('Error fetching teacher entry:', fetchError);
        return;
      }

      if (!existingEntries || existingEntries.length === 0) {
        throw new Error('Teacher not found.');
      }

      const entryToUpdate = existingEntries[0];

      // Step 2: Soft delete the class_user record
      const { error: updateError } = await this.supabase
        .from(TABLES.ClassUser)
        .update({ is_deleted: true, updated_at: updatedAt })
        .eq('id', entryToUpdate.id);

      if (updateError) {
        logger.error('Error updating teacher record:', updateError);
        return;
      }

      await this.updateClassAndSchoolLastModified([classId]);

      // No pushChanges needed
    } catch (error) {
      logger.error('SupabaseApi ~ deleteTeacher ~ error:', error);
    }
  }

  async updateClassAndSchoolLastModified(
    classIds: string[],
    schoolId?: string,
  ): Promise<void> {
    if (!this.supabase) return;

    const uniqueClassIds = Array.from(
      new Set(classIds.map((classId) => classId.trim()).filter(Boolean)),
    );
    if (uniqueClassIds.length === 0) return;

    await Promise.all(
      uniqueClassIds.map(async (classId) => {
        await this.updateClassLastModified(classId);
      }),
    );

    if (schoolId && schoolId.trim().length > 0) {
      await this.updateSchoolLastModified(schoolId);
      return;
    }

    const { data: classRows, error: classFetchError } = await this.supabase
      .from(TABLES.Class)
      .select('school_id')
      .in('id', uniqueClassIds)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (classFetchError) {
      logger.error(
        'Error fetching class rows for school updated_at sync:',
        classFetchError,
      );
      return;
    }

    const resolvedSchoolId = classRows?.[0]?.school_id;
    if (resolvedSchoolId) {
      await this.updateSchoolLastModified(resolvedSchoolId);
    }
  }

  async getClassCodeById(class_id: string): Promise<number | undefined> {
    if (!this.supabase || !class_id) return;

    try {
      const currentDate = new Date().toISOString();

      const { data, error } = await this.supabase
        .from(TABLES.ClassInvite_code)
        .select('code')
        .eq('class_id', class_id)
        .eq('is_deleted', false)
        .gte('expires_at', currentDate)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Supabase error in getClassCodeById:', error);
        return;
      }

      return data?.code;
    } catch (err) {
      logger.error('Error in getClassCodeById:', err);
      return;
    }
  }

  async getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from(TABLES.Result)
        .select('*')
        .eq('chapter_id', chapter_id)
        .eq('course_id', course_id)
        .eq('class_id', classId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Supabase error in getResultByChapterByDate:', error);
        return;
      }

      return data?.length ? data : undefined;
    } catch (err) {
      logger.error('Error in getResultByChapterByDate:', err);
      return;
    }
  }

  async getUniqueAssignmentIdsByCourseAndChapter(
    classId: string,
    courseId: string,
    chapterIdOrIds: string | string[],
  ): Promise<string[]> {
    if (!this.supabase) return [];

    try {
      const chapterIds = Array.isArray(chapterIdOrIds)
        ? chapterIdOrIds.filter(Boolean)
        : [chapterIdOrIds].filter(Boolean);

      if (!chapterIds.length) return [];

      let query = this.supabase
        .from(TABLES.Assignment)
        .select('id')
        .eq('class_id', classId)
        .eq('course_id', courseId)
        .eq('is_deleted', false);

      query =
        chapterIds.length === 1
          ? query.eq('chapter_id', chapterIds[0])
          : query.in('chapter_id', chapterIds);

      const { data, error } = await query;

      if (error) {
        logger.error(
          'Supabase error in getUniqueAssignmentIdsByCourseAndChapter:',
          error,
        );
        return [];
      }

      return Array.from(
        new Set((data ?? []).map((row: any) => row.id).filter(Boolean)),
      ) as string[];
    } catch (err) {
      logger.error('Error in getUniqueAssignmentIdsByCourseAndChapter:', err);
      return [];
    }
  }

  async createClassCode(classId: string): Promise<number> {
    try {
      // Validate parameters
      if (!classId)
        throw new Error('Class ID is required to create a class code.');

      // Call the RPC function
      const classCode = await this?.supabase?.rpc(
        'generate_unique_class_code',
        {
          class_id_input: classId,
        },
      );
      if (!classCode?.data) {
        throw new Error(`A class code is not created`);
      }
      return classCode?.data;
    } catch (error) {
      throw error; // Re-throw the error for external handling
    }
  }
}
