import { IonCard } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./ProfileCard.css";
import React, { useState } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { HiPlusCircle } from "react-icons/hi";
import {
  ACTION,
  AVATARS,
  EVENTS,
  PAGES,
  MODES,
  TableTypes,
} from "../../common/constants";
import { Util } from "../../utility/util";
import DialogBoxButtons from "./DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import Loading from "../Loading";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";

const ProfileCard: React.FC<{
  width: string;
  height: string;
  //true for User, false for no user
  userType: boolean;
  user: TableTypes<"user">;
  showText?: boolean;
  setReloadProfiles: (event: boolean) => void;
  profiles?: TableTypes<"user">[];
  studentCurrMode: string | undefined;
}> = ({
  width,
  height,
  userType,
  user,
  setReloadProfiles,
  profiles,
  studentCurrMode,
}) => {
  const history = useHistory();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [showWarningDialogBox, setShowWarningDialogBox] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const areProfilesAvailable = (profiles && profiles[0] == null) || undefined;
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
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
              if (!online) {
                presentToast({
                  message: t(
                    `Device is offline. Cannot edit or delete child profile`
                  ),
                  color: "danger",
                  duration: 3000,
                  position: "bottom",
                  buttons: [
                    {
                      text: "Dismiss",
                      role: "cancel",
                    },
                  ],
                });
                return;
              }
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
            src={
              (studentCurrMode === MODES.SCHOOL && user.image) ||
              "assets/avatars/" + (user.avatar ?? AVATARS[0]) + ".png"
            }
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
              if (!online) {
                presentToast({
                  message: t(
                    `Device is offline. Cannot create a new child profile`
                  ),
                  color: "danger",
                  duration: 3000,
                  position: "bottom",
                  buttons: [
                    {
                      text: "Dismiss",
                      role: "cancel",
                    },
                  ],
                });
                return;
              }
              history.replace(PAGES.CREATE_STUDENT, {
                showBackButton: !areProfilesAvailable,
              });
            }}
          ></HiPlusCircle>
          <p>{t("New Profile")}</p>
        </div>
      )}

      {userType ? (
        <div
          id="profile-card-image-report"
          onClick={async () => {
            await Util.setCurrentStudent(user, undefined, false, false);
            // const api = ServiceConfig.getI().apiHandler;
            // api.currentStudent = user;

            Util.setPathToBackButton(PAGES.STUDENT_PROGRESS, history);
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
            "You can edit or delete the Profile by clicking on the buttons below."
          )}
          showDialogBox={showDialogBox}
          yesText={t("Delete Profile")}
          noText={t("Edit Profile")}
          handleClose={() => {
            setShowDialogBox(false);
            console.log("Close", false);
          }}
          onYesButtonClicked={async ({}) => {
            console.log(`Delete Profile`, "yes", user.id);
            setShowWarningDialogBox(true);
          }}
          onNoButtonClicked={async ({}) => {
            console.log(`Edit Profile`, "no", user.id);
            const api = ServiceConfig.getI().apiHandler;
            await Util.setCurrentStudent(user, undefined, false);
            history.replace(PAGES.EDIT_STUDENT, {
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
          message={t("Do you want to delete the Profile?")}
          showDialogBox={showDialogBox}
          yesText={t("Yes")}
          noText={t("No")}
          handleClose={() => {
            setShowDialogBox(false);
            console.log("Close", false);
          }}
          onYesButtonClicked={async ({}) => {
            console.log(`Show warning yes:`, user.id);
            setShowWarningDialogBox(false);
            setShowDialogBox(false);
            setIsLoading(true);
            setReloadProfiles(false);
            await ServiceConfig.getI().apiHandler.deleteProfile(user.id);
            setReloadProfiles(true);
            const eventParams = {
              user_id: user.id,
              // user_type: user.role,
              user_name: user.name,
              user_gender: user.gender!,
              user_age: user.age!,
              phone_number: user.phone,
              // parent_id: user.uid,
              // parent_username: user.username,
              action_type: ACTION.DELETE,
            };
            console.log(
              "Util.logEvent(EVENTS.USER_PROFILE, eventParams);",
              EVENTS.USER_PROFILE,
              eventParams
            );
            Util.logEvent(EVENTS.USER_PROFILE, eventParams);
            setIsLoading(false);
          }}
          onNoButtonClicked={async ({}) => {
            console.log(`Show warning No:`);
            setShowWarningDialogBox(false);
          }}
        ></DialogBoxButtons>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonCard>
  );
};

export default ProfileCard;
