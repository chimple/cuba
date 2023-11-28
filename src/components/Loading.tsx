import { IonLoading, LoadingOptions } from "@ionic/react";
import React from "react";
import "./Loading.css";

interface LoadingProps extends LoadingOptions {
  isLoading: boolean;
  msg?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  isLoading,
  msg = "",
  className = "loading",
  ...loadingOptions
}) => {
  return isLoading ? (
    <div>
      <IonLoading
        isOpen={isLoading}
        spinner={null}
        message={
          `<img class="${className}" src="assets/loading.gif"></img> <br/><p>${msg}</p>`
        }
        {...(loadingOptions as any)}
      />
    </div>
  ) : null;
};

export default Loading;
