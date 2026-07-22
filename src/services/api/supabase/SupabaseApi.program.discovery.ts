import {
  GeoDataParams,
  RequestTypes,
  STATUS,
  School,
  SearchSchoolsParams,
  SearchSchoolsResult,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiProgramRequestReview } from './SupabaseApi.program.requestReview';

export interface SupabaseApiProgramDiscovery {
  [key: string]: any;
}
export class SupabaseApiProgramDiscovery extends SupabaseApiProgramRequestReview {
  async getProgramsByRole(): Promise<{ data: TableTypes<'program'>[] }> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return { data: [] };
    }

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User not logged in');

    const userId = _currentUser.id;
    const roles: string[] = store.getState().auth.roles ?? [];
    const isSuperAdmin = roles.includes(RoleType.SUPER_ADMIN);
    const isOpsDirector = roles.includes(RoleType.OPERATIONAL_DIRECTOR);

    // Case 1: Super Admin or Ops Director → fetch ALL programs
    if (isSuperAdmin || isOpsDirector) {
      const { data, error } = await this.supabase
        .from('program')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching programs:', error);
        return { data: [] };
      }
      return { data: data || [] };
    }

    // Case 2: Program Manager → fetch only programs assigned to them
    if (roles.includes(RoleType.PROGRAM_MANAGER)) {
      const { data: programUsers, error: programUsersError } =
        await this.supabase
          .from('program_user')
          .select('program_id')
          .eq('user', userId)
          .eq('role', RoleType.PROGRAM_MANAGER)
          .eq('is_deleted', false);

      if (programUsersError) {
        logger.error('Error fetching program_user entries:', programUsersError);
        return { data: [] };
      }
      if (!programUsers || programUsers.length === 0) {
        return { data: [] };
      }
      const programIds = programUsers.map((p) => p.program_id);
      const { data: programs, error } = await this.supabase
        .from('program')
        .select('*')
        .in('id', programIds)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching programs for program manager:', error);
        return { data: [] };
      }
      return { data: programs || [] };
    }

    return { data: [] };
  }

  async getFieldCoordinatorsByProgram(
    programId: string,
  ): Promise<{ data: TableTypes<'user'>[] }> {
    if (!this.supabase) return { data: [] };
    if (!programId) return { data: [] };

    const { data: programUsers, error: linkError } = await this.supabase
      .from('program_user')
      .select('user')
      .eq('program_id', programId)
      .eq('role', RoleType.FIELD_COORDINATOR)
      .eq('is_deleted', false);

    if (linkError || !programUsers?.length) {
      logger.error('Error fetching program_user:', linkError);
      return { data: [] };
    }
    const userIds = programUsers
      .map((pu) => pu.user)
      .filter((id): id is string => !!id);
    const { data: users, error: userError } = await this.supabase
      .from('user')
      .select('*')
      .in('id', userIds)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (userError) {
      logger.error('Error fetching users:', userError);
      return { data: [] };
    }
    return { data: users || [] };
  }

  async updateSchoolStatus(
    schoolId: string,
    schoolStatus: (typeof STATUS)[keyof typeof STATUS],
    address?: {
      state?: string;
      district?: string;
      block?: string;
      address?: string;
    },
    keyContacts?: any,
  ): Promise<void> {
    if (!this.supabase) return;

    const updatePayload: any = {
      status: schoolStatus,
      updated_at: new Date().toISOString(),
    };

    if (address?.state !== undefined) updatePayload.group1 = address.state;
    if (address?.district !== undefined)
      updatePayload.group2 = address.district;
    if (address?.block !== undefined) updatePayload.group3 = address.block;
    if (address?.address !== undefined) updatePayload.group4 = address.address;

    if (keyContacts) {
      updatePayload.key_contacts = JSON.stringify(keyContacts);
    }
    const { error } = await this.supabase
      .from('school')
      .update(updatePayload)
      .eq('id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error updating school status:', error);
    }
  }
  async getGeoData(params: GeoDataParams): Promise<string[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase.rpc('get_geo_data', params);

    if (error || !data) {
      logger.error("RPC 'get_geo_data' failed with params:", params, error);
      return [];
    }
    return data || [];
  }
  async getClientCountryCode(): Promise<any> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase.rpc('get_client_country_code');
    if (error) {
      logger.error('Error fetching geo data:', error);
      return null;
    }
    return data;
  }
  async getLocaleByIdOrCode(
    locale_id?: string,
    locale_code?: string,
  ): Promise<TableTypes<'locale'> | null> {
    if (!this.supabase) {
      return null;
    }
    let query = this.supabase
      .from('locale')
      .select('*')
      .eq('is_deleted', false);

    if (locale_id) {
      query = query.eq('id', locale_id);
    } else if (locale_code) {
      query = query.eq('code', locale_code);
    } else {
      return null;
    }
    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      logger.error('getLocaleByIdOrCode error:', error);
      throw error;
    }

    return data;
  }

  async searchSchools(
    params: SearchSchoolsParams,
  ): Promise<SearchSchoolsResult> {
    if (!this.supabase) {
      logger.error('Supabase client is not available.');
      return { total_count: 0, schools: [] };
    }

    const { data, error } = await this.supabase.rpc('search_schools', params);

    if (error) {
      logger.error("RPC 'search_schools' failed:", params, error);
      return { total_count: 0, schools: [] };
    }
    const resultRow = Array.isArray(data) ? data[0] : data;
    logger.info('searchSchools result:', data);
    return {
      total_count: resultRow.total_count,
      schools: (resultRow.schools as School[]) ?? [],
    };
  }

  async sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string,
  ): Promise<void> {
    if (!this.supabase) throw new Error('Supabase instance is not initialized');

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error('User is not Logged in');
    const now = new Date().toISOString();
    const { error } = await this.supabase.from('ops_requests').insert([
      {
        school_id: schoolId,
        class_id: classId,
        request_type: requestType,
        requested_by: currentUser.id,
        request_status: STATUS.REQUESTED,
        rejected_reason_description: '',
        rejected_reason_type: '',
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
    ]);

    if (error) {
      logger.error('❌ Error inserting join school request:', error);
      throw error;
    }
  }
  async getAllClassesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'class'>[]> {
    if (!this.supabase) return [];

    const { data: classes, error } = await this.supabase.rpc(
      'get_classes_by_school_id',
      {
        school_id_input: schoolId,
      },
    );
    if (error) {
      logger.error('Error fetching classes by school ID:', error);
      return [];
    }
    return classes || [];
  }
  async getRewardById(
    rewardId: string,
  ): Promise<TableTypes<'rive_reward'> | undefined> {
    if (!this.supabase) return undefined;
    try {
      const { data, error } = await this.supabase
        .from('rive_reward')
        .select('*')
        .eq('id', rewardId)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error fetching reward by ID:', error);
      }
      return data && data.length > 0
        ? (data[0] as TableTypes<'rive_reward'>)
        : undefined;
    } catch (error) {
      logger.error('Unexpected error fetching reward by ID:', error);
      return undefined;
    }
  }
  async getAllRewards(): Promise<TableTypes<'rive_reward'>[] | []> {
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase
        .from(TABLES.RiveReward)
        .select('*')
        .eq('type', 'normal')
        .eq('is_deleted', false)
        .order('state_number_input');

      if (error) {
        logger.error('Error fetching all rewards', error);
        return [];
      }
      return data as TableTypes<'rive_reward'>[];
    } catch (error) {
      logger.error('Error fetching all rewards', error);
      return [];
    }
  }
  async updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string,
  ): Promise<void> {
    if (!this.supabase) return;
    try {
      const currentUser = (await this.getUserByDocId(
        userId,
      )) as TableTypes<'user'> | null;
      if (!currentUser) {
        logger.warn(`No user found`);
        return;
      }

      const timestamp = created_at ?? new Date().toISOString();

      const newReward = {
        reward_id: rewardId,
        timestamp: timestamp,
      };
      const rewardString = JSON.stringify(newReward);

      // Update the same currentUser object
      currentUser.reward = rewardString;
      const { error } = await this.supabase
        .from('user')
        .update({ reward: currentUser.reward, updated_at: timestamp })
        .eq('id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error updating user reward:', error);
        return;
      }
      Util.setCurrentStudent(currentUser);
    } catch (error) {
      logger.error('❌ Error updating user reward:', error);
    }
  }
  async getActiveStudentsCountByClass(
    classId: string,
    days: number = 7,
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    const { data, error } = await this.supabase.rpc(
      'get_active_students_count_by_class',
      {
        p_class_id: classId,
        p_days: days,
      },
    );
    if (error) {
      logger.error('Error fetching active students count:', error);
      throw error;
    }
    return (data ?? 0).toString();
  }
  async getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[],
  ): Promise<{ subject_id: string; completed_count: number }[]> {
    if (!this.supabase) return [];

    try {
      // Query to get count of completed lessons per subject for the student for given subjects
      const { data, error } = await this.supabase
        .from('result')
        .select('lesson:lesson_id(subject_id)')
        .eq('student_id', studentId)
        .in('lesson.subject_id', subjectIds)
        .is('is_deleted', false);

      if (error) {
        logger.error('Error fetching completed homework counts:', error);
        return [];
      }

      // Aggregate counts by subject_id
      const completedCountMap: { [key: string]: number } = {};
      data.forEach((row: any) => {
        const subjId = row.lesson.subject_id;
        completedCountMap[subjId] = (completedCountMap[subjId] || 0) + 1;
      });

      return Object.entries(completedCountMap).map(
        ([subject_id, completed_count]) => ({
          subject_id,
          completed_count,
        }),
      );
    } catch (err) {
      logger.error('Exception in getCompletedHomeworkCountForSubjects:', err);
      return [];
    }
  }
  async deleteApprovedOpsRequestsForUser(
    userId: string,
    schoolId?: string,
    classId?: string,
  ): Promise<void> {
    if (!this.supabase) return;

    let query = this.supabase
      .from('ops_requests')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('requested_by', userId)
      .eq('request_status', 'approved')
      .eq('is_deleted', false);

    if (schoolId) query = query.eq('school_id', schoolId);
    if (classId) query = query.eq('class_id', classId);

    const { error } = await query;

    if (error) {
      logger.error('Error deleting approved ops_requests:', error);
    }
  }
}
