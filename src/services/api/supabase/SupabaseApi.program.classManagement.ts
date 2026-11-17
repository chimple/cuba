import { v4 as uuidv4 } from 'uuid';
import { AVATARS } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiProgramEnrollment } from './SupabaseApi.program.enrollment';
import type {
  OpsStudentProfileMatch,
  OpsStudentProfileSearchResult,
} from '../serviceapi/ServiceApi.fieldActivities';
import { normalizeIndianPhone10 } from '../../../ops-console/utils/phoneNormalization';

export interface SupabaseApiProgramClassManagement {
  [key: string]: any;
}
export class SupabaseApiProgramClassManagement extends SupabaseApiProgramEnrollment {
  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any,
  ): Promise<void> {
    if (!this.supabase) return;
    const insertPayload: any = {
      model: schoolModel,
      updated_at: new Date().toISOString(),
    };

    if (locationLink !== undefined && locationLink !== null) {
      insertPayload.location_link = locationLink;
    }

    if (keyContacts) {
      insertPayload.key_contacts = JSON.stringify(keyContacts);
    }

    const { error } = await this.supabase
      .from('school')
      .update(insertPayload)
      .eq('id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error inserting school details:', error);
    }
  }
  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    // Delete all existing course for this class
    const { error: deleteError } = await this.supabase
      .from('class_course')
      .update({ is_deleted: true, updated_at: now })
      .eq('class_id', classId)
      .eq('is_deleted', false);

    if (deleteError) {
      logger.error('Error removing old class_course entries:', deleteError);
      throw deleteError;
    }

    // Insert the new course
    if (selectedCourseIds.length > 0) {
      const newEntries = selectedCourseIds.map((courseId) => ({
        id: uuidv4(),
        class_id: classId,
        course_id: courseId,
        created_at: now,
        updated_at: now,
        is_deleted: false,
      }));

      const { error: insertError } = await this.supabase
        .from('class_course')
        .insert(newEntries);

      if (insertError) {
        logger.error('Error inserting new class_course entries:', insertError);
        throw insertError;
      }
    }
  }

  async searchStudentProfilesByContact(
    contact: string,
    classId: string,
  ): Promise<OpsStudentProfileSearchResult> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

    const { data, error } = await this.supabase.functions.invoke(
      'get_or_create_user',
      {
        body: { action: 'search_student_profiles', contact, class_id: classId },
      },
    );
    if (error) throw error;

    const profiles = (data?.profiles ?? []).map(
      (profile: {
        id: string;
        name: string | null;
        studentCode: string | null;
        isInSelectedClass: boolean;
      }) => profile,
    );
    return {
      profiles,
      profileCount:
        typeof data?.profile_count === 'number'
          ? data.profile_count
          : profiles.length,
    };
  }

  async hasDuplicateStudentProfile(
    name: string,
    phone: string,
    classId: string,
  ): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

    const { data, error } = await this.supabase.functions.invoke(
      'get_or_create_user',
      {
        body: {
          action: 'check_student_profile_duplicate',
          student_name: name.trim(),
          phone,
          class_id: classId,
        },
      },
    );
    if (error) throw error;
    return data?.duplicate === true;
  }

  async linkExistingStudentToClass(
    studentId: string,
    classId: string,
    contact: string,
  ): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

    const { data, error } = await this.supabase.functions.invoke(
      'get_or_create_user',
      {
        body: {
          action: 'link_existing_student_profile',
          student_id: studentId,
          class_id: classId,
          contact,
        },
      },
    );
    if (error) throw error;
    return data?.linked === true;
  }

  async addStudentWithParentValidation(params: {
    phone?: string;
    name: string;
    gender: string;
    age: string | null;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?: string;
    studentID?: string;
    atSchool?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase client is not initialized' };
    }

    const {
      phone,
      name,
      gender,
      age,
      classId,
      schoolId,
      parentName,
      email,
      studentID,
      atSchool,
    } = params;
    const normalizedName = name.trim();
    const normalizedPhone = phone
      ? (normalizeIndianPhone10(phone) ?? undefined)
      : undefined;
    const normalizedEmail = email?.trim().toLowerCase();
    if (phone && !normalizedPhone) {
      return { success: false, message: 'Phone number must be 10 digits.' };
    }
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (
      !normalizedName ||
      (!atSchool && !normalizedPhone && !normalizedEmail)
    ) {
      return {
        success: false,
        message: 'Name and phone number or email are required.',
      };
    }

    const parsedAge = age === null || age === '' ? NaN : Number(age);
    const normalizedAge = Number.isNaN(parsedAge) ? null : parsedAge;
    try {
      let parentId: string | null = null;
      if (normalizedPhone || normalizedEmail) {
        const { data: parentData, error: parentError } =
          await this.supabase.functions.invoke('get_or_create_user', {
            body: {
              name: parentName || 'Parent',
              phone: normalizedPhone,
              email: normalizedEmail,
              normalize_contact_lookup: true,
            },
          });
        if (parentError || !parentData?.user?.id) {
          logger.error('Error creating/getting parent user:', parentError);
          return { success: false, message: 'Error creating parent account' };
        }
        parentId = parentData.user.id;
      }

      const { data: createResult, error: createError } =
        await this.supabase.functions.invoke('get_or_create_user', {
          body: {
            action: 'create_student_profile',
            name: normalizedName,
            gender,
            age: normalizedAge,
            student_code: studentID || null,
            class_id: classId,
            school_id: schoolId || null,
            parent_id: parentId,
            phone: normalizedPhone ?? null,
            email: normalizedEmail ?? null,
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            at_school: Boolean(atSchool),
          },
        });

      if (createError) {
        logger.error('Error creating Ops student profile:', createError);
        return { success: false, message: 'Error creating student profile' };
      }

      if (!createResult?.success || !createResult.student_id) {
        return {
          success: false,
          message: createResult?.message || 'Error creating student profile',
        };
      }

      return {
        success: true,
        message: 'Student added successfully',
        data: { studentId: createResult.student_id, parentId },
      };
    } catch (error) {
      logger.error(
        'Unexpected error in addStudentWithParentValidation:',
        error,
      );
      return {
        success: false,
        message: 'An unexpected error occurred while adding the student',
      };
    }
  }
}
