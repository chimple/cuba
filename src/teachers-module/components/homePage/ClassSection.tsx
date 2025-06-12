import React from "react";
import { IonItem, IonIcon, IonLabel, IonButton } from "@ionic/react";
import { peopleOutline, chevronForwardOutline } from "ionicons/icons";
import { t } from "i18next";
import CustomDropdown from "../CustomDropdown";
import ClassCodeGenerateButton from "../ClassCodeGenerateButton";
import "./ClassSection.css";

interface ClassSectionProps {
  classData: { id: string | number; name: string }[];
  currentClassDetail: { id: string | number; name: string };
  currentClassId: string;
  classCode: number | undefined;
  handleClassSelect: (school: { id: string | number; name: string }) => void;
  handleManageClassClick: () => void;
  setClassCode: (code: number | undefined) => void;
}

const ClassSection: React.FC<ClassSectionProps> = ({
  classData,
  currentClassDetail,
  currentClassId,
  classCode,
  handleClassSelect,
  handleManageClassClick,
  setClassCode,
}) => {
  return (
    <>
      <IonItem lines="none">
        <img src="assets/icons/classIcon.svg" alt="SCHOOL" className="icon" />
        <IonLabel color="dark" className="class-iconlabel">{t("Class")}</IonLabel>
      </IonItem>
      <div className="school-dropdown">
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
      />

      <div className="divider-line">
        <div className="class-divider" />
      </div>
      <div className="manage-classes">
        <div className="manage-class-button">
          <IonButton fill="clear" color="" onClick={handleManageClassClick}>
            <IonLabel color="dark">{t("Manage Classes")}</IonLabel>
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
