import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";
import { IS_USER_LOGED_IN, PAGES, USER_TOKEN } from "../common/constants";
import Auth from "../models/auth";

const Login: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const isUserLogedIn = Auth.i.isUserLoggedIn();
    if (isUserLogedIn == true) {
      history.replace(PAGES.HOME);
    }
  }, []);
  console.log("Login page");
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
            if (!BackgroundMode.isActive()) {
              BackgroundMode.setEnabled(true);
            }

            let isUserLoggedIn: boolean = await Auth.i.VSOLogin();
            if (isUserLoggedIn) {
              history.replace(PAGES.HOME);
            }

            if (BackgroundMode.isActive()) {
              BackgroundMode.setEnabled(false);
            }
          }}
        >
          <img
            id="login-button-img"
            alt="VSO Icon"
            src="assets/icons/VSOLogo.svg"
          />
          <p id="login-button-text">Login with VSO</p>
          <img
            id="login-button-img"
            alt="Arrow Icon"
            src="assets/icons/ArrowIcon.svg"
          />
        </div>
        <button
          style={{
            position: "absolute",
            top: "90%",
            left: "45%",
            padding: "1%",
          }}
          onClick={async () => {
            Auth.i.userAccountName = "debug15@gmail.com";
            Auth.i.accountType = "com.debug15";
            Auth.i.authToken = "VcisaeK2MhuAxpUCvWUcmVoGyxe1NKY";
            localStorage.setItem(IS_USER_LOGED_IN, "true");
            localStorage.setItem(
              USER_TOKEN,
              JSON.stringify(
                "01,debug15@gmail.com,com.debug15,VcisaeK2MhuAxpUCvWUcmVoGyxe1NKY"
              )
            );
            history.replace(PAGES.HOME);
          }}
        >
          Debug login
        </button>
        {/* <Loading isLoading={isLoading} /> */}
      </IonContent>
    </IonPage>
  );
};

export default Login;
