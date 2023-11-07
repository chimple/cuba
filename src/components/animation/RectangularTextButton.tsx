import { t } from "i18next";
import "./RectangularTextButton.css";
import { useEffect, useState } from "react";
const RectangularTextButton: React.FC<{
  buttonWidth: number;
  buttonHeight: number;
  text: string;
  fontSize: number;
  userChoice: boolean;
  className : string;
  padding: number;
  onHeaderIconClick: React.MouseEventHandler<HTMLDivElement>;
}> = ({
  buttonWidth,
  buttonHeight,
  text,
  fontSize,
  onHeaderIconClick,
  className,
  userChoice,
  padding,
}) => {
  // console.log(className);
  // const [bgColor, setbgColor] = useState<string>("#EAEAEA");
  // const defaultColor = {
  //   width: buttonWidth,
  //   height: buttonHeight,
  //   backgroundColor: "lightgray",
  // };

  // const greenColor = {
  //   width: buttonWidth,
  //   height: buttonHeight,
  //   backgroundColor: "#83c327",
  // };

  // const redColor = {
  //   width: buttonWidth,
  //   height: buttonHeight,
  //   backgroundColor: "red",
  // };
  // const [dyStyle, setDyStyle] = useState(defaultColor);
  // useEffect(() => {
  //   console.log("className ===", userChoice);
  // }, []);
  return (
    <div
      // id="rectangular-text-button"
      className={className}
      onClick={onHeaderIconClick}
      // onMouseEnter={() => {
        // setDyStyle(greentColor);
        // if (!userChoice) {
        //   setDyStyle(greenColor);
        // } else {
        //   setDyStyle(redColor);
        // }
        // setTimeout(() => {
        //   setDyStyle(defaultColor);
        // }, 500);
        // console.log("onMouseEnter={()", dyStyle);
      // }}
      // style={dyStyle}
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
          // padding: "0.2vh",
          // fontSize: "var(--text-size)",
        }}
      >
        {t(text)}
      </p>
    </div>
  );
};
export default RectangularTextButton;
