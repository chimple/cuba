import { useTranslation } from "react-i18next";
import {
  AVATARS,
  HEADERLIST,
  HEADER_ICON_CONFIGS,
  HeaderIconConfig,
} from "../common/constants";
import "./HomeHeader.css";
import HeaderIcon from "./HeaderIcon";
import React from "react";
import { ServiceConfig } from "../services/ServiceConfig";

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
  const student = ServiceConfig.getI().apiHandler.currentStudent;

  return (
    <div id="home-header-icons">
      <HeaderIcon
        headerName="Home"
        iconSrc="assets/icons/HomeIcon.svg"
        currentHeader={currentHeader}
        headerList={HEADERLIST.HOME}
        onHeaderIconClick={() => {
          if (currentHeader != HEADERLIST.HOME) {
            onHeaderIconClick(HEADERLIST.HOME);
          }
        }}
      ></HeaderIcon>

      <div id="home-header-middle-icons">
        {headerIconList.map((element, index) => {
          // console.log("Dyanamic Header List ", element);
          return (
            <HeaderIcon
              key={index}
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
        headerName={student?.name ?? "Profile"}
        iconSrc={"assets/avatars/" + (student?.avatar ?? AVATARS[0]) + ".png"}
        currentHeader={currentHeader}
        headerList={HEADERLIST.PROFILE}
        onHeaderIconClick={() => {
          if (currentHeader != HEADERLIST.PROFILE) {
            onHeaderIconClick(HEADERLIST.PROFILE);
          }
        }}
      ></HeaderIcon>
    </div>
  );
};

export default HomeHeader;
