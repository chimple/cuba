import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { PAGES } from "../common/constants";
import Auth from "../models/auth";
import IconButton from "./IconButton";
import "./ProfileHeader.css";
import { ServiceConfig } from "../services/ServiceConfig";

const ProfileHeader: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  return (
    <div className="header">
      <IconButton
        name={t("back")}
        iconSrc="assets/icons/BackIcon.svg"
        onClick={() => {
          history.replace(PAGES.HOME);
        }}
      />
      <IconButton name="Chimp" iconSrc="assets/icons/Profile.svg" />
      <IconButton
        name={t("signOut")}
        iconSrc="assets/icons/SignOutIcon.svg"
        onClick={async () => {
          // const isUserLoggedOut: boolean = Auth.i.authLogout();
          // if (isUserLoggedOut) {

          // await ServiceConfig.getI().authHandler.logOut();

          // setTimeout(() => {
          history.replace(PAGES.PARENT);
          // }, 300);
          // }
        }}
      />
    </div>
  );
};
export default ProfileHeader;
