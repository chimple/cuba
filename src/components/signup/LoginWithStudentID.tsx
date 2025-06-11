import { t } from "i18next";
import React from "react";

import "./LoginWithStudentID.css";

interface LoginWithStudentIDProps {
  onLogin: () => void;
  schoolCode: string;
  setSchoolCode: (value: string) => void;
  studentId: string;
  setStudentId: (value: string) => void;
  studentPassword: string;
  setStudentPassword: (value: string) => void;
  errorMessage: string | null;
  checkbox: boolean;
}

const LoginWithStudentID: React.FC<LoginWithStudentIDProps> = ({
  onLogin,
  schoolCode,
  setSchoolCode,
  studentId,
  setStudentId,
  studentPassword,
  setStudentPassword,
  errorMessage,
  checkbox
}) => {
  const isFormValid = schoolCode && studentId && studentPassword.length >= 6 && checkbox;

  const buttonColors = {
    Default: "#8A8A8A",
    Valid: "#F34D08",
  };

  return (
    <div className="login-method-student-id">
      <div className="login-method-content-student-id">
        <span className="login-with-student-text">{t("Login / SignUp")}</span>

        <div className="student-input-wrapper">
          <div className="input-icon-wrapper-student-id">
            <img
              src="/assets/loginAssets/SchoolCode.svg"
              alt=""
              className="input-icon-student-id"
            />
            <input
              type="text"
              placeholder={t("Enter your School Code") || ""}
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              className="login-student-input"
            />
          </div>

          <div className="input-icon-wrapper-student-id">
            <img
              src="/assets/loginAssets/StudentID_Input.svg"
              alt=""
              className="input-icon-student-id"
            />
            <input
              type="text"
              placeholder={t("Enter your Student ID") || ""}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="login-student-input"
            />
          </div>

          <div className="input-icon-wrapper-student-id">
            <img
              src="/assets/loginAssets/Password.svg"
              alt=""
              className="input-icon-student-id"
            />
            <input
              type="password"
              placeholder={t("Enter your Password") || ""}
              value={studentPassword}
              onChange={(e) => setStudentPassword(e.target.value)}
              className="login-student-input"
            />
          </div>
        </div>
        <div className="divider-with-student-id">
          {errorMessage && (
            <span className="error-message-student-id">
              {errorMessage}
            </span>
          )}
          <button
            disabled={!isFormValid}
            onClick={onLogin}
            style={{
              backgroundColor: isFormValid
                ? buttonColors.Valid
                : buttonColors.Default,
              borderBottom: isFormValid ? "4px solid #8A2901" : "none",
              marginTop: "10px",
            }}
            className="login-with-student-button"
          >
          {t("START")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginWithStudentID;
