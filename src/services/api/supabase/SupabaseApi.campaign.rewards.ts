import logger from '../../../utility/logger';
import { Database } from '../../database';
import type { CampaignStudentRewardPayload } from '../ServiceApi';
import { SupabaseApiCampaignMessaging } from './SupabaseApi.campaign.messaging';

/** Supabase operations supporting offline campaign reward evaluation. */
export class SupabaseApiCampaignRewards extends SupabaseApiCampaignMessaging {
  async getCampaignCertificateIndicator(_studentId: string): Promise<{
    hasUnseenCertificate: boolean;
    campaignId?: string;
  }> {
    return { hasUnseenCertificate: false };
  }

  async markCampaignCertificatesSeen(_studentId: string): Promise<void> {}

  async markCampaignCertificatePopupSeen(
    campaignId: string,
    studentId: string,
  ): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase
      .from('user_campaign_rewards')
      .update({
        is_certificate_popup_seen: true,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .eq('student_id', studentId);

    if (error) {
      logger.error('Campaign certificate popup seen update failed', error);
      throw error;
    }
  }

  async getCampaignCertificatePopupSeen(
    campaignId: string,
    studentId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    const { data, error } = await this.supabase
      .from('user_campaign_rewards')
      .select('is_certificate_popup_seen')
      .eq('campaign_id', campaignId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      logger.error('Campaign certificate popup seen fetch failed', error);
      throw error;
    }

    return data?.is_certificate_popup_seen ?? false;
  }

  /** Preserves the existing RPC for campaign-config sync callers outside goal rendering. */
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
    if (error) {
      logger.error('Campaign fetch failed', error);
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
    const { error } = await this.supabase.from('user_campaign_rewards').upsert(
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
      logger.error('Campaign reward upload failed', error);
      throw error;
    }
  }
}
