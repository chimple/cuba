import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '../utility/screenOrientation';
import { IonPage } from '@ionic/react';
import { t } from 'i18next';
import { FC, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import {
  AVATARS,
  EDIT_STUDENTS_MAP,
  EVENTS,
  MODES,
  PAGES,
  TableTypes,
} from '../common/constants';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';
import ParentalLock from '../components/parent/ParentalLock';
import SkeltonLoading from '../components/SkeltonLoading';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import { ServiceConfig } from '../services/ServiceConfig';
import logger from '../utility/logger';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import { ReactComponent as BrandLogoIcon } from './assets/brandLogoIcon.svg';
import './DisplayStudents.css';
const DisplayStudents: FC<{}> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<TableTypes<'user'>[]>();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const { setGbUpdated } = useGbContext();
  const isWebPlatform = Capacitor.getPlatform() === 'web';
  const getProfileCardPlayActionParams = (
    student: TableTypes<'user'>,
  ): Record<string, string> => {
    const currentClass = Util.getCurrentClass();
    return {
      action_type: 'play',
      target_student_id: student.id,
      target_student_grade: student.grade_id ?? '',
      ...(studentMode === MODES.TEACHER_SCHOOL && currentClass?.id
        ? { class_id: currentClass.id }
        : {}),
    };
  };

  useEffect(() => {
    Util.loadBackgroundImage();
    getStudents();
    lockOrientation();
    return () => {
      setIsLoading(false);
    };
  }, []);
  const lockOrientation = () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: 'landscape' });
    }
  };
  const getStudents = async () => {
    const currMode = await schoolUtil.getCurrMode();
    setStudentMode(currMode);
    const tempStudents = await api.getParentStudentProfiles();
    const storedMapStr = sessionStorage.getItem(EDIT_STUDENTS_MAP);
    const mergedStudents = Util.mergeStudentsByUpdatedAt(
      tempStudents,
      storedMapStr,
    );
    if (!mergedStudents || mergedStudents.length < 1) {
      history.replace(PAGES.CREATE_STUDENT, {
        showBackButton: false,
      });
      return;
    }
    setStudents(mergedStudents);
    updateLocalAttributes({ count_of_children: mergedStudents.length });
    setGbUpdated(true);
    setIsLoading(false);
  };
  const onStudentClick = async (student: TableTypes<'user'>) => {
    schoolUtil.setCurrMode(MODES.PARENT);
    await Util.setCurrentStudent(student, undefined, true);
    const linkedData = await api.getStudentClassesAndSchools(student.id);
    void Util.ensureLidoCommonAudioForStudent(student).catch((error) => {
      logger.warn('Failed to prefetch Lido common audio in background.', error);
    });
    let resolvedSchoolIds: string[] = [];
    if (linkedData?.classes && linkedData.classes.length > 0) {
      const firstClass = linkedData.classes[0];
      const currClass = await api.getClassById(firstClass.id);
      await schoolUtil.setCurrentClass(currClass ?? undefined);
      resolvedSchoolIds = currClass?.school_id ? [currClass.school_id] : [];
    } else {
      logger.warn('No classes found for the student.');
      await schoolUtil.setCurrentClass(undefined);
    }
    // Sync GrowthBook with the selected child's current school linkage.
    updateLocalAttributes({
      student_id: student.id,
      age: student.age ?? null,
      grade_id: student.grade_id ?? null,
      school_ids: resolvedSchoolIds,
    });
    setGbUpdated(true);
    if (!student.language_id) {
      history.replace(PAGES.EDIT_STUDENT, {
        from: history.location.pathname,
      });
    } else {
      history.replace(PAGES.HOME + window.location.search);
    }
  };
  const onCreateNewStudent = () => {
    if (!online) {
      presentToast({
        message: t(`Device is offline. Cannot create a new child profile`),
        color: 'danger',
        duration: 3000,
        position: 'bottom',
        buttons: [
          {
            text: 'Dismiss',
            role: 'cancel',
          },
        ],
      });

      return;
    }
    const isProfilesExist = students && students.length > 0;
    const locationState = isProfilesExist
      ? { showBackButton: true }
      : undefined;
    history.replace(PAGES.CREATE_STUDENT, locationState);
  };
  return (
    <IonPage
      id="display-students"
      className={isWebPlatform ? 'display-students-web' : undefined}
    >
      <div id="display-students-chimple-logo">
        <div id="display-students-parent-icon"></div>
        <div className="display-students-title">
          <div className="display-students-welcome-title">
            <BrandLogoIcon className="display-students-brand-logo" />
            <span>{t('Welcome to Chimple!')}</span>
          </div>
          <span className="display-students-subtitle">
            {t("Select the child's profile")}
          </span>
        </div>
        <button
          id="display-students-parent-button"
          type="button"
          onClick={() => {
            setShowDialogBox(true);
          }}
        >
          {t('Parent')}
          <img id="parent-icon" src={'assets/icons/user.png'} alt="" />
        </button>
      </div>
      {!isLoading && students && (
        <div className="display-student-content">
          <div className="avatar-container">
            {students.map((student) => (
              <article
                key={student.id}
                className="display-students-card display-students-avatar"
              >
                <img
                  className="avatar-img display-students-avatar-img"
                  src={
                    (studentMode === MODES.SCHOOL && student.image) ||
                    'assets/avatars/' + (student.avatar ?? AVATARS[0]) + '.png'
                  }
                  alt=""
                />
                {student.name && (
                  <span className="display-student-name-profile">Profile:</span>
                )}
                <span className="display-student-name">
                  {student.name ? student.name : '\u00A0'}
                </span>
                <div id="play-button-shadow" className="play-button-shadow">
                  <button
                    id={`display-students-play-${student.id}`}
                    type="button"
                    className="display-students-play-button"
                    onClick={() => {
                      void Util.logEvent(
                        EVENTS.PROFILE_CARD_ACTION_CLICKED,
                        getProfileCardPlayActionParams(student),
                      );
                      onStudentClick(student);
                    }}
                  >
                    {t('Play')}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {showDialogBox ? (
            <ParentalLock
              showDialogBox={showDialogBox}
              onHandleClose={() => {
                setShowDialogBox(false);
              }}
            ></ParentalLock>
          ) : null}
        </div>
      )}
      <SkeltonLoading isLoading={isLoading} header={PAGES.DISPLAY_STUDENT} />
    </IonPage>
  );
};
export default DisplayStudents;
