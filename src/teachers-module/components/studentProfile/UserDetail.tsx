import React from "react";
import "./UserDetail.css";
import {
  AVATARS,
  CLASS_USERS,
  CURRENT_TEACHER,
  PAGES,
  TableTypes,
} from "../../../common/constants";
import { useHistory } from "react-router-dom";
import { IonIcon } from "@ionic/react";
const UserDetail: React.FC<{
  user: TableTypes<"user">;
  classDoc: TableTypes<"class">;
  schoolDoc: TableTypes<"school">;
  userType: CLASS_USERS;
}> = ({ user, classDoc, schoolDoc, userType }) => {
  const history = useHistory();
  console.log("usertype..", userType);

  const handleStudentClick = (studentId: string) => {
    history.replace(PAGES.STUDENT_PROFILE, {
      classDoc: classDoc,
      studentId: studentId,
    });
  };
  const handleTeacherClick = () => {
    localStorage.setItem(CURRENT_TEACHER, JSON.stringify(user));
    history.replace(PAGES.TEACHER_PROFILE, {
      classDoc: classDoc,
      school: schoolDoc,
    });
  };
  const getRandomAvatar = () => {
    if (AVATARS.length === 0) return ""; // Return empty if there are no avatars
    const randomIndex = Math.floor(Math.random() * AVATARS.length);
    return "assets/avatars/" + AVATARS[randomIndex] + ".png";
  };
  const avatarUrl = user.image
    ? user.image
    : user.avatar
      ? "assets/avatars/" + user.avatar + ".png"
      : getRandomAvatar();
  return (
    <div
      onClick={() => {
        if (userType === CLASS_USERS.STUDENTS) {
          handleStudentClick(user.id);
        } else {
          handleTeacherClick();
        }
      }}
    >
      <div className="student-list">
        <div className="student-name-div">
          <div className="student-item">
            {userType === CLASS_USERS.STUDENTS ? (
              <img className="avatar-img" src={avatarUrl} alt={user.name!} />
            ) : (
              <img className="user-img" src={"assets/icons/userIcon.png"} />
            )}
          </div>
          <div className="student-profile-name">{user.name}</div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
