const ELIGIBLE_CAMPAIGN_IDS_PREFIX = 'campaignEligibleIds:';

const keyFor = (studentId: string) =>
  `${ELIGIBLE_CAMPAIGN_IDS_PREFIX}${studentId}`;

export const getEligibleCampaignIds = (studentId: string): Set<string> => {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(keyFor(studentId)) ?? '[]',
    );
    return new Set(
      Array.isArray(value)
        ? value.filter(
            (campaignId): campaignId is string =>
              typeof campaignId === 'string',
          )
        : [],
    );
  } catch {
    return new Set();
  }
};

export const saveEligibleCampaignIds = (
  studentId: string,
  campaignIds: Set<string>,
): void =>
  localStorage.setItem(keyFor(studentId), JSON.stringify([...campaignIds]));

export const hasEligibleCampaignIds = (studentId: string): boolean =>
  localStorage.getItem(keyFor(studentId)) !== null;
