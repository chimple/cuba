import { useEffect } from "react";
import "./BackButton.css";
import { IoIosArrowBack } from "react-icons/io";
import { App } from "@capacitor/app";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";

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
      if (urlParams.get("continue") && Capacitor.isNativePlatform()) {
        App.addListener("appStateChange", Util.onAppStateChange);
      }
    };
  }, [onClicked]);

  return (
    <IoIosArrowBack
      id="common-back-button"
      onClick={onClicked}
    ></IoIosArrowBack>
  );
};
export default BackButton;
