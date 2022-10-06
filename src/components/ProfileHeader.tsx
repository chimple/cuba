import { useHistory } from "react-router";
import { PAGES } from "../common/constants";
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
      <IconButton name="Chimp" iconSrc="assets/icons/profile.png" />
      <IconButton
        name="Sign Out"
        iconSrc="assets/icons/SignOutIcon.svg"
        onClick={() => {
          history.push(PAGES.LOGIN);
          localStorage.setItem("isUserLogedIn", "false");
        }}
      />
    </div>
  );
};
export default ProfileHeader;
