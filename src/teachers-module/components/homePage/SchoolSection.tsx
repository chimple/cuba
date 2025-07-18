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
      <div className="schoolsection-school">
        <img src="assets/icons/scholarIcon.svg" alt="SCHOOL" className="icon" />
        <span className="school-iconlabel">{t("School")}</span>
      </div>
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
          <IonButton fill="clear" color="" onClick={handleManageSchoolClick} style={{ textTransform: "none" }}>
            <IonLabel style={{color: "#707070", fontSize: "18px"}}>{t("Manage School")}</IonLabel>
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
