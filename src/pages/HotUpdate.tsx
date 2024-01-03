import { IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import { AppUpdater, HotUpdateStatus } from "../services/AppUpdater";
import { useHistory } from "react-router";
import { HOT_UPDATE_SERVER, LANGUAGE, PAGES } from "../common/constants";
import { t } from "i18next";
import "./HotUpdate.css";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from "../services/RemoteConfig";
import { Capacitor } from "@capacitor/core";

const HotUpdate: FC<{}> = () => {
  const history = useHistory();
  const [currentStatus, setCurrentStatus] = useState(
    HotUpdateStatus.CHECKING_FOR_UPDATE
  );
  const init = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        push();
        return;
      }
      const canHotUpdate = await RemoteConfig.getBoolean(
        REMOTE_CONFIG_KEYS.CAN_HOT_UPDATE
      );
      const hotUpdateServer = HOT_UPDATE_SERVER;
      if (!canHotUpdate || !hotUpdateServer) {
        push();
        return;
      }
      const appUpdate = await AppUpdater.sync(hotUpdateServer, (status) => {
        setCurrentStatus(status);
      });
      push();
    } catch (error) {
      push();
    }
  };
  const push = () => {
    const appLang = localStorage.getItem(LANGUAGE);
    if (appLang == undefined) {
      history.replace(PAGES.APP_LANG_SELECTION);
    } else
      history.replace(PAGES.HOME);
  };
  useEffect(() => {
    init();
  }, []);
  return (
    <IonPage id="app-update">
      <img className="hot-update-loading" src="assets/loading.gif"></img>
      <br />
      <p>{t(currentStatus)}</p>
    </IonPage>
  );
};
export default HotUpdate;
