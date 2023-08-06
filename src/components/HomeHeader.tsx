import { useTranslation } from "react-i18next";
import {
  HOMEHEADERLIST,
  AVATARS,
  HEADER_ICON_CONFIGS,
  HeaderIconConfig,
  PAGES,
  MODES,
  CURRENT_MODE,
} from "../common/constants";
import "./HomeHeader.css";
import HeaderIcon from "./HeaderIcon";
import React, { useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import User from "../models/user";
import { useHistory } from "react-router";
import { schoolUtil } from "../utility/schoolUtil";

const HomeHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
  pendingAssignmentCount: number;
}> = ({ currentHeader, onHeaderIconClick, pendingAssignmentCount }) => {
  const { t } = useTranslation();
  const [currentHeaderIconList, setCurrentHeaderIconList] =
    useState<HeaderIconConfig[]>();
  var headerIconList: HeaderIconConfig[] = [];

  const history = useHistory();
  const [student, setStudent] = useState<User>();
  async function init() {
    const student = await Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.HOME);
      return;
    }
    const currMode = await schoolUtil.getCurrMode();
    HEADER_ICON_CONFIGS.forEach((element) => {
      // console.log("elements", element);

      console.log(currMode);
      if (
        !(
          currMode === MODES.SCHOOL &&
          element.headerList === HOMEHEADERLIST.ASSIGNMENT
        )
      ) {
        headerIconList.push(element);
      }
    });

    if (!headerIconList) return;

    setCurrentHeaderIconList(headerIconList);

    setStudent(student);
  }

  useEffect(() => {
    init();
  }, []);

  // const student =await Util.getCurrentStudent();
  return (
    <div id="home-header-icons">
      <HeaderIcon
        headerName={t("Home")}
        iconSrc="assets/icons/home_icon.svg"
        currentHeader={currentHeader}
        headerList={HOMEHEADERLIST.HOME}
        pendingAssignmentCount={0}
        onHeaderIconClick={() => {
          if (currentHeader != HOMEHEADERLIST.HOME) {
            onHeaderIconClick(HOMEHEADERLIST.HOME);
          }
        }}
      ></HeaderIcon>

      <div id="home-header-middle-icons">
        {!!currentHeaderIconList &&
          currentHeaderIconList.map((element, index) => {
            return (
              <HeaderIcon
                key={index}
                headerName={element.displayName}
                iconSrc={element.iconSrc}
                currentHeader={currentHeader}
                headerList={element.headerList}
                pendingAssignmentCount={pendingAssignmentCount}
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
        iconSrc={student?.image || ("assets/avatars/" + (student?.avatar ?? AVATARS[0]) + ".png")}
        currentHeader={currentHeader}
        headerList={HOMEHEADERLIST.PROFILE}
        pendingAssignmentCount={0}
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
