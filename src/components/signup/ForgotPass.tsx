import { t } from 'i18next';
import { useState } from 'react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { ServiceConfig } from '../../services/ServiceConfig';
import "./ForgotPass.css";

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
            setForgotMessage("Please enter a valid email address");
            return;
        }

        setForgotLoading(true);

        try {
            const authInstance = ServiceConfig.getI().authHandler;
            const res = await authInstance.sendResetPasswordEmail(forgotEmail);

            if (res) {
                setIsMailSent(true);
                setForgotMessage("Please check your mail and confirm")
            } else {
                setForgotError(true);
                setForgotMessage("Something went wrong. Please try again.")
            }
        } catch (error) {
            setForgotError(true);
            setForgotMessage("Something went wrong. Please try again.")
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
        <div className="ForgotPass-method-with-email">
            {!isMailSent ? (
                <div className="ForgotPass-container-with-email">
                    <span className="ForgotPass-forgot-email-text">{t("We will send a password reset link")}</span>

                    <div className="ForgotPass-input-wrapper">
                        <div className="ForgotPass-input-icon-wrapper-email">
                            <EmailOutlinedIcon sx={{ color: "var(--text-color)", fontSize: "22px" }}
                                className="ForgotPass-input-icon-email"
                            />
                            <input
                                type="email"
                                placeholder={t("Enter your Email ID")||"Enter your Email ID"}
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="ForgotPass-email-input"
                            />
                        </div>
                    </div>
                    <div className="ForgotPass-divider-with-email">
                        {forgotError && (
                            <span className="ForgotPass-Forgoterror-message-email">
                                {t(forgotMessage)}
                            </span>
                        )}
                        <button
                            disabled={!isFormValid || forgotLoading}
                            onClick={handleSendResetLink}
                            style={{
                                backgroundColor: isFormValid
                                    ? buttonColors.Valid
                                    : buttonColors.Default,
                                marginTop: "5px"
                            }}
                            className="ForgotPass-with-email-button"
                        >
                            {forgotLoading ? t("sending") : t("send")}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="ForgotPass-container-with-email">
                    <span className="ForgotPass-forgot-email-text">{t("Please check your mail and confirm.")}</span>
                    <div className="ForgotPass-divider-with-email">
                        <button
                            onClick={onGoBack}
                            style={{
                                backgroundColor: buttonColors.Valid,
                                marginTop: "25px"
                            }}
                            className="ForgotPass-with-email-button"
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
