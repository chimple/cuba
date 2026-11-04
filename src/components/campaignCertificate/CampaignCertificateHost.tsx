import { useEffect, useState } from 'react';
import CampaignCertificateModal from './CampaignCertificateModal';
import type { CampaignCertificateData } from './campaignCertificate.types';

export const CAMPAIGN_CERTIFICATE_EARNED_EVENT =
  'chimple:campaign-certificate-earned';

export const showCampaignCertificate = (
  certificate: CampaignCertificateData,
) => {
  window.dispatchEvent(
    new CustomEvent<CampaignCertificateData>(
      CAMPAIGN_CERTIFICATE_EARNED_EVENT,
      {
        detail: certificate,
      },
    ),
  );
};

const CampaignCertificateHost = () => {
  const [certificate, setCertificate] =
    useState<CampaignCertificateData | null>(null);

  useEffect(() => {
    const showCertificate = (event: Event) => {
      const detail = (event as CustomEvent<CampaignCertificateData>).detail;
      setCertificate(
        detail
          ? { ...detail, isNewlyEarned: detail.isNewlyEarned ?? true }
          : null,
      );
    };
    window.addEventListener(CAMPAIGN_CERTIFICATE_EARNED_EVENT, showCertificate);
    return () =>
      window.removeEventListener(
        CAMPAIGN_CERTIFICATE_EARNED_EVENT,
        showCertificate,
      );
  }, []);

  // QA preview works from either Home route (the app has kid and teacher Home routes).
  useEffect(() => {
    if (
      !new URLSearchParams(window.location.search).has(
        'campaignCertificatePreview',
      )
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      let studentName = 'Madhavi';
      try {
        const student = JSON.parse(
          localStorage.getItem('currentStudent') ?? '{}',
        ) as { name?: string };
        studentName = student.name ?? studentName;
      } catch {
        // Use the preview name when no child profile is available.
      }

      showCampaignCertificate({
        campaignId: 'campaign-certificate-preview',
        campaignName: 'Chimple Summer League, Jun 2026',
        studentName,
        rank: 1,
        awardedAt: '2026-06-28T00:00:00.000Z',
        languageCode: localStorage.getItem('language') ?? 'en',
        isNewlyEarned: false,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!certificate) return null;
  return (
    <CampaignCertificateModal
      certificate={certificate}
      onClose={() => setCertificate(null)}
    />
  );
};

export default CampaignCertificateHost;
