import {
  PostgrestSingleResponse,
  RealtimeChannel,
  SupabaseClient,
  createClient,
} from '@supabase/supabase-js';
import {
  CACHETABLES,
  DEFAULT_LOCALE_ID,
  EVENTS,
  MODES,
  MUTATE_TYPES,
  PROFILETYPE,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import {
  readAssignmentCartFromStorage,
  writeAssignmentCartToStorage,
} from '../../../teachers-module/pages/AssignmentCartStorage';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { Database, Json } from '../../database';
import { SqliteApi } from '../SqliteApi';
const TABLES_EXCLUDED_FROM_SYNC = new Set<TABLES>([
  TABLES.ProgramUser,
  TABLES.ReqNewSchool,
  TABLES.Program,
  TABLES.GeoLocations,
  TABLES.SchoolMetrics,
  TABLES.FcQuestion,
  TABLES.FcSchoolVisit,
  TABLES.FcUserForms,
]);

export interface SupabaseApiCore {
  [key: string]: any;
}
export class SupabaseApiCore {
  protected _assignmetRealTime?: RealtimeChannel;
  protected _assignmentUserRealTime?: RealtimeChannel;
  protected _liveQuizRealTime?: RealtimeChannel;
  protected _currentMode: MODES;
  protected searchStudentsTimer: any = null;
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
  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE,
  ): Promise<string | null> {
    const extension = file.name.split('.').pop(); // Get file extension
    const newName = `ProfilePicture_${profileType}_${Date.now()}.${extension}`; // Rename the file
    const folderName = encodeURIComponent(String(id));
    const filePath = `${profileType}/${folderName}/${newName}`; // Path inside the bucket
    // Attempt to delete existing files
    await this.supabase?.storage
      .from('profile-images')
      .remove(
        (
          await this.supabase?.storage
            .from('profile-images')
            .list(`${profileType}/${folderName}`, { limit: 2 })
        )?.data?.map((file) => `${profileType}/${folderName}/${file.name}`) ||
          [],
      );
    // Convert File to Blob (necessary for renaming)
    const renamedFile = new File([file], newName, { type: file.type });
    // Upload the new file (allow overwrite)
    const uploadResponse = await this.supabase?.storage
      .from('profile-images')
      .upload(filePath, renamedFile, { upsert: true });
    if (uploadResponse?.error) {
      logger.error('Error uploading file:', uploadResponse.error.message);
      return null;
    }
    // Get the Public URL of the uploaded file
    const urlData = this.supabase?.storage
      .from('profile-images')
      .getPublicUrl(filePath);
    const imageUrl = urlData?.data.publicUrl;
    return imageUrl || null;
  }

  async uploadSchoolVisitMediaFile(params: {
    schoolId: string;
    file: File;
  }): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized.');
    }

    const { file } = params;
    const filePath = `${file.name}`;

    const uploadResponse = await this.supabase.storage
      .from('school-visits')
      .upload(filePath, file, { upsert: true });

    if (uploadResponse.error) {
      logger.error('Error uploading school visit media:', uploadResponse.error);
      throw uploadResponse.error;
    }

    const urlData = this.supabase.storage
      .from('school-visits')
      .getPublicUrl(filePath);

    const publicUrl = urlData.data.publicUrl;
    if (!publicUrl) {
      throw new Error('Failed to generate public URL for uploaded media.');
    }

    return publicUrl;
  }

  async uploadData(payload: any): Promise<boolean | null> {
    if (!this.supabase) return false;

    const supabase = this.supabase;
    let resolved = false;
    const currentuserData =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const uploadingUser = currentuserData?.id;
    return new Promise(async (resolve) => {
      let uploadId: string | undefined;
      let subscriptionFailCount = 0;
      const subscribeToDirectChannel = (): RealtimeChannel => {
        const channel = supabase
          .channel(`upload-status-${uploadId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'upload_queue',
              filter: `id=eq.${uploadId}`,
            },
            async (payload) => {
              const status = payload.new?.status;
              logger.info('?? Realtime update received:', status);
              if ((status === 'success' || status === 'failed') && !resolved) {
                resolved = true;
                await channel.unsubscribe();
                resolve(status === 'success');
              }
            },
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              logger.info('?? Realtime subscription active.');
              subscriptionFailCount = 0;
            } else {
              subscriptionFailCount++;
              logger.warn('?? Subscription status:', status);
              if (subscriptionFailCount > 2) {
                logger.warn(
                  '?? Reinitializing subscription due to failures...',
                );
                await channel.unsubscribe();
                subscribeToDirectChannel();
              }
            }
          });
        return channel;
      };
      const fallbackChannel = uploadingUser
        ? supabase
            .channel(`upload-fallback-${uploadingUser}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'upload_queue',
                filter: `uploading_user=eq.${uploadingUser}`,
              },
              async (payload) => {
                const status = payload.new?.status;
                const id = payload.new?.id;
                logger.info(
                  '?? [Fallback] Realtime update:',
                  status,
                  'ID:',
                  id,
                );
                if (
                  (status === 'success' || status === 'failed') &&
                  !resolved
                ) {
                  resolved = true;
                  await fallbackChannel?.unsubscribe();
                  logger.info(`? / ? Fallback resolved with status: ${status}`);
                  resolve(status === 'success');
                }
              },
            )
            .subscribe()
        : null;
      const { data } = await supabase.functions.invoke('ops-data-insert', {
        body: payload,
      });
      uploadId = data?.upload_id;
      if (uploadId) {
        logger.info('?? Received upload_id:', uploadId);
        if (fallbackChannel) {
          await fallbackChannel.unsubscribe();
        }
        const { data: row } = await supabase
          .from('upload_queue')
          .select('status')
          .eq('id', uploadId)
          .single();
        if (row?.status === 'success') {
          return resolve(true);
        }
        if (row?.status === 'failed') {
          return resolve(false);
        }
        subscribeToDirectChannel();
      } else {
        logger.warn('? No upload_id returned � using fallback listener.');
      }
    });
  }

  async migrateSchoolData(payload: { school_ids: string[] }): Promise<boolean> {
    if (!this.supabase) return false;

    const supabase = this.supabase;
    const schoolIds = Array.isArray(payload?.school_ids)
      ? payload.school_ids
          .map((id) => String(id ?? '').trim())
          .filter((id) => id.length > 0)
      : [];
    if (schoolIds.length === 0) return false;

    let resolved = false;
    const currentUserData =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const uploadingUser = currentUserData?.id;

    return new Promise(async (resolve) => {
      let uploadId: string | undefined;
      let directChannel: RealtimeChannel | null = null;
      let fallbackChannel: RealtimeChannel | null = null;
      let subscriptionFailCount = 0;

      const resolveOnce = async (isSuccess: boolean) => {
        if (resolved) return;
        resolved = true;
        if (directChannel) {
          await directChannel.unsubscribe();
        }
        if (fallbackChannel) {
          await fallbackChannel.unsubscribe();
        }
        resolve(isSuccess);
      };

      const subscribeToDirectChannel = (): RealtimeChannel => {
        const channel = supabase
          .channel(`school-migrate-status-${uploadId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'upload_queue',
              filter: `id=eq.${uploadId}`,
            },
            async (realtimePayload) => {
              const status = realtimePayload.new?.status;
              if ((status === 'success' || status === 'failed') && !resolved) {
                await resolveOnce(status === 'success');
              }
            },
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              subscriptionFailCount = 0;
            } else {
              subscriptionFailCount++;
              if (subscriptionFailCount > 2) {
                await channel.unsubscribe();
                directChannel = subscribeToDirectChannel();
              }
            }
          });
        return channel;
      };

      fallbackChannel = uploadingUser
        ? supabase
            .channel(`school-migrate-fallback-${uploadingUser}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'upload_queue',
                filter: `uploading_user=eq.${uploadingUser}`,
              },
              async (realtimePayload) => {
                const status = realtimePayload.new?.status;
                const id = realtimePayload.new?.id;
                if (
                  (status === 'success' || status === 'failed') &&
                  !resolved &&
                  (!uploadId || id === uploadId)
                ) {
                  await resolveOnce(status === 'success');
                }
              },
            )
            .subscribe()
        : null;

      const { data, error: functionError } = await supabase.functions.invoke(
        'school-data-migrate',
        {
          body: {
            school_ids: schoolIds,
          },
        },
      );

      if (functionError) {
        logger.error(
          'Edge function error in school-data-migrate:',
          functionError,
        );
        await resolveOnce(false);
        return;
      }

      uploadId = data?.upload_id || data?.migration_id || data?.id;
      if (uploadId) {
        if (fallbackChannel) {
          await fallbackChannel.unsubscribe();
          fallbackChannel = null;
        }

        const { data: row } = await supabase
          .from('upload_queue')
          .select('status')
          .eq('id', uploadId)
          .single();

        if (row?.status === 'success') {
          await resolveOnce(true);
          return;
        }
        if (row?.status === 'failed') {
          await resolveOnce(false);
          return;
        }

        directChannel = subscribeToDirectChannel();
        return;
      }

      if (
        data &&
        typeof data === 'object' &&
        'success' in (data as Record<string, unknown>)
      ) {
        await resolveOnce(Boolean((data as Record<string, unknown>).success));
        return;
      }

      if (!fallbackChannel) {
        await resolveOnce(false);
      }
    });
  }

  async getTablesData(
    tableNames: TABLES[] = Object.values(TABLES),
    tablesLastModifiedTime: Map<string, string> = new Map(),
    isInitialFetch = false,
  ): Promise<Map<string, any[]>> {
    try {
      const data = new Map<string, any[]>();
      const DEFAULT_LAST_MODIFIED = '2024-01-01T00:00:00.000Z';
      const syncTableNames = tableNames.filter(
        (tableName) => !TABLES_EXCLUDED_FROM_SYNC.has(tableName),
      );
      const updatedAtPayload: Record<string, string> = {};
      for (const tableName of syncTableNames) {
        // TABLES.User -> "user", TABLES.Class -> "class", etc.
        updatedAtPayload[tableName] =
          tablesLastModifiedTime.get(tableName) ?? DEFAULT_LAST_MODIFIED;
      }
      const res = await this.supabase?.rpc('sql_sync_all', {
        p_updated_at: updatedAtPayload,
        p_tables: syncTableNames,
        p_is_first_time: isInitialFetch, // TABLES[] should be string[] under the hood
      });
      logger.warn('pulled results', res);
      if (res == null || res.error || !res.data) {
        let parent_user;
        try {
          parent_user = await ServiceConfig.getI().authHandler.getCurrentUser();
        } catch (error: any) {
          logger.error('User Error', error);
        }
        Util.logEvent(EVENTS.SYNCHING_ERROR, {
          user_name: parent_user?.name || null,
          user_id: parent_user?.id || null,
          user_username: parent_user?.email || null,
          last_modified_date: updatedAtPayload || 'not found',
          error_code: res?.error?.code || null,
          error_deatils: res?.error?.details || null,
          error_hint: res?.error?.hint || null,
          error_message: res?.error?.message || null,
        });
      }
      syncTableNames.map(async (tableName) => {
        const payload =
          res?.data && typeof res.data === 'object' && !Array.isArray(res.data)
            ? (res.data as Record<string, Json>)
            : {};
        data.set(tableName, (payload[tableName] as Json[]) ?? []);
      });
      return data;
    } catch (err: any) {
      let parent_user;
      try {
        parent_user = await ServiceConfig.getI().authHandler.getCurrentUser();
      } catch (error: any) {
        logger.error('User Error', error);
      }
      Util.logEvent(EVENTS.SYNCHING_ERROR, {
        user_name: parent_user?.name || null,
        user_id: parent_user?.id || null,
        user_username: parent_user?.email || null,
        last_modified_date: 'not found',
        error_message: err || 'Unknown error',
      });
      logger.error(':rocket: ~ Api ~ getTablesData ~ error:', err);
      throw err;
    }
  }

  async mutate(
    mutateType: MUTATE_TYPES,
    tableName: TABLES,
    data1: { [key: string]: any },
    id: string,
  ) {
    const data = { ...data1 };
    data.updated_at = new Date().toISOString();
    if (tableName === TABLES.User && data.tc_agreed_version == null) {
      data.tc_agreed_version = 0;
    }
    if (!this.supabase) return;
    let res: PostgrestSingleResponse<any> | undefined = undefined;
    switch (mutateType) {
      case MUTATE_TYPES.INSERT:
        res = await this.supabase.from(tableName).insert(data);
        break;

      case MUTATE_TYPES.UPDATE:
        delete data.id;
        res = await this.supabase.from(tableName).update(data).eq('id', id);
        break;

      case MUTATE_TYPES.DELETE:
        res = await this.supabase.from(tableName).delete().eq('id', id);
        break;

      default:
        break;
    }
    return res;
    // return !!res && !res.error;
  }

  async pushAssignmentCart(data: { [key: string]: any }, id: string) {
    const now = new Date().toISOString();
    const existing = readAssignmentCartFromStorage(id);
    writeAssignmentCartToStorage(id, {
      lessons: data?.lessons ?? existing?.lessons ?? null,
      created_at: existing?.created_at ?? data?.created_at ?? now,
      updated_at: data?.updated_at ?? now,
    });
  }
}
