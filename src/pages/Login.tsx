import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { AccountManager } from "account-manager";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";

const Login: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const isUserLogedIn = localStorage.getItem("isUserLogedIn");
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
          src="/assets/icons/ChimpleBrandLogo.svg"
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
                localStorage.setItem("isUserLogedIn", "true");
                history.replace("/");
              } else {
                console.log("login-button result false", result);
                localStorage.setItem("isUserLogedIn", "false");
              }
            } catch (error) {
              console.log("got exception error", error);
              localStorage.setItem("isUserLogedIn", "false");
            }
            if (BackgroundMode.isActive()) {
              BackgroundMode.setEnabled(false);
            }
          }}
        >
          <img
            id="login-button-img"
            alt="VSO Icon"
            src="/assets/icons/VSOLogo.svg"
          />
          <p>Login with VSO</p>
          <img
            id="login-button-img"
            alt="Arrow Icon"
            src="/assets/icons/ArrowIcon.svg"
          />
        </div>
        {/* <Loading isLoading={isLoading} /> */}
      </IonContent>
    </IonPage>
  );
};

export default Login;
