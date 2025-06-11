import { t } from 'i18next';
import { useState } from 'react';

import { ServiceConfig } from '../../services/ServiceConfig';
import "./LoginWithEmail.css";

interface ForgotPassProps {
    onGoBack: () => void;
}

const ForgotPass = ({ onGoBack }: ForgotPassProps) => {
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotError, setForgotError] = useState(false);
    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [isMailSent, setIsMailSent] = useState(false)

    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSendResetLink = async () => {
        setForgotError(false);
        setForgotMessage("");
        
        if (!validateEmail(forgotEmail)) {
            setForgotError(true);
            setForgotMessage(t("Please enter a valid email address") || "Please enter a valid email address");
            return;
        }

        setForgotLoading(true);

        try {
            const authInstance = ServiceConfig.getI().authHandler;
            const res = await authInstance.sendResetPasswordEmail(forgotEmail);

            if (res) {
                setIsMailSent(true);
                setForgotMessage(t("Please check your mail and confirm") || "Please check your mail and confirm");
            } else {
                setForgotError(true);
                setForgotMessage(t("Something went wrong. Please try again") || "Something went wrong. Please try again");
            }
        } catch (error) {
            setForgotError(true);
            setForgotMessage(t("Something went wrong. Please try again") || "Something went wrong. Please try again");
        } finally {
            setForgotLoading(false);
        }
    };

    const isFormValid = forgotEmail.length > 0 && validateEmail(forgotEmail);

    const buttonColors = {
        Default: "#8A8A8A",
        Valid: "#F34D08",
    };

    return (
        <div className="login-method-with-email">
            {!isMailSent ? (
                <div className="login-container-with-email">
                    <span className="forgot-email-text">{t("We will send a password reset link")}</span>

                    <div className="email-input-wrapper">
                        <div className="input-icon-wrapper-email">
                            <img
                                src="/assets/loginAssets/EmailInput.svg"
                                alt=""
                                className="input-icon-email"
                            />
                            <input
                                type="email"
                                placeholder={t("Enter your Email ID")||"Enter your Email ID"}
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="login-email-input"
                            />
                        </div>
                    </div>
                    <div className="divider-with-email">
                        {forgotError && (
                            <span className="error-message-email">
                                {forgotMessage}
                            </span>
                        )}
                        <button
                            disabled={!isFormValid || forgotLoading}
                            onClick={handleSendResetLink}
                            style={{
                                backgroundColor: isFormValid
                                    ? buttonColors.Valid
                                    : buttonColors.Default,
                                borderBottom: isFormValid ? "4px solid #8A2901" : "none",
                                marginTop: "25px"
                            }}
                            className="login-with-email-button"
                        >
                            {forgotLoading ? t("sending") : t("send")}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="login-container-with-email">
                    <span className="forgot-email-text">{t("Please check your mail and confirm.") || "Please check your mail and confirm."}</span>
                    <div className="divider-with-email">
                        <button
                            onClick={onGoBack}
                            style={{
                                backgroundColor: buttonColors.Valid,
                                borderBottom: "4px solid #8A2901",
                                marginTop: "25px"
                            }}
                            className="login-with-email-button"
                        >
                            {t("Go to Login")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ForgotPass;
