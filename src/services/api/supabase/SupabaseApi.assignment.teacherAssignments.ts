import { v4 as uuidv4 } from 'uuid';
import { TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import { SupabaseApiAssignmentRecommendations } from './SupabaseApi.assignment.recommendations';

export interface SupabaseApiAssignmentTeacherAssignments {
  [key: string]: any;
}
export class SupabaseApiAssignmentTeacherAssignments extends SupabaseApiAssignmentRecommendations {
  async createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string,
  ): Promise<void> {
    if (!this.supabase) return;

    const assignmentId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      // Insert into assignment table
      const { error: assignmentError } = await this.supabase
        .from('assignment')
        .insert([
          {
            id: assignmentId,
            created_by: userId,
            starts_at,
            ends_at,
            is_class_wise,
            class_id,
            school_id,
            lesson_id,
            chapter_id,
            course_id,
            type,
            source: source ?? null,
            batch_id: batch_id ?? null,
            created_at: created_at ?? timestamp,
            updated_at: timestamp,
            is_deleted: false,
          },
        ]);

      if (assignmentError) {
        logger.error('Error inserting assignment:', assignmentError.message);
      }

      // If not class-wise, insert into assignment_user
      if (!is_class_wise && student_list.length > 0) {
        const assignmentUserEntries = student_list.map((studentId) => ({
          id: uuidv4(),
          assignment_id: assignmentId,
          user_id: studentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
        }));

        const { error: userError } = await this.supabase
          .from('assignment_user')
          .insert(assignmentUserEntries);

        if (userError) {
          logger.error(
            'Error inserting assignment_user records:',
            userError.message,
          );
        }
      }
    } catch (error) {
      logger.error('Unexpected error in createAssignment:', error);
    }
  }

  async getTeachersForClass(
    classId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    if (!this.supabase) return;

    //  Get all user_ids of teachers for the class
    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('user_id')
      .eq('class_id', classId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false);

    if (classUserError) {
      logger.error('Error fetching class users:', classUserError);
      return [];
    }

    const userIds = classUsers?.map((cu) => cu.user_id) ?? [];
    if (userIds.length === 0) return [];

    //  Get user details for those user_ids
    const { data: users, error: userError } = await this.supabase
      .from(TABLES.User)
      .select('*')
      .in('id', userIds)
      .eq('is_deleted', false);

    if (userError) {
      logger.error('Error fetching users:', userError);
      return [];
    }

    return users ?? [];
  }
  async getUserByEmail(email: string): Promise<TableTypes<'user'> | undefined> {
    try {
      const results = await this?.supabase?.rpc('get_user_by_email', {
        p_email: email,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? '';
      }
      const data = results.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getUserByPhoneNumber(
    phone: string,
  ): Promise<TableTypes<'user'> | undefined> {
    try {
      const results = await this?.supabase?.rpc('get_user_by_phonenumber', {
        p_phone: phone,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? '';
      }
      const data = results.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<'user'>,
  ): Promise<void> {
    if (!this.supabase) return;
    const { data: principalRows, error: principalError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('id')
      .eq('school_id', schoolId)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .in('role', [RoleType.PRINCIPAL, 'principal'])
      .limit(1);

    if (principalError) {
      logger.error(
        'Error checking principal role in school_user:',
        principalError,
      );
      throw principalError;
    }

    if (principalRows && principalRows.length > 0) {
      throw new Error(
        'This user is already Principal in this school and cannot be added as Teacher for the same school.',
      );
    }

    const classUserId = uuidv4();
    const now = new Date().toISOString();

    const classUser = {
      id: classUserId,
      class_id: classId,
      user_id: user.id,
      role: RoleType.TEACHER as Database['public']['Enums']['role'],
      created_at: now,
      updated_at: now,
      is_deleted: false,
    };

    // Insert into class_user table

    const { error: insertError } = await this.supabase
      .from(TABLES.ClassUser)
      .insert(classUser);

    if (insertError) {
      logger.error('Error inserting class_user:', insertError);
      throw insertError;
    }

    // Fetch user doc from your server API
    // const user_doc = await this.getUserByDocId(userId);
    const { error: schoolUpdateError } = await this.supabase
      .from(TABLES.School)
      .update({ updated_at: now })
      .eq('id', schoolId)
      .eq('is_deleted', false);

    // 🔹 Update 'school_course' table
    const { error: schoolCourseUpdateError } = await this.supabase
      .from(TABLES.SchoolCourse)
      .update({ updated_at: now })
      .eq('school_id', schoolId)
      .eq('is_deleted', false);
    // Insert into user table with upsert logic (on conflict do nothing)

    const { error: classUpdateError } = await this.supabase
      .from(TABLES.Class)
      .update({ updated_at: now })
      .eq('id', classId)
      .eq('is_deleted', false);

    // 🔹 Update 'school_course' table
    const { error: classCourseUpdateError } = await this.supabase
      .from(TABLES.ClassCourse)
      .update({ updated_at: now })
      .eq('class_id', classId)
      .eq('is_deleted', false);
    if (user) {
      const { error: userInsertError } = await this.supabase
        .from(TABLES.User)
        .upsert(
          {
            id: user.id,
            name: user.name,
            age: user.age,
            gender: user.gender,
            avatar: user.avatar,
            image: user.image,
            curriculum_id: user.curriculum_id,
            language_id: user.language_id,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
          { ignoreDuplicates: true },
        );

      if (userInsertError) {
        logger.error('Error inserting user:', userInsertError);
        throw userInsertError;
      }
    }
  }
  async checkUserExistInSchool(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    //  Check if user is in school_user but NOT as a parent and not deleted
    const { data: schoolUsers, error: schoolUserError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('*')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false);

    if (schoolUserError) {
      logger.error('Error querying school_user:', schoolUserError);
      return false;
    }
    if (schoolUsers && schoolUsers.length > 0) return true;

    //  Get all classes for this school
    const { data: classes, error: classError } = await this.supabase
      .from(TABLES.Class)
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (classError) {
      logger.error('Error querying class:', classError);
      return false;
    }
    if (!classes || classes.length === 0) return false;

    const classIds = classes.map((c) => c.id);
    if (classIds.length === 0) return false;

    //  Check if user is teacher in any of these classes
    const { data: teachers, error: teacherError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('*')
      .in('class_id', classIds)
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false);

    if (teacherError) {
      logger.error('Error querying class_user:', teacherError);
      return false;
    }

    return teachers && teachers.length > 0;
  }
  async checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;
    //  Check if user is in school_user but NOT as a parent and not deleted
    const { data: schoolUsers, error: schoolUserError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('*')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false);

    if (schoolUserError) {
      logger.error('Error querying school_user:', schoolUserError);
      return false;
    }
    if (schoolUsers && schoolUsers.length > 0) return true;

    //  Check if user is teacher in this classe
    const { data, error } = await this.supabase
      .from('class_user')
      .select('id')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false)
      .maybeSingle(); // Returns null if no match

    if (error) {
      logger.error('Error checking user in class:', error);
      return false;
    }

    return !!data; // true if found, false if not
  }

  async checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    const roles = [
      RoleType.PROGRAM_MANAGER,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.FIELD_COORDINATOR,
    ];

    const { data, error } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('*')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .in('role', roles)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error querying school_user:', error);
      return false;
    }

    return !!(data && data.length > 0);
  }
  async getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    classWiseAssignments: TableTypes<'assignment'>[];
    individualAssignments: TableTypes<'assignment'>[];
  }> {
    if (!this.supabase) {
      return { classWiseAssignments: [], individualAssignments: [] };
    }

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('*')
      .eq('created_by', userId)
      .or(`class_id.eq.${classId},is_class_wise.eq.true`)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('is_deleted', false)
      .order('is_class_wise', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching assignments:', error);
      return { classWiseAssignments: [], individualAssignments: [] };
    }

    const assignments = data ?? [];

    const classWiseAssignments = assignments.filter((a) => a.is_class_wise);
    const individualAssignments = assignments.filter((a) => !a.is_class_wise);

    return { classWiseAssignments, individualAssignments };
  }
}
