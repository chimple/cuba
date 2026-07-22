import { v4 as uuidv4 } from 'uuid';
import { AVATARS, TABLES } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SupabaseApiProgramEnrollment } from './SupabaseApi.program.enrollment';

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

  async addStudentWithParentValidation(params: {
    phone?: string;
    name: string;
    gender: string;
    age: string;
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
    const timestamp = new Date().toISOString();
    const finalAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    try {
      let languageId;
      if (schoolId) {
        const { data: schoolData, error: schoolError } = await this.supabase
          .from(TABLES.School)
          .select('language')
          .eq('id', schoolId)
          .maybeSingle();

        if (schoolData?.language) {
          languageId = schoolData?.language;
        }
      }
      if (!languageId) {
        languageId = '7eaf3509-e44e-460f-80a1-7f6a13a8a883';
      }

      if (atSchool) {
        const childId = uuidv4();
        const { error: childCreateError } = await this.supabase
          .from(TABLES.User)
          .insert({
            id: childId,
            name: name,
            gender: gender,
            age: parseInt(age) || 0,
            language_id: languageId,
            avatar: finalAvatar,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
            student_id: studentID || null,
          });
        if (childCreateError) {
          logger.error(
            'Error creating at-school student user:',
            childCreateError,
          );
          return { success: false, message: 'Error creating student profile' };
        }
        const { error: studentClassError } = await this.supabase
          .from(TABLES.ClassUser)
          .insert({
            id: uuidv4(),
            class_id: classId,
            user_id: childId,
            role: RoleType.STUDENT,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
          });
        if (studentClassError) {
          logger.error(
            'Error adding at-school student to class:',
            studentClassError,
          );
          return { success: false, message: 'Error adding student to class' };
        }
        return {
          success: true,
          message: 'Student added successfully',
          data: { studentId: childId },
        };
      }

      const { data: userData, error: userError } =
        await this.supabase.functions.invoke('get_or_create_user', {
          body: {
            name: parentName || 'Parent',
            phone: phone,
            email: email,
          },
        });

      if (userError) {
        logger.error('Error creating/getting parent user:', userError);
        return {
          success: false,
          message: 'Error creating parent account',
        };
      }

      if (!userData || !userData.user) {
        logger.error('Invalid response from user-upsert:', userData);
        return { success: false, message: 'Invalid response from server' };
      }

      const parentId = userData.user.id;

      const { count, error: countError } = await this.supabase
        .from(TABLES.ParentUser)
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parentId)
        .eq('is_deleted', false);

      if (countError) {
        logger.error('Error counting children:', countError);
        return {
          success: false,
          message: 'Error checking existing profiles',
        };
      }

      if (count !== null && count >= 3) {
        return {
          success: false,
          message: 'This number already has 3 profiles.',
        };
      }

      const childId = uuidv4();
      const { error: childCreateError } = await this.supabase
        .from(TABLES.User)
        .insert({
          id: childId,
          name: name,
          gender: gender,
          age: parseInt(age) || 0,
          language_id: languageId,
          avatar: finalAvatar,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
          student_id: studentID || null,
        });

      if (childCreateError) {
        logger.error('Error creating child user:', childCreateError);
        return { success: false, message: 'Error creating student profile' };
      }

      const { error: parentUserError } = await this.supabase
        .from(TABLES.ParentUser)
        .insert({
          id: uuidv4(),
          parent_id: parentId,
          student_id: childId,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
        });

      if (parentUserError) {
        logger.error('Error linking child to parent:', parentUserError);
        return { success: false, message: 'Error linking student to parent' };
      }

      const { error: studentClassError } = await this.supabase
        .from(TABLES.ClassUser)
        .insert({
          id: uuidv4(),
          class_id: classId,
          user_id: childId,
          role: RoleType.STUDENT,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
        });

      if (studentClassError) {
        logger.error('Error adding student to class:', studentClassError);
        return { success: false, message: 'Error adding student to class' };
      }

      const { data: parentInClass, error: parentCheckError } =
        await this.supabase
          .from(TABLES.ClassUser)
          .select('id')
          .eq('class_id', classId)
          .eq('user_id', parentId)
          .eq('role', RoleType.PARENT)
          .eq('is_deleted', false)
          .maybeSingle();

      if (parentCheckError) {
        logger.error('Error checking parent in class:', parentCheckError);
      }

      if (!parentInClass) {
        const { error: parentClassError } = await this.supabase
          .from(TABLES.ClassUser)
          .insert({
            id: uuidv4(),
            class_id: classId,
            user_id: parentId,
            role: RoleType.PARENT,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
          });

        if (parentClassError) {
          logger.error('Error adding parent to class:', parentClassError);
        }
      }

      return {
        success: true,
        message: 'Student added successfully',
        data: {
          studentId: childId,
          parentId: parentId,
        },
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
