import { v4 as uuidv4 } from 'uuid';
import {
  PROFILETYPE,
  STATUS,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiSchoolCreation } from './SupabaseApi.school.creation';

export interface SupabaseApiSchoolRequests {
  [key: string]: any;
}
export class SupabaseApiSchoolRequests extends SupabaseApiSchoolCreation {
  async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string,
  ): Promise<TableTypes<'req_new_school'> | null> {
    if (!this.supabase) return null;

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not logged in');

    // ✅ Select id, created_at, updated_at to avoid TS error
    const { data: existingRequests, error: selectError } = await this.supabase
      .from(TABLES.ReqNewSchool)
      .select('id, created_at, updated_at')
      .eq('user_id', _currentUser.id)
      .eq('is_deleted', false)
      .limit(1);

    if (selectError) {
      logger.error('Error checking for existing request:', selectError);
      throw selectError;
    }

    if (existingRequests && existingRequests.length > 0) {
      const existing = existingRequests[0];
      return {
        id: existing.id,
        user_id: _currentUser.id,
        name,
        state,
        district,
        city,
        image: null,
        udise_id: udise_id ?? null,
        is_resolved: false,
        created_at: existing.created_at,
        updated_at: existing.updated_at,
        is_deleted: false,
      };
    }

    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const imageUrl = image
      ? await this.addProfileImages(requestId, image, PROFILETYPE.SCHOOL)
      : null;

    const newRequest: TableTypes<'req_new_school'> = {
      id: requestId,
      user_id: _currentUser.id,
      name,
      state,
      district,
      city,
      image: imageUrl ?? null,
      udise_id: udise_id ?? null,
      is_resolved: false,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };

    const { error: insertError } = await this.supabase
      .from(TABLES.ReqNewSchool)
      .insert([newRequest]);

    if (insertError) {
      logger.error('Error inserting school request:', insertError);
      throw insertError;
    }

    return newRequest;
  }
  async getExistingSchoolRequest(
    requested_by: string,
  ): Promise<TableTypes<'ops_requests'> | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from(TABLES.OpsRequests)
      .select('*')
      .eq('requested_by', requested_by)
      .eq('request_status', STATUS.REQUESTED)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching existing school request:', error);
      throw error;
    }

    return data ?? null;
  }
}
