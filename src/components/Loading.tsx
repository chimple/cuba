import { IonLoading } from "@ionic/react";
// import { useTranslation } from "react-i18next";
import "./Loading.css";

const Loading: React.FC<{ isLoading: boolean; msg?: string }> = ({
  isLoading,
  msg = "",
}) => {
  return isLoading ? (
    <div>
      <IonLoading
        isOpen={isLoading}
        spinner={null}
        message={
          '<img class="loading" src="assets/loading.gif"></img> <br/><p>' +
          msg +
          "<p/>"
        }
      />
    </div>
  ) : null;
};

export default Loading;
