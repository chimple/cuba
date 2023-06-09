import { IonLoading } from "@ionic/react";
// import { useTranslation } from "react-i18next";
import "./Loading.css";
import React from "react";

const Loading: React.FC<{ isLoading: boolean; msg?: string }> = ({
  isLoading,
  msg = "loading",
}) => {
  // const { t } = useTranslation();
  // const tMsg = t(msg);
  return isLoading ? (
    <div>
      <IonLoading
        isOpen={isLoading}
        spinner={null}
        message={`<img class="loading" src="assets/loading.gif">`}
      ></IonLoading>
    </div>
  ) : null;
};

export default Loading;
