import React, { useEffect, useState } from "react";
import "./UserList.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { CLASS_USERS, TableTypes, USER_ROLE } from "../../../common/constants";
import UserDetail from "./UserDetail";
import { IonAlert, IonIcon } from "@ionic/react";
import { RoleType } from "../../../interface/modelInterfaces";
import { t } from "i18next";
import { trashOutline } from "ionicons/icons";

const UserList: React.FC<{
  schoolDoc: TableTypes<"school">;
  classDoc: TableTypes<"class">;
  userType: CLASS_USERS;
}> = ({ schoolDoc, classDoc, userType }) => {
  const api = ServiceConfig.getI()?.apiHandler;
  const [allStudents, setAllStudents] = useState<TableTypes<"user">[]>();
  const [allTeachers, setAllTeachers] = useState<TableTypes<"user">[]>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TableTypes<"user"> | null>(
    null
  );
  const currentUserRole = JSON.parse(localStorage.getItem(USER_ROLE)!);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (userType === CLASS_USERS.STUDENTS) {
      const studentsDoc = await api?.getStudentsForClass(classDoc.id);
      setAllStudents(studentsDoc);
      console.log("all students..", studentsDoc);
    } else {
      const teachersDoc = await api?.getTeachersForClass(classDoc.id);
      setAllTeachers(teachersDoc);
      console.log("all teachers..", teachersDoc);
    }
  };

  const handleDeleteClick = (user: TableTypes<"user">) => {
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      try {
        if (userType === CLASS_USERS.STUDENTS) {
          await api?.deleteUserFromClass(selectedUser.id);
          console.log("selected student removed from class", selectedUser);
          setAllStudents((prev) =>
            prev?.filter((student) => student.id !== selectedUser.id)
          );
        } else if (userType === CLASS_USERS.TEACHERS) {
          await api?.deleteTeacher(classDoc.id, selectedUser.id);

          await api.updateSchoolLastModified(schoolDoc.id);
          await api.updateClassLastModified(classDoc.id);
          await api.updateUserLastModified(selectedUser.id);

          console.log("selected teacher removed from class");
          setAllTeachers((prev) =>
            prev?.filter((teacher) => teacher.id !== selectedUser.id)
          );
        }
        setShowConfirm(false);
        setSelectedUser(null);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div>
      {userType === CLASS_USERS.STUDENTS &&
      allStudents &&
      allStudents.length > 0
        ? allStudents.map((student, index) => (
            <div key={index}>
              <div className="student-div">
                <div>
                  <UserDetail
                    user={student}
                    schoolDoc={schoolDoc}
                    classDoc={classDoc}
                    userType={userType}
                  />
                </div>

                <div
                  className="delete-button"
                  onClick={() => handleDeleteClick(student)}
                >
                  <IonIcon icon={trashOutline} className="trash-icon" />
                </div>
              </div>

              <hr className="horizontal-line" />
            </div>
          ))
        : null}

      {userType === CLASS_USERS.TEACHERS &&
      allTeachers &&
      allTeachers.length > 0
        ? allTeachers.map((teacher, index) => (
            <div key={index}>
              <div className="student-div">
                <div>
                  <UserDetail
                    schoolDoc={schoolDoc}
                    user={teacher}
                    classDoc={classDoc}
                    userType={userType}
                  />
                </div>

                {(currentUserRole === RoleType.PRINCIPAL ||
                  currentUserRole === RoleType.COORDINATOR) && (
                  <div
                    className="delete-button"
                    onClick={() => handleDeleteClick(teacher)}
                  >
                    <IonIcon icon={trashOutline} className="trash-icon" />
                  </div>
                )}
              </div>

              <hr className="horizontal-line" />
            </div>
          ))
        : null}

      <IonAlert
        isOpen={showConfirm}
        onDidDismiss={() => setShowConfirm(false)}
        cssClass="custom-alert"
        message={t("Are you sure you want to delete this user?") || ""}
        buttons={[
          {
            text: t("Delete"),
            cssClass: "alert-delete-button",
            handler: confirmDelete,
          },
          {
            text: t("Cancel") || "",
            cssClass: "alert-cancel-button",
            handler: () => setShowConfirm(false),
          },
        ]}
      />
    </div>
  );
};

export default UserList;
