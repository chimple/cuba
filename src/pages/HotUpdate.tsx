import { IonLoading } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import { AppUpdater, HotUpdateStatus } from "../services/AppUpdater";
import { useHistory } from "react-router";
import { HOT_UPDATE_SERVER, LANGUAGE, PAGES } from "../common/constants";
import { t } from "i18next";
import "./HotUpdate.css";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from "../services/RemoteConfig";
import { Capacitor } from "@capacitor/core";
import { useFeatureValue, useFeatureIsOn } from "@growthbook/growthbook-react";

const HotUpdate: FC<{}> = () => {
  const history = useHistory();
  const [currentStatus, setCurrentStatus] = useState(
    HotUpdateStatus.CHECKING_FOR_UPDATE
  );
  const [isLoading, setIsLoading] = useState(true);
  const can_hot_update = useFeatureIsOn("can_hot_update");
  const hot_update_server = useFeatureValue("hot_update_url", "https://chimple-prod-hot-update.web.app/v7");
  const init = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        push();
        return;
      }
      // const canHotUpdate = await RemoteConfig.getBoolean(
      //   REMOTE_CONFIG_KEYS.CAN_HOT_UPDATE
      // );
      const canHotUpdate = can_hot_update;
      const hotUpdateServer = hot_update_server
      // const hotUpdateServer = HOT_UPDATE_SERVER;
      if (!canHotUpdate || !hotUpdateServer) {
        push();
        return;
      }
      // AppUpdater.sync(hotUpdateServer, (status) => {
      //   // setCurrentStatus(status);
      // });
      push();
    } catch (error) {
      push();
    }
    setIsLoading(false);
  };
  const push = () => {
    const appLang = localStorage.getItem(LANGUAGE);
    if (appLang == undefined) {
      history.replace(PAGES.APP_LANG_SELECTION);
    } else history.replace(PAGES.SELECT_MODE);
  };
  useEffect(() => {
    init();
  }, []);
  return isLoading ? (
    <IonLoading
      message={`<img class="loading" src="assets/loading.gif"></img>`}
      isOpen={true}
      spinner={null}
    />
  ) : null;
};
export default HotUpdate;
