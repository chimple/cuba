import { IonRouterOutlet } from '@ionic/react';
import { HardwareBackButtonHandler } from '../common/backButtonRegistry';
import TermsGate from '../components/termsandconditons/TermsGate';
import { useNavigationHandler } from '../helper/navigation/NavigationHandler';
import { useGenericPopup } from '../hooks/useGenericPopup';
import { useOpsConsoleBodyClass } from '../hooks/useOpsConsoleBodyClass';
import { useRouteAudioCleanup } from '../hooks/useRouteAudioCleanup';
import { useUsageLimitModal } from '../hooks/useUsageLimitModal';
import { useAppSelector } from '../redux/hooks';
import AppRoutes from './AppRoutes';
import AppOverlays from './AppOverlays';

const AppRouteEffects = () => {
  useNavigationHandler();
  useOpsConsoleBodyClass();
  useRouteAudioCleanup();
  return null;
};

const AppContent: React.FC = () => {
  const isGlobalLoading = useAppSelector((state) => state.auth.globalLoading);
  const popup = useGenericPopup();
  const usageLimit = useUsageLimitModal();

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
    </>
  );
};

export default AppContent;
