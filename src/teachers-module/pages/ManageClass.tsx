import React, { useState, useEffect, useMemo } from "react";
import {
  CLASS,
  CLASSES,
  IconType,
  PAGES,
  SCHOOL,
  TableTypes,
  USER_ROLE,
  OPS_ROLES
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
      if (tempSchool) {
        setCurrentSchool(tempSchool);
        const fetchedClasses = await api.getClassesForSchool(
          tempSchool.id,
          user.id
        );
        if (fetchedClasses) {
          setAllClasses(fetchedClasses);
          localStorage.setItem(CLASSES, JSON.stringify(fetchedClasses));
        }
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  };
  const storedRoles: string[] = JSON.parse(
    localStorage.getItem(USER_ROLE) ?? "[]"
  );
  
  const canCreate = useMemo(
    () => OPS_ROLES.some((role) => storedRoles.includes(role)),
    [storedRoles]
  );
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
    // wrapper so we can `await`
    (async () => {
      await init();
      // Right after the fetch, overwrite the one you just edited
      const updated = Util.getCurrentClass();
      if (updated) {
        setAllClasses((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      }
    })();
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
      {canCreate && (
        <AddButton
          onClick={() => {
            history.replace(PAGES.ADD_CLASS, { origin: PAGES.MANAGE_CLASS });
          }}
        />
      )}
    </div>
  );
};

export default ManageClass;
