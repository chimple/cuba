import { t } from "i18next";
import { COURSES, HOMEHEADERLIST } from "../common/constants";
import IconButton from "./IconButton";
import "./IconButton.css";
import React from "react";
const HeaderIcon: React.FC<{
  iconSrc: string;
  headerName: string;
  currentHeader: string;
  headerList: HOMEHEADERLIST;
  onHeaderIconClick: Function;
}> = ({
  iconSrc,
  headerName,
  currentHeader,
  headerList,
  onHeaderIconClick,
}) => {
  return (
    <div>
      {currentHeader == headerList ? (
        <p className="home-header-indicator">&#9679;</p>
      ) : (
        <p className="home-header-indicator">&nbsp;</p>
      )}
      <IconButton
        name={t(headerName)}
        iconSrc={iconSrc}
        onClick={() => {
          if (currentHeader != headerList) {
            onHeaderIconClick(headerList);
          }
        }}
      ></IconButton>
    </div>
  );
};
export default HeaderIcon;
