import { IonPage } from '@ionic/react';
import { t } from 'i18next';
import { FC } from 'react';
import { GiTeacher } from 'react-icons/gi';
import { IoMdPeople } from 'react-icons/io';
import {
  AVATARS,
  CURRENT_SCHOOL_NAME,
  EVENTS,
  STAGES,
  TEACHER_APP_AUTH_METHODS,
  TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS,
} from '../common/constants';
import DropDown from '../components/DropDown';
import Loading from '../components/Loading';
import TeacherAuthenticationPopup from '../components/parent/TeacherAuthenticationPopup';
import SelectModeButton from '../components/selectMode/SelectModeButton';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import { isAutoUserRole } from '../utility/roleUtil';
import {
  SelectModeClassTabs,
  SelectModeSchoolHeader,
} from './SelectModeSchoolStageParts';

import { useSelectModeController } from './useSelectModeController';
import './SelectMode.css';

const SelectMode: FC = () => {
  const {
    api,
    applyAutoUserModeLanguage,
    classProfileSelectionText,
    classStripClassName,
    continueToTeacherMode,
    currClass,
    currentSchool,
    currentSchoolId,
    currentSchoolName,
    currentStudents,
    displayClasses,
    getStudentAvatarSrc,
    handleStudentSelect,
    isAutoUser,
    isLoading,
    isNextClassNavigationDisabled,
    isOkayButtonDisabled,
    isPreviousClassNavigationDisabled,
    isTeacherAuthPopupOpen,
    nextClassNavigationClassName,
    onClassNavigation,
    onClassSelect,
    onParentSelect,
    onSchoolModeSelect,
    onTeacherSelect,
    previousClassNavigationClassName,
    schoolList,
    setCurrentSchool,
    setCurrentSchoolId,
    setCurrentSchoolName,
    setCurrentSchoolRole,
    setIsOkayButtonDisabled,
    setIsTeacherAuthPopupOpen,
    setStage,
    shouldShowClassArrows,
    stage,
    studentGridClassName,
    visibleClasses,
  } = useSelectModeController();

  return (
    <IonPage className="select-mode-page">
      {!isLoading && (
        <div>
          <div>
            {stage === STAGES.MODE && (
              <div className="select-mode-main">
                <span className="select-mode-text">
                  {t('How would you like to join?')}
                </span>

                <SelectModeButton
                  text={isAutoUser ? t('School Mode') : t('Parent')}
                  icon={IoMdPeople}
                  onClick={isAutoUser ? onSchoolModeSelect : onParentSelect}
                  id={
                    isAutoUser
                      ? 'select-mode-school-mode-button'
                      : 'select-mode-parent-button'
                  }
                />

                <SelectModeButton
                  text={isAutoUser ? t('Teacher App') : t('Teacher')}
                  icon={GiTeacher}
                  onClick={onTeacherSelect}
                  id="select-mode-teacher-button"
                />
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.SCHOOL && (
              <div className="select-school-main">
                <span className="select-school-text">
                  {t('Choose the School')}
                </span>
                <DropDown
                  placeholder={t('Select the School').toString()}
                  onValueChange={async (selectedSchoolDocId) => {
                    const currSchool = schoolList.find(
                      (element: any) => element.id === selectedSchoolDocId,
                    )?.school;

                    if (!currSchool) {
                      setIsOkayButtonDisabled(true);
                      return;
                    }
                    const selectedSchoolEntry = schoolList.find(
                      (element: any) => element.id === selectedSchoolDocId,
                    );
                    setCurrentSchool(currSchool);
                    setCurrentSchoolRole(selectedSchoolEntry?.role);
                    localStorage.setItem(
                      CURRENT_SCHOOL_NAME,
                      JSON.stringify(currSchool.name),
                    );
                    setCurrentSchoolName(currSchool.name);
                    setCurrentSchoolId(currSchool.id);
                    setIsOkayButtonDisabled(false);
                    schoolUtil.setCurrentSchool(currSchool);
                    if (isAutoUserRole(selectedSchoolEntry?.role)) {
                      await applyAutoUserModeLanguage(api, currSchool);
                    }
                  }}
                  optionList={schoolList}
                  width="26vw"
                  currentValue={currentSchoolId}
                />
                <button
                  className={`okay-btn ${
                    isOkayButtonDisabled ? 'okay-btn-disabled' : ''
                  }`}
                  onClick={async function () {
                    // history.replace(PAGES.SELECT_CLASS);
                    const selectedClass = await displayClasses();
                    setStage(selectedClass ? STAGES.STUDENT : STAGES.CLASS);
                    return;
                  }}
                  disabled={isOkayButtonDisabled}
                >
                  {t('Okay')}
                </button>
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.CLASS && (
              <div className="class-main class-main-school-mode">
                <SelectModeSchoolHeader onTeacherSelect={onTeacherSelect} />
                <SelectModeClassTabs
                  classStripClassName={classStripClassName}
                  currClass={currClass}
                  isNextClassNavigationDisabled={isNextClassNavigationDisabled}
                  isPreviousClassNavigationDisabled={
                    isPreviousClassNavigationDisabled
                  }
                  nextClassNavigationClassName={nextClassNavigationClassName}
                  onClassNavigation={onClassNavigation}
                  onClassSelect={onClassSelect}
                  previousClassNavigationClassName={
                    previousClassNavigationClassName
                  }
                  shouldMoveToStudentStage
                  shouldShowClassArrows={shouldShowClassArrows}
                  visibleClasses={visibleClasses}
                />
                <div className="school-mode-empty-state">
                  {currentSchool?.name ?? currentSchoolName}
                </div>
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.STUDENT && (
              <div className="class-main class-main-school-mode">
                <div className="school-mode-student-stage">
                  <SelectModeSchoolHeader onTeacherSelect={onTeacherSelect} />
                  <SelectModeClassTabs
                    classStripClassName={classStripClassName}
                    currClass={currClass}
                    isNextClassNavigationDisabled={
                      isNextClassNavigationDisabled
                    }
                    isPreviousClassNavigationDisabled={
                      isPreviousClassNavigationDisabled
                    }
                    nextClassNavigationClassName={nextClassNavigationClassName}
                    onClassNavigation={onClassNavigation}
                    onClassSelect={onClassSelect}
                    previousClassNavigationClassName={
                      previousClassNavigationClassName
                    }
                    shouldMoveToStudentStage={false}
                    shouldShowClassArrows={shouldShowClassArrows}
                    visibleClasses={visibleClasses}
                  />
                  {shouldShowClassArrows && currClass?.name && (
                    <p className="school-mode-class-profile-selection-text">
                      {classProfileSelectionText}
                    </p>
                  )}
                  <div className={studentGridClassName}>
                    {currentStudents?.map((tempStudent: any) => (
                      <article
                        key={tempStudent.id}
                        className="school-mode-student-card class-avatar"
                      >
                        <img
                          className="class-avatar-img school-mode-student-avatar"
                          src={getStudentAvatarSrc(tempStudent)}
                          alt=""
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = `assets/avatars/${tempStudent?.avatar ?? AVATARS[0]}.png`;
                            if (
                              target.src !==
                                window.location.origin + '/' + fallback &&
                              target.src !== fallback
                            ) {
                              target.src = fallback;
                            }
                          }}
                        />
                        <span className="class-name school-mode-student-name">
                          {tempStudent.name}
                        </span>
                        <div className="play-button-shadow">
                          <button
                            id={`school-mode-play-${tempStudent.id}`}
                            type="button"
                            className="school-mode-play-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStudentSelect(tempStudent);
                            }}
                          >
                            {t('Play')}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
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
