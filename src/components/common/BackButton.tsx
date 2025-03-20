import { useEffect } from "react";
import "./BackButton.css";
import { IoIosArrowBack } from "react-icons/io";
import { App } from "@capacitor/app";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";
import { CONTINUE } from "../../common/constants";
import { t } from "i18next";

const BackButton: React.FC<{
  onClicked: any;
}> = ({ onClicked }) => {
  useEffect(() => {
    const backButtonHandler = () => {
      onClicked();
    };
    App.addListener("backButton", backButtonHandler);

    return () => {
      App.removeAllListeners();
      const urlParams = new URLSearchParams(window.location.search);
      App.addListener("appUrlOpen", Util.onAppUrlOpen);
      if (urlParams.get(CONTINUE) && Capacitor.isNativePlatform()) {
        App.addListener("appStateChange", Util.onAppStateChange);
      }
    };
  }, [onClicked]);

  return (
    <IoIosArrowBack
      id="common-back-button"
      aria-label={String(t("Back"))}
      onClick={onClicked}
    ></IoIosArrowBack>
  );
};
export default BackButton;
