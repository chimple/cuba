import { IonPage } from '@ionic/react';
import { t } from 'i18next';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { FC, useEffect } from 'react';
import { useHistory } from 'react-router';
import {
  CHIMPLE_MASCOT_ANIMATION_WAVY,
  MODES,
  PAGES,
  CURRENT_SCHOOL_NAME,
  CURRENT_CLASS_NAME,
  SELECTED_CLASSES,
  SELECTED_STUDENTS,
  USER_SELECTION_STAGE,
  SCHOOL,
  CLASS,
} from '../../common/constants';
import ChimpleRiveMascot from '../../components/learningPathway/ChimpleRiveMascot';
import { schoolUtil } from '../../utility/schoolUtil';
import { ReactComponent as HomeLocationIcon } from '../assets/icons/homeLocationIcon.svg';
import { ReactComponent as SchoolLocationIcon } from '../assets/icons/schoolLocationIcon.svg';
import './KidsAppLocation.css';
import logger from '../../utility/logger';
import { ServiceConfig } from '../../services/ServiceConfig';

const KidsAppLocation: FC = () => {
  const history = useHistory();
  useEffect(() => {
    const lockOrientation = async () => {
      if (Capacitor.getPlatform() === 'android') {
        try {
          await ScreenOrientation.lock({ orientation: 'landscape' });
        } catch (error) {
          logger.warn('Failed to lock orientation:', error);
        }
      }
    };
    lockOrientation();
  }, []);

  const clearSchoolModeData = (clearSchool: boolean) => {
    // Clear class/student/selection data
    localStorage.removeItem(CURRENT_CLASS_NAME);
    localStorage.removeItem(SELECTED_CLASSES);
    localStorage.removeItem(SELECTED_STUDENTS);
    localStorage.removeItem(USER_SELECTION_STAGE);
    localStorage.removeItem(CLASS);
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = undefined;

    if (clearSchool) {
      // Also clear school data
      localStorage.removeItem(CURRENT_SCHOOL_NAME);
      localStorage.removeItem(SCHOOL);
      api.currentSchool = undefined;
    }
  };

  const onHomeClick = () => {
    clearSchoolModeData(false);
    schoolUtil.setCurrMode(MODES.TEACHER_HOME);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  const onSchoolClick = () => {
    // Clear all school mode data for a completely fresh selection
    clearSchoolModeData(false);
    schoolUtil.setCurrMode(MODES.TEACHER_SCHOOL);
    history.replace(PAGES.SELECT_MODE);
  };

  return (
    <IonPage className="kids-app-location-page">
      <div className="kids-app-location-container">
        <div className="kids-app-location-avatar">
          <ChimpleRiveMascot animationName={CHIMPLE_MASCOT_ANIMATION_WAVY} />
        </div>
        <h1 className="kids-app-location-title">
          {t('Where are you using this app?')}
        </h1>
        <div className="kids-app-location-actions">
          <button
            type="button"
            className="kids-app-location-btn kids-app-location-btn-home"
            onClick={onHomeClick}
          >
            <HomeLocationIcon className="kids-app-location-btn-icon" />
            <span>{t('Home')}</span>
          </button>
          <button
            type="button"
            className="kids-app-location-btn kids-app-location-btn-school"
            onClick={onSchoolClick}
          >
            <SchoolLocationIcon className="kids-app-location-btn-icon" />
            <span>{t('School')}</span>
          </button>
        </div>
      </div>
    </IonPage>
  );
};

export default KidsAppLocation;
