import { SupabaseClient } from '@supabase/supabase-js';
import { PROGRAM_TAB, TABLES, TabType } from '../../../common/constants';
import logger from '../../../utility/logger';
import { Json } from '../../database';
import { CampaignSetupOptions, ProgramListingProgramRow } from '../ServiceApi';
import type { CampaignNotificationPayload } from '../ServiceApi';
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
  /**
   * Supabase Storage bucket used for push notification images.
   * Must be created in the Supabase dashboard (or via the API) before uploads work.
   */
  private static readonly PUSH_NOTIFICATIONS_BUCKET = 'push-notifications';

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
          .select('id, name, model')
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
        model: program.model ? String(program.model) : null,
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

  async getCampaignNotificationLabels(): Promise<string[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.CampaignNotification)
      .select('label')
      .eq('is_deleted', false)
      .order('label', { ascending: true });

    if (error) {
      logger.error('Error fetching campaign notification labels:', error);
      return [];
    }

    return Array.from(
      new Set(
        (data ?? [])
          .map((row) => row.label?.trim())
          .filter((label): label is string => Boolean(label)),
      ),
    );
  }

  /**
   * Ensures the `push-notifications` storage bucket exists.
   * Creates it (public) if it doesn't — no-op if it already exists.
   */
  private async ensurePushNotificationsBucket(): Promise<void> {
    if (!this.supabase) return;

    const bucket = SupabaseApiCampaignPrograms.PUSH_NOTIFICATIONS_BUCKET;

    try {
      const { data: buckets, error: listError } =
        await this.supabase.storage.listBuckets();

      if (listError) {
        logger.error(
          `Failed to list storage buckets while ensuring '${bucket}':`,
          listError,
        );
        return;
      }

      const exists = buckets.some((b: { name: string }) => b.name === bucket);
      if (!exists) {
        const { error: createError } = await this.supabase.storage.createBucket(
          bucket,
          { public: true },
        );
        if (createError) {
          logger.error(
            `Failed to create storage bucket '${bucket}'. Check Supabase dashboard > Storage > Buckets. Error: ${createError.message}`,
            createError,
          );
        } else {
        }
      }
    } catch (error) {
      logger.error(
        `Unexpected error ensuring storage bucket '${bucket}':`,
        error,
      );
    }
  }

  async uploadPushNotificationImage(file: File): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    await this.ensurePushNotificationsBucket();

    const { data: authData } = await this.supabase.auth.getUser();
    const extension = file.name.split('.').pop() || 'png';
    const folder = authData.user?.id || 'anonymous';
    const filePath = `${folder}/push-notification_${Date.now()}.${extension}`;

    const { error } = await this.supabase.storage
      .from('push-notifications')
      .upload(filePath, file, { upsert: true });

    if (error) {
      logger.error('Error uploading push notification image:', error);
      throw error;
    }

    const { data: urlData } = this.supabase.storage
      .from('push-notifications')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      throw new Error(
        'Failed to generate public URL for push notification image.',
      );
    }
    return publicUrl;
  }

  async sendCampaignNotification(
    payload: CampaignNotificationPayload,
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    const DAY_INDEX: Record<string, number> = {
      Sun: 7,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    // Materialise the ad-hoc audience selection into a campaign_target_audience row.
    const { data: audienceRow, error: audienceError } = await this.supabase
      .from('campaign_target_audience')
      .insert({
        name: null,
        program_id: payload.programId,
        is_all_schools: payload.isAllSchools,
        is_all_grades: payload.isAllGrades,
        is_saved: false,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single();

    if (audienceError) {
      logger.error(
        'Error creating campaign notification audience:',
        audienceError,
      );
      throw audienceError;
    }

    const targetAudienceId = String(audienceRow.id);

    try {
      if (!payload.isAllSchools && payload.schoolIds.length > 0) {
        const { error: schoolError } = await this.supabase
          .from('campaign_target_audience_school')
          .insert(
            payload.schoolIds.map((schoolId) => ({
              target_audience_id: targetAudienceId,
              school_id: schoolId,
            })),
          );
        if (schoolError) throw schoolError;
      }

      if (!payload.isAllGrades && payload.gradeIds.length > 0) {
        const { error: gradeError } = await this.supabase
          .from('campaign_target_audience_grade')
          .insert(
            payload.gradeIds.map((gradeId) => ({
              target_audience_id: targetAudienceId,
              grade_id: gradeId,
            })),
          );
        if (gradeError) throw gradeError;
      }
    } catch (error) {
      await this.supabase
        .from('campaign_target_audience')
        .update({ is_deleted: true })
        .eq('id', targetAudienceId);
      throw error;
    }

    const recurringDays =
      payload.deliveryMode === 'recurring' && payload.recurringDays?.length
        ? payload.recurringDays
            .map((day: keyof typeof DAY_INDEX) => DAY_INDEX[day])
            .filter(
              (index: number | undefined): index is number =>
                index !== undefined,
            )
        : null;

    const isSendNow = payload.deliveryMode === 'send_now';
    const now = new Date().toISOString();
    const currentDate = new Date();
    const currentDateString = currentDate.toLocaleDateString('en-CA');
    const currentTimeString = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const campaignNotificationInsert = {
      label: payload.label,
      title: payload.title,
      message: payload.message,
      user_type: payload.userType,
      target_type: payload.activityRecency,
      image_url: payload.imageUrl?.trim() || null,
      program_id: payload.programId,
      target_audience: targetAudienceId,
      send_date: isSendNow ? currentDateString : (payload.startDate ?? null),
      send_time: isSendNow ? currentTimeString : (payload.sendTime ?? null),
      end_date:
        payload.deliveryMode === 'recurring' && payload.endDate
          ? payload.endDate
          : null,
      recurring_days: recurringDays,
      status: 'active',
      is_deleted: false,
      created_by: user?.id ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.supabase
      .from(TABLES.CampaignNotification)
      .insert(campaignNotificationInsert)
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to send campaign notification:', {
        error,
        payload: campaignNotificationInsert,
      });
      throw error;
    }
    return String(data.id);
  }
}
