import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import "./StudentProfile.css";
import { CURRENT_TEACHER, PAGES, TableTypes } from "../../common/constants";
import Header from "../components/homePage/Header";
import { IonPage } from "@ionic/react";
import TeacherProfileSection from "../components/addTeacher/TeacherProfileSection";

const TeacherProfile: React.FC = () => {
  const localTeacher = localStorage.getItem(CURRENT_TEACHER);
  const selectedTeacher = JSON.parse(localTeacher!);
  const history = useHistory();
  const location = useLocation<{
    classDoc: TableTypes<"class">;
    school: TableTypes<"school">;
  }>();
  const { classDoc, school } = location.state || {};

  const onBackButtonClick = () => {
    history.replace(`${PAGES.CLASS_USERS}?tab=Teachers`, classDoc);
  };

  return (
    <IonPage className="student-profile-page">
      <div className="student-profile">
        <div className="fixed-header">
          <Header
            isBackButton={true}
            showSchool={true}
            showClass={true}
            className={classDoc?.name}
            schoolName={school?.name}
            onBackButtonClick={onBackButtonClick}
          />
        </div>

        {selectedTeacher && (
          <TeacherProfileSection
            teacher={selectedTeacher}
            classDoc={classDoc}
          />
        )}
      </div>
    </IonPage>
  );
};

export default TeacherProfile;
