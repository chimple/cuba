import { IonCard } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./ProfileCard.css";
import React from "react";
import { MdModeEditOutline } from "react-icons/md";

const ProfileCard: React.FC<{
  width: string;
  height: string;
  user: any;
  //   isPlayed: boolean;
  //   isUnlocked: boolean;
  showText?: boolean;
}> = ({ width, height, user }) => {
  const history = useHistory();

  return (
    <IonCard
      id="profile-card"
      style={{
        // width: "auto",
        width: width,
        // height: height,
        height: "auto",
      }}
      onClick={() => {
        console.log("Profile card Icon is clicked");
      }}
    >
      <div id="profile-card-edit-icon-div">
        <MdModeEditOutline
          id="profile-card-edit-icon"
          size={"5%"}
          onClick={() => {
            console.log("clicked on Parent back");
            //   history.replace(PAGES.HOME);
          }}
        ></MdModeEditOutline>
        {/* <img
          id="profile-card-edit-icon"
          loading="lazy"
          src="assets/icons/DoneIcon.svg"
          alt="assets/icons/DoneIcon.svg"
        /> */}
      </div>
      <div id="profile-card-image-div">
        <img
          id="profile-card-image"
          loading="lazy"
          src="assets/icons/Profile.svg"
          alt="assets/icons/Profile.svg"
        />
        <p>User Name</p>
      </div>
      <div id="profile-card-image-report">Report</div>
    </IonCard>
  );
};

export default ProfileCard;
