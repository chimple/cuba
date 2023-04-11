import { IonContent, IonPage } from "@ionic/react";
import { useEffect } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { PAGES } from "../common/constants";
import Auth from "../models/auth";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
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
    <IonPage>
      <IonContent fullscreen>
        <img
          id="login-chimple-logo"
          alt="Chimple Brand Logo"
          // src="assets/Monk.gif"
          src="assets/icons/ChimpleBrandLogo.svg"
        />
        <div
          id="login-button"
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

            // let isUserLoggedIn: boolean = await Auth.i.VSOLogin();
            // if (isUserLoggedIn) {
            //   history.replace(PAGES.HOME);
            // }
          }}
        >
          <img
            id="login-button-img"
            alt="VSO Icon"
            src="assets/icons/VSOLogo.svg"
          />
          <p id="login-button-text">Login with Google</p>
          <img
            id="login-button-img"
            alt="Arrow Icon"
            src="assets/icons/ArrowIcon.svg"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
