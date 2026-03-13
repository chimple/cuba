import { t } from "i18next";
import "./RectangularIconButton.css";
const RectangularIconButton: React.FC<{
  buttonWidth: number;
  buttonHeight: number;
  iconSrc: string;
  
  name: string;
  isButtonEnable: boolean;
  onHeaderIconClick: React.MouseEventHandler<HTMLDivElement>;
}> = ({
  buttonWidth,
  buttonHeight,
  iconSrc,
  
  name,
  isButtonEnable,
  onHeaderIconClick,
}) => {
    

    return (
      <div
        id="rectangular-icon-button"
        onClick={onHeaderIconClick}
        style={{
          width: buttonWidth + "vw",
          height: buttonHeight + "vh",
          opacity: isButtonEnable ? "1" : "0.5",
        }}
      >
        <img
          id="rectangular-icon-button-img"
          style={{
            width: "auto",
            height: buttonHeight - 2 + "vh",
          }}
          alt={iconSrc}
          src={iconSrc}
        />
        <p>{t(name)}</p>
        
      </div>
    );
  };
export default RectangularIconButton;
