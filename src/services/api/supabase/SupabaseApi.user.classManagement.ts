import { v4 as uuidv4 } from 'uuid';
import { TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { JoinClassInviteLookupResult } from '../ServiceApi';
import { SupabaseApiUserSchoolRoles } from './SupabaseApi.user.schoolRoles';
export interface SupabaseApiUserClassManagement {
  [key: string]: any;
}
export class SupabaseApiUserClassManagement extends SupabaseApiUserSchoolRoles {
  parseClassName(className: string): { grade: number; section: string } {
    const cleanedName = className.trim();
    if (!cleanedName) {
      return { grade: 0, section: '' };
    }

    let grade = 0;
    let section = '';

    const numericMatch = cleanedName.match(/^(\d+)$/);
    if (numericMatch) {
      grade = parseInt(numericMatch[1], 10);
      return { grade: isNaN(grade) ? 0 : grade, section: '' };
    }

    const alphanumericMatch = cleanedName.match(/(\d+)\s*(\w+)/i);
    if (alphanumericMatch) {
      grade = parseInt(alphanumericMatch[1], 10);
      section = alphanumericMatch[2];
      return { grade: isNaN(grade) ? 0 : grade, section };
    }

    logger.warn(
      `Could not parse grade from class name: "${cleanedName}". Assigning grade 0.`,
    );
    return { grade: 0, section: cleanedName };
  }

  async getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]> {
    if (!this.supabase) return [];

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('user_id')
      .eq('class_id', classId)
      .eq('role', RoleType.STUDENT)
      .eq('is_deleted', false);

    if (classUserError) {
      logger.error('Error fetching class users:', classUserError);
    }

    if (classUsers && classUsers.length > 0) {
      const studentIds = classUsers.map((cu) => cu.user_id);
      const { data: students, error: studentError } = await this.supabase
        .from(TABLES.User)
        .select('*')
        .in('id', studentIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (studentError) {
        logger.error('Error fetching students:', studentError);
      }

      return students || [];
    }
    return [];
  }
  async subscribeToClassTopic(): Promise<void> {
    var students: TableTypes<'user'>[] = await this.getParentStudentProfiles();
    for (const student of students) {
      const linkedData = await this.getStudentClassesAndSchools(student.id);
      if (
        !!linkedData &&
        !!linkedData.classes &&
        linkedData.classes.length > 0
      ) {
        Util.subscribeToClassTopic(
          linkedData.classes[0].id,
          linkedData.schools[0].id,
        );
      }
    }
  }
  async getDataByInviteCode(inviteCode: number): Promise<any> {
    try {
      const rpcRes = await this.supabase?.rpc('getDataByInviteCode', {
        invite_code: inviteCode,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? '';
      }
      const data = rpcRes.data;
      return data;
    } catch (e) {
      throw new Error('Invalid inviteCode');
    }
  }

  async getDataByInviteCodeNew(
    inviteCode: number,
  ): Promise<JoinClassInviteLookupResult> {
    try {
      logger.warn('Join class lookup RPC started', {
        file_name: 'SupabaseApi.ts',
        function_name: 'getDataByInviteCodeNew',
        inviteCode,
      });
      const rpcRes = await this.supabase?.rpc('getDataByInviteCodeNew', {
        invite_code: inviteCode,
      });

      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        logger.warn('Join class lookup RPC returned empty/error response', {
          file_name: 'SupabaseApi.ts',
          function_name: 'getDataByInviteCodeNew',
          inviteCode,
          rpcError: rpcRes?.error ?? null,
          hasData: !!rpcRes?.data,
        });
        throw rpcRes?.error ?? '';
      }

      const { inviteData, classData, schoolData } =
        rpcRes.data as JoinClassInviteLookupResult;

      if (!classData) {
        throw new Error('Class data could not be fetched.');
      }

      if (!schoolData) {
        throw new Error('School data could not be fetched.');
      }

      logger.warn('Join class lookup RPC succeeded', {
        file_name: 'SupabaseApi.ts',
        function_name: 'getDataByInviteCodeNew',
        inviteCode,
        classId: inviteData?.class_id,
        schoolId: inviteData?.school_id,
        className: inviteData?.class_name,
        schoolName: inviteData?.school_name,
      });

      return {
        inviteData,
        classData,
        schoolData,
      };
    } catch (error) {
      logger.warn('Join class lookup RPC failed', {
        file_name: 'SupabaseApi.ts',
        function_name: 'getDataByInviteCodeNew',
        inviteCode,
        rawError: error,
      });
      logger.error('Error in getDataByInviteCodeNew', error);
      throw new Error('Invalid inviteCode');
    }
  }

  async storeJoinClassLookupDataLocally(
    classData: TableTypes<'class'>,
    schoolData: TableTypes<'school'>,
  ): Promise<void> {
    return;
  }

  async createClass(
    schoolId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
    gradeId?: string,
    standard?: string,
  ): Promise<TableTypes<'class'>> {
    if (!this.supabase) throw new Error('Supabase instance is not initialized');

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');

    const classId = uuidv4();
    const timestamp = new Date().toISOString();

    const newClass: TableTypes<'class'> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      grade_id: gradeId ?? null,
      group_id: groupId ?? null,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
      standard: standard ?? null,
      status: null,
      whatsapp_invite_link: whatsapp_invite_link ?? null,
      migrated_count: 0,
    };

    const { error } = await this.supabase.from('class').insert(newClass);
    if (error) {
      logger.error('Error inserting class:', error);
      throw error;
    }
    return newClass;
  }
  async deleteClass(classId: string) {
    if (!this.supabase) return;

    try {
      // Soft-delete class_user (only teachers)
      const { error: classUserUpdateError } = await this.supabase
        .from('class_user')
        .update({ is_deleted: true })
        .eq('class_id', classId)
        .eq('role', RoleType.TEACHER);

      if (classUserUpdateError) {
        logger.error('Error updating class_user:', classUserUpdateError);
        throw classUserUpdateError;
      }

      // Get affected class_user IDs (teachers)
      const { data: deletedClassUsers, error: classUserFetchError } =
        await this.supabase
          .from('class_user')
          .select('id')
          .eq('class_id', classId)
          .eq('role', RoleType.TEACHER)
          .eq('is_deleted', true);

      if (classUserFetchError) {
        logger.error(
          'Error fetching updated class_user records:',
          classUserFetchError,
        );
        throw classUserFetchError;
      }

      if (!deletedClassUsers || deletedClassUsers.length === 0) {
      }

      // Soft-delete class_course for this class
      const { error: classCourseUpdateError } = await this.supabase
        .from('class_course')
        .update({ is_deleted: true })
        .eq('class_id', classId);

      if (classCourseUpdateError) {
        logger.error('Error updating class_course:', classCourseUpdateError);
        throw classCourseUpdateError;
      }

      // Get affected class_course IDs
      const { data: deletedClassCourses, error: classCourseFetchError } =
        await this.supabase
          .from('class_course')
          .select('id')
          .eq('class_id', classId)
          .eq('is_deleted', true);

      if (classCourseFetchError) {
        logger.error(
          'Error fetching updated class_course records:',
          classCourseFetchError,
        );
        throw classCourseFetchError;
      }

      if (!deletedClassCourses || deletedClassCourses.length === 0) {
      }

      // Soft-delete the class itself
      const { error: classUpdateError } = await this.supabase
        .from('class')
        .update({ is_deleted: true })
        .eq('id', classId)
        .eq('is_deleted', false);

      if (classUpdateError) {
        logger.error('Error soft-deleting class:', classUpdateError);
        throw classUpdateError;
      }
    } catch (error) {
      logger.error('Failed to delete class:', error);
      throw error;
    }
  }
  async updateClass(
    classId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
  ) {
    if (!this.supabase) return;

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');

    const updateData: any = {
      name: className,
      updated_at: new Date().toISOString(),
    };
    if (groupId !== undefined) updateData.group_id = groupId;
    if (whatsapp_invite_link !== undefined)
      updateData.whatsapp_invite_link = whatsapp_invite_link;

    const { error } = await this.supabase
      .from('class')
      .update(updateData)
      .eq('id', classId);

    if (error) {
      logger.error('Error updating class name:', error);
      throw error;
    }
  }
  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    try {
      if (!studentId) {
        throw Error('Student Not Found');
      }
      logger.warn('Join class link RPC started', {
        file_name: 'SupabaseApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
      });
      const rpcRes = await this.supabase?.rpc('new_link_student', {
        invite_code: inviteCode,
        student_id: studentId,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        const error = rpcRes?.error;
        logger.warn('Join class link RPC returned empty/error response', {
          file_name: 'SupabaseApi.ts',
          function_name: 'linkStudent',
          inviteCode,
          studentId,
          rpcError: error ?? null,
          hasData: !!rpcRes?.data,
        });
        if (error) {
          if (error.code === '23503') {
            logger.warn('Join class link RPC detected missing backend user', {
              file_name: 'SupabaseApi.ts',
              function_name: 'linkStudent',
              inviteCode,
              studentId,
              errorCode: error.code,
              errorMessage: error.message,
              errorDetails: error.details,
              errorHint: error.hint,
            });
          }
          const normalizedMessage = [error.details, error.message, error.hint]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .find(Boolean);

          if (normalizedMessage) {
            throw new Error(normalizedMessage);
          }
        }

        throw new Error('Failed to join class.');
      }
      const data = rpcRes.data;
      logger.warn('Join class link RPC succeeded', {
        file_name: 'SupabaseApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        responseType: Array.isArray(data) ? 'array' : typeof data,
        responseCount: Array.isArray(data) ? data.length : undefined,
      });
      return data;
    } catch (e) {
      logger.warn('Join class link RPC failed', {
        file_name: 'SupabaseApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        rawError: e,
      });
      if (e instanceof Error) {
        throw e;
      }
      throw new Error('Failed to join class.');
    }
  }
}
