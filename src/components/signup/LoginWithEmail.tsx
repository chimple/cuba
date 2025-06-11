import { t } from "i18next";
import React, { useState } from "react";
import "./LoginWithEmail.css";

interface LoginWithEmailProps {
  onLogin: (email: string, password: string) => void;
  onForgotPasswordChange: () => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  errorMessage: string | null;
  checkbox: boolean;
}

const LoginWithEmail: React.FC<LoginWithEmailProps> = ({
  onLogin,
  onForgotPasswordChange,
  email,
  setEmail,
  password,
  setPassword,
  errorMessage,
  checkbox,
}) => {
  const isFormValid = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Password validation
    if (password.length < 6 || /\s/.test(password)) {
      return false;
    }
    // Check terms and conditions
    if (!checkbox) {
      return false;
    }
    return true;
  };

  const buttonColors = {
    Default: "#8A8A8A",
    Valid: "#F34D08",
  };

  return (
    <div className="login-method-with-email">
      <div className="login-container-with-email">
        <span className="login-with-email-text">{t("Login / SignUp")}</span>

        <div className="email-input-wrapper">
          <div className="input-icon-wrapper-email">
            <img
              src="/assets/loginAssets/EmailInput.svg"
              alt=""
              className="input-icon-email"
            />
            <input
              type="text"
              placeholder={t("Enter your Email ID") || ""}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-email-input"
            />
          </div>

          <div className="input-icon-wrapper-email">
            <img
              src="/assets/loginAssets/Password.svg"
              alt=""
              className="input-icon-email"
            />
            <input
              type="password"
              placeholder={t("Enter your Password") || ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-email-input"
            />
          </div>
          <span
            className="forgot-password-email-text"
            onClick={() => onForgotPasswordChange?.()}
          >
            {t("Forgot Password?")}
          </span>
        </div>
        <div className="divider-with-email">
          {errorMessage && (
            <span className="error-message-email">{errorMessage}</span>
          )}
          <button
            disabled={!isFormValid}
            onClick={() => onLogin(email, password)}
            style={{
              backgroundColor: isFormValid()
                ? buttonColors.Valid
                : buttonColors.Default,
              borderBottom: isFormValid() ? "4px solid #8A2901" : "none",
              marginTop: errorMessage ? "10px" : "0px",
            }}
            className="login-with-email-button"
          >
          {t("START")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginWithEmail;
