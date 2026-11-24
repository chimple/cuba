import { t } from 'i18next';
import type { TableTypes } from '../common/constants';
import InlineSvg from '../components/InlineSvg';
import BrandLogoIcon from './assets/brandLogoIcon.svg?raw';
import LeftArrowIcon from './assets/leftArrowIcon.svg?raw';
import { TRACKABLE_IDS, getTrackableProps } from '../analytics/trackable';

interface SelectModeSchoolHeaderProps {
  onTeacherSelect: () => void;
}

export const SelectModeSchoolHeader = ({
  onTeacherSelect,
}: SelectModeSchoolHeaderProps) => (
  <div className="school-mode-header class-header">
    <div className="school-mode-welcome">
      <InlineSvg svg={BrandLogoIcon} className="school-mode-brand-logo" />
      <span>{t('Welcome to Chimple!')}</span>
    </div>
    <button
      id={TRACKABLE_IDS.SCHOOL_MODE_TEACHER_BUTTON}
      type="button"
      className="school-mode-role-badge"
      {...getTrackableProps(TRACKABLE_IDS.SCHOOL_MODE_TEACHER_BUTTON)}
      onClick={onTeacherSelect}
    >
      <span>{t('Teacher')}</span>
      <img src="assets/icons/user.png" alt="" />
    </button>
  </div>
);

interface SelectModeClassTabsProps {
  classStripClassName: string;
  currClass?: TableTypes<'class'>;
  isNextClassNavigationDisabled: boolean;
  isPreviousClassNavigationDisabled: boolean;
  nextClassNavigationClassName: string;
  onClassNavigation: (direction: 'previous' | 'next') => void;
  onClassSelect: (
    selectedClass: TableTypes<'class'>,
    shouldMoveToStudentStage: boolean,
  ) => void;
  previousClassNavigationClassName: string;
  shouldMoveToStudentStage: boolean;
  shouldShowClassArrows: boolean;
  visibleClasses: TableTypes<'class'>[];
}

export const SelectModeClassTabs = ({
  classStripClassName,
  currClass,
  isNextClassNavigationDisabled,
  isPreviousClassNavigationDisabled,
  nextClassNavigationClassName,
  onClassNavigation,
  onClassSelect,
  previousClassNavigationClassName,
  shouldMoveToStudentStage,
  shouldShowClassArrows,
  visibleClasses,
}: SelectModeClassTabsProps) => {
  const previousClassButtonId = TRACKABLE_IDS.SCHOOL_MODE_PREVIOUS_CLASS_BUTTON;
  const nextClassButtonId = TRACKABLE_IDS.SCHOOL_MODE_NEXT_CLASS_BUTTON;

  return (
    <div className={classStripClassName}>
      {shouldShowClassArrows && (
        <button
          id={previousClassButtonId}
          type="button"
          className={`${previousClassNavigationClassName} ${previousClassButtonId}`}
          {...getTrackableProps(previousClassButtonId)}
          disabled={isPreviousClassNavigationDisabled}
          onClick={() => onClassNavigation('previous')}
        >
          <InlineSvg svg={LeftArrowIcon} className="school-mode-nav-arrow" />
        </button>
      )}
      <div className="school-mode-class-tabs">
        {visibleClasses.map((tempClass) => {
          const classTabId = `${TRACKABLE_IDS.SCHOOL_MODE_CLASS_TAB_PREFIX}${tempClass.id}`;
          return (
            <button
              key={tempClass.id}
              id={classTabId}
              type="button"
              onClick={() => {
                void onClassSelect(tempClass, shouldMoveToStudentStage);
              }}
              className={`school-mode-class-tab class-avatar ${classTabId} ${
                currClass?.id === tempClass.id
                  ? 'school-mode-class-tab-active'
                  : ''
              }`}
              {...getTrackableProps(classTabId)}
            >
              {tempClass.name}
            </button>
          );
        })}
      </div>
      {shouldShowClassArrows && (
        <button
          id={nextClassButtonId}
          type="button"
          className={`${nextClassNavigationClassName} ${nextClassButtonId}`}
          {...getTrackableProps(nextClassButtonId)}
          disabled={isNextClassNavigationDisabled}
          onClick={() => onClassNavigation('next')}
        >
          <InlineSvg
            svg={LeftArrowIcon}
            className="school-mode-nav-arrow school-mode-nav-arrow-right"
          />
        </button>
      )}
    </div>
  );
};
