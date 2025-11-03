import React, { useState, useEffect } from "react";
import { IonButton, IonLabel } from "@ionic/react";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { t } from "i18next";
import "./SchoolSection.css";
import AutocompleteDropdown from "../SearchableDropdown";
import { TableTypes } from "../../../common/constants";
import { RoleType } from "../../../interface/modelInterfaces";

interface SchoolSectionProps {
  schoolData: { id: string | number; name: string }[];
  currentSchoolDetail: { id: string | number; name: string };
  handleSchoolSelect: (school: {
    id: string | number;
    name: string;
    role?: RoleType;
  }) => void;
  handleManageSchoolClick: () => void;
}

const SchoolSection: React.FC<SchoolSectionProps> = ({
  schoolData,
  currentSchoolDetail,
  handleSchoolSelect,
  handleManageSchoolClick,
}) => {
  const api = ServiceConfig.getI()?.apiHandler;
  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(
    null
  );

  useEffect(() => {
    const fetchUser = async () => {
      const user = await ServiceConfig.getI()?.authHandler.getCurrentUser();
      if (!user) {
        console.error("No user is logged in.");
        return;
      }
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const fetchSchools = async (query: string, page: number) => {
    if (!currentUser) return [];

    try {
      const result = await api.getSchoolsForUser(currentUser.id, {
        page,
        page_size: 20,
        search: query || "",
      });

      return result.map(({ school, role }: any) => ({
        id: school.id,
        name: school.name,
        role: role,
      }));
    } catch (err) {
      console.error("Error fetching schools:", err);
      return [];
    }
  };
  const handleClearSchool = () => {
    handleSchoolSelect({ id: "", name: "" });
  };
  return (
    <>
      <div className="schoolsection-school">
        <img src="assets/icons/scholarIcon.svg" alt="SCHOOL" className="icon" />
        <span className="school-iconlabel">{t("School")}</span>
      </div>

      <div className="school-dropdown">
        <AutocompleteDropdown
          placeholder="Search or select a school"
          fetchOptions={fetchSchools}
          selectedValue={currentSchoolDetail}
          onOptionSelect={handleSchoolSelect}
          onClear={handleClearSchool}
        />
        <div className="divider-line">
          <div className="school-divider" />
        </div>
      </div>
      <div className="manage-school">
        <div className="manage-school-button">
          <IonButton
            fill="clear"
            color=""
            onClick={handleManageSchoolClick}
            style={{ textTransform: "none" }}
          >
            <IonLabel style={{ color: "#707070", fontSize: "18px" }}>
              {t("Manage School")}
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

export default SchoolSection;
