import logger from '../../../utility/logger';

export const logCampaignReward = (
  event: string,
  details: Record<string, unknown>,
) => {
  logger.warn(`[CAMPAIGN_REWARD] ${event} ${JSON.stringify(details)}`);
};

export const logCampaignFetch = (studentId: string, changes: unknown[]) =>
  logCampaignReward('campaigns fetched', {
    studentId,
    count: changes.length,
    campaigns: changes,
  });

export const logCampaignHydration = (
  studentId: string,
  localCampaignCount: number,
  eligibleCampaignCount: number,
) =>
  logCampaignReward('hydrating campaigns', {
    studentId,
    localCampaignCount,
    eligibleCampaignCount,
  });

export const logCampaignEvaluation = (
  campaign: { id: unknown; name: unknown },
  studentId: string,
  details: Record<string, unknown>,
) =>
  logCampaignReward('campaign evaluated', {
    campaignId: campaign.id,
    campaignName: campaign.name,
    studentId,
    ...details,
  });
