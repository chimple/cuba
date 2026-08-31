import logger from '../../../utility/logger';
import { SupabaseApiOpsSchoolUsers } from './SupabaseApi.ops.schoolUsers';

export interface SupabaseApiOpsValidation {
  [key: string]: any;
}
export class SupabaseApiOpsValidation extends SupabaseApiOpsSchoolUsers {
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
}
