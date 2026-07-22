import { EnumType, TABLES } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiProgramActivityStats } from './SupabaseApi.program.activityStats';

export interface SupabaseApiProgramRequests {
  [key: string]: any;
}
export class SupabaseApiProgramRequests extends SupabaseApiProgramActivityStats {
  async getOpsRequests(
    requestStatus: EnumType<'ops_request_status'>,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at',
    orderDir: 'asc' | 'desc' = 'asc',
    filters?: {
      request_type?: EnumType<'ops_request_type'>[];
      school?: string[];
    },
    searchTerm?: string,
  ): Promise<{
    data: any[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      if (!this.supabase)
        return { data: [], total: 0, totalPages: 0, page, limit };

      const { data, error } = await this.supabase.rpc('get_ops_requests', {
        p_request_status: requestStatus,
        p_page: page,
        p_limit: limit,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_request_types: filters?.request_type?.length
          ? filters.request_type
          : undefined,
        p_school_ids: filters?.school?.length ? filters.school : undefined,
        p_search_term: searchTerm ?? undefined,
      });

      if (error) throw error;

      const response =
        data && typeof data === 'object' && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : {};

      return {
        data: Array.isArray(response.data) ? response.data : [],
        total: typeof response.total === 'number' ? response.total : 0,
        totalPages:
          typeof response.totalPages === 'number' ? response.totalPages : 0,
        page: typeof response.page === 'number' ? response.page : page,
        limit: typeof response.limit === 'number' ? response.limit : limit,
      };
    } catch (err) {
      logger.error('Error in getOpsRequests:', err);
      return { data: [], total: 0, totalPages: 0, page, limit };
    }
  }

  async getRequestFilterOptions() {
    try {
      if (!this.supabase) return null;

      const [requestTypeResponse, schoolResponse] = await Promise.all([
        this.supabase
          .from(TABLES.OpsRequests)
          .select('request_type')
          .eq('is_deleted', false),

        this.supabase
          .from(TABLES.OpsRequests)
          .select('school_id, school:school(id, name)')
          .eq('is_deleted', false)
          .not('school_id', 'is', null),
      ]);

      if (requestTypeResponse.error) {
        logger.error(
          'Failed to fetch request types:',
          requestTypeResponse.error.message,
        );
        throw requestTypeResponse.error;
      }

      if (schoolResponse.error) {
        logger.error('Failed to fetch schools:', schoolResponse.error.message);
        throw schoolResponse.error;
      }
      // 1. Get unique request types
      const allRequestTypes = (requestTypeResponse.data || []).map(
        (item) => item.request_type,
      );
      const uniqueRequestTypes = [...new Set(allRequestTypes)];

      // 2. Get unique schools with id and name
      const schoolMap = new Map<string, { id: string; name: string }>();

      ((schoolResponse.data as any[]) || []).forEach((item) => {
        if (item.school && item.school.id && item.school.name) {
          schoolMap.set(item.school.id, {
            id: item.school.id,
            name: item.school.name,
          });
        }
      });

      const uniqueSchools = Array.from(schoolMap.values());

      return {
        requestType: uniqueRequestTypes,
        school: uniqueSchools,
      };
    } catch (error) {
      logger.error('Error in getRequestFilterOptions:', error);
      throw error;
    }
  }
  async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number,
    classId?: string,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    if (!this.supabase) {
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty search result.
    if (!classId && classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    const supabase = this.supabase;

    return new Promise((resolve) => {
      if (this.searchStudentsTimer) {
        clearTimeout(this.searchStudentsTimer);
      }

      this.searchStudentsTimer = setTimeout(async () => {
        try {
          let classQuery = supabase
            .from('class')
            .select('id, name')
            .eq('school_id', schoolId)
            .eq('is_deleted', false);

          if (classId) {
            classQuery = classQuery.eq('id', classId);
          } else if (classIds && classIds.length > 0) {
            // Applies program class scope while preserving the class-detail override.
            classQuery = classQuery.in('id', classIds);
          }

          const { data: classData } = await classQuery;

          const schoolClassIds = (classData ?? []).map(
            (classRow) => classRow.id,
          );

          if (schoolClassIds.length === 0) {
            resolve({ data: [], total: 0 });
            return;
          }

          const studentFilter = `name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`;

          // ✅ ADDED phone IN SELECT
          const { data: studentRows } = await supabase
            .from('class_user')
            .select(
              `
              class_id,
              user:user_id!inner (
                id,
                name,
                email,
                phone,
                gender,
                student_id
              )
            `,
            )
            .in('class_id', schoolClassIds)
            .eq('role', 'student')
            .eq('is_deleted', false)
            .or(studentFilter, {
              foreignTable: 'user',
            });

          const parentFilter = `phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`;

          const { data: parentRowsRaw } = await (supabase
            .from('class_user')
            .select(
              `
                user:user_id!inner (
                  id,
                  phone,
                  email,
                  is_wa_contact
                )
            `,
            )
            .in('class_id', schoolClassIds)
            .eq('role', 'parent')
            .eq('is_deleted', false)
            .or(parentFilter, {
              foreignTable: 'user',
            }) as any);
          const parentRows = (parentRowsRaw ?? []) as Array<{
            user?: { id?: string | null } | null;
          }>;
          const parentIds = parentRows
            .map((row) => String(row?.user?.id ?? '').trim())
            .filter((id) => id.length > 0);

          type StudentSearchRow = {
            class_id: string;
            user: {
              id: string;
              name?: string | null;
              email?: string | null;
              phone?: string | null;
              gender?: string | null;
              student_id?: string | null;
            };
          };
          let parentLinkedStudents: StudentSearchRow[] = [];
          type ParentSearchContact = {
            phone?: string | null;
            email?: string | null;
            is_wa_contact?: string | boolean | null;
          };
          const parentContactsByStudentId = new Map<
            string,
            ParentSearchContact[]
          >();
          const addParentContact = (
            studentId: string | null | undefined,
            parent: ParentSearchContact | null | undefined,
          ) => {
            const normalizedStudentId = String(studentId ?? '').trim();
            if (!normalizedStudentId || !parent) return;

            const currentParents =
              parentContactsByStudentId.get(normalizedStudentId) ?? [];
            // For search results we only need unique phone/email contact entries.
            const alreadyAdded = currentParents.some(
              (existingParent) =>
                (existingParent.phone &&
                  parent.phone &&
                  existingParent.phone === parent.phone) ||
                (existingParent.email &&
                  parent.email &&
                  existingParent.email === parent.email),
            );
            if (alreadyAdded) return;

            parentContactsByStudentId.set(normalizedStudentId, [
              ...currentParents,
              parent,
            ]);
          };

          if (parentIds.length > 0) {
            const { data: parentLinksRaw } = await supabase
              .from('parent_user')
              .select(
                `
                student_id,
                parent:parent_id (
                  phone,
                  email,
                  is_wa_contact
                )
              `,
              )
              .in('parent_id', parentIds)
              .eq('is_deleted', false);
            const parentLinks = (parentLinksRaw ?? []) as Array<{
              student_id?: string | null;
              parent?: {
                phone?: string | null;
                email?: string | null;
                is_wa_contact?: string | boolean | null;
              } | null;
            }>;

            const studentIds = parentLinks
              .map((link) => String(link?.student_id ?? '').trim())
              .filter((id) => id.length > 0);

            parentLinks.forEach((link) => {
              addParentContact(link.student_id, {
                phone: link.parent?.phone ?? null,
                email: link.parent?.email ?? null,
                is_wa_contact: link.parent?.is_wa_contact ?? null,
              });
            });

            if (studentIds.length > 0) {
              const { data } = await supabase
                .from('class_user')
                .select(
                  `
                  class_id,
                  user:user_id!inner (
                    id,
                    name,
                    email,
                    phone,
                    gender,
                    student_id
                  )
                `,
                )
                .in('class_id', schoolClassIds)
                .eq('role', 'student')
                .in('user_id', studentIds)
                .eq('is_deleted', false);

              parentLinkedStudents = (data ??
                []) as object[] as StudentSearchRow[];
            }
          }

          const allRows = [
            ...((studentRows ?? []) as object[] as StudentSearchRow[]),
            ...parentLinkedStudents,
          ];

          const uniqueMap = new Map<string, StudentSearchRow>();

          allRows.forEach((row) => {
            uniqueMap.set(row.user.id, row);
          });

          const mergedRows = Array.from(uniqueMap.values());
          // ✅ GET ALL STUDENT IDS
          const allStudentIds = mergedRows.map((r) => r.user.id);

          // Fetch every linked parent contact for matched students.
          if (allStudentIds.length > 0) {
            const { data: allParentLinksRaw } = await supabase
              .from('parent_user')
              .select(
                `
        student_id,
        parent:parent_id (
          phone,
          email,
          is_wa_contact
        )
      `,
              )
              .in('student_id', allStudentIds)
              .eq('is_deleted', false);
            const allParentLinks = (allParentLinksRaw ?? []) as Array<{
              student_id?: string | null;
              parent?: {
                phone?: string | null;
                email?: string | null;
                is_wa_contact?: string | boolean | null;
              } | null;
            }>;

            allParentLinks.forEach((link) => {
              addParentContact(link.student_id, {
                phone: link.parent?.phone ?? null,
                email: link.parent?.email ?? null,
                is_wa_contact: link.parent?.is_wa_contact ?? null,
              });
            });
          }
          const offset = (page - 1) * limit;

          const pagedRows = mergedRows.slice(offset, offset + limit);
          const result = pagedRows.map((row) => {
            const classInfo = classData?.find((c) => c.id === row.class_id);

            const className = classInfo?.name ?? '';

            const { grade, section } = this.parseClassName(className);

            const parentContacts =
              parentContactsByStudentId.get(row.user.id) ?? [];
            const parentContact = parentContacts[0] ?? {};

            // ✅ FALLBACK FLATTEN LOGIC (ONLY ADDITION)
            const phone = row.user.phone || parentContact.phone || '';

            const email = row.user.email || parentContact.email || '';
            return {
              user: {
                id: row.user.id,
                name: row.user.name,
                student_id: row.user.student_id,
                gender: row.user.gender,
                phone,
                email,
              },

              parent: {
                phone: parentContact.phone ?? null,
                email: parentContact.email ?? null,
                is_wa_contact: parentContact.is_wa_contact ?? null,
              },
              parents: parentContacts,

              class_id: row.class_id,
              class_name: className,
              classWithidname: {
                id: row.class_id,
                class_name: className,
              },
              grade,
              classSection: section,
            };
          });

          resolve({
            data: result,
            total: mergedRows.length,
          });
        } catch (err) {
          logger.error(err);
          resolve({ data: [], total: 0 });
        }
      }, 400);
    });
  }
}
