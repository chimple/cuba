import { IonCard } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./ProfileCard.css";
import React, { useState } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { FcPlus } from "react-icons/fc";
import { HiPlusCircle } from "react-icons/hi";
import User from "../../models/user";
import { AVATARS, PAGES } from "../../common/constants";
import { Util } from "../../utility/util";
import DialogBoxButtons from "./DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";

const ProfileCard: React.FC<{
  width: string;
  height: string;
  //true for User, false for no user
  userType: boolean;
  user: User;
  showText?: boolean;
}> = ({ width, height, userType, user }) => {
  const history = useHistory();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);

  return (
    <IonCard
      id="profile-card"
      style={{
        // width: "auto",
        width: width,
        height: height,
        // height: "auto",
      }}
      onClick={() => {
        console.log("Profile card Icon is clicked");
      }}
    >
      <div id="profile-card-edit-icon-div">
        {userType ? (
          <MdModeEditOutline
            id="profile-card-edit-icon"
            size={"5%"}
            onClick={() => {
              console.log("click on edit icon");
              setShowDialogBox(true);
            }}
          ></MdModeEditOutline>
        ) : (
          <p className="profile-card-empty-element">&#9679;</p>
        )}
        {/* <img
          id="profile-card-edit-icon"
          loading="lazy"
          src="assets/icons/DoneIcon.svg"
          alt="assets/icons/DoneIcon.svg"
        /> */}
      </div>
      {userType ? (
        <div id="profile-card-image-div">
          <img
            id="profile-card-image"
            loading="lazy"
            src={"assets/avatars/" + (user.avatar ?? AVATARS[0]) + ".png"}
            alt=""
          />
          <p>{user.name}</p>
        </div>
      ) : (
        <div id="profile-card-new-user">
          <HiPlusCircle
            id="profile-card-new-user-icon"
            // id="profile-card-edit-icon"
            size={"25vh"}
            onClick={() => {
              // if (!userType) {
              //   console.log("clicked on New User Icon");
              history.replace(PAGES.CREATE_STUDENT);
              // }
            }}
          ></HiPlusCircle>
          <p>New User</p>
        </div>
      )}

      {userType ? (
        <div
          id="profile-card-image-report"
          onClick={async () => {
            await Util.setCurrentStudent(user);
            history.replace(PAGES.STUDENT_PROGRESS);
          }}
        >
          Progress Report
        </div>
      ) : (
        // <></>
        <p className="profile-card-empty-element">&#9679;</p>
      )}
      {showDialogBox ? (
        <DialogBoxButtons
          width={"10vh"}
          height={"10vh"}
          message="You can edit or delete user by clicking on the below buttons"
          showDialogBox={showDialogBox}
          yesText="Delete User"
          noText="Edit User"
          onButtonClicked={async ({ detail }) => {
            console.log(`Dismissed with role: ${detail.role} ${user.docId}`);
            if (detail.role === "delete") {
              await ServiceConfig.getI().apiHandler.deleteProfile(user.docId);
            } else {
              const api = ServiceConfig.getI().apiHandler;
              api.currentStudent = user;
              history.push(PAGES.EDIT_STUDENT, {
                from: history.location.pathname,
              });
            }
            setShowDialogBox(false);
          }}
        ></DialogBoxButtons>
      ) : null}
    </IonCard>
  );
};

export default ProfileCard;
