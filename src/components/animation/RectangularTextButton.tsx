import { t } from "i18next";
import "./RectangularTextButton.css";
const RectangularTextButton: React.FC<{
  buttonWidth: number;
  buttonHeight: number;
  text: string;
  fontSize: number;
  className: string;
  onHeaderIconClick: React.MouseEventHandler<HTMLDivElement>;
}> = ({
  buttonWidth,
  buttonHeight,
  text,
  fontSize,
  onHeaderIconClick,
  className,
}) => {
  console.log(className);
  return (
    <div
      // id="rectangular-text-button"
      className={className}
      onClick={onHeaderIconClick}
      style={{
        width: buttonWidth + "vw",
        height: buttonHeight + "vh",
        background: "#EAEAEA",
      }}
    >
      <p
        style={{
          fontSize: fontSize + "vh",
          // fontSize: "var(--text-size)",
        }}
      >
        {t(text)}
      </p>
    </div>
  );
};
export default RectangularTextButton;
