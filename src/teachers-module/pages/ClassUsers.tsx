import React, { useEffect, useState } from "react";
import Tabs from "../../common/Tabs";
import Header from "../components/homePage/Header";
import AddButton from "../../common/AddButton";
import "./ClassUsers.css";
import {
  CLASS_USERS,
  PAGES,
  TableTypes,
  USER_ROLE,
} from "../../common/constants";
import { Util } from "../../utility/util";
import { useHistory, useLocation } from "react-router-dom";
import UserList from "../components/studentProfile/UserList";
import { RoleType } from "../../interface/modelInterfaces";

const ClassUsers: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState(CLASS_USERS.STUDENTS);
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const classData = (location.state as TableTypes<"class">) || {};
  const currentSchool = Util.getCurrentSchool();
  const currentRole = JSON.parse(localStorage.getItem(USER_ROLE)!);
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (classData) {
      setCurrentClass(classData);
    }
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get("tab");

    if (tab === CLASS_USERS.TEACHERS) {
      handleTabSelect(CLASS_USERS.TEACHERS);
    } else {
      handleTabSelect(CLASS_USERS.STUDENTS);
    }
  };

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
  };
  const addStudent = () => {
    history.replace(PAGES.ADD_STUDENT, {
      classDoc: classData,
      school: currentSchool,
    });
  };
  const addTeacher = () => {
    history.replace(PAGES.ADD_TEACHER, {
      classDoc: classData,
      school: currentSchool,
    });
  };

  const tabLabels = Object.values(CLASS_USERS).map((key) => key);
  console.log("tab names..", tabLabels);
  const onBackButtonClick = () => {
    Util.setPathToBackButton(PAGES.MANAGE_CLASS, history);
  };
  return (
    <>
      {currentSchool && currentClass && (
        <div className="main-page">
          <div className="fixed-header">
            <Header
              isBackButton={true}
              showSchool={true}
              showClass={true}
              className={currentClass?.name}
              schoolName={currentSchool?.name}
              onBackButtonClick={onBackButtonClick}
            />
            <Tabs
              tabs={tabLabels}
              selectedTab={selectedTab}
              onSelectTab={handleTabSelect}
            />
          </div>

          <div className="scrollable-content">
            {selectedTab === CLASS_USERS.STUDENTS && (
              <UserList
                schoolDoc={currentSchool}
                classDoc={currentClass}
                userType={CLASS_USERS.STUDENTS}
              />
            )}
            {selectedTab === CLASS_USERS.TEACHERS && (
              <UserList
                schoolDoc={currentSchool}
                classDoc={currentClass}
                userType={CLASS_USERS.TEACHERS}
              />
            )}
          </div>
          {selectedTab === CLASS_USERS.STUDENTS && (
            <AddButton onClick={addStudent} />
          )}
          {selectedTab === CLASS_USERS.TEACHERS &&
            !(currentRole === RoleType.TEACHER) && (
              <AddButton onClick={addTeacher} />
            )}
        </div>
      )}
    </>
  );
};

export default ClassUsers;
