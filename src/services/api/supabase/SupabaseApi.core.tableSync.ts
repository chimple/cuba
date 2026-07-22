import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { EVENTS, MUTATE_TYPES, TABLES } from '../../../common/constants';
import {
  readAssignmentCartFromStorage,
  writeAssignmentCartToStorage,
} from '../../../teachers-module/pages/AssignmentCartStorage';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { Json } from '../../database';
import { SupabaseApiCoreUpload } from './SupabaseApi.core.upload';
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
export interface SupabaseApiCoreTableSync {
  [key: string]: any;
}
export class SupabaseApiCoreTableSync extends SupabaseApiCoreUpload {
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
