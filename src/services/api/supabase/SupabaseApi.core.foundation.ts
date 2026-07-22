import {
  RealtimeChannel,
  SupabaseClient,
  createClient,
} from '@supabase/supabase-js';
import {
  CACHETABLES,
  DEFAULT_LOCALE_ID,
  MODES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import { SqliteApi } from '../SqliteApi';
export interface SupabaseApiCoreFoundation {
  [key: string]: any;
}
export class SupabaseApiCoreFoundation {
  protected _assignmetRealTime?: RealtimeChannel;

  protected _assignmentUserRealTime?: RealtimeChannel;

  protected _liveQuizRealTime?: RealtimeChannel;

  protected _currentMode: MODES;

  protected searchStudentsTimer: any = null;

  public supabase: SupabaseClient<Database> | undefined;

  protected supabaseUrl: string;

  protected supabaseKey: string;

  protected _currentStudent: TableTypes<'user'> | undefined;

  protected _currentClass: TableTypes<'class'> | undefined;

  protected _currentSchool: TableTypes<'school'> | undefined;

  protected _currentCourse:
    | Map<string, TableTypes<'course'> | undefined>
    | undefined;

  protected init() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_KEY ?? '';
    this.supabase = createClient<Database>(this.supabaseUrl, this.supabaseKey);
  }

  // as parameters type: school, user, class
  //               image
  // return image stored url
  //---------------------------------------------------------------

  async getChaptersForCourse(courseId: string): Promise<
    {
      course_id: string | null;
      created_at: string;
      id: string;
      image: string | null;
      is_deleted: boolean | null;
      name: string | null;
      sort_index: number | null;
      sub_topics: string | null;
      updated_at: string | null;
    }[]
  > {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase
      .from(TABLES.Chapter)
      .select('*')
      .eq('course_id', courseId)
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (error) {
      logger.error('Error fetching chapters for course:', error);
      return [];
    }

    return data ?? [];
  }

  async clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void> {
    logger.warn('Delegating clearSpecificTablesSqlite to SqliteApi');
    const sqliteApi = await SqliteApi.getInstance();
    return sqliteApi.clearCacheData(tableNames);
  }

  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'> | undefined> {
    if (!this.supabase) return undefined;

    // Class-wise assignments
    const { data: classWise, error: classWiseError } = await this.supabase
      .from(TABLES.Assignment)
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('class_id', classId)
      .eq('is_class_wise', true)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (classWiseError) {
      logger.error('Error fetching class-wise assignments:', classWiseError);
      return;
    }

    // Individual assignments (joined with assignment_user)
    const { data: individual, error: individualError } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
      *,
      assignment_user:assignment_user!inner(user_id)
    `,
      )
      .eq('lesson_id', lessonId)
      .eq('class_id', classId)
      .eq('assignment_user.user_id', studentId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (individualError) {
      logger.error('Error fetching individual assignments:', individualError);
      return;
    }

    // Combine and filter out assignments that already have a result
    const assignments = [...(classWise ?? []), ...(individual ?? [])];

    // Limit to 20 total assignments to check
    const limitedAssignments = assignments.slice(0, 20);

    const results = await Promise.all(
      limitedAssignments.map(async (assignment) => {
        if (!this.supabase) {
          return null;
        }
        const { data: result, error: resultError } = await this.supabase
          .from('result')
          .select('id')
          .eq('assignment_id', assignment.id)
          .eq('student_id', studentId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (resultError) {
          logger.error('Error checking assignment result:', resultError);
          return null;
        }
        return !result ? assignment : null;
      }),
    );

    // Return the first pending assignment, or undefined if none
    return results.find((a) => !!a) as TableTypes<'assignment'> | undefined;
  }

  async getFavouriteLessons(userId: string): Promise<TableTypes<'lesson'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.FavoriteLesson)
      .select(`lesson:lesson_id(*)`)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching favourite lessons:', error);
      return [];
    }

    const lessons: TableTypes<'lesson'>[] = (data ?? [])
      .map((item) => item.lesson as unknown as TableTypes<'lesson'>)
      .filter((lesson) => !!lesson);
    return lessons;
  }

  async getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  }> {
    if (!this.supabase) return { classes: [], schools: [] };
    const data: {
      classes: TableTypes<'class'>[];
      schools: TableTypes<'school'>[];
    } = {
      classes: [],
      schools: [],
    };
    const { data: classUserData, error } = await this.supabase
      .from(TABLES.ClassUser)
      .select(
        `
      class:class_id (
        *,
        school:school_id (*)
      )
    `,
      )
      .eq('user_id', userId)
      .eq('role', RoleType.STUDENT)
      .eq('is_deleted', false);
    if (error || !classUserData) {
      logger.error('Error fetching student classes and schools', error);
      return data;
    }

    const schoolsMap = new Map<string, TableTypes<'school'>>();

    for (const item of classUserData as any[]) {
      const cls = item.class as TableTypes<'class'> & {
        school?: TableTypes<'school'>;
      };

      if (cls) {
        data.classes.push(cls);
        if (cls.school && !schoolsMap.has(cls.school.id)) {
          schoolsMap.set(cls.school.id, cls.school);
        }
      }
    }

    data.schools = Array.from(schoolsMap.values());
    return data;
  }

  async createUserDoc(
    user: TableTypes<'user'>,
  ): Promise<TableTypes<'user'> | undefined> {
    if (!this.supabase) return;

    const countryCode = await this.getClientCountryCode();
    let locale: TableTypes<'locale'> | null = null;
    if (countryCode) {
      locale = await this.getLocaleByIdOrCode(undefined, countryCode);
    }
    const localeId = locale?.id ?? DEFAULT_LOCALE_ID;

    const { error } = await this.supabase.from(TABLES.User).insert({
      id: user.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      avatar: user.avatar,
      image: user.image,
      curriculum_id: user.curriculum_id,
      language_id: user.language_id,
      locale_id: localeId,
      tc_agreed_version: user.tc_agreed_version ?? 0,
    });

    if (error) {
      logger.error('Error creating user:', error);
      return;
    }
    return user;
  }

  syncDB(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  isSyncInProgress(): boolean {
    return false;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
