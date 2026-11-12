import React, { useEffect } from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { HardwareBackButtonHandler } from '../common/backButtonRegistry';
import TermsGate from '../components/termsandconditons/TermsGate';
import { useNavigationHandler } from '../helper/navigation/NavigationHandler';
import { useGenericPopup } from '../hooks/useGenericPopup';
import { useOpsConsoleBodyClass } from '../hooks/useOpsConsoleBodyClass';
import { useRouteAudioCleanup } from '../hooks/useRouteAudioCleanup';
import { useUsageLimitModal } from '../hooks/useUsageLimitModal';
import { usePredictiveDownloads } from '../hooks/usePredictiveDownloads';
import { useAppSelector } from '../redux/hooks';
import AppRoutes from './AppRoutes';
import AppOverlays from './AppOverlays';
import { CampaignCertificateHost } from '../components/campaignCertificate';
import { SqliteApi } from '../services/api/SqliteApi';
import { Util } from '../utility/util';

const AppRouteEffects = () => {
  useNavigationHandler();
  useOpsConsoleBodyClass();
  useRouteAudioCleanup();
  useEffect(() => {
    // Start the throttled campaign sync once the app shell is mounted.
    const timer = window.setTimeout(() => {
      const student = Util.getCurrentStudent();
      if (student?.id) {
        void SqliteApi.getInstance()
          .then((api) => api.syncCampaignRewards(student.id))
          .catch(() => undefined);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
};

const AppContent: React.FC = () => {
  const isGlobalLoading = useAppSelector((state) => state.auth.globalLoading);
  const popup = useGenericPopup();
  const usageLimit = useUsageLimitModal();
  usePredictiveDownloads();

  return (
    <>
      <AppRouteEffects />
      <TermsGate />
      <HardwareBackButtonHandler
        popupDataRef={popup.popupDataRef}
        setPopupData={popup.setPopupData}
        popupManager={popup.popupManager}
        showModalRef={usageLimit.showModalRef}
        setShowModal={usageLimit.setShowModal}
      />
      <IonRouterOutlet>
        <AppRoutes />
      </IonRouterOutlet>
      <AppOverlays
        isGlobalLoading={isGlobalLoading}
        popupData={popup.popupData}
        onPopupClose={popup.closePopup}
        onPopupAction={popup.actOnPopup}
        showBreakModal={usageLimit.showModal}
        onContinueFromBreak={usageLimit.continueAfterBreak}
        showBreakToast={usageLimit.showToast}
        onDismissBreakToast={() => usageLimit.setShowToast(false)}
      />
      {/* Global host lets lesson evaluation open the certificate from any route. */}
      <CampaignCertificateHost />
    </>
  );
};

export default AppContent;
