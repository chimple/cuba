import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import "./Login.css";
import { useHistory } from "react-router-dom";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {}, []);

  return (
    <IonPage>
      <IonContent fullscreen>
        <button
          id="login-button"
          onClick={() => {
            history.push("/home");
          }}
        >
          Login
        </button>
        {/* <Loading isLoading={isLoading} /> */}
      </IonContent>
    </IonPage>
  );
};

export default Login;
