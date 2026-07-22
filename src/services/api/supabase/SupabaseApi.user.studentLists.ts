import {
  StudentAPIResponse,
  StudentInfo,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiUserLookups } from './SupabaseApi.user.lookups';
export interface SupabaseApiUserStudentLists {
  [key: string]: any;
}
export class SupabaseApiUserStudentLists extends SupabaseApiUserLookups {
  async getUsersByIds(userIds: string[]): Promise<TableTypes<'user'>[]> {
    if (!this.supabase || userIds.length === 0) return [];

    const { data: users, error } = await this.supabase
      .from(TABLES.User)
      .select('*')
      .in('id', userIds)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching users by IDs:', error);
      return [];
    }

    return users || [];
  }

  async getStudentInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20,
    classId?: string,
    classIds?: string[],
  ): Promise<StudentAPIResponse> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty page without querying.
    if (!classId && classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    // Query classes first and filter class_user by class_id list.
    // This avoids expensive class_user -> class join scans that can timeout.
    const { data: schoolClasses, error: classFetchError } = await this.supabase // fetch classes for the school
      .from(TABLES.Class)
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (classFetchError) {
      logger.error(
        'Error fetching classes for school student query:',
        classFetchError,
      );
      return { data: [], total: 0 };
    }

    const classMap = new Map<string, string>(
      (schoolClasses || []).map((c) => [String(c.id), String(c.name || '')]), // store clsId and clsName in a map of that particular school
    );
    const allowedClassIds = classId
      ? classMap.has(classId)
        ? [classId]
        : []
      : classIds && classIds.length > 0
        ? classIds
            .map((classIdItem) => String(classIdItem).trim())
            .filter((classIdItem) => classMap.has(classIdItem))
        : Array.from(classMap.keys()); // if classId is provided, use it only if it's valid for the school; otherwise use all class IDs for the school

    if (allowedClassIds.length === 0) {
      return { data: [], total: 0 };
    }

    const {
      data: pagedStudentRows,
      error: pagedStudentsError,
      count: totalStudentsRaw,
    } = await this.supabase
      .from(TABLES.ClassUser)
      .select(
        `
      class_id,
      user:user!class_user_user_id_fkey!inner (
        age,
        avatar,
        created_at,
        curriculum_id,
        fcm_token,
        firebase_id,
        grade_id,
        image,
        is_deleted,
        is_firebase,
        is_ops,
        language_id,
        is_tc_accepted,
        student_id,
        reward,
        updated_at,
        learning_path,
        id,
        name,
        phone,
        gender,
        email
      )
    `,
        { count: 'exact' },
      )
      .eq('role', 'student')
      .eq('is_deleted', false)
      .in('class_id', allowedClassIds)
      .eq('user.is_deleted', false)
      .order('name', { ascending: true, foreignTable: TABLES.User })
      .order('id', { ascending: true, foreignTable: TABLES.User })
      .range(offset, offset + limit - 1);

    const totalStudents =
      typeof totalStudentsRaw === 'number' ? totalStudentsRaw : 0;

    if (pagedStudentsError) {
      logger.error(
        'Error fetching paged students for school:',
        pagedStudentsError,
      );
      return { data: [], total: totalStudents };
    }

    const normalizedPagedRows = (
      (pagedStudentRows || []) as Array<{
        class_id?: string | null;
        user?: TableTypes<'user'> | TableTypes<'user'>[] | null;
      }>
    ).map((row) => {
      const user = Array.isArray(row?.user) ? row.user[0] : row?.user;
      const classIdValue = String(row?.class_id || '').trim();
      const studentId = String(user?.id || '').trim();
      return {
        classIdValue,
        studentId,
        user,
      };
    });

    const pagedStudentIds = normalizedPagedRows
      .map((row) => row.studentId)
      .filter((studentId) => studentId.length > 0);

    if (pagedStudentIds.length === 0) {
      return {
        data: [],
        total: totalStudents,
      };
    }

    const parentsByStudentId = new Map<
      string,
      Array<{
        id?: string;
        phone?: string;
        email?: string;
        is_wa_contact?: string | boolean | null;
      }>
    >();
    if (pagedStudentIds.length > 0) {
      const { data: parentLinks, error: parentError } = await this.supabase
        .from(TABLES.ParentUser)
        .select('student_id, parent_id')
        .in('student_id', pagedStudentIds)
        .eq('is_deleted', false);

      if (parentError) {
        logger.error('Error fetching parent links for students:', parentError);
      } else {
        const parentIds = [
          ...new Set(
            (parentLinks || [])
              .map((link) => String(link?.parent_id || '').trim())
              .filter((parentId) => parentId.length > 0),
          ),
        ];

        const parentById = new Map<
          string,
          {
            id?: string;
            phone?: string;
            email?: string;
            is_wa_contact?: string | boolean | null;
          }
        >();

        if (parentIds.length > 0) {
          type ParentUserWithWhatsapp = {
            id?: string | null;
            name?: string | null;
            phone?: string | null;
            email?: string | null;
            is_wa_contact?: string | boolean | null;
          };
          const { data: parentUsersRaw, error: parentUsersError } =
            await (this.supabase
              .from(TABLES.User)
              .select('id, name, phone, email, is_wa_contact')
              .in('id', parentIds)
              .eq('is_deleted', false) as any);
          const parentUsers = (parentUsersRaw ??
            []) as ParentUserWithWhatsapp[];

          if (parentUsersError) {
            logger.error(
              'Error fetching parent users for students:',
              parentUsersError,
            );
          } else {
            parentUsers.forEach((parentUser) => {
              const parentId = String(parentUser?.id || '').trim();
              if (!parentId) return;

              parentById.set(parentId, {
                id: parentId,
                phone:
                  typeof parentUser?.phone === 'string'
                    ? parentUser.phone
                    : undefined,
                email:
                  typeof parentUser?.email === 'string'
                    ? parentUser.email
                    : undefined,
                is_wa_contact:
                  typeof parentUser?.is_wa_contact === 'string' ||
                  typeof parentUser?.is_wa_contact === 'boolean'
                    ? parentUser.is_wa_contact
                    : null,
              });
            });
          }
        }

        (parentLinks || []).forEach((link) => {
          const sid = String(link?.student_id || '').trim();
          const parentId = String(link?.parent_id || '').trim();
          const parent = parentById.get(parentId);
          if (!sid || !parent) return;

          const currentParents = parentsByStudentId.get(sid) ?? [];
          // Deduplicate by contact values to keep merged contacts clean.
          const alreadyAdded = currentParents.some(
            (existingParent) =>
              (existingParent.id && existingParent.id === parent.id) ||
              (existingParent.phone &&
                parent.phone &&
                existingParent.phone === parent.phone) ||
              (existingParent.email &&
                parent.email &&
                existingParent.email === parent.email),
          );
          if (alreadyAdded) return;

          parentsByStudentId.set(sid, [...currentParents, parent]);
        });
      }
    }

    const studentInfoList: StudentInfo[] = normalizedPagedRows
      .map((row) => {
        const user = row.user;
        if (!user) return null;

        const studentId = row.studentId;
        const classIdValue = row.classIdValue;
        const className = classMap.get(classIdValue) || '';
        const { grade, section } = this.parseClassName(className);
        const parents =
          (parentsByStudentId.get(studentId) as TableTypes<'user'>[]) ?? [];
        const parent = parents[0] || null;
        const updatedUser = {
          ...user,
          phone: user?.phone || parent?.phone || '',
          email: user?.email || parent?.email || '',
        };

        return {
          user: updatedUser,
          grade,
          classSection: section,
          parent,
          parents,
          // Needed by student detail flows that rely on class id/name shape.
          classWithidname: {
            id: classIdValue,
            class_name: className,
          },
        } as StudentInfo;
      })
      .filter((row): row is StudentInfo => row !== null);

    return {
      data: studentInfoList,
      total: totalStudents,
    };
  }
  async getStudentsAndParentsByClassId(
    classId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<StudentAPIResponse> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('class_user')
      .select(
        `
      class:class_id!inner (
        id,
        name
      ),
      user:user_id (
        *,
        parent_links:parent_user!student_id (
          parent:parent_id (
            *
          )
        )
      )
    `,
        { count: 'exact' },
      )
      .eq('role', 'student')
      .eq('is_deleted', false)
      .eq('class_id', classId); // Filter by classId

    const { data, error, count } = await query
      .order('user(name)', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching students and parents by class ID:', error);
      return { data: [], total: 0 };
    }

    type StudentParentLinkRow = {
      user?:
        | (TableTypes<'user'> & {
            parent_links?: Array<{ parent?: TableTypes<'user'> | null }>;
          })
        | null;
      class?: { id?: string | null; name?: string | null } | null;
    };
    const studentRows = (data ?? []) as object[] as StudentParentLinkRow[];
    const studentInfoList = studentRows.reduce<StudentInfo[]>((list, row) => {
      const { user, class: cls } = row;
      if (!user) return list;

      const className = cls?.name || '';
      const { grade, section } = this.parseClassName(className);

      const parents = (user.parent_links || [])
        .map((link) => link?.parent)
        .filter((parent): parent is TableTypes<'user'> => Boolean(parent));
      const parent = parents[0] || null;

      list.push({
        user,
        grade,
        classSection: section,
        parent,
        parents,
        classWithidname: cls?.id
          ? {
              id: cls.id,
              class_name: className,
            }
          : undefined,
      });
      return list;
    }, []);
    return {
      data: studentInfoList,
      total: count ?? 0,
    };
  }
  async getStudentAndParentByStudentId(studentId: string): Promise<{
    user: TableTypes<'user'> | null;
    parents: TableTypes<'user'>[];
  }> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return { user: null, parents: [] };
    }

    const { data, error } = await this.supabase
      .from('user')
      .select(
        `
      *,
      parent_links:parent_user!student_id (
        parent:parent_id (
          *
        )
      )
      `,
      )
      .eq('id', studentId)
      .eq('is_deleted', false)
      .single();

    if (error || !data) {
      logger.error('Error fetching student and parent by student ID:', error);
      return { user: null, parents: [] };
    }
    const parentLinks = (data.parent_links ?? []) as object[] as Array<{
      parent?: TableTypes<'user'> | null;
    }>;
    const parents = parentLinks
      .map((link) => link.parent)
      .filter((parent): parent is TableTypes<'user'> => Boolean(parent));

    return {
      user: data,
      parents,
    };
  }
  async getParentsByStudentId(
    studentId: string,
    options?: {
      studentIds?: string[];
      activeOnly?: boolean;
    },
  ): Promise<TableTypes<'user'>[]> {
    if (!this.supabase) {
      logger.warn('Supabase not initialized.');
      return [];
    }

    const requestedStudentIds =
      options?.studentIds?.filter((id) => id.trim() !== '') ??
      (studentId.trim() !== '' ? [studentId] : []);
    if (requestedStudentIds.length === 0) {
      return [];
    }

    let query = this.supabase.from('parent_user').select(
      `
          parent:parent_id (
            *
          )
        `,
    );

    if (requestedStudentIds.length === 1) {
      query = query.eq('student_id', requestedStudentIds[0]);
    } else {
      query = query.in('student_id', requestedStudentIds);
    }

    if (options?.activeOnly) {
      query = query.eq('is_deleted', false);
    }

    const { data, error } = await query;

    if (error || !data) {
      logger.error('Error fetching parents by student ID:', error);
      return [];
    }

    return data.map((row: any) => row.parent).filter(Boolean);
  }
}
