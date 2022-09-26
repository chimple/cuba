import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
// import { AccountManager } from "account-manager";
import "./Login.css";
import { useHistory } from "react-router-dom";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {}, []);
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
            // let result = await AccountManager.authenticator({
            //   userName: "skandakumar97@gmail.com",
            //   AccountType: "com.google",
            // });
            console.log("login-button entred");
            // let result: any;
            // try {
            //   result = await AccountManager.accountPicker();
            // } catch (error) {
            //   console.log("error", error);
            // }
            // console.log("login-button-result", result.result);
            history.push("/home");
          }}
        >
          <img alt="VSO Icon" src="/assets/icons/VSOLogo.svg" />
          <p>Login with VSO</p>
          <img alt="Arrow Icon" src="/assets/icons/ArrowIcon.svg" />
        </div>
        {/* <Loading isLoading={isLoading} /> */}
      </IonContent>
    </IonPage>
  );
};

export default Login;
