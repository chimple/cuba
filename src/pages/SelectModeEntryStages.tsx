import { t } from 'i18next';
import { FC } from 'react';
import { CURRENT_SCHOOL_NAME, STAGES } from '../common/constants';
import { TRACKABLE_IDS, getTrackableProps } from '../analytics/trackable';
import DropDown from '../components/DropDown';
import SelectModeButton from '../components/selectMode/SelectModeButton';
import { isAutoUserRole } from '../utility/roleUtil';
import { schoolUtil } from '../utility/schoolUtil';
import type { useSelectModeController } from './useSelectModeController';
import { GiTeacher } from 'react-icons/gi';
import { IoMdPeople } from 'react-icons/io';

type SelectModeController = ReturnType<typeof useSelectModeController>;

interface SelectModeEntryStagesProps {
  controller: SelectModeController;
}

const SelectModeEntryStages: FC<SelectModeEntryStagesProps> = ({
  controller,
}) => {
  const modeButtonId = controller.isAutoUser
    ? TRACKABLE_IDS.SELECT_MODE_SCHOOL_MODE_BUTTON
    : TRACKABLE_IDS.SELECT_MODE_PARENT_BUTTON;
  const teacherButtonId = TRACKABLE_IDS.SELECT_MODE_TEACHER_BUTTON;
  const continueButtonId = TRACKABLE_IDS.CONTINUE_TO_CLASS_SELECTION;

  return (
    <>
      <div>
        {controller.stage === STAGES.MODE && (
          <div className="select-mode-main">
            <span className="select-mode-text">
              {t('How would you like to join?')}
            </span>

            <SelectModeButton
              text={controller.isAutoUser ? t('School Mode') : t('Parent')}
              icon={IoMdPeople}
              onClick={
                controller.isAutoUser
                  ? controller.onSchoolModeSelect
                  : controller.onParentSelect
              }
              id={modeButtonId}
              className={`${modeButtonId}`}
              trackableId={modeButtonId}
            />

            <SelectModeButton
              text={controller.isAutoUser ? t('Teacher App') : t('Teacher')}
              icon={GiTeacher}
              onClick={controller.onTeacherSelect}
              id={teacherButtonId}
              className={`${teacherButtonId}`}
              trackableId={teacherButtonId}
            />
          </div>
        )}
      </div>

      <div>
        {controller.stage === STAGES.SCHOOL && (
          <div className="select-school-main">
            <span className="select-school-text">{t('Choose the School')}</span>
            <DropDown
              placeholder={t('Select the School').toString()}
              onValueChange={async (selectedSchoolDocId) => {
                const selectedSchoolEntry = controller.schoolList.find(
                  (schoolOption) => schoolOption.id === selectedSchoolDocId,
                );
                const currentSchool = selectedSchoolEntry?.school;

                if (!currentSchool) {
                  controller.setIsOkayButtonDisabled(true);
                  return;
                }

                controller.setCurrentSchool(currentSchool);
                controller.setCurrentSchoolRole(selectedSchoolEntry?.role);
                localStorage.setItem(
                  CURRENT_SCHOOL_NAME,
                  JSON.stringify(currentSchool.name),
                );
                controller.setCurrentSchoolName(currentSchool.name);
                controller.setCurrentSchoolId(currentSchool.id);
                controller.setIsOkayButtonDisabled(false);
                schoolUtil.setCurrentSchool(currentSchool);
                if (isAutoUserRole(selectedSchoolEntry?.role)) {
                  await controller.applyAutoUserModeLanguage(
                    controller.api,
                    currentSchool,
                  );
                }
              }}
              optionList={controller.schoolList}
              width="26vw"
              currentValue={controller.currentSchoolId}
            />
            <button
              id={continueButtonId}
              className={`okay-btn ${continueButtonId} ${
                controller.isOkayButtonDisabled ? 'okay-btn-disabled' : ''
              }`}
              {...getTrackableProps(continueButtonId)}
              onClick={async () => {
                const selectedClass = await controller.displayClasses();
                controller.setStage(
                  selectedClass ? STAGES.STUDENT : STAGES.CLASS,
                );
              }}
              disabled={controller.isOkayButtonDisabled}
            >
              {t('Okay')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SelectModeEntryStages;
