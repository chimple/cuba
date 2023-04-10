import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { DEBUG_15, IS_USER_LOGED_IN, PAGES, USER_TOKEN } from "../common/constants";
import Auth from "../models/auth";
import { Capacitor } from "@capacitor/core";
// import { Platform } from "react-native";

const Login: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const isUserLogedIn = Auth.i.isUserLoggedIn();
    if (isUserLogedIn == true) {
      history.replace(PAGES.HOME);
    }
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
            
            let isUserLoggedIn: boolean = await Auth.i.VSOLogin();
            if (isUserLoggedIn) {
              history.replace(PAGES.HOME);
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
        {/* {Capacitor.getPlatform() === "android" ? (
          <button
            style={{
              position: "absolute",
              top: "90%",
              left: "45%",
              padding: "1%",
            }}
            onClick={async () => {
              Auth.i.userAccountName = DEBUG_15;
              Auth.i.accountType = "com.ustadmobile";
              Auth.i.authToken = "VcisaeK2MhuAxpUCvWUcmVoGyxe1NKY";
              Auth.i.sourcedId = "4334700840729898";
              Auth.i.endpointUrl = "http://192.168.88.99:8087/";
              localStorage.setItem(IS_USER_LOGED_IN, "true");
              localStorage.setItem(
                USER_TOKEN,
                JSON.stringify({
                  authAccount: Auth.i.userAccountName,
                  sourcedId: Auth.i.sourcedId,
                  endpointUrl: Auth.i.endpointUrl,
                  addedType: Auth.i.accountType,
                  authToken: Auth.i.authToken,
                })
              );
              history.replace(PAGES.HOME);
            }}
          >
            Debug login
          </button>
        ) : (
          <></>
        )} */}
        {/* <Loading isLoading={isLoading} /> */}
      </IonContent>
    </IonPage>
  );
};

export default Login;
