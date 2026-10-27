import { EVENTS } from '../../common/constants';
import { Util } from '../../utility/util';
import type { CampaignCertificateData } from './campaignCertificate.types';

export type CampaignCertificateEvent =
  | EVENTS.CAMPAIGN_CERTIFICATE_EARNED
  | EVENTS.CAMPAIGN_CERTIFICATE_POPUP_VIEWED
  | EVENTS.CAMPAIGN_CERTIFICATE_SHARE_CLICKED
  | EVENTS.CAMPAIGN_CERTIFICATE_SHARE_SUCCESS
  | EVENTS.CAMPAIGN_CERTIFICATE_SHARE_FAILED;

export const logCampaignCertificateEvent = (
  event: CampaignCertificateEvent,
  certificate: CampaignCertificateData,
  extra: Record<string, string | number | boolean> = {},
) =>
  Util.logEvent(event, {
    // Include the shared context fields on every certificate telemetry event.
    student_id: certificate.studentId ?? '',
    school_id: certificate.schoolId ?? '',
    campaign_id: certificate.campaignId,
    campaign_name: certificate.campaignName,
    rank_achieved: certificate.rank,
    language: certificate.languageCode ?? 'en',
    ...extra,
  });
