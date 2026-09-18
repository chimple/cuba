import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { TABLES, TableTypes, SchoolRoleMap } from '../../../common/constants';

type SupabaseLike = {
  from: (table: string) => any;
};

const CLASS_USER_IDS_PER_REQUEST = 100;
const CLASS_USER_ROWS_PER_PAGE = 1000;

type ClassUserWithUser = {
  class_id: string;
  user: TableTypes<'user'> | TableTypes<'user'>[] | null;
};

type ClassUserQueryResult = {
  data: ClassUserWithUser[] | null;
  error: unknown;
};

/**
 * PostgREST encodes `.in()` filters in the request URL. Large saved audiences
 * can contain thousands of classes, so querying all class IDs at once can be
 * rejected as a bad request by the gateway. Keep both the URL and response
 * size bounded while still returning every matching class-user row.
 */
export const getClassUsersForClassIdsImpl = async (
  supabase: SupabaseLike,
  classIds: string[],
  role: RoleType,
): Promise<ClassUserQueryResult> => {
  const normalizedClassIds = Array.from(
    new Set(classIds.map((classId) => classId.trim()).filter(Boolean)),
  );
  const classUsers: ClassUserWithUser[] = [];

  for (
    let batchStart = 0;
    batchStart < normalizedClassIds.length;
    batchStart += CLASS_USER_IDS_PER_REQUEST
  ) {
    const classIdBatch = normalizedClassIds.slice(
      batchStart,
      batchStart + CLASS_USER_IDS_PER_REQUEST,
    );
    let pageStart = 0;

    while (true) {
      const { data, error } = await supabase
        .from(TABLES.ClassUser)
        .select('id, user: user_id (*), class_id')
        .in('class_id', classIdBatch)
        .eq('is_deleted', false)
        .eq('role', role)
        .order('id', { ascending: true })
        .range(pageStart, pageStart + CLASS_USER_ROWS_PER_PAGE - 1);

      if (error) return { data: null, error };

      const page = (data ?? []) as ClassUserWithUser[];
      classUsers.push(...page);
      if (page.length < CLASS_USER_ROWS_PER_PAGE) break;
      pageStart += CLASS_USER_ROWS_PER_PAGE;
    }
  }

  return { data: classUsers, error: null };
};

export const getTeachersForSchoolsAndGradesImpl = async (
  supabase: SupabaseLike,
  schoolIds: string[],
  gradeIds: string[],
): Promise<SchoolRoleMap[]> => {
  const normalizedGradeIds = Array.from(
    new Set(gradeIds.map((gradeId) => gradeId.trim()).filter(Boolean)),
  );

  if (schoolIds.length === 0 || normalizedGradeIds.length === 0) {
    return schoolIds.map((id) => ({ schoolId: id, users: [] }));
  }

  let classQuery = supabase
    .from(TABLES.Class)
    .select('id, school_id')
    .in('school_id', schoolIds)
    .eq('is_deleted', false);

  classQuery = classQuery.or(
    `grade_id.in.(${normalizedGradeIds.join(',')}),grade_id.is.null`,
  );

  const { data: classes, error: classError } = await classQuery;

  if (classError || !classes) {
    logger.error(
      'Error fetching grade-scoped classes for teachers:',
      classError,
    );
    return schoolIds.map((id) => ({ schoolId: id, users: [] }));
  }

  const classRows = classes as Array<{ id: string; school_id: string }>;
  const classIds = classRows.map((cls) => cls.id);
  const classIdToSchoolId: Record<string, string> = {};
  for (const cls of classRows) {
    classIdToSchoolId[cls.id] = cls.school_id;
  }

  const { data: classUsers, error: classUserError } =
    await getClassUsersForClassIdsImpl(supabase, classIds, RoleType.TEACHER);

  if (classUserError || !classUsers) {
    logger.error(
      'Error fetching grade-scoped class users for teachers:',
      classUserError,
    );
    return schoolIds.map((id) => ({ schoolId: id, users: [] }));
  }

  const schoolMap: Map<string, TableTypes<'user'>[]> = new Map();
  for (const schoolId of schoolIds) {
    schoolMap.set(schoolId, []);
  }

  for (const entry of classUsers) {
    const schoolId = classIdToSchoolId[entry.class_id];
    const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
    if (!schoolId || !user) continue;

    const existing = schoolMap.get(schoolId) || [];
    if (!existing.some((current) => current.id === user.id)) {
      existing.push(user);
      schoolMap.set(schoolId, existing);
    }
  }

  return schoolIds.map((schoolId) => ({
    schoolId,
    users: schoolMap.get(schoolId) ?? [],
  }));
};
