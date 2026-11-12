import { useEffect, useState } from 'react';
import { PAGES } from '../../common/constants';
import CampaignCertificateModal from './CampaignCertificateModal';
import type { CampaignCertificateData } from './campaignCertificate.types';

export const CAMPAIGN_CERTIFICATE_EARNED_EVENT =
  'chimple:campaign-certificate-earned';
const PENDING_CERTIFICATE_STORAGE_KEY = 'campaignCertificatePending';

const isHomeRoute = (pathname: string) => pathname === PAGES.HOME;

export const showCampaignCertificate = (
  certificate: CampaignCertificateData,
) => {
  // Persist before dispatching so an event emitted while the global host is
  // mounting is not lost (this is common on native scorecard navigation).
  const isPreview = new URLSearchParams(window.location.search).has(
    'campaignCertificatePreview',
  );
  if (!isPreview) {
    localStorage.setItem(
      PENDING_CERTIFICATE_STORAGE_KEY,
      JSON.stringify({
        ...certificate,
        isNewlyEarned: certificate.isNewlyEarned ?? true,
      }),
    );
  }
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
    const displayCertificate = (detail: CampaignCertificateData) => {
      setCertificate({
        ...detail,
        isNewlyEarned: detail.isNewlyEarned ?? true,
      });
    };

    const displayPendingCertificateOnHome = () => {
      // Lesson scorecards keep the event queued until Continue Playing returns
      // the learner to Home, where the global modal is visible to the child.
      if (!isHomeRoute(window.location.pathname)) return;
      const pending = localStorage.getItem(PENDING_CERTIFICATE_STORAGE_KEY);
      if (!pending) return;
      try {
        const detail = JSON.parse(pending) as CampaignCertificateData;
        localStorage.removeItem(PENDING_CERTIFICATE_STORAGE_KEY);
        displayCertificate(detail);
      } catch {
        localStorage.removeItem(PENDING_CERTIFICATE_STORAGE_KEY);
      }
    };

    const showCertificate = (event: Event) => {
      const detail = (event as CustomEvent<CampaignCertificateData>).detail;
      if (!detail) return;
      const isPreview = new URLSearchParams(window.location.search).has(
        'campaignCertificatePreview',
      );
      if (!isHomeRoute(window.location.pathname) && !isPreview) {
        localStorage.setItem(
          PENDING_CERTIFICATE_STORAGE_KEY,
          JSON.stringify({
            ...detail,
            isNewlyEarned: detail.isNewlyEarned ?? true,
          }),
        );
        return;
      }
      if (!isPreview) {
        localStorage.removeItem(PENDING_CERTIFICATE_STORAGE_KEY);
      }
      displayCertificate(detail);
    };
    window.addEventListener(CAMPAIGN_CERTIFICATE_EARNED_EVENT, showCertificate);
    window.addEventListener(
      'ionRouteDidChange',
      displayPendingCertificateOnHome,
    );
    document.addEventListener(
      'ionRouteDidChange',
      displayPendingCertificateOnHome,
    );
    document.addEventListener(
      'ionViewDidEnter',
      displayPendingCertificateOnHome,
    );
    window.addEventListener('popstate', displayPendingCertificateOnHome);
    displayPendingCertificateOnHome();
    return () => {
      window.removeEventListener(
        CAMPAIGN_CERTIFICATE_EARNED_EVENT,
        showCertificate,
      );
      window.removeEventListener(
        'ionRouteDidChange',
        displayPendingCertificateOnHome,
      );
      document.removeEventListener(
        'ionRouteDidChange',
        displayPendingCertificateOnHome,
      );
      document.removeEventListener(
        'ionViewDidEnter',
        displayPendingCertificateOnHome,
      );
      window.removeEventListener('popstate', displayPendingCertificateOnHome);
    };
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
