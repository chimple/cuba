import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { useEffect } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { PAGES } from "../common/constants";
import Auth from "../models/auth";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
import TextBox from "../components/TextBox";
import { FaBeer, FaGoogle } from "react-icons/fa";
// import { Platform } from "react-native";

const Login: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const authHandler = ServiceConfig.getI().authHandler;
    authHandler.isUserLoggedIn().then((isUserLoggedIn) => {
      if (isUserLoggedIn) history.replace(PAGES.HOME);
    });
    // const isUserLogedIn = Auth.i.isUserLoggedIn();
    // if (isUserLogedIn == true) {
    //   history.replace(PAGES.HOME);
    // }
  }, []);
  console.log(
    "Login page",
    Capacitor.getPlatform(),
    Capacitor.getPlatform() === "android"
  );
  return (
    <IonPage id="login-screen">
      <IonContent fullscreen>
        <img
          id="login-chimple-logo"
          alt="Chimple Brand Logo"
          // src="assets/Monk.gif"
          src="assets/icons/ChimpleBrandLogo.svg"
        />
        <div id="chimple-brand-text1">Welcome to Chimple!</div>
        <p id="chimple-brand-text2">
          Discovering the joy of learning with Chimple- where curiosity meets
          education!
        </p>

        <TextBox
          inputText={"Enter your Phone Number"}
          inputType={"number"}
        ></TextBox>

        <div id="login-continue-button">Continue</div>

        <div id="login-google-icon-text">Continue with Google</div>

        <img
          id="login-google-icon"
          alt="Google Icon"
          src="assets/icons/Google Icon.png"
          onClick={async () => {
            const _authHandler = ServiceConfig.getI().authHandler;
            const result = await _authHandler.googleSign();
            console.log(
              "🚀 ~ file: Login.tsx:44 ~ onClick={ ~ result:",
              result
            );
            if (result) {
              history.replace(PAGES.HOME);
            }
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
