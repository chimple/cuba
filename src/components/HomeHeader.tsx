import { useTranslation } from "react-i18next";
import {
  HOMEHEADERLIST,
  HEADER_ICON_CONFIGS,
  HeaderIconConfig,
} from "../common/constants";
import "./HomeHeader.css";
import IconButton from "./IconButton";
import HeaderIcon from "./HeaderIcon";
import React from "react";

const HomeHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
}> = ({ currentHeader, onHeaderIconClick }) => {
  const { t } = useTranslation();

  var headerIconList: HeaderIconConfig[] = [];
  HEADER_ICON_CONFIGS.forEach((element) => {
    // console.log("elements", element);
    headerIconList.push(element);
  });

  return (
    <div id="home-header-icons">
      <HeaderIcon
        headerName="Subject"
        iconSrc="assets/icons/HomeIcon.svg"
        currentHeader={currentHeader}
        headerList={HOMEHEADERLIST.HOME}
        onHeaderIconClick={() => {
          if (currentHeader != HOMEHEADERLIST.HOME) {
            onHeaderIconClick(HOMEHEADERLIST.HOME);
          }
        }}
      ></HeaderIcon>

      <div id="home-header-middle-icons">
        {headerIconList.map((element, index) => {
          // console.log("Dyanamic Header List ", element);
          return (
            <HeaderIcon
              headerName={element.displayName}
              iconSrc={element.iconSrc}
              currentHeader={currentHeader}
              headerList={element.headerList}
              onHeaderIconClick={() => {
                if (currentHeader != element.headerList) {
                  onHeaderIconClick(element.headerList);
                }
              }}
            ></HeaderIcon>
          );
        })}
      </div>

      <HeaderIcon
        headerName="Profile"
        iconSrc="assets/icons/Profile.svg"
        currentHeader={currentHeader}
        headerList={HOMEHEADERLIST.PROFILE}
        onHeaderIconClick={() => {
          if (currentHeader != HOMEHEADERLIST.PROFILE) {
            onHeaderIconClick(HOMEHEADERLIST.PROFILE);
          }
        }}
      ></HeaderIcon>
    </div>
  );
};

export default HomeHeader;
