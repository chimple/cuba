import { IonLoading, LoadingOptions } from "@ionic/react";
import React from "react";
import "./Loading.css";

interface LoadingProps extends LoadingOptions {
  isLoading: boolean;
  msg?: string;
}

const Loading: React.FC<LoadingProps> = ({
  isLoading,
  msg = "",

}) => {
  return isLoading ? (
    <div>
      <IonLoading
        isOpen={isLoading}
        spinner={null}
        message={
          `<img class="loading" src="assets/loading.gif"></img> <br/><p>${msg}</p>`
        }
      />
    </div>
  ) : null;
};

export default Loading;
