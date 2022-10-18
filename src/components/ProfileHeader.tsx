import { useHistory } from "react-router";
import { PAGES, USER_TOKEN } from "../common/constants";
import Auth from "../models/auth";
import IconButton from "./IconButton";
import "./ProfileHeader.css";

const ProfileHeader: React.FC = () => {
  const history = useHistory();
  return (
    <div className="header">
      <IconButton
        name="Back"
        iconSrc="assets/icons/BackIcon.svg"
        onClick={() => {
          history.replace(PAGES.HOME);
        }}
      />
      <IconButton name="Chimp" iconSrc="assets/icons/Profile.svg" />
      <IconButton
        name="Sign Out"
        iconSrc="assets/icons/SignOutIcon.svg"
        onClick={() => {
          const isUserLoggedOut: boolean = Auth.i.authLogout();
          if (isUserLoggedOut) {
            history.replace(PAGES.LOGIN);
          }
        }}
      />
    </div>
  );
};
export default ProfileHeader;
