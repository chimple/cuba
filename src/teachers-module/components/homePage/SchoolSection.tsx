import React from "react";
import { IonItem, IonIcon, IonLabel, IonButton } from "@ionic/react";
import { schoolOutline, chevronForwardOutline, school } from "ionicons/icons";
import DropDown from "../DropDown";
import { t } from "i18next";
import CustomDropdown from "../CustomDropdown";
import "./SchoolSection.css";
import { display } from "html2canvas/dist/types/css/property-descriptors/display";

interface SchoolSectionProps {
  schoolData: { id: string | number; name: string }[];
  currentSchoolDetail: { id: string | number; name: string };
  handleSchoolSelect: (school: { id: string | number; name: string }) => void;
  handleManageSchoolClick: () => void;
}

const SchoolSection: React.FC<SchoolSectionProps> = ({
  schoolData,
  currentSchoolDetail,
  handleSchoolSelect,
  handleManageSchoolClick,
}) => {
  return (
    <>
      <IonItem lines="none">
        <img src="assets/icons/scholarIcon.svg" alt="SCHOOL" className="icon" />
        <IonLabel color="white" className="school-iconlabel">{t("School")}</IonLabel>
      </IonItem>
      <div className="school-dropdown">
        <CustomDropdown
          options={schoolData}
          onOptionSelect={handleSchoolSelect}
          selectedValue={currentSchoolDetail}
          isDownBorder={false}
        />
        <div className="divider-line">
          <div className="school-divider" />
        </div>
      </div>
      <div className="manage-school">
        <div className="manage-school-button">
          <IonButton fill="clear" color="" onClick={handleManageSchoolClick}>
            <IonLabel color="dark">{t("Manage School")}</IonLabel>
          </IonButton>
        </div>
      </div>
      <div className="divider-line">
        <div className="divider" />
      </div>
    </>
  );
};

export default SchoolSection;
