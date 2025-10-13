import React from "react";
import "./Loading.css";
import { t } from "i18next";

interface LoadingProps {
  isLoading: boolean;
  msg?: string;
}

const Loading: React.FC<LoadingProps> = ({ isLoading, msg = "" }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <img src="assets/loading.gif" alt="loading" className="loading-img" />

        {msg && <p className="loading-msg">{t(msg)}</p>}
      </div>
    </div>
  );
};

export default Loading;
