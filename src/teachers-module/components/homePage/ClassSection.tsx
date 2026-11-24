import React from 'react';
import { IonLabel, IonButton } from '@ionic/react';
import { t } from 'i18next';
import CustomDropdown from '../CustomDropdown';
import ClassCodeGenerateButton from '../ClassCodeGenerateButton';
import './ClassSection.css';
import { getTrackableProps, TRACKABLE_IDS } from '../../../analytics/trackable';

interface ClassSectionProps {
  classData: { id: string | number; name: string }[];
  currentClassDetail: { id: string | number; name: string };
  currentClassId: string;
  classCode: number | undefined;
  isExternalUser: boolean;
  handleClassSelect: (school: { id: string | number; name: string }) => void;
  handleManageClassClick: () => void;
  setClassCode: (code: number | undefined) => void;
}

const ClassSection: React.FC<ClassSectionProps> = ({
  classData,
  currentClassDetail,
  currentClassId,
  classCode,
  isExternalUser,
  handleClassSelect,
  handleManageClassClick,
  setClassCode,
}) => {
  return (
    <>
      <div className="classsection-class">
        <img src="assets/icons/classIcon.svg" alt="SCHOOL" className="icon" />
        <span className="class-iconlabel">{t('Class')}</span>
      </div>
      <div
        id={TRACKABLE_IDS.TEACHER_MENU_CLASS_DROPDOWN}
        {...getTrackableProps(TRACKABLE_IDS.TEACHER_MENU_CLASS_DROPDOWN)}
        className="school-dropdown teacher_menu_class_dropdown"
      >
        <CustomDropdown
          icon=""
          options={classData}
          onOptionSelect={handleClassSelect}
          selectedValue={currentClassDetail}
          isDownBorder={false}
        />
        <div className="divider-line">
          <div className="class-divider" />
        </div>
      </div>

      <ClassCodeGenerateButton
        currentClassId={currentClassId}
        setClassCode={setClassCode}
        classCode={classCode}
        className={currentClassDetail.name}
        isGenerateDisabled={isExternalUser}
      />

      <div className="divider-line">
        <div className="class-divider" />
      </div>
      <div className="manage-classes">
        <div className="manage-class-button">
          <IonButton
            id={TRACKABLE_IDS.TEACHER_MANAGE_CLASS_BUTTON}
            {...getTrackableProps(TRACKABLE_IDS.TEACHER_MANAGE_CLASS_BUTTON)}
            fill="clear"
            color=""
            onClick={handleManageClassClick}
            className="teacher_manage_class_button"
            style={{ textTransform: 'none' }}
          >
            <IonLabel style={{ color: '#707070', fontSize: '18px' }}>
              {t('Manage Classes')}
            </IonLabel>
          </IonButton>
        </div>
      </div>
      <div className="divider-line">
        <div className="divider" />
      </div>
    </>
  );
};

export default ClassSection;
