export type CampaignCertificateRank = 1 | 2 | 3 | 'participation' | 'progress';

export type CampaignCertificateData = {
  campaignId: string;
  campaignName: string;
  studentName: string;
  rank: CampaignCertificateRank;
  awardedAt: string | Date;
  // IDs are retained for the required analytics base context payload.
  studentId?: string;
  schoolId?: string;
  languageCode?: string;
  isNewlyEarned?: boolean;
};

export type CampaignCertificateLabels = {
  title?: string;
  awardedTo?: string;
  congratulations?: string;
  encouragement?: string;
  share?: string;
};
