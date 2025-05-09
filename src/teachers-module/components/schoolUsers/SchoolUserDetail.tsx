import React from "react";
import "./SchoolUserDetail.css";
import { SCHOOL_USERS, TableTypes } from "../../../common/constants";
const SchoolUserDetail: React.FC<{
  user: TableTypes<"user">;
  schoolId: string;
  userType: SCHOOL_USERS;
}> = ({ user, schoolId, userType }) => {
  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    event.currentTarget.src = "assets/icons/userIcon.png";
  };
  return (
    <div>
      <div className="school-user-list">
        <div className="school-user-name-div">
          <div className="school-user-item">
            <img
              className="avatar-img"
              src={user.image ? user.image : "assets/icons/userIcon.png"}
              onError={handleImageError}
            />
          </div>
          <div className="school-user-profile-name">{user.name}</div>
        </div>
      </div>
    </div>
  );
};

export default SchoolUserDetail;
