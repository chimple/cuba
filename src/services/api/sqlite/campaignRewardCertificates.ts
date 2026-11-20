type QueryResult = { values?: Array<Record<string, unknown>> };

type ExecuteQuery = (
  statement: string,
  values?: unknown[],
) => Promise<QueryResult | undefined>;

export const getCampaignCertificateIndicator = async (
  executeQuery: ExecuteQuery,
  studentId: string,
) => {
  const result = await executeQuery(
    `SELECT campaign_id FROM user_campaign_rewards
     WHERE student_id = ? AND is_deleted = 0 AND has_unseen_certificate = 1
     ORDER BY evaluated_at DESC LIMIT 1`,
    [studentId],
  );
  const campaignId = result?.values?.[0]?.campaign_id as string | undefined;
  return { hasUnseenCertificate: Boolean(campaignId), campaignId };
};

export const markCampaignCertificatesSeen = async (
  executeQuery: ExecuteQuery,
  studentId: string,
) =>
  executeQuery(
    `UPDATE user_campaign_rewards SET has_unseen_certificate = 0, updated_at = ?
     WHERE student_id = ? AND is_deleted = 0 AND has_unseen_certificate = 1`,
    [new Date().toISOString(), studentId],
  );
