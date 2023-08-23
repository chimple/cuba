import { useEffect } from "react";
import "./BackButton.css";
import { IoIosArrowBack } from "react-icons/io";
import { App } from "@capacitor/app";

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
