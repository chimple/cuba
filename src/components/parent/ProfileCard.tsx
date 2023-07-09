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
import { t } from "i18next";

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
  const [showWarningDialogBox, setShowWarningDialogBox] =
    useState<boolean>(false);

  return (
    <IonCard
      id="profile-card"
      style={{
        // width: "auto",
        width: width,
        // height: height,
        height: "auto",
        padding: userType ? "1.5% 1.5% 3% 1.5%" : "0% 0% 0% 0%",
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
          // <></>
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
          <p id="profile-card-user-name">{user.name}</p>
        </div>
      ) : (
        <div id="profile-card-new-user">
          <HiPlusCircle
            id="profile-card-new-user-icon"
            size={"16vw"}
            onClick={() => {
              history.replace(PAGES.CREATE_STUDENT, {
                showBackButton: true,
              });
            }}
          ></HiPlusCircle>
          <p>{t("New User")}</p>
        </div>
      )}

      {userType ? (
        <div
          id="profile-card-image-report"
          onClick={async () => {
            await Util.setCurrentStudent(user, undefined, false, false);
            // const api = ServiceConfig.getI().apiHandler;
            // api.currentStudent = user;

            history.replace(PAGES.STUDENT_PROGRESS);
          }}
        >
          {t("Progress Report")}
        </div>
      ) : (
        // <></>
        <p className="profile-card-empty-element">&#9679;</p>
      )}
      {showDialogBox ? (
        <DialogBoxButtons
          width={"40vw"}
          height={"30vh"}
          message={t(
            "You can edit or delete user by clicking on the below buttons"
          )}
          showDialogBox={showDialogBox}
          yesText={t("Delete User")}
          noText={t("Edit User")}
          handleClose={() => {
            setShowDialogBox(false);
            console.log("Close", false);
          }}
          onYesButtonClicked={async ({}) => {
            console.log(`Delete Profile`, "yes", user.docId);
            setShowWarningDialogBox(true);
          }}
          onNoButtonClicked={async ({}) => {
            console.log(`Edit Profile`, "no", user.docId);
            const api = ServiceConfig.getI().apiHandler;
            await Util.setCurrentStudent(user, undefined, false);
            history.push(PAGES.EDIT_STUDENT, {
              from: history.location.pathname,
            });
            setShowDialogBox(false);
          }}
        ></DialogBoxButtons>
      ) : null}
      {showWarningDialogBox ? (
        <DialogBoxButtons
          width={"40vw"}
          height={"30vh"}
          message={t("Do you want to delete the user?")}
          showDialogBox={showDialogBox}
          yesText={t("Yes")}
          noText={t("No")}
          handleClose={() => {
            setShowDialogBox(false);
            console.log("Close", false);
          }}
          onYesButtonClicked={async ({}) => {
            console.log(`Show warning yes:`, user.docId);
            setShowWarningDialogBox(false);
            setShowDialogBox(false);
            await ServiceConfig.getI().apiHandler.deleteProfile(user.docId);
          }}
          onNoButtonClicked={async ({}) => {
            console.log(`Show warning No:`);
            setShowWarningDialogBox(false);
          }}
        ></DialogBoxButtons>
      ) : null}
    </IonCard>
  );
};

export default ProfileCard;
