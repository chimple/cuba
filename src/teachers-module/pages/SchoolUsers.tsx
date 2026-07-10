import React, { useEffect, useState } from "react";
import Tabs from "../../common/Tabs";
import Header from "../components/homePage/Header";
import AddButton from "../../common/AddButton";
import "./ClassUsers.css";
import { PAGES, SCHOOL_USERS, SchoolWithRole } from "../../common/constants";
import { Util } from "../../utility/util";
import { useHistory, useLocation } from "react-router-dom";
import { RoleType } from "../../interface/modelInterfaces";
import SchoolUserList from "../components/schoolUsers/SchoolUserList";
import { IonPage } from "@ionic/react";

const SchoolUsers: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState(SCHOOL_USERS.PRINCIPALS);

  const { school, role } = (location.state as SchoolWithRole) || {};
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get("tab");
    if (tab === SCHOOL_USERS.COORDINATORS) {
      handleTabSelect(SCHOOL_USERS.COORDINATORS);
    } else if (tab === SCHOOL_USERS.SPONSORS) {
      handleTabSelect(SCHOOL_USERS.SPONSORS);
    } else {
      handleTabSelect(SCHOOL_USERS.PRINCIPALS);
    }
  };

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
  };
  const addPrincipal = () => {
    history.replace(PAGES.ADD_PRINCIPAL, {
      school: school,
      role: role,
    });
  };
  const addCoordinator = () => {
    history.replace(PAGES.ADD_COORDINATOR, {
      school: school,
      role: role,
    });
  };
  const addSponsor = () => {
    history.replace(PAGES.ADD_SPONSOR, {
      school: school,
      role: role,
    });
  };

  const tabLabels = Object.values(SCHOOL_USERS).map((key) => key);
  const onBackButtonClick = () => {
    Util.setPathToBackButton(PAGES.MANAGE_SCHOOL, history);
  };
  return (
    <>
      {school && (
        <IonPage className="main-page">
          <div className="fixed-header">
            <Header
              isBackButton={true}
              showSchool={true}
              schoolName={school.name}
              onBackButtonClick={onBackButtonClick}
            />
            <Tabs
              tabs={tabLabels}
              selectedTab={selectedTab}
              onSelectTab={handleTabSelect}
            />
          </div>

          <div className="scrollable-content">
            {selectedTab === SCHOOL_USERS.PRINCIPALS && (
              <SchoolUserList
                schoolDoc={school}
                userType={SCHOOL_USERS.PRINCIPALS}
              />
            )}
            {selectedTab === SCHOOL_USERS.COORDINATORS && (
              <SchoolUserList
                schoolDoc={school}
                userType={SCHOOL_USERS.COORDINATORS}
              />
            )}
            {selectedTab === SCHOOL_USERS.SPONSORS && (
              <SchoolUserList
                schoolDoc={school}
                userType={SCHOOL_USERS.SPONSORS}
              />
            )}
          </div>
          {(role === RoleType.PRINCIPAL || role === RoleType.COORDINATOR) && (
            <>
              {selectedTab === SCHOOL_USERS.PRINCIPALS && (
                <AddButton onClick={addPrincipal} />
              )}
              {selectedTab === SCHOOL_USERS.COORDINATORS && (
                <AddButton onClick={addCoordinator} />
              )}
              {selectedTab === SCHOOL_USERS.SPONSORS && (
                <AddButton onClick={addSponsor} />
              )}
            </>
          )}
        </IonPage>
      )}
    </>
  );
};

export default SchoolUsers;
