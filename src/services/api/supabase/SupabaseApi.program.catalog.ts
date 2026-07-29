import { OPS_ROLES, TABLES } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Json } from '../../database';
import { SupabaseApiProgramFoundation } from './SupabaseApi.program.foundation';

const SCHOOL_METRIC_GRADE_BATCH_SIZE = 1000;

const mergeGradeIds = (
  gradeIds: Set<string>,
  rows: Array<{ grade_id?: string | null }>,
) => {
  rows.forEach((row) => {
    if (row.grade_id) gradeIds.add(row.grade_id);
  });
};

export interface SupabaseApiProgramCatalog {
  [key: string]: any;
}
export class SupabaseApiProgramCatalog extends SupabaseApiProgramFoundation {
  async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: {
      name: string;
      role: string;
      phone: string;
      email: string;
    }[];
  } | null> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return null;
    }

    try {
      const { data: program, error: programError } = await this.supabase
        .from('program')
        .select('*')
        .eq('id', programId)
        .single();

      if (programError || !program) {
        logger.error('Error fetching program:', programError);
        return null;
      }

      const { data: mappings, error: mappingsError } = await this.supabase
        .from('program_user')
        .select('user')
        .eq('program_id', programId)
        .eq('role', 'program_manager')
        .eq('is_deleted', false);

      if (mappingsError) {
        logger.error('Error fetching program managers:', mappingsError);
        return null;
      }

      const userIds = mappings
        .map((m) => m.user)
        .filter((id): id is string => !!id);

      const { data: users, error: usersError } = await this.supabase
        .from('user')
        .select('*')
        .in('id', userIds);
      if (usersError) {
        logger.error('Error fetching user details:', usersError);
        return null;
      }

      const programDetails = [
        {
          id: 'program_name',
          label: 'Program Name',
          value: program.name ?? '',
        },
        {
          id: 'program_type',
          label: 'Program Type',
          value: program.program_type ?? '',
        },
        {
          id: 'program_model',
          label: 'Program Model',
          value: Array.isArray(program.model)
            ? program.model.join(', ')
            : (program.model ?? ''),
        },
        {
          id: 'program_date',
          label: 'Program Date',
          value: `${program.start_date ?? ''}  ${program.end_date ?? ''}`,
        },
      ];

      const locationDetails = [
        { id: 'country', label: 'Country', value: program.country ?? '' },
        { id: 'state', label: 'State', value: program.state ?? '' },
        { id: 'district', label: 'District', value: program.district ?? '' },
        // { id: "cluster", label: "Cluster", value: program.cluster ?? "" },
        // { id: "block", label: "Block", value: program.block ?? "" },
        // { id: "village", label: "Village", value: program.village ?? "" },
      ];

      const partnerDetails = [
        {
          id: 'implementation_partner',
          label: 'Implementation Partner',
          value: program.implementation_partner ?? '',
        },
        {
          id: 'funding_partner',
          label: 'Funding Partner',
          value: program.funding_partner ?? '',
        },
        {
          id: 'institute_owner',
          label: 'Institute Owner',
          value: program.institute_partner ?? '',
        },
      ];
      const programManagers = (users ?? []).map((user) => ({
        name: user.name ?? '',
        role: 'Program Manager',
        phone: user.phone ?? '',
        email: user.email ?? '',
      }));

      return {
        programDetails,
        locationDetails,
        partnerDetails,
        programManagers,
      };
    } catch (err) {
      logger.error('Unexpected error in getProgramData:', err);
      return null;
    }
  }
  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, unknown[]>
  > {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return {};
    }

    const emptyOptions: Record<string, unknown[]> = {
      program: [],
      grade: [],
      state: [],
      district: [],
      block: [],
      programType: [],
      partner: [],
      programManager: [],
      fieldCoordinator: [],
      cluster: [],
    };

    try {
      const [{ data, error }, metricGradeResult] = await Promise.all([
        this.supabase.rpc('get_school_filter_options'),
        this.supabase
          .from(TABLES.SchoolMetrics)
          .select('grade_id', { count: 'exact' })
          .eq('is_deleted', false)
          .not('grade_id', 'is', null)
          .range(0, SCHOOL_METRIC_GRADE_BATCH_SIZE - 1),
      ]);

      if (error) {
        logger.error(
          'RPC error in getSchoolFilterOptionsForSchoolListing:',
          error,
        );
        return emptyOptions;
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return emptyOptions;
      }

      const rpcData = data as Record<string, Json>;
      const gradeIds = new Set<string>();
      mergeGradeIds(gradeIds, metricGradeResult.data ?? []);

      let fetchedGradeRows = metricGradeResult.data?.length ?? 0;
      const totalGradeRows = metricGradeResult.count ?? fetchedGradeRows;
      while (fetchedGradeRows < totalGradeRows) {
        const { data: nextGradeRows, error: nextGradeRowsError } =
          await this.supabase
            .from(TABLES.SchoolMetrics)
            .select('grade_id')
            .eq('is_deleted', false)
            .not('grade_id', 'is', null)
            .range(
              fetchedGradeRows,
              fetchedGradeRows + SCHOOL_METRIC_GRADE_BATCH_SIZE - 1,
            );

        if (nextGradeRowsError) {
          logger.error(
            'Error fetching grade ids from school_metrics:',
            nextGradeRowsError,
          );
          break;
        }

        const rows = nextGradeRows ?? [];
        if (rows.length === 0) break;

        mergeGradeIds(gradeIds, rows);
        fetchedGradeRows += rows.length;
      }

      const gradeResult =
        gradeIds.size > 0
          ? await this.supabase
              .from('grade')
              .select('id, name, sort_index')
              .in('id', Array.from(gradeIds))
              .eq('is_deleted', false)
              .order('sort_index', { ascending: true })
              .order('name', { ascending: true })
          : { data: [], error: null };

      if (metricGradeResult.error) {
        logger.error(
          'Error fetching grade ids from school_metrics:',
          metricGradeResult.error,
        );
      }
      if (gradeResult.error) {
        logger.error('Error fetching grade labels:', gradeResult.error);
      }

      const gradeOptions = (gradeResult.data ?? [])
        .map((grade) => (typeof grade.name === 'string' ? grade.name : ''))
        .filter((name) => name.trim().length > 0);

      const programOptions = Array.isArray(rpcData.program)
        ? (rpcData.program as unknown[])
            .map((item) => {
              if (typeof item === 'string') {
                return { id: item, name: item };
              }
              if (
                item &&
                typeof item === 'object' &&
                !Array.isArray(item) &&
                'id' in item &&
                'name' in item
              ) {
                const option = item as { id?: unknown; name?: unknown };
                if (
                  typeof option.id === 'string' &&
                  typeof option.name === 'string'
                ) {
                  return { id: option.id, name: option.name };
                }
              }
              return null;
            })
            .filter(
              (item): item is { id: string; name: string } => item !== null,
            )
        : [];

      return {
        grade: gradeOptions,
        program: programOptions,
        state: Array.isArray(rpcData.state) ? (rpcData.state as string[]) : [],
        district: Array.isArray(rpcData.district)
          ? (rpcData.district as string[])
          : [],
        block: Array.isArray(rpcData.block) ? (rpcData.block as string[]) : [],
        programType: Array.isArray(rpcData.programType)
          ? (rpcData.programType as string[])
          : [],
        partner: Array.isArray(rpcData.partner)
          ? (rpcData.partner as string[])
          : [],
        programManager: Array.isArray(rpcData.programManager)
          ? (rpcData.programManager as string[])
          : [],
        fieldCoordinator: Array.isArray(rpcData.fieldCoordinator)
          ? (rpcData.fieldCoordinator as string[])
          : [],
        cluster: Array.isArray(rpcData.cluster)
          ? (rpcData.cluster as string[])
          : [],
      };
    } catch (err) {
      logger.error('Unexpected error in getSchoolFilterOptions:', err);
      return emptyOptions;
    }
  }

  async getSchoolFilterOptionsForProgram(
    programId: string,
  ): Promise<Record<string, string[]>> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return {};
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'get_school_filter_options_for_program',
        { input_program_id: programId },
      );

      if (error) {
        logger.error('RPC error in getSchoolFilterOptionsForProgram:', error);
        return {};
      }

      const parsed: Record<string, string[]> = {
        state: [],
        district: [],
        block: [],
        cluster: [],
        programType: [],
        partner: [],
        programManager: [],
        fieldCoordinator: [],
        model: [],
      };

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        for (const key in parsed) {
          const val = (data as Record<string, Json>)[key];
          parsed[key] = Array.isArray(val)
            ? val.filter(
                (v): v is string =>
                  typeof v === 'string' && v.trim() !== '' && v !== 'null',
              )
            : [];
        }
      }

      return parsed;
    } catch (err) {
      logger.error(
        'Unexpected error in getSchoolFilterOptionsForProgram:',
        err,
      );
      return {};
    }
  }

  async createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }> {
    if (!this.supabase) {
      return { success: false, error: 'Supabase not initialized' };
    }
    try {
      const { data, error: functionError } =
        await this.supabase.functions.invoke('get_or_create_user', {
          body: {
            name: payload.name,
            email: payload.email || undefined,
            phone: payload.phone || undefined,
          },
        });
      if (functionError) {
        const body = data as any;
        const errorCode = body?.message || 'unknown-error';
        const errorDetail = body?.error || functionError.message;
        return {
          success: false,
          message: errorCode,
          error: errorDetail || 'Unexpected error occurred',
        };
      }
      const body = data as any;
      const user = body?.user;
      const isNew = body?.is_new === true;
      if (!user || !user.id) {
        return {
          success: false,
          message: 'unexpected-error',
          error: 'Invalid response from ops_adding_and_creating_user',
        };
      }
      const userId: string = user.id as string;
      const { data: existingSpecial, error: specialError } = await this.supabase
        .from('special_users')
        .select('id, role')
        .eq('user_id', userId)
        .eq('is_deleted', false);
      if (specialError) {
        return {
          success: false,
          message: 'db-role-check-failed',
          error: specialError.message,
        };
      }
      const rolesToBlock: RoleType[] = [
        RoleType.PROGRAM_MANAGER,
        RoleType.FIELD_COORDINATOR,
      ];
      const hasBlockedRole =
        existingSpecial?.some((entry) =>
          rolesToBlock.includes(entry.role as RoleType),
        ) ?? false;
      if (hasBlockedRole) {
        return {
          success: true,
          user_id: userId,
          message: 'success-user-already-exists',
        };
      }
      const roleForInsert = OPS_ROLES.find((r) => r === payload.role) as
        | RoleType
        | any;
      const { error: insertSpecialError } = await this.supabase
        .from('special_users')
        .insert({
          user_id: userId,
          role: roleForInsert,
          is_deleted: false,
        });
      if (insertSpecialError) {
        return {
          success: false,
          message: 'insert-role-failed',
          error: insertSpecialError.message,
        };
      }
      const successMessage = isNew
        ? 'success-created'
        : 'success-added-to-special_users';
      return {
        success: true,
        user_id: userId,
        message: successMessage,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'unexpected-error',
        error: err?.message || 'Unexpected error occurred',
      };
    }
  }
}
