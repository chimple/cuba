import { SupabaseClient } from '@supabase/supabase-js';
import { PROGRAM_TAB, TabType } from '../../../common/constants';
import logger from '../../../utility/logger';
import { Json } from '../../database';
import { CampaignSetupOptions, ProgramListingProgramRow } from '../ServiceApi';
import {
  type CampaignProgramRow,
  type CampaignSavedAudienceGroupRow,
  type ProgramMetricsDatabase,
  type ProgramMetricsTableRow,
} from './SupabaseApi.campaign.helpers';
import { SupabaseApiOpsLearningPath } from './SupabaseApi.ops.learningPath';

export interface SupabaseApiCampaignPrograms {
  [key: string]: any;
}
export class SupabaseApiCampaignPrograms extends SupabaseApiOpsLearningPath {
  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return {};
    }

    try {
      // Normalizes array fields that may arrive as real arrays or JSON strings.
      const normalizeProgramMetricsStringList = (
        value: string[] | string | null | undefined,
      ): string[] => {
        const normalizeString = (item: string): string[] => {
          const trimmedItem = item.trim();
          if (!trimmedItem || trimmedItem === 'null') return [];
          if (!trimmedItem.startsWith('[')) return [trimmedItem];
          try {
            const parsed = JSON.parse(trimmedItem) as Json;
            if (!Array.isArray(parsed)) return [trimmedItem];
            return parsed.filter(
              (entry): entry is string =>
                typeof entry === 'string' &&
                entry.trim() !== '' &&
                entry !== 'null',
            );
          } catch {
            return [trimmedItem];
          }
        };

        if (Array.isArray(value)) {
          return value.flatMap((item) =>
            typeof item === 'string' ? normalizeString(item) : [],
          );
        }
        return typeof value === 'string' ? normalizeString(value) : [];
      };

      // Builds the Program Listing drawer filter options from program_metrics rows.
      const buildProgramMetricsFilterOptions = (
        rows: ProgramMetricsTableRow[],
      ): Record<string, string[]> => {
        const options = {
          partner: new Set<string>(),
          programManager: new Set<string>(),
          programType: new Set<string>(),
          state: new Set<string>(),
          district: new Set<string>(),
        };

        rows.forEach((row) => {
          normalizeProgramMetricsStringList(row.partners).forEach((value) =>
            options.partner.add(value),
          );
          normalizeProgramMetricsStringList(row.program_managers).forEach(
            (value) => options.programManager.add(value),
          );
          if (row.program_type) options.programType.add(row.program_type);
          if (row.state?.trim()) options.state.add(row.state.trim());
          if (row.district?.trim()) options.district.add(row.district.trim());
        });

        return {
          partner: Array.from(options.partner).sort(),
          programManager: Array.from(options.programManager).sort(),
          programType: Array.from(options.programType).sort(),
          state: Array.from(options.state).sort(),
          district: Array.from(options.district).sort(),
        };
      };

      const programMetricsClient = this
        .supabase as SupabaseClient<ProgramMetricsDatabase>;
      const { data, error } = await programMetricsClient
        .from('program_metrics')
        .select(
          'partners,program_managers,program_type,state,district,is_deleted',
        )
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error fetching program_metrics filter options:', error);
        return {};
      }

      return buildProgramMetricsFilterOptions(
        (data ?? []) as ProgramMetricsTableRow[],
      );
    } catch (err) {
      logger.error('Unexpected error:', err);
      return {};
    }
  }

  async getPrograms({
    currentUserId,
    filters = {},
    searchTerm = '',
    tab = PROGRAM_TAB.ALL,
    limit = 10,
    offset = 0,
    orderBy = 'name',
    order = 'asc',
    date_range,
  }: {
    currentUserId?: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    date_range?: string;
  }): Promise<{ data: ProgramListingProgramRow[]; total: number }> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized');
      return { data: [], total: 0 };
    }

    try {
      const authUserId =
        currentUserId ||
        (await this.supabase.auth.getUser()).data.user?.id ||
        '';
      if (!authUserId) {
        logger.error('Current user is not available for program query');
        return { data: [], total: 0 };
      }

      // The public API uses limit/offset pagination while the existing metrics
      // implementation uses page/page_size internally.
      return await this.getProgramsFromProgramMetrics({
        currentUserId: authUserId,
        filters,
        tab,
        page: Math.floor(Math.max(offset, 0) / Math.max(limit, 1)) + 1,
        page_size: Math.max(limit, 1),
        order_by: orderBy === 'name' ? 'program_name' : orderBy,
        order_dir: order,
        search: searchTerm,
        date_range,
      });
    } catch (err) {
      logger.error('Unexpected error in getPrograms:', err);
      return { data: [], total: 0 };
    }
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data, error } = await this.supabase.rpc('get_program_managers');

    if (error) {
      logger.error('Error fetching managers:', error);
      return [];
    }

    return (data as { name: string; id: string }[]) || [];
  }

  async getCampaignSetupOptions(): Promise<CampaignSetupOptions> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return { programs: [], managers: [], savedGroups: [] };
    }

    const [programsResponse, managers, savedGroupsResponse] = await Promise.all(
      [
        this.supabase
          .from('program')
          .select('id, name')
          .eq('is_deleted', false)
          .order('name', { ascending: true }),
        this.getProgramManagers(),
        this.supabase
          .from('campaign_target_audience')
          .select(
            'id, name, program_id, is_all_schools, is_all_grades, campaign_target_audience_school(school_id), campaign_target_audience_grade(grade_id)',
          )
          .eq('is_deleted', false)
          .eq('is_saved', true)
          .order('created_at', { ascending: false }),
      ],
    );

    if (programsResponse.error) {
      logger.error('Error fetching campaign programs:', programsResponse.error);
    }

    if (savedGroupsResponse.error) {
      logger.error(
        'Error fetching campaign saved groups:',
        savedGroupsResponse.error,
      );
    }

    const programs = ((programsResponse.data ?? []) as CampaignProgramRow[])
      .filter((program) => program.id && program.name)
      .map((program) => ({
        id: String(program.id),
        name: String(program.name),
      }));

    const savedGroups = (
      (savedGroupsResponse.data ?? []) as CampaignSavedAudienceGroupRow[]
    )
      .filter((group) => group.id && group.name && group.program_id)
      .map((group) => this.mapCampaignSavedAudienceGroup(group));

    return {
      programs,
      managers,
      savedGroups,
    };
  }
}
