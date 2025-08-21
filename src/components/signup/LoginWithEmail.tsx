import { t } from "i18next";
import React, { useState } from "react";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
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
    <div className="LoginWithEmail-method-with-email">
      <div className="LoginWithEmail-container-with-email">
        <span className="LoginWithEmail-with-email-text">{t("Login / SignUp")}</span>

        <div className="LoginWithEmail-input-wrapper">
          <div className="LoginWithEmail-input-icon-wrapper-email">
          <EmailOutlinedIcon sx={{ color: "var(--text-color)", fontSize: "22px" }}
              className="LoginWithEmail-input-icon-email"
            />
            <input
              type="text"
              placeholder={t("Enter your Email ID") || ""}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="LoginWithEmail-email-input"
            />
          </div>

          <div className="LoginWithEmail-input-icon-wrapper-email">
          <LockOutlinedIcon sx={{ color: "var(--text-color)", fontSize: "22px" }}
              className="LoginWithEmail-input-icon-email"
            />
            <input
              type="password"
              placeholder={t("Enter your password") || "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="LoginWithEmail-email-input"
            />
          </div>
        </div>
        <div className="LoginWithEmail-forgotPass-wrapper">
         <span
            className="LoginWithEmail-forgot-password-email-text"
            onClick={() => onForgotPasswordChange?.()}
          >
            {t("Forgot Password?")}
          </span>
        </div>
        <div className="LoginWithEmail-divider-with-email">
          {errorMessage && (
            <span className="LoginWithEmail-error-message-email">{errorMessage}</span>
          )}
          <button
            disabled={!isFormValid()}
            onClick={() => onLogin(email, password)}
            style={{
              backgroundColor: isFormValid()
                ? buttonColors.Valid
                : buttonColors.Default,
            }}
            className="LoginWithEmail-with-email-button"
          >
          {t("START")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginWithEmail;
