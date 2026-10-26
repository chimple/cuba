import {
  RequestTypes,
  STATUS,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiProgramRequests } from './SupabaseApi.program.requests';

export interface SupabaseApiProgramRequestReview {
  [key: string]: any;
}
export class SupabaseApiProgramRequestReview extends SupabaseApiProgramRequests {
  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    if (!this.supabase) return { data: [], total: 0 };
    // Empty program class scopes should return an empty search result.
    if (classIds && classIds.length === 0) return { data: [], total: 0 };
    try {
      // Step 1: Get all class ids for the school.
      let classQuery = this.supabase
        .from(TABLES.Class)
        .select('id, name')
        .eq('school_id', schoolId)
        .eq('is_deleted', false);

      if (classIds && classIds.length > 0) {
        // Applies program class scope before searching teacher memberships.
        classQuery = classQuery.in('id', classIds);
      }

      const { data: classData, error: classError } = await classQuery;
      if (classError || !classData) {
        logger.error('Error fetching classes for school:', classError);
        return { data: [], total: 0 };
      }
      const schoolClassIds = classData.map((row) => row.id);
      if (schoolClassIds.length === 0) return { data: [], total: 0 };

      const classNameById = new Map<string, string>(
        classData.map((row) => [
          String(row?.id ?? '').trim(),
          String(row?.name ?? '').trim(),
        ]),
      );

      // Step 2: Get class_user links for teacher membership in this school.
      const { data: classUserLinks, error: classUserError } =
        await this.supabase
          .from(TABLES.ClassUser)
          .select('class_id, user_id')
          .in('class_id', schoolClassIds)
          .eq('role', 'teacher')
          .eq('is_deleted', false);
      if (classUserError || !classUserLinks) {
        logger.error('Error fetching class_user rows:', classUserError);
        return { data: [], total: 0 };
      }

      // Keep one stable class per teacher (alphabetically by class name).
      const primaryClassByTeacher = new Map<string, string>();
      for (const row of classUserLinks) {
        const teacherId = String(row?.user_id ?? '').trim();
        const nextClassId = String(row?.class_id ?? '').trim();
        if (!teacherId || !nextClassId) continue;

        const existingClassId = primaryClassByTeacher.get(teacherId);
        if (!existingClassId) {
          primaryClassByTeacher.set(teacherId, nextClassId);
          continue;
        }

        const existingClassName =
          classNameById.get(existingClassId) || existingClassId;
        const nextClassName = classNameById.get(nextClassId) || nextClassId;
        if (
          nextClassName.localeCompare(existingClassName, undefined, {
            sensitivity: 'base',
          }) < 0
        ) {
          primaryClassByTeacher.set(teacherId, nextClassId);
        }
      }

      const allTeacherIds = Array.from(primaryClassByTeacher.keys());
      if (allTeacherIds.length === 0) return { data: [], total: 0 };

      // Step 3: Load teacher users and apply name search on user table.
      const { data: matchedTeachers, error: teacherUsersError } =
        await this.supabase
          .from(TABLES.User)
          .select('id, name, gender, email, phone')
          .in('id', allTeacherIds)
          .eq('is_deleted', false)
          .ilike('name', `%${searchTerm}%`);
      if (teacherUsersError) {
        logger.error(
          'Error fetching teacher users for search:',
          teacherUsersError,
        );
        return { data: [], total: 0 };
      }

      const sortedTeachers = (matchedTeachers || [])
        .map((teacher) => ({
          id: String(teacher?.id ?? '').trim(),
          name: String(teacher?.name ?? '').trim(),
          gender: teacher?.gender ?? null,
          email: teacher?.email ?? null,
          phone: teacher?.phone ?? null,
        }))
        .filter((teacher) => teacher.id.length > 0)
        .sort(
          (a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
            a.id.localeCompare(b.id),
        );

      const total = sortedTeachers.length;
      const offset = (page - 1) * limit;
      const pagedTeachers = sortedTeachers.slice(offset, offset + limit);
      const teacherIds = pagedTeachers.map((teacher) => teacher.id);

      // Step 4: Get parent info for paged teachers.
      let parentInfoMap: Record<
        string,
        {
          parent_id: string;
          parent_name: string | null;
          parent_phone: string | null;
        }
      > = {};
      if (teacherIds.length > 0) {
        const { data: parentUserData, error: parentUserError } =
          await this.supabase
            .from(TABLES.ParentUser)
            .select('parent_id, student_id')
            .in('student_id', teacherIds)
            .eq('is_deleted', false);
        if (!parentUserError && parentUserData && parentUserData.length > 0) {
          const parentIds = parentUserData.map((row: any) => row.parent_id);
          let parentDetailsMap: Record<
            string,
            { name: string | null; phone: string | null }
          > = {};
          if (parentIds.length > 0) {
            const { data: parentDetails, error: parentDetailsError } =
              await this.supabase
                .from(TABLES.User)
                .select('id, name, phone')
                .in('id', parentIds)
                .eq('is_deleted', false);
            if (
              !parentDetailsError &&
              parentDetails &&
              parentDetails.length > 0
            ) {
              for (const parent of parentDetails) {
                parentDetailsMap[parent.id] = {
                  name: parent.name ?? null,
                  phone: parent.phone ?? null,
                };
              }
            }
          }
          for (const row of parentUserData) {
            parentInfoMap[row.student_id] = {
              parent_id: row.parent_id,
              parent_name: parentDetailsMap[row.parent_id]?.name ?? null,
              parent_phone: parentDetailsMap[row.parent_id]?.phone ?? null,
            };
          }
        }
      }

      // Step 5: Build result objects (with parent info).
      const result = pagedTeachers.map((teacherUser) => {
        const teacherId = teacherUser.id;
        const classId = primaryClassByTeacher.get(teacherId) ?? '';
        const className = classNameById.get(classId) ?? '';
        const { grade, section } = this.parseClassName(className);
        const parentInfo = parentInfoMap[teacherId] ?? null;
        return {
          id: teacherId,
          name: teacherUser.name,
          gender: teacherUser.gender ?? null,
          email: teacherUser.email,
          phone: teacherUser.phone,
          class_id: classId,
          class_name: className,
          grade,
          classSection: section,
          parent: parentInfo,
        };
      });
      return { data: result, total };
    } catch (err) {
      logger.error('Error searching teachers in school:', err);
      return { data: [], total: 0 };
    }
  }
  async approveOpsRequest(
    requestId: string, //request row Id
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    if (!this.supabase) return undefined;

    const normalizedRole = (role ?? '').toString().toLowerCase();
    const resolvedRole =
      normalizedRole === RequestTypes.PRINCIPAL && classId
        ? RequestTypes.TEACHER
        : normalizedRole;

    // Build update payload dynamically
    const updatePayload: any = {
      request_status: 'approved',
      responded_by: respondedBy,
      request_type: resolvedRole,
      updated_at: new Date().toISOString(),
    };

    if (schoolId) {
      updatePayload.school_id = schoolId;
    }

    if (classId) {
      updatePayload.class_id = classId;
    } else if (resolvedRole === RequestTypes.PRINCIPAL) {
      updatePayload.class_id = null;
    }
    const { data, error } = await this.supabase
      .from('ops_requests')
      .update(updatePayload)
      .or(`id.eq.${requestId},request_id.eq.${requestId}`)
      .eq('is_deleted', false)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('Error approving ops_request:', error);
      return undefined;
    }

    return data as TableTypes<'ops_requests'>;
  }
  async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    if (!this.supabase) return undefined;

    const updatePayload: any = {
      request_status: status,
      responded_by: respondedBy,
      updated_at: new Date().toISOString(),
    };
    if (rejectedReasonType) {
      updatePayload.rejected_reason_type = rejectedReasonType;
    }
    if (rejectedReasonDescription) {
      updatePayload.rejected_reason_description = rejectedReasonDescription;
    }

    const { data, error } = await this.supabase
      .from('ops_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .eq('is_deleted', false)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('Error responding to school_request:', error);
      return undefined;
    }

    return data as TableTypes<'ops_requests'>;
  }
}
