import { TABLES } from '../../../common/constants';
import logger from '../../../utility/logger';
import {
  CampaignMessagingQueryParams,
  CampaignMessagingResponse,
  UpdateCampaignMessagingRowPayload,
} from '../ServiceApi';
import { SupabaseApiCampaignAssignmentOptions } from './SupabaseApi.campaign.assignmentOptions';
import {
  CAMPAIGN_REACH_METRIC_WINDOW,
  DEFAULT_CAMPAIGN_MESSAGING_PAGE_SIZE,
  type CampaignAudienceAccessRow,
} from './SupabaseApi.campaign.helpers';

export interface SupabaseApiCampaignMessaging {
  [key: string]: any;
}
export class SupabaseApiCampaignMessaging extends SupabaseApiCampaignAssignmentOptions {
  async getCampaignMessaging(
    campaignId: string,
    {
      page = 1,
      pageSize = DEFAULT_CAMPAIGN_MESSAGING_PAGE_SIZE,
    }: CampaignMessagingQueryParams = {},
  ): Promise<CampaignMessagingResponse> {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.max(1, Math.floor(pageSize))
      : DEFAULT_CAMPAIGN_MESSAGING_PAGE_SIZE;
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const emptyResponse: CampaignMessagingResponse = {
      data: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
    };

    if (!this.supabase) return emptyResponse;

    try {
      const effectiveCampaignId = campaignId.trim();
      if (!effectiveCampaignId) return emptyResponse;

      const { data, error, count } = await this.supabase
        .from('campaign_messaging')
        .select('*', { count: 'exact' })
        .eq('campaign_id', effectiveCampaignId)
        .eq('is_deleted', false)
        .order('message_time', { ascending: true })
        .range(from, to);

      if (error) {
        logger.error('Error fetching campaign messaging:', error);
        return emptyResponse;
      }

      logger.info(
        `Fetched campaign messaging for campaignId=${effectiveCampaignId}, page=${safePage}, pageSize=${safePageSize}:`,
        data,
      );

      return {
        data: (data ?? []) as CampaignMessagingResponse['data'],
        total: count ?? 0,
        page: safePage,
        pageSize: safePageSize,
      };
    } catch (error) {
      logger.error('Exception fetching campaign messaging:', error);
      return emptyResponse;
    }
  }

  async updateCampaignMessaging(
    rows: UpdateCampaignMessagingRowPayload[],
  ): Promise<boolean> {
    if (!this.supabase) return false;

    const normalizedRows = rows.filter(
      (row) =>
        String(row.id ?? '').trim().length > 0 ||
        String(row.message ?? '').trim().length > 0 ||
        String(row.mediaLink ?? '').trim().length > 0 ||
        String(row.pollQuestion ?? '').trim().length > 0 ||
        row.pollOptions.some(
          (option) => String(option ?? '').trim().length > 0,
        ),
    );
    if (normalizedRows.length === 0) return true;

    const updatedAt = new Date().toISOString();

    try {
      const rowsToUpdate = normalizedRows.filter(
        (row) => String(row.id ?? '').trim().length > 0,
      );
      const rowsToInsert = normalizedRows.filter(
        (row) => String(row.id ?? '').trim().length === 0,
      );

      const updateResults = await Promise.all(
        rowsToUpdate.map((row) => {
          const pollQuestion = row.pollQuestion.trim();
          const pollOptions = row.pollOptions
            .map((option) => option.trim())
            .filter((option) => option.length > 0);

          return this.supabase!.from('campaign_messaging')
            .update({
              message: row.message.trim(),
              media_link: row.mediaLink.trim() || null,
              message_time: row.messageTime,
              poll_time: row.pollTime,
              message_status: row.messageStatus ?? null,
              poll_status: row.pollStatus ?? null,
              poll:
                pollQuestion.length > 0 || pollOptions.length > 0
                  ? {
                      question: pollQuestion,
                      options: pollOptions,
                    }
                  : null,
              updated_at: updatedAt,
            })
            .eq('id', row.id!)
            .eq('is_deleted', false);
        }),
      );

      const insertRows = rowsToInsert.map((row) => {
        const pollQuestion = row.pollQuestion.trim();
        const pollOptions = row.pollOptions
          .map((option) => option.trim())
          .filter((option) => option.length > 0);

        return {
          campaign_id: row.campaignId,
          message: row.message.trim() || null,
          media_link: row.mediaLink.trim() || null,
          message_time: row.messageTime,
          poll_time: row.pollTime,
          poll:
            pollQuestion.length > 0 || pollOptions.length > 0
              ? {
                  question: pollQuestion,
                  options: pollOptions,
                }
              : null,
          message_status: 'pending',
          poll_status: 'pending',
          is_deleted: false,
          updated_at: updatedAt,
        };
      });

      const updateFailure = updateResults.find((result) => result.error);
      if (updateFailure?.error) {
        logger.error('Error updating campaign messaging:', updateFailure.error);
        return false;
      }

      if (insertRows.length > 0) {
        const { error: insertError } = await this.supabase
          .from('campaign_messaging')
          .insert(insertRows);

        if (insertError) {
          logger.error('Error inserting campaign messaging:', insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Exception updating campaign messaging:', error);
      return false;
    }
  }

  async getCampaignParentsInGroupBySchoolIds(
    schoolIds: string[],
  ): Promise<number> {
    if (!this.supabase || schoolIds.length === 0) return 0;

    const uniqueSchoolIds = Array.from(new Set(schoolIds));
    const { data, error } = await this.supabase
      .from(TABLES.SchoolMetrics)
      .select('school_id, parents_in_group')
      .in('school_id', uniqueSchoolIds)
      .eq('metric_window', CAMPAIGN_REACH_METRIC_WINDOW)
      .eq('is_deleted', false);

    if (error) {
      logger.error(
        'Error fetching campaign parents-in-group school metrics:',
        error,
      );
      throw error;
    }

    return (data ?? []).reduce(
      (total, row) => total + (row.parents_in_group ?? 0),
      0,
    );
  }

  private async getFieldCoordinatorAccessibleCampaignIds({
    accessibleSchoolIds,
    accessibleProgramIds,
    directProgramIds,
  }: {
    accessibleSchoolIds: string[];
    accessibleProgramIds: string[];
    directProgramIds: string[];
  }): Promise<string[]> {
    if (!this.supabase) {
      return [];
    }

    const allowedCampaignIds = new Set<string>();

    if (accessibleSchoolIds.length > 0) {
      const { data: audienceAccessRows, error: audienceAccessError } =
        await this.supabase
          .from('campaign_target_audience_school')
          .select('target_audience_id')
          .in('school_id', accessibleSchoolIds)
          .eq('is_deleted', false);

      if (audienceAccessError) {
        logger.error(
          'Error fetching field coordinator audience access rows:',
          audienceAccessError,
        );
        return [];
      }

      const audienceIds = Array.from(
        new Set(
          ((audienceAccessRows ?? []) as CampaignAudienceAccessRow[])
            .map((row) => row.target_audience_id)
            .filter((id): id is string => !!id),
        ),
      );

      if (audienceIds.length > 0) {
        const { data: schoolCampaignRows, error: schoolCampaignError } =
          await this.supabase
            .from('campaign')
            .select('id')
            .eq('is_deleted', false)
            .in('target_audience_id', audienceIds);

        if (schoolCampaignError) {
          logger.error(
            'Error fetching field coordinator school-access campaign ids:',
            schoolCampaignError,
          );
          return [];
        }

        ((schoolCampaignRows ?? []) as Array<{ id?: string | null }>).forEach(
          (row) => {
            if (row.id) {
              allowedCampaignIds.add(row.id);
            }
          },
        );
      }
    }

    if (accessibleProgramIds.length > 0) {
      const { data: allSchoolsCampaignRows, error: allSchoolsCampaignError } =
        await this.supabase
          .from('campaign')
          .select(
            'id, target_audience:target_audience_id!inner(is_all_schools)',
          )
          .eq('is_deleted', false)
          .in('program_id', accessibleProgramIds)
          .eq('target_audience.is_all_schools', true);

      if (allSchoolsCampaignError) {
        logger.error(
          'Error fetching field coordinator all-schools campaign ids:',
          allSchoolsCampaignError,
        );
        return [];
      }

      ((allSchoolsCampaignRows ?? []) as Array<{ id?: string | null }>).forEach(
        (row) => {
          if (row.id) {
            allowedCampaignIds.add(row.id);
          }
        },
      );
    }

    if (directProgramIds.length > 0) {
      const { data: directProgramCampaignRows, error: directProgramError } =
        await this.supabase
          .from('campaign')
          .select('id')
          .eq('is_deleted', false)
          .in('program_id', directProgramIds);

      if (directProgramError) {
        logger.error(
          'Error fetching field coordinator direct-program campaign ids:',
          directProgramError,
        );
        return [];
      }

      (
        (directProgramCampaignRows ?? []) as Array<{ id?: string | null }>
      ).forEach((row) => {
        if (row.id) {
          allowedCampaignIds.add(row.id);
        }
      });
    }

    return Array.from(allowedCampaignIds);
  }
}
