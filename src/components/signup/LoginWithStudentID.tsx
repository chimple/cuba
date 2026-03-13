import { t } from "i18next";
import React from "react";

import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

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
    <div className="LoginWithStudentID-login-method-student-id">
      <div className="LoginWithStudentID-login-method-content-student-id">
        <span className="LoginWithStudentID-login-with-student-text">{t("Login / SignUp")}</span>

        <div className="LoginWithStudentID-student-input-wrapper">
          <div className="LoginWithStudentID-input-icon-wrapper-student-id">
            <SchoolOutlinedIcon sx={{ color: "var(--text-color)", fontSize: "22px" }}
              className="LoginWithStudentID-input-icon-student-id"
            />
            <input
              type="text"
              placeholder={t("Enter your School Code") || ""}
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              className="LoginWithStudentID-login-student-input"
            />
          </div>

          <div className="LoginWithStudentID-input-icon-wrapper-student-id">
            <img
              src="/assets/loginAssets/StudentID_Input.svg"
              alt=""
              className="LoginWithStudentID-input-icon-student-id"
            />
            <input
              type="text"
              placeholder={t("Enter your Student ID") || ""}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="LoginWithStudentID-login-student-input"
            />
          </div>

          <div className="LoginWithStudentID-input-icon-wrapper-student-id">
            <LockOutlinedIcon sx={{ color: "var(--text-color)", fontSize: "22px" }}
              className="LoginWithStudentID-input-icon-student-id"
            />
            <input
              type="password"
              placeholder={t("Enter your password") || ""}
              value={studentPassword}
              onChange={(e) => setStudentPassword(e.target.value)}
              className="LoginWithStudentID-login-student-input"
            />
          </div>
        </div>
        <div className="LoginWithStudentID-divider-with-student-id">
          {errorMessage && (
            <span className="LoginWithStudentID-error-message-student-id">
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
            }}
            className="LoginWithStudentID-login-with-student-button"
          >
          {t("START")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginWithStudentID;
