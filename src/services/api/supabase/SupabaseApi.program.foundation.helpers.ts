import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { TABLES, TableTypes, SchoolRoleMap } from '../../../common/constants';

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (
        column: string,
        values: string[],
      ) => {
        eq: (
          column: string,
          value: string | boolean,
        ) => {
          or?: (filter: string) => unknown;
        } & PromiseLike<{
          data: unknown;
          error: unknown;
        }>;
      };
    };
  };
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

  const classIds = (classes as Array<{ id: string; school_id: string }>).map(
    (cls) => cls.id,
  );
  const classIdToSchoolId: Record<string, string> = {};
  for (const cls of classes as Array<{ id: string; school_id: string }>) {
    classIdToSchoolId[cls.id] = cls.school_id;
  }

  const { data: classUsers, error: classUserError } = await supabase
    .from(TABLES.ClassUser)
    .select('user: user_id (*), class_id')
    .in('class_id', classIds.length ? classIds : [''])
    .eq('is_deleted', false)
    .eq('role', RoleType.TEACHER);

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

  for (const entry of classUsers as Array<{
    class_id: string;
    user: TableTypes<'user'>;
  }>) {
    const schoolId = classIdToSchoolId[entry.class_id];
    const user = entry.user;
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
