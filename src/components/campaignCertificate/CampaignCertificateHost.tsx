import { useEffect, useState } from 'react';
import { CURRENT_STUDENT_CHANGED_EVENT, PAGES } from '../../common/constants';
import {
  clearPendingCampaignCertificate,
  CURRENT_STUDENT_CERTIFICATE_KEY,
  queueCampaignCertificate,
} from '../../redux/slices/campaignRewards/campaignRewardsSlice';
import { store } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import CampaignCertificateModal from './CampaignCertificateModal';
import type { CampaignCertificateData } from './campaignCertificate.types';

export const CAMPAIGN_CERTIFICATE_EARNED_EVENT =
  'chimple:campaign-certificate-earned';
const getStudentCertificateKey = (studentId?: string) =>
  studentId ?? CURRENT_STUDENT_CERTIFICATE_KEY;

const isForCurrentStudent = (certificate: CampaignCertificateData) => {
  if (!certificate.studentId) return true;
  return certificate.studentId === Util.getCurrentStudent()?.id;
};

const getCurrentRoutePathname = () => {
  const hashRoute = window.location.hash.replace(/^#/, '').split('?')[0];
  return hashRoute || window.location.pathname;
};

const canDisplayCertificate = () =>
  Boolean(Util.getCurrentStudent()?.id) &&
  !store.getState().campaignRewards.isProfileSelectionInProgress &&
  ![
    PAGES.PARENT,
    PAGES.DISPLAY_STUDENT,
    PAGES.EDIT_STUDENT,
    PAGES.STUDENT_PROGRESS,
  ].includes(getCurrentRoutePathname() as PAGES);

export const showCampaignCertificate = (
  certificate: CampaignCertificateData,
) => {
  // Queue before dispatching so an event emitted while the global host is
  // mounting is not lost. Certificates stay isolated by child profile.
  store.dispatch(
    queueCampaignCertificate({
      ...certificate,
      isNewlyEarned: certificate.isNewlyEarned ?? true,
    }),
  );
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

    const displayPendingCertificate = () => {
      if (!canDisplayCertificate()) {
        setCertificate(null);
        return;
      }
      const studentId = Util.getCurrentStudent()?.id;
      const detail =
        store.getState().campaignRewards.pendingCertificates[
          getStudentCertificateKey(studentId)
        ] ??
        store.getState().campaignRewards.pendingCertificates[
          CURRENT_STUDENT_CERTIFICATE_KEY
        ];
      if (!detail || !isForCurrentStudent(detail)) return;
      store.dispatch(
        clearPendingCampaignCertificate(
          getStudentCertificateKey(detail.studentId),
        ),
      );
      displayCertificate(detail);
    };

    const showCertificate = (event: Event) => {
      const detail = (event as CustomEvent<CampaignCertificateData>).detail;
      if (!detail) return;
      if (!canDisplayCertificate()) return;
      if (!isForCurrentStudent(detail)) return;
      store.dispatch(
        clearPendingCampaignCertificate(
          getStudentCertificateKey(detail.studentId),
        ),
      );
      displayCertificate(detail);
    };

    const handleStudentChange = () => {
      setCertificate((current) =>
        current && (!canDisplayCertificate() || !isForCurrentStudent(current))
          ? null
          : current,
      );
      displayPendingCertificate();
    };
    window.addEventListener(CAMPAIGN_CERTIFICATE_EARNED_EVENT, showCertificate);
    window.addEventListener('ionRouteDidChange', displayPendingCertificate);
    document.addEventListener('ionRouteDidChange', displayPendingCertificate);
    document.addEventListener('ionViewDidEnter', displayPendingCertificate);
    window.addEventListener('popstate', displayPendingCertificate);
    window.addEventListener(CURRENT_STUDENT_CHANGED_EVENT, handleStudentChange);
    displayPendingCertificate();
    return () => {
      window.removeEventListener(
        CAMPAIGN_CERTIFICATE_EARNED_EVENT,
        showCertificate,
      );
      window.removeEventListener(
        'ionRouteDidChange',
        displayPendingCertificate,
      );
      document.removeEventListener(
        'ionRouteDidChange',
        displayPendingCertificate,
      );
      document.removeEventListener(
        'ionViewDidEnter',
        displayPendingCertificate,
      );
      window.removeEventListener('popstate', displayPendingCertificate);
      window.removeEventListener(
        CURRENT_STUDENT_CHANGED_EVENT,
        handleStudentChange,
      );
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
        campaignEndDate: '2026-06-28T00:00:00.000Z',
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
      onCollected={async ({ campaignId, studentId }) => {
        if (!studentId) return;
        const api = ServiceConfig.getI()?.apiHandler;
        if (typeof api?.markCampaignCertificatePopupSeen !== 'function') {
          return;
        }
        try {
          await api.markCampaignCertificatePopupSeen(campaignId, studentId);
        } catch (error) {
          logger.error(
            'Failed to mark campaign certificate popup as seen',
            error,
          );
        }
      }}
    />
  );
};

export default CampaignCertificateHost;
