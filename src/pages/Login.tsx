import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { AccountManager } from "account-manager";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";
import { Capacitor } from "@capacitor/core";
import { IS_USER_LOGED_IN, PAGES, USER_TOKEN } from "../common/constants";
import Auth from "../models/auth";

const Login: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const isUserLogedIn = localStorage.getItem(IS_USER_LOGED_IN);
    if (isUserLogedIn == "true") {
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
          <p>Login with VSO</p>
          <img
            id="login-button-img"
            alt="Arrow Icon"
            src="assets/icons/ArrowIcon.svg"
          />
        </div>
        {/* <Loading isLoading={isLoading} /> */}
      </IonContent>
    </IonPage>
  );
};

export default Login;
