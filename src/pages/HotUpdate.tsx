import { FC, useEffect, useState } from "react";
import { AppUpdater, HotUpdateStatus } from "../services/AppUpdater";
import { useHistory } from "react-router";
import { LANGUAGE, PAGES } from "../common/constants";
import "./HotUpdate.css";
import { Capacitor } from "@capacitor/core";
import { useFeatureValue, useFeatureIsOn } from "@growthbook/growthbook-react";
import { ServiceConfig } from "../services/ServiceConfig";
import Loading from "../components/Loading";

const HotUpdate: FC<{}> = () => {
  const history = useHistory();
  const [currentStatus, setCurrentStatus] = useState(
    HotUpdateStatus.CHECKING_FOR_UPDATE
  );
  const [isLoading, setIsLoading] = useState(true);
  const can_hot_update = useFeatureIsOn("can_hot_update");
  const hot_update_server = useFeatureValue(
    "hot_update_url",
    "https://chimple-prod-hot-update.web.app/v7"
  );
  const api = ServiceConfig.getI().apiHandler;

  const init = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        push();
        return;
      }
      const canHotUpdate = can_hot_update;
      const hotUpdateServer = hot_update_server;

      if (!canHotUpdate || !hotUpdateServer) {
        push();
        return;
      }

      AppUpdater.sync(hotUpdateServer, (status) => {
        setCurrentStatus(status);
      });

      push();
    } catch (error) {
      push();
    }
    setIsLoading(false);
  };

  const push = () => {
    const appLang = localStorage.getItem(LANGUAGE);

    if (appLang == undefined) {
      history.replace(PAGES.LOGIN);
    } else {
      history.replace(PAGES.SELECT_MODE);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return <Loading isLoading={isLoading} />;
};

export default HotUpdate;
