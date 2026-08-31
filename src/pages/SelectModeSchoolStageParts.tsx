import { t } from 'i18next';
import InlineSvg from '../components/InlineSvg';
import BrandLogoIcon from './assets/brandLogoIcon.svg?raw';
import LeftArrowIcon from './assets/leftArrowIcon.svg?raw';

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
      type="button"
      className="school-mode-role-badge"
      onClick={onTeacherSelect}
    >
      <span>{t('Teacher')}</span>
      <img src="assets/icons/user.png" alt="" />
    </button>
  </div>
);

interface SelectModeClassTabsProps {
  classStripClassName: string;
  currClass?: any;
  isNextClassNavigationDisabled: boolean;
  isPreviousClassNavigationDisabled: boolean;
  nextClassNavigationClassName: string;
  onClassNavigation: (direction: 'previous' | 'next') => void;
  onClassSelect: (
    selectedClass: any,
    shouldMoveToStudentStage: boolean,
  ) => void;
  previousClassNavigationClassName: string;
  shouldMoveToStudentStage: boolean;
  shouldShowClassArrows: boolean;
  visibleClasses: any[];
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
}: SelectModeClassTabsProps) => (
  <div className={classStripClassName}>
    {shouldShowClassArrows && (
      <button
        id="school-mode-prev-class-button"
        type="button"
        className={previousClassNavigationClassName}
        disabled={isPreviousClassNavigationDisabled}
        onClick={() => onClassNavigation('previous')}
      >
        <InlineSvg svg={LeftArrowIcon} className="school-mode-nav-arrow" />
      </button>
    )}
    <div className="school-mode-class-tabs">
      {visibleClasses?.map((tempClass: any) => (
        <button
          key={tempClass.id}
          id={`school-mode-class-tab-${tempClass.id}`}
          type="button"
          onClick={() => {
            void onClassSelect(tempClass, shouldMoveToStudentStage);
          }}
          className={`school-mode-class-tab class-avatar ${
            currClass?.id === tempClass.id ? 'school-mode-class-tab-active' : ''
          }`}
        >
          {tempClass.name}
        </button>
      ))}
    </div>
    {shouldShowClassArrows && (
      <button
        id="school-mode-next-class-button"
        type="button"
        className={nextClassNavigationClassName}
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
