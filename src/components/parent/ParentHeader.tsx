import { useTranslation } from "react-i18next";
import {
  HOMEHEADERLIST,
  HEADER_ICON_CONFIGS,
  HeaderIconConfig,
  PARENTHEADERLIST,
  parentHeaderIconList,
} from "../../common/constants";
import "./ParentHeader.css";
import IconButton from "./../IconButton";
import HeaderIcon from "./../HeaderIcon";
import React from "react";
import RectangularIconButton from "./RectangularIconButton";

const ParentHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
}> = ({ currentHeader, onHeaderIconClick }) => {
  const { t } = useTranslation();

  return (
    <div id="parent-header-icons">
      <IconButton
        name={t("back")}
        iconSrc="assets/icons/BackIcon.svg"
        onClick={() => {
          console.log("clicked on Parent back");
          //   history.replace(PAGES.HOME);
        }}
      />
      <div id="parent-header-middle-icons">
        {parentHeaderIconList.map((element) => {
          //   console.log("Dyanamic Parent Header List ", element);
          return (
            <RectangularIconButton
              buttonWidth={20}
              buttonHeight={7}
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
