import React, { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { ServiceConfig } from "../services/ServiceConfig";
import { PAGES } from "../common/constants";
import { IonButton, IonIcon, IonInput } from "@ionic/react";
import { eye, eyeOff } from "ionicons/icons";
import "./ResetPassword.css";
import { t } from "i18next";

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const authInstance = ServiceConfig.getI().authHandler;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const data = await authInstance.updateUser({ password: newPassword });

    if (data) {
      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => history.push(PAGES.LOGIN), 2000);
    } else {
      console.log("error in updating user....");
    }
  };

  return (
    <div className="reset-password-main-div">
      <h2>{t("reset password")}</h2>

      <div className="reset-password-field-div">
        <IonInput
          type={showPassword ? "text" : "password"}
          value={newPassword}
          placeholder={t("Enter new password") || ""}
          className="reset-password-text-box"
          onIonChange={(e) => setNewPassword(e.detail.value || "")}
        />
        <IonIcon
          icon={showPassword ? eye : eyeOff}
          onClick={() => setShowPassword((prev) => !prev)}
          className="reset-password-eye-icon"
        />
      </div>

      <div className="reset-password-field-div">
        <IonInput
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          placeholder={t("Confirm password") || ""}
          className="reset-password-text-box"
          onIonChange={(e) => setConfirmPassword(e.detail.value || "")}
        />
        <IonIcon
          icon={showConfirmPassword ? eye : eyeOff}
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="reset-password-eye-icon"
        />
      </div>

      <IonButton
        onClick={handlePasswordReset}
        className="reset-password-button"
        id="reset-password-button-inner"
      >
        {t("Save")}
      </IonButton>

      {message && <p>{t(message)}</p>}
    </div>
  );
};

export default ResetPassword;
