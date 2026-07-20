import { v4 as uuidv4 } from 'uuid';
import {
  CoordinatorAPIResponse,
  CoordinatorInfo,
  PrincipalAPIResponse,
  PrincipalInfo,
  STARS_COUNT,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Database } from '../../database';

import { SupabaseApiAssignment } from './SupabaseApi.assignment';
export interface SupabaseApiOps {
  [key: string]: any;
}
export class SupabaseApiOps extends SupabaseApiAssignment {
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
  async updateSchoolLastModified(schoolId: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();

    const { error } = await this.supabase
      .from('school')
      .update({ updated_at: updatedAt })
      .eq('id', schoolId);

    if (error) {
      logger.error("Error updating school's updated_at:", error);
    }
  }
  async updateClassLastModified(classId: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();

    const { error } = await this.supabase
      .from('class')
      .update({ updated_at: updatedAt })
      .eq('id', classId);

    if (error) {
      logger.error("Error updating class's updated_at:", error);
    }
  }
  async updateUserLastModified(userId: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();

    const { error } = await this.supabase
      .from('user')
      .update({ updated_at: updatedAt })
      .eq('id', userId);

    if (error) {
      logger.error("Error updating user's updated_at:", error);
    }
  }

  async validateSchoolData(
    schoolId: string,
    schoolName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }
    try {
      const { data, error } = await this.supabase.rpc(
        'validate_school_data_rpc',
        {
          input_school_id: schoolId,
          input_school_name: schoolName,
        },
      );
      if (error || !data) {
        throw error ?? new Error('Unknown error from RPC');
      }

      return data as { status: string; errors?: string[] };
    } catch (error) {
      return {
        status: 'error',
        errors: [String(error)],
      };
    }
  }
  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'check_parent_and_student_in_class',
        {
          phone_number: phoneNumber,
          student_name: studentName,
          class_name: className,
          input_school_udise_code: schoolId,
        },
      );
      // Narrow the type from Json to expected shape
      if (
        typeof data === 'object' &&
        data !== null &&
        'status' in data &&
        typeof (data as any).status === 'string'
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: 'error',
        errors: ['Unexpected response format from Supabase function'],
      };
    } catch (error) {
      return {
        status: 'error',
        errors: [String(error)],
      };
    }
  }
  async validateProgramName(
    programName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc('validate_program_name', {
        input_program_name: programName,
      });
      // Narrow the type from Json to expected shape
      if (
        typeof data === 'object' &&
        data !== null &&
        'status' in data &&
        typeof (data as any).status === 'string'
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: 'error',
        errors: ['Unexpected response format from Supabase function 1111'],
      };
    } catch (error) {
      return {
        status: 'error',
        errors: [String(error)],
      };
    }
  }

  async validateSchoolUdiseCode(
    schoolId: string,
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'validate_school_udise_code',
        {
          input_school_udise_code: schoolId,
        },
      );
      // Narrow the type from Json to expected shape
      if (
        typeof data === 'object' &&
        data !== null &&
        'status' in data &&
        typeof (data as any).status === 'string'
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: 'error',
        errors: ['Unexpected response format from Supabase function'],
      };
    } catch (error) {
      return {
        status: 'error',
        errors: [String(error)],
      };
    }
  }
  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string,
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'check_class_exists_by_name_and_school',
        {
          class_name: className,
          input_school_udise_code: schoolId,
        },
      );
      // Narrow the type from Json to expected shape
      if (
        typeof data === 'object' &&
        data !== null &&
        'status' in data &&
        typeof (data as any).status === 'string'
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: 'error',
        errors: ['Unexpected response format from Supabase function'],
      };
    } catch (error) {
      return {
        status: 'error',
        errors: [String(error)],
      };
    }
  }
  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'check_student_duplicate_in_class_without_phone_number',
        {
          student_name: studentName,
          class_name: className,
          input_school_udise_code: schoolId,
        },
      );

      // Narrow the type from Json to expected shape
      if (
        typeof data === 'object' &&
        data !== null &&
        'status' in data &&
        typeof (data as any).status === 'string'
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: 'error',
        errors: ['Unexpected response format from Supabase function'],
      };
    } catch (error) {
      return {
        status: 'error',
        errors: [String(error)],
      };
    }
  }

  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string, // new parameter
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }
    // Step 1: Fetch curriculum ID
    const { data: curriculumData, error: curriculumError } = await this.supabase
      .from('curriculum')
      .select('id')
      .eq('name', curriculumName)
      .single();

    if (curriculumError || !curriculumData) {
      return {
        status: 'error',
        errors: ['Invalid curriculum name'],
      };
    }
    const curriculumId = curriculumData.id;

    // Step 2: Fetch grade ID
    const { data: gradeData, error: gradeError } = await this.supabase
      .from('grade')
      .select('id')
      .eq('name', gradeName)
      .single();
    if (gradeError || !gradeData) {
      return {
        status: 'error',
        errors: ['Invalid grade name'],
      };
    }

    const gradeId = gradeData.id;

    // Step 3: Check if course exists with curriculum ID, grade ID, and subject name
    const { data: courseData, error: courseError } = await this.supabase
      .from('course')
      .select('id')
      .eq('curriculum_id', curriculumId)
      .eq('grade_id', gradeId)
      .eq('name', subjectName.trim())
      .eq('is_deleted', false);
    if (courseError || !courseData || courseData.length === 0) {
      return {
        status: 'error',
        errors: [
          `Subject '${subjectName}' not found for grade '${gradeName}' in the '${curriculumName}' curriculum.`,
        ],
      };
    }
    return { status: 'success' };
  }

  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string,
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'validate_user_contacts_rpc',
        {
          program_manager_contact: programManagerPhone.trim(),
          field_coordinator_contact: fieldCoordinatorPhone?.trim(),
        },
      );
      if (error || !data) {
        return {
          status: 'error',
          errors: [
            'programManagerPhone and fieldCoordinatorPhone Validation failed',
          ],
        };
      }
      if (
        error ||
        !data ||
        typeof data !== 'object' ||
        data === null ||
        !('status' in data) ||
        typeof (data as any).status !== 'string'
      ) {
        return {
          status: 'error',
          errors: ['Invalid response from validation RPC'],
        };
      }

      return data as { status: string; errors?: string[] };
    } catch (err) {
      return {
        status: 'error',
        errors: [String(err)],
      };
    }
  }

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
