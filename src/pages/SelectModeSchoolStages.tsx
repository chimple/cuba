import { FC } from 'react';
import { AVATARS, STAGES } from '../common/constants';
import { TRACKABLE_IDS, getTrackableProps } from '../analytics/trackable';
import { t } from 'i18next';
import {
  SelectModeClassTabs,
  SelectModeSchoolHeader,
} from './SelectModeSchoolStageParts';
import type { useSelectModeController } from './useSelectModeController';

type SelectModeController = ReturnType<typeof useSelectModeController>;

interface SelectModeSchoolStagesProps {
  controller: SelectModeController;
}

const SelectModeSchoolStages: FC<SelectModeSchoolStagesProps> = ({
  controller,
}) => {
  const classTabsProps = {
    classStripClassName: controller.classStripClassName,
    currClass: controller.currClass,
    isNextClassNavigationDisabled: controller.isNextClassNavigationDisabled,
    isPreviousClassNavigationDisabled:
      controller.isPreviousClassNavigationDisabled,
    nextClassNavigationClassName: controller.nextClassNavigationClassName,
    onClassNavigation: controller.onClassNavigation,
    onClassSelect: controller.onClassSelect,
    previousClassNavigationClassName:
      controller.previousClassNavigationClassName,
    shouldShowClassArrows: controller.shouldShowClassArrows,
    visibleClasses: controller.visibleClasses,
  };

  return (
    <>
      <div>
        {controller.stage === STAGES.CLASS && (
          <div className="class-main class-main-school-mode">
            <SelectModeSchoolHeader
              onTeacherSelect={controller.onTeacherSelect}
            />
            <SelectModeClassTabs {...classTabsProps} shouldMoveToStudentStage />
            <div className="school-mode-empty-state">
              {controller.currentSchool?.name ?? controller.currentSchoolName}
            </div>
          </div>
        )}
      </div>

      <div>
        {controller.stage === STAGES.STUDENT && (
          <div className="class-main class-main-school-mode">
            <div className="school-mode-student-stage">
              <SelectModeSchoolHeader
                onTeacherSelect={controller.onTeacherSelect}
              />
              <SelectModeClassTabs
                {...classTabsProps}
                shouldMoveToStudentStage={false}
              />
              {controller.shouldShowClassArrows &&
                controller.currClass?.name && (
                  <p className="school-mode-class-profile-selection-text">
                    {controller.classProfileSelectionText}
                  </p>
                )}
              <div className={controller.studentGridClassName}>
                {controller.currentStudents?.map((student) => {
                  const playButtonId = `${TRACKABLE_IDS.SCHOOL_MODE_PLAY_BUTTON_PREFIX}${student.id}`;
                  return (
                    <article
                      key={student.id}
                      className="school-mode-student-card class-avatar"
                    >
                      <img
                        className="class-avatar-img school-mode-student-avatar"
                        src={controller.getStudentAvatarSrc(student)}
                        alt=""
                        onError={(event) => {
                          const target = event.target as HTMLImageElement;
                          const fallback = `assets/avatars/${student.avatar ?? AVATARS[0]}.png`;
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
                        {student.name}
                      </span>
                      <div className="play-button-shadow">
                        <button
                          id={playButtonId}
                          type="button"
                          className={`school-mode-play-button ${playButtonId}`}
                          {...getTrackableProps(playButtonId)}
                          onClick={(event) => {
                            event.stopPropagation();
                            controller.handleStudentSelect(student);
                          }}
                        >
                          {t('Play')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SelectModeSchoolStages;
