import { useTranslation } from "react-i18next";
import {
  parentHeaderIconList,
  PAGES,
  CONTINUE,
} from "../../common/constants";
import "./ParentHeader.css";
import React from "react";
import RectangularIconButton from "./RectangularIconButton";
import { useHistory } from "react-router-dom";
import BackButton from "../common/BackButton";
import { Util } from "../../utility/util";

const ParentHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
}> = ({ currentHeader, onHeaderIconClick }) => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <div id="parent-header-icons">
      <BackButton
        onClicked={() => {
          const urlParams = new URLSearchParams(window.location.search);
          Util.setPathToBackButton(PAGES.DISPLAY_STUDENT, history, urlParams);
        }}
      ></BackButton>
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
