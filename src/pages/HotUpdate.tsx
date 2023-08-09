import { IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import { AppUpdater, HotUpdateStatus } from "../services/AppUpdater";
import { useHistory } from "react-router";
import { HOT_UPDATE_SERVER, PAGES } from "../common/constants";
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
      console.log(
        "🚀 ~ file: HotUpdate.tsx:18 ~ init ~ canHotUpdate:",
        canHotUpdate
      );
      const hotUpdateServer = HOT_UPDATE_SERVER;
      console.log(
        "🚀 ~ file: HotUpdate.tsx:23 ~ init ~ hotUpdateServer:",
        hotUpdateServer
      );

      if (!canHotUpdate || !hotUpdateServer) {
        push();
        return;
      }
      console.log(
        "🚀 ~ file: AppUpdate.tsx:18 ~ init ~ hotUpdateServer:",
        hotUpdateServer
      );
      const appUpdate = await AppUpdater.sync(hotUpdateServer, (status) => {
        console.log("🚀 ~ file: HotUpdate.tsx:42 ~ init ~ status:", status);
        setCurrentStatus(status);
      });
      console.log("🚀 ~ file: AppUpdate.tsx:19 ~ init ~ appUpdate:", appUpdate);
      push();
    } catch (error) {
      console.log("🚀 ~ file: AppUpdate.tsx:21 ~ init ~ error:", error);
      push();
    }
  };
  const push = () => {
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
