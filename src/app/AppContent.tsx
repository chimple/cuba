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
import { setCertificateProfileSelectionInProgress } from '../redux/slices/campaignRewards/campaignRewardsSlice';
import { store } from '../redux/store';
import AppRoutes from './AppRoutes';
import AppOverlays from './AppOverlays';
import { CampaignCertificateHost } from '../components/campaignCertificate';
import { SqliteApi } from '../services/api/SqliteApi';
import { Util } from '../utility/util';
import {
  CURRENT_STUDENT_CHANGED_EVENT,
  MODES,
  SELECTED_CLASSES,
} from '../common/constants';

const AppRouteEffects = () => {
  useNavigationHandler();
  useOpsConsoleBodyClass();
  useRouteAudioCleanup();
  useEffect(() => {
    // This guard is only meaningful during one profile-selection transition.
    // Reset any persisted value left by an interrupted app session.
    store.dispatch(setCertificateProfileSelectionInProgress(false));

    let disposed = false;
    let lastSelectedStudentId = Util.getCurrentStudent()?.id;
    let syncInFlight = false;
    let profilesPreloaded = false;

    // Campaign rewards are student-scoped. Sync the selected profile as soon
    // as it is available, then warm the cache for the other profiles in the
    // background so switching profiles does not require a refresh.
    const syncProfiles = async (selectedStudentId?: string) => {
      const api = await SqliteApi.getInstance();
      if (disposed) return;

      const studentIds = new Set<string>();
      const isSchoolMode =
        api.currentMode === MODES.SCHOOL ||
        api.currentMode === MODES.TEACHER_SCHOOL;

      if (isSchoolMode) {
        const schoolId = api.currentSchool?.id ?? Util.getCurrentSchool()?.id;
        const selectedClass = api.currentClass ?? Util.getCurrentClass();
        let classIds: string[] = [];

        if (schoolId) {
          const classes = await api
            .getClassesBySchoolId(schoolId)
            .catch(() => []);
          classIds = classes.map((classroom) => classroom.id);
        } else {
          const storedClasses = localStorage.getItem(SELECTED_CLASSES);
          if (storedClasses) {
            try {
              const parsedClasses: unknown = JSON.parse(storedClasses);
              if (Array.isArray(parsedClasses)) {
                classIds = parsedClasses.flatMap((classroom) =>
                  typeof classroom === 'object' &&
                  classroom !== null &&
                  'id' in classroom &&
                  typeof classroom.id === 'string'
                    ? [classroom.id]
                    : [],
                );
              }
            } catch {
              classIds = [];
            }
          }

          if (classIds.length === 0 && selectedClass?.id) {
            classIds = [selectedClass.id];
          }
        }

        const studentsByClass = await Promise.all(
          [...new Set(classIds)].map((classId) =>
            api.getStudentsForClass(classId).catch(() => []),
          ),
        );

        studentsByClass.flat().forEach((student) => {
          if (student?.id) studentIds.add(student.id);
        });
      } else {
        const profiles = await api.getParentStudentProfiles().catch(() => []);
        profiles.forEach((profile) => {
          if (profile?.id) studentIds.add(profile.id);
        });
      }
      if (selectedStudentId) studentIds.add(selectedStudentId);

      await Promise.allSettled(
        [...studentIds].map((studentId) =>
          api.syncCampaignRewards(studentId).catch(() => undefined),
        ),
      );
      profilesPreloaded = true;
    };

    const startSync = (studentId: string) => {
      if (syncInFlight) return;
      syncInFlight = true;
      void syncProfiles(studentId).finally(() => {
        syncInFlight = false;
      });
    };

    const handleStudentChange = (event: Event) => {
      const studentId = (event as CustomEvent<{ id?: string }>)?.detail?.id;
      if (
        !studentId ||
        studentId === lastSelectedStudentId ||
        profilesPreloaded
      ) {
        return;
      }
      lastSelectedStudentId = studentId;
      startSync(studentId);
    };

    window.addEventListener(CURRENT_STUDENT_CHANGED_EVENT, handleStudentChange);

    const timer = window.setTimeout(() => {
      const studentId = Util.getCurrentStudent()?.id;
      if (!studentId) return;
      lastSelectedStudentId = studentId;
      startSync(studentId);
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.removeEventListener(
        CURRENT_STUDENT_CHANGED_EVENT,
        handleStudentChange,
      );
    };
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
