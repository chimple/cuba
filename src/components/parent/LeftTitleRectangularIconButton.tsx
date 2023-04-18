import { PARENTHEADERLIST } from "../../common/constants";
import "./LeftTitleRectangularIconButton.css";
const LeftTitleRectangularIconButton: React.FC<{
  buttonWidth: number;
  buttonHeight: number;
  iconSrc: string;
  // rectangularIcon: any;
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
      <p>{name}</p>
      <img
        id="rectangular-icon-button-img"
        style={{
          width: "auto",
          height: buttonHeight - 2 + "vh",
        }}
        alt={iconSrc}
        src={iconSrc}
      />
      {/* {rectangularIcon} */}
    </div>
  );
};
export default LeftTitleRectangularIconButton;
