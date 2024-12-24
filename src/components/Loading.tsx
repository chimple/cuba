import { IonLoading, LoadingOptions } from "@ionic/react";
import React from "react";
import "./Loading.css";
import { t } from "i18next";

interface LoadingProps extends LoadingOptions {
  isLoading: boolean;
  msg?: string;
  initialLogin?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  isLoading,
  msg = "",
  initialLogin
}) => {
  return isLoading ? (
    <div>
      <IonLoading
        isOpen={isLoading}
        spinner={null}
        message={
          `<img class="loading" src="assets/loading.gif"></img> <br/><p class="msg">${ initialLogin ? t("Please wait.....Login in progress. This may take a moment.") : ""}</p>`
        }
      />
    </div>
  ) : null;
};

export default Loading;
