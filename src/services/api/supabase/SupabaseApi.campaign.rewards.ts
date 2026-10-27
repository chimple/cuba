import { CAMPAIGN_REWARD_LOG_KEYWORD } from '../../../common/constants';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import type { CampaignStudentRewardPayload } from '../ServiceApi';
import { SupabaseApiCampaignMessaging } from './SupabaseApi.campaign.messaging';

/** Supabase operations supporting offline campaign reward evaluation. */
export class SupabaseApiCampaignRewards extends SupabaseApiCampaignMessaging {
  /** Fetches incremental campaign configuration changes for one student. */
  async getActiveCampaigns(
    studentId: string,
    lastFetchTimestamp?: string | null,
  ): Promise<
    Database['public']['Functions']['get_active_campaigns']['Returns']
  > {
    if (!this.supabase || !studentId) return [];

    const { data, error } = await this.supabase.rpc('get_active_campaigns', {
      p_student_id: studentId,
      p_last_fetch_timestamp: lastFetchTimestamp ?? null,
    });
    logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} campaigns fetched`, {
      studentId,
      lastFetchTimestamp: lastFetchTimestamp ?? null,
      count: data?.length ?? 0,
    });
    if (error) {
      logger.error(
        `${CAMPAIGN_REWARD_LOG_KEYWORD} campaign fetch failed`,
        error,
      );
      throw error;
    }
    return (data ??
      []) as Database['public']['Functions']['get_active_campaigns']['Returns'];
  }

  /** Persists a locally evaluated reward outcome for Ops reporting. */
  async upsertCampaignStudentReward(
    payload: CampaignStudentRewardPayload,
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();
    logger.info(
      `${CAMPAIGN_REWARD_LOG_KEYWORD} reward upsert started`,
      payload,
    );
    const { error } = await this.supabase
      .from('campaign_student_rewards')
      .upsert(
        {
          campaign_id: payload.campaignId,
          student_id: payload.studentId,
          rank_achieved: payload.rankAchieved,
          status: payload.status,
          evaluated_at: payload.evaluatedAt ?? now,
          updated_at: now,
          is_deleted: false,
        },
        { onConflict: 'campaign_id,student_id' },
      );

    if (error) {
      logger.error(
        `${CAMPAIGN_REWARD_LOG_KEYWORD} reward upsert failed`,
        error,
      );
      throw error;
    }
    logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} reward upsert completed`, {
      campaignId: payload.campaignId,
      studentId: payload.studentId,
    });
  }
}
