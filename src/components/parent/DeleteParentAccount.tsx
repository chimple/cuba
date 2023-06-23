import { t } from "i18next";
import "./DeleteParentAccount.css";
import { ImBin } from "react-icons/im";
import { useState } from "react";
import DialogBoxButtons from "./DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";
import Loading from "../Loading";

const DeleteParentAccount: React.FC<{}> = ({}) => {
  const [showDialogBox, setShowDialogBox] = useState(false);
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const ondelete = async () => {
    setIsLoading(true);
    const auth = ServiceConfig.getI().authHandler;
    const api = ServiceConfig.getI().apiHandler;
    await api.deleteAllUserData();
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    history.replace(PAGES.APP_LANG_SELECTION);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };
  return (
    <div
      onClick={() => {
        setShowDialogBox(!showDialogBox);
      }}
      className="parent-delete-btn"
    >
      <ImBin className="parent-delete-icon" />
      <div>{t("Delete Parent Account")}</div>
      <DialogBoxButtons
        width={"40vw"}
        height={"30vh"}
        message={t("Do you want to delete the parent account")}
        showDialogBox={showDialogBox}
        yesText={t("Cancel")}
        noText={t("Delete")}
        handleClose={() => {
          setShowDialogBox(false);
        }}
        onYesButtonClicked={() => {
          setShowDialogBox(false);
        }}
        onNoButtonClicked={ondelete}
      />
      <Loading isLoading={isLoading} />
    </div>
  );
};

export default DeleteParentAccount;
