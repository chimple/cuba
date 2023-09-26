import { t } from "i18next";
import "./RectangularTextButton.css";
const RectangularTextButton: React.FC<{
  buttonWidth: number;
  buttonHeight: number;
  text: string;
  fontSize: number;
  onHeaderIconClick: React.MouseEventHandler<HTMLDivElement>;
}> = ({ buttonWidth, buttonHeight, text, fontSize, onHeaderIconClick }) => {
  return (
    <div
      id="rectangular-text-button"
      onClick={onHeaderIconClick}
      style={{
        width: buttonWidth + "vw",
        height: buttonHeight + "vh",
      }}
    >
      <p
        style={{
          fontSize: fontSize + "vh",
        }}
      >
        {t(text)}
      </p>
    </div>
  );
};
export default RectangularTextButton;
