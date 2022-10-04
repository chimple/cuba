import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { AccountManager } from "account-manager";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";
import { Capacitor } from "@capacitor/core";
import { IS_USER_LOGED_IN } from "../common/constants";

const Login: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const isUserLogedIn = localStorage.getItem(IS_USER_LOGED_IN);
    if (isUserLogedIn == "true") {
      history.replace("/");
    }
  }, []);
  console.log("Login page");
  return (
    <IonPage>
      <IonContent fullscreen>
        <img
          id="login-chimple-logo"
          alt="Chimple Brand Logo"
          src="assets/icons/ChimpleBrandLogo.svg"
        />
        <div
          id="login-button"
          onClick={async () => {
            if (!BackgroundMode.isActive()) {
              BackgroundMode.setEnabled(true);
            }

            // let result = await AccountManager.authenticator({
            //   userName: "skandakumar97@gmail.com",
            //   AccountType: "com.google",
            // });
            console.log("login-button entred");
            let responce: any;
            try {
              responce = await AccountManager.accountPicker();
              console.log("login-button-result", responce.result);
              let result: boolean = responce.result;
              console.log(
                "login-button-result result.result",
                result,
                responce.result
              );
              if (result) {
                console.log("login-button result true", result);
                localStorage.setItem(IS_USER_LOGED_IN, "true");
                history.replace("/");
              } else {
                console.log("login-button result false", result);
                localStorage.setItem(IS_USER_LOGED_IN, "false");
              }
            } catch (error: any) {
              localStorage.setItem(IS_USER_LOGED_IN, "false");

              if (
                error.message === "Method not implemented." &&
                !Capacitor.isNativePlatform()
              ) {
                console.log("login-button result true");
                localStorage.setItem(IS_USER_LOGED_IN, "true");
                history.replace("/");
              }
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
