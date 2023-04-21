import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { AVATARS, PAGES } from "../common/constants";
import IconButton from "./IconButton";
import "./ProfileHeader.css";
import { ServiceConfig } from "../services/ServiceConfig";

const ProfileHeader: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const student = ServiceConfig.getI().apiHandler.currentStudent;

  return (
    <div className="header">
      <IconButton
        name={t("back")}
        iconSrc="assets/icons/BackIcon.svg"
        onClick={() => {
          history.replace(PAGES.HOME);
        }}
      />
      <IconButton
        name={student?.name ?? "Chimp"}
        iconSrc={"assets/avatars/" + (student?.avatar ?? AVATARS[0]) + ".png"}
      />
      <IconButton
        name={t("signOut")}
        iconSrc="assets/icons/SignOutIcon.svg"
        onClick={async () => {
          // const isUserLoggedOut: boolean = Auth.i.authLogout();
          // if (isUserLoggedOut) {
          await ServiceConfig.getI().authHandler.logOut();
          // setTimeout(() => {
          history.replace(PAGES.LOGIN);
          // }, 300);
          // }
        }}
      />
    </div>
  );
};
export default ProfileHeader;
