import { t } from "i18next";
import "./ParentLogout.css";
import { ImSwitch } from "react-icons/im";
import { useState } from "react";
import DialogBoxButtons from "./DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import { CURRENT_STUDENT, CURRENT_USER, PAGES } from "../../common/constants";
import { Capacitor } from "@capacitor/core";
import { Util } from "../../utility/util";

const ParentLogout: React.FC<{}> = ({ }) => {
  const [showDialogBox, setShowDialogBox] = useState(false);
  const history = useHistory();
  const onSignOut = async () => {
    const auth = ServiceConfig.getI().authHandler;
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    localStorage.removeItem(CURRENT_USER);
    history.replace(PAGES.APP_LANG_SELECTION);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };
  return (
    <div
      onClick={() => {
        setShowDialogBox(!showDialogBox);
      }}
      className="parent-logout-btn"
    >
      <ImSwitch className="parent-logout-icon" />
      <div>{t("Sign out as a Parent")}</div>
      <DialogBoxButtons
        width={"40vw"}
        height={"30vh"}
        message={t("Do you want to sign out")}
        showDialogBox={showDialogBox}
        yesText={t("Cancel")}
        noText={t("Sign Out")}
        handleClose={() => {
          setShowDialogBox(false);
        }}
        onYesButtonClicked={() => {
          setShowDialogBox(false);
        }}
        onNoButtonClicked={onSignOut}
      />
    </div>
  );
};

export default ParentLogout;
