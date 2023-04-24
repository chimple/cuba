import { useTranslation } from "react-i18next";
import {
  HOMEHEADERLIST,
  HEADER_ICON_CONFIGS,
  HeaderIconConfig,
  PARENTHEADERLIST,
  parentHeaderIconList,
  PAGES,
} from "../../common/constants";
import "./ParentHeader.css";
import IconButton from "./../IconButton";
import HeaderIcon from "./../HeaderIcon";
import React from "react";
import RectangularIconButton from "./RectangularIconButton";
import { IoIosArrowBack, IoIosArrowDropleftCircle } from "react-icons/io";
import { useHistory } from "react-router-dom";

const ParentHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
}> = ({ currentHeader, onHeaderIconClick }) => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <div id="parent-header-icons">
      <IoIosArrowBack
        id="parent-header-icons-back"
        size={"8vh"}
        onClick={() => {
          console.log("clicked on Parent back");
          history.replace(PAGES.DISPLAY_STUDENT);
        }}
      ></IoIosArrowBack>
      {/* <IoIosArrowDropleftCircle
        id="parent-header-icons-back"
        size={"4%"}
        onClick={() => {
          console.log("clicked on Parent back");
          //   history.replace(PAGES.HOME);
        }}
      ></IoIosArrowDropleftCircle> */}
      {/* <img
        id="parent-header-icons-back"
        src="assets/icons/ArrowIcon.svg"
        alt="Back"
        onClick={() => {
          console.log("clicked on Parent back");
          //   history.replace(PAGES.HOME);
        }}
      /> */}
      <div id="parent-header-middle-icons">
        {parentHeaderIconList.map((element) => {
          //   console.log("Dyanamic Parent Header List ", element);
          return (
            <RectangularIconButton
              buttonWidth={18}
              buttonHeight={8}
              iconSrc={element.iconSrc}
              name={element.displayName}
              isButtonEnable={currentHeader === element.headerList}
              onHeaderIconClick={() => {
                if (currentHeader != element.headerList) {
                  onHeaderIconClick(element.headerList);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ParentHeader;
