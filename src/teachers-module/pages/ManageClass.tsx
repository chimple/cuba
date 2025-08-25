import React, { useState, useEffect } from "react";
import {
  CLASS,
  IconType,
  PAGES,
  SCHOOL,
  TableTypes,
  USER_ROLE,
} from "../../common/constants";
import { useHistory } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import Header from "../components/homePage/Header";
import AddButton from "../../common/AddButton";
import { t } from "i18next";
import DetailList from "../components/schoolComponent/DetailList";
import { RoleType } from "../../interface/modelInterfaces";
import "./ManageClass.css";
import { Util } from "../../utility/util";

const ManageClass: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(
    null
  );
  const [currentSchool, setCurrentSchool] = useState<
    TableTypes<"school"> | undefined
  >();

  const [allClasses, setAllClasses] = useState<TableTypes<"class">[]>([]);
  const [userRole, setUserRole] = useState<RoleType>();

  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const tempClass = Util.getCurrentClass();

  const init = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) return;
      setCurrentUser(user);
      const tempSchool = Util.getCurrentSchool();
      const tempRole = JSON.parse(localStorage.getItem(USER_ROLE)!);
      if (tempRole) setUserRole(tempRole as RoleType);
      if (tempSchool) {
        setCurrentSchool(tempSchool);
        const fetchedClasses = await api.getClassesForSchool(
          tempSchool.id,
          user.id
        );
        console.log("all classes..", fetchedClasses);
        if (fetchedClasses) setAllClasses(fetchedClasses);
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  };
  const onBackButtonClick = () => {
    history.replace(PAGES.HOME_PAGE, {
      tabValue: 0,
    });
  };
  useEffect(() => {
    if (!tempClass) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }
    init();
  }, []);

  return (
    <div className="main-page">
      <div className="fixed-header">
        <Header
          isBackButton={true}
          onBackButtonClick={onBackButtonClick}
          showSchool={true}
          schoolName={currentSchool?.name}
        />
      </div>
      <div className="school-div">{t("Classes")}</div>

      <div className="school-list">
        <DetailList
          data={allClasses}
          type={IconType.CLASS}
          school={currentSchool}
        />
      </div>
      {userRole === RoleType.PRINCIPAL || userRole === RoleType.COORDINATOR ? (
        <AddButton
          onClick={() => {
            history.replace(PAGES.ADD_CLASS, { origin: PAGES.MANAGE_CLASS });
          }}
        />
      ) : null}
    </div>
  );
};

export default ManageClass;
