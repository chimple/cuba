import React, { useEffect, useState } from "react";
import {
  PAGES,
  SCHOOL,
  SchoolWithRole,
  TableTypes,
} from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import Header from "../components/homePage/Header";
import SchoolProfileContent from "../components/schoolComponent/SchoolProfileContent";
import "./SchoolProfile.css";
import { useHistory, useLocation } from "react-router-dom";
import { Util } from "../../utility/util";

const SchoolProfile: React.FC = () => {
  const history = useHistory();
  const location = useLocation<SchoolWithRole>();
  const [currentSchool, setCurrentSchool] = useState<
    TableTypes<"school"> | undefined
  >();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const { school, role } = location.state || {};
  useEffect(() => {
    init();
  }, []);

  const onBackButtonClick = () => {
    Util.setPathToBackButton(PAGES.MANAGE_SCHOOL, history);
  };

  const init = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) return;
      if (school) setCurrentSchool(school);
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  };

  return (
    <div className="school-profile-page">
      {currentSchool?.name && (
        <>
          <Header
            isBackButton={true}
            onBackButtonClick={onBackButtonClick}
            schoolName={currentSchool.name}
            showSchool={true}
          />
          <SchoolProfileContent school={currentSchool} role={role} />
        </>
      )}
    </div>
  );
};

export default SchoolProfile;
