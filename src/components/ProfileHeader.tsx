import { useHistory } from "react-router";
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
          history.replace("/");
        }}
      />
      <IconButton name="Chimp" iconSrc="assets/icons/profile.png" />
      <IconButton
        name="Sign Out"
        iconSrc="assets/icons/SignOutIcon.svg"
        onClick={() => {
          history.push("/login");
          localStorage.setItem("isUserLogedIn", "false");
        }}
      />
    </div>
  );
};
export default ProfileHeader;
