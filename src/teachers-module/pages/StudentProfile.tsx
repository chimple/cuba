import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "./StudentProfile.css";
import { CLASS, PAGES, SCHOOL, TableTypes } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import Header from "../components/homePage/Header";
import { IonPage } from "@ionic/react";
import UserProfile from "../components/studentProfile/UserProfile";
import { t } from "i18next";
import { Util } from "../../utility/util";
import { subDays } from "date-fns";

const StudentProfile: React.FC = () => {
  const history = useHistory();
  const [student, setStudent] = useState<TableTypes<"user">>();
  const [school, setSchool] = useState<TableTypes<"school">>();
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [isEditing, setIsEditing] = useState(false);
  const [allClasses, setAllClasses] = useState<TableTypes<"class">[]>([]);
  const tempClass = history.location.state!["classDoc"] as TableTypes<"class">;

  const paramStudentId = history.location.state!["studentId"] as string;
  const api = ServiceConfig.getI()?.apiHandler;
  const auth = ServiceConfig.getI()?.authHandler;

  useEffect(() => {
    init();
  }, []);

  const handleViewProgressClick = () => {
    var startDate = subDays(new Date(), 6);
    var endDate = new Date();
    history.replace(PAGES.STUDENT_REPORT, {
      student: student,
      startDate: startDate,
      endDate: endDate,
      isStudentProfilePage: true,
      classDoc: tempClass,
    });
  };

  const init = async () => {
    const user = await auth.getCurrentUser();
    if (!user) return;
    const tempSchool = Util.getCurrentSchool();
    if (tempSchool) setSchool(tempSchool);
    if (tempClass) setCurrentClass(tempClass);
    const tempStud = await api.getUserByDocId(paramStudentId);
    if (tempStud) {
      setStudent(tempStud);
    }
    if (tempSchool) {
      const fetchedClasses = await api.getClassesForSchool(
        tempSchool.id,
        user.id
      );
      setAllClasses(fetchedClasses);
    }
  };

  const onBackButtonClick = () => {
    history.replace(PAGES.CLASS_USERS, currentClass);
  };

  const handleUpdateClick = async () => {
    if (student) {
      try {
        const updatedStudent = await api.updateStudentFromSchoolMode(
          student,
          student.name!,
          student.age!,
          student.gender!,
          student.avatar!,
          undefined,
          student.curriculum_id!,
          student.grade_id!,
          student.language_id!,
          student.student_id!,
          currentClass?.id!
        );
        setStudent(updatedStudent);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update student:", error);
      }
    }
  };

  return (
    <IonPage className="student-profile-page">
      <div className="student-profile">
        <div className="fixed-header">
          <Header
            isBackButton={true}
            showSchool={true}
            showClass={true}
            className={tempClass?.name}
            schoolName={school?.name}
            onBackButtonClick={onBackButtonClick}
          />
        </div>
        {student && (
          <UserProfile
            student={student}
            classDoc={currentClass}
            isEditing={isEditing}
            setStudent={setStudent}
            setIsEditing={setIsEditing}
            setCurrentClass={setCurrentClass}
            allClasses={allClasses}
          />
        )}
        {!isEditing ? (
          <p>{t("Click below to view student's progress")}</p>
        ) : (
          <p>{t("Click below to update student's progress")}</p>
        )}

        {!isEditing ? (
          <button
            onClick={handleViewProgressClick}
            className="view-progress-btn"
          >
            {t("View Progress")}
          </button>
        ) : (
          <button className="view-progress-btn" onClick={handleUpdateClick}>
            {t("Update")}
          </button>
        )}
      </div>
    </IonPage>
  );
};

export default StudentProfile;
