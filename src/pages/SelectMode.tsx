import { IonPage } from '@ionic/react';
import { FC } from 'react';
import {
  EVENTS,
  TEACHER_APP_AUTH_METHODS,
  TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS,
} from '../common/constants';
import Loading from '../components/Loading';
import TeacherAuthenticationPopup from '../components/parent/TeacherAuthenticationPopup';
import { Util } from '../utility/util';
import { useSelectModeController } from './useSelectModeController';
import SelectModeEntryStages from './SelectModeEntryStages';
import SelectModeSchoolStages from './SelectModeSchoolStages';
import './SelectMode.css';

const SelectMode: FC = () => {
  const controller = useSelectModeController();
  const {
    continueToTeacherMode,
    isLoading,
    isTeacherAuthPopupOpen,
    setIsTeacherAuthPopupOpen,
  } = controller;

  return (
    <IonPage className="select-mode-page">
      {!isLoading && (
        <div>
          <SelectModeEntryStages controller={controller} />
          <SelectModeSchoolStages controller={controller} />
        </div>
      )}

      <Loading isLoading={isLoading} />
      <TeacherAuthenticationPopup
        isOpen={isTeacherAuthPopupOpen}
        sourceEntryPoint={
          TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS.SWITCH_PROFILE_BACK_BUTTON
        }
        onClose={() => setIsTeacherAuthPopupOpen(false)}
        onAuthenticated={async () => {
          setIsTeacherAuthPopupOpen(false);
          Util.logEvent(EVENTS.TEACHER_APP_AUTH_SUCCESS, {
            auth_method_used: TEACHER_APP_AUTH_METHODS.MATH_GATE,
          });
          await continueToTeacherMode();
        }}
      />
    </IonPage>
  );
};

export default SelectMode;
