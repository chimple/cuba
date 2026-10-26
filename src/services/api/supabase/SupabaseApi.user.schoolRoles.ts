import {
  TABLES,
  TeacherAPIResponse,
  TeacherInfo,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SupabaseApiUserPathwayMerge } from './SupabaseApi.user.pathwayMerge';

export interface SupabaseApiUserSchoolRoles {
  [key: string]: any;
}
export class SupabaseApiUserSchoolRoles extends SupabaseApiUserPathwayMerge {
  async getUserRoleForSchool(
    userId: string,
    schoolId: string,
  ): Promise<RoleType | undefined> {
    if (!this.supabase) return;

    // Program roles apply only to schools in the user's mapped program.
    // This prevents program permissions from leaking into unrelated schools.
    const getUserProgramRoleForSchool = async (
      fallbackRole?: RoleType,
    ): Promise<RoleType | undefined> => {
      const { data: school } = await this.supabase!.from(TABLES.School)
        .select('program_id')
        .eq('id', schoolId)
        .eq('is_deleted', false)
        .maybeSingle();

      if (!school?.program_id) return undefined;

      const { data: programUser } = await this.supabase!.from(
        TABLES.ProgramUser,
      )
        .select('role')
        .eq('user', userId)
        .eq('program_id', school.program_id)
        .eq('is_deleted', false)
        .in('role', [RoleType.PROGRAM_MANAGER, RoleType.FIELD_COORDINATOR])
        .limit(1)
        .maybeSingle();

      if (!programUser) return undefined;

      return (programUser.role as RoleType | null) ?? fallbackRole;
    };

    // Check special users
    const { data: specialUser } = await this.supabase
      .from(TABLES.SpecialUsers)
      .select('role')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (specialUser?.role) {
      const specialRole = specialUser.role as RoleType;
      if (
        specialRole === RoleType.SUPER_ADMIN ||
        specialRole === RoleType.OPERATIONAL_DIRECTOR ||
        specialRole === RoleType.EXTERNAL_USER
      ) {
        return specialRole;
      }

      if (
        specialRole === RoleType.PROGRAM_MANAGER ||
        specialRole === RoleType.FIELD_COORDINATOR
      ) {
        const programScopedRole =
          await getUserProgramRoleForSchool(specialRole);
        if (programScopedRole) return programScopedRole;
      } else {
        return specialRole;
      }
    }

    const programScopedRole = await getUserProgramRoleForSchool();
    if (programScopedRole) return programScopedRole;

    // Check school_user (not parent)
    const { data: schoolUser } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('role')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false)
      .single();
    if (schoolUser?.role) return schoolUser.role as RoleType;

    // Check class_user → teacher
    const { data: classUsers } = await this.supabase
      .from(TABLES.ClassUser)
      .select('class_id')
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false);
    if (classUsers?.length) {
      const classIds = classUsers.map((cu) => cu.class_id);
      const { data: classes } = await this.supabase
        .from(TABLES.Class)
        .select('id, school_id')
        .in('id', classIds)
        .eq('is_deleted', false);
      if (classes?.some((c) => c.school_id === schoolId)) {
        return RoleType.TEACHER;
      }
    }

    return undefined;
  }

  async getTeacherInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
    classIds?: string[],
  ): Promise<TeacherAPIResponse> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty page without querying.
    if (classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const offset = (safePage - 1) * safeLimit;

    const { data: schoolClasses, error: classFetchError } = await this.supabase
      .from(TABLES.Class)
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (classFetchError) {
      logger.error(
        'Error fetching classes for school teacher query:',
        classFetchError,
      );
      return { data: [], total: 0 };
    }

    const classMap = new Map<string, string>();
    (schoolClasses || []).forEach((schoolClass) => {
      const classId = String(schoolClass?.id || '').trim();
      if (!classId) return;
      classMap.set(classId, String(schoolClass?.name || '').trim());
    });
    const allowedClassIds =
      classIds && classIds.length > 0
        ? classIds
            .map((classId) => String(classId).trim())
            .filter((classId) => classMap.has(classId))
        : Array.from(classMap.keys());

    if (allowedClassIds.length === 0) {
      return { data: [], total: 0 };
    }

    const { data: allTeacherLinks, error: teacherLinksError } =
      await this.supabase
        .from(TABLES.ClassUser)
        .select(
          `
      class_id,
      user_id
    `,
        )
        .eq('role', 'teacher')
        .eq('is_deleted', false)
        .in('class_id', allowedClassIds);

    if (teacherLinksError) {
      logger.error('Error fetching teacher info:', teacherLinksError);
      return { data: [], total: 0 };
    }

    const teacherClassLinks = new Map<
      string,
      { teacherId: string; classId: string }
    >();
    (allTeacherLinks || []).forEach((row) => {
      const teacherId = String(row?.user_id || '').trim();
      const candidateClassId = String(row?.class_id || '').trim();
      if (!teacherId || !candidateClassId) return;

      teacherClassLinks.set(`${teacherId}:${candidateClassId}`, {
        teacherId,
        classId: candidateClassId,
      });
    });

    const teacherClassLinkList = Array.from(teacherClassLinks.values());
    const allTeacherIds = Array.from(
      new Set(teacherClassLinkList.map((link) => link.teacherId)),
    );
    if (allTeacherIds.length === 0) {
      return {
        data: [],
        total: 0,
      };
    }

    const { data: teacherUsers, error: userError } = await this.supabase
      .from(TABLES.User)
      .select('*')
      .in('id', allTeacherIds)
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .order('id', { ascending: true });

    if (userError) {
      logger.error('Error fetching teacher user rows:', userError);
      return { data: [], total: 0 };
    }

    if (!teacherUsers?.length) {
      return {
        data: [],
        total: 0,
      };
    }

    const teacherUserById = new Map(
      teacherUsers.map((teacherUser) => [teacherUser.id, teacherUser]),
    );
    const sortedTeacherClassLinks = teacherClassLinkList
      .filter((link) => teacherUserById.has(link.teacherId))
      .sort((leftLink, rightLink) => {
        const leftTeacher = teacherUserById.get(leftLink.teacherId);
        const rightTeacher = teacherUserById.get(rightLink.teacherId);
        const leftName = String(leftTeacher?.name || '');
        const rightName = String(rightTeacher?.name || '');
        const leftClassName =
          classMap.get(leftLink.classId) || leftLink.classId;
        const rightClassName =
          classMap.get(rightLink.classId) || rightLink.classId;

        return (
          leftName.localeCompare(rightName, undefined, {
            sensitivity: 'base',
          }) ||
          leftLink.teacherId.localeCompare(rightLink.teacherId) ||
          leftClassName.localeCompare(rightClassName, undefined, {
            sensitivity: 'base',
          }) ||
          leftLink.classId.localeCompare(rightLink.classId)
        );
      });

    const totalTeachers = sortedTeacherClassLinks.length;
    const teacherInfoList: TeacherInfo[] = sortedTeacherClassLinks
      .slice(offset, offset + safeLimit)
      .map((teacherClassLink) => {
        const teacherUser = teacherUserById.get(teacherClassLink.teacherId);
        if (!teacherUser) return null;

        const classIdValue = teacherClassLink.classId;
        const className = classMap.get(classIdValue) || '';
        const { grade, section } = this.parseClassName(className);

        return {
          user: teacherUser,
          grade: grade,
          classSection: section,
          classWithidname: {
            id: classIdValue,
            name: className,
          },
        };
      })
      .filter((row): row is TeacherInfo => row !== null);

    return {
      data: teacherInfoList,
      total: totalTeachers,
    };
  }
}
