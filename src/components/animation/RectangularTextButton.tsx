import { t } from "i18next";
import "./RectangularTextButton.css";
import { useEffect, useState } from "react";
const RectangularTextButton: React.FC<{
  buttonWidth: number;
  buttonHeight: number;
  text: string;
  fontSize: number;
  className: string;
  padding: number;
  onHeaderIconClick: React.MouseEventHandler<HTMLDivElement>;
}> = ({
  buttonWidth,
  buttonHeight,
  text,
  fontSize,
  onHeaderIconClick,
  className,
  padding,
}) => {
  return (
    <div
      // id="rectangular-text-button"
      className={className}
      onClick={onHeaderIconClick}
      style={{
        width: buttonWidth + "vw",
        height: buttonHeight + "vh",
        padding: padding + "vh",
        // background: "white",
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
