import { FC } from "react";
import { t } from "i18next";
import "./CommonDialogBox.css";

const CommonDialogBox: FC<{
  message: string;
  showConfirmFlag: boolean;
  header?: string;
  leftButtonText?: string;
  leftButtonHandler?: () => void;
  onDidDismiss: () => void;
  rightButtonText?: string;
  rightButtonHandler?: () => void;
}> = ({
  message,
  showConfirmFlag,
  header,
  leftButtonText,
  leftButtonHandler,
  onDidDismiss,
  rightButtonText,
  rightButtonHandler,
}) => {
  if (!showConfirmFlag) return null;

  return (
    <div className="custom-dialog-overlay" onClick={onDidDismiss}>
      <div
        className="custom-dialog-box"
        onClick={(e) => e.stopPropagation()}
      >
        {header && <h3 className="custom-dialog-header">{t(header)}</h3>}
        <p className="custom-dialog-message">{t(message)}</p>
        <div className="custom-dialog-buttons">
          {leftButtonText && (
            <button
              className="custom-dialog-button custom-dialog-cancel"
              onClick={leftButtonHandler}
            >
              {t(leftButtonText)}
            </button>
          )}
          {rightButtonText && (
            <button
              className="custom-dialog-button custom-dialog-confirm"
              onClick={rightButtonHandler}
            >
              {t(rightButtonText)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommonDialogBox;
