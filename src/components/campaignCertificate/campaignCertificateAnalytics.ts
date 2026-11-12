import { EVENTS } from '../../common/constants';
import { CURRENT_STUDENT } from '../../common/constants';
import { store } from '../../redux/store';
import { schoolUtil } from '../../utility/schoolUtil';
import { Util } from '../../utility/util';
import type { CampaignCertificateData } from './campaignCertificate.types';

export type CampaignCertificateEvent =
  | EVENTS.CAMPAIGN_CERTIFICATE_EARNED
  | EVENTS.CAMPAIGN_CERTIFICATE_POPUP_VIEWED
  | EVENTS.CAMPAIGN_CERTIFICATE_SHARE_CLICKED
  | EVENTS.CAMPAIGN_CERTIFICATE_SHARE_SUCCESS
  | EVENTS.CAMPAIGN_CERTIFICATE_SHARE_FAILED;

export const buildCampaignAnalyticsContext = (studentId: string) => {
  let profileLanguage = localStorage.getItem('language') ?? 'en';
  try {
    const student = JSON.parse(
      localStorage.getItem(CURRENT_STUDENT) ?? '{}',
    ) as { language?: string; language_code?: string };
    profileLanguage =
      student.language_code ?? student.language ?? profileLanguage;
  } catch {
    // Keep the language stored by the app when the profile cache is unavailable.
  }

  const state = store.getState();
  return {
    student_id: studentId,
    auth_user_id: state.auth.authUser?.id ?? state.auth.user?.id ?? null,
    school_id: schoolUtil.getCurrentSchool()?.id ?? null,
    class_id: schoolUtil.getCurrentClass()?.id ?? null,
    profile_language: profileLanguage,
  };
};

export const logCampaignCertificateEvent = (
  event: CampaignCertificateEvent,
  certificate: CampaignCertificateData,
  extra: Record<string, string | number | boolean> = {},
) =>
  Util.logEvent(event, {
    ...buildCampaignAnalyticsContext(certificate.studentId ?? ''),
    campaign_id: certificate.campaignId,
    campaign_name: certificate.campaignName,
    rank_achieved: certificate.rank,
    language: certificate.languageCode ?? 'en',
    ...extra,
  });
