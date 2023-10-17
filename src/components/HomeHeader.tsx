import { useTranslation } from "react-i18next";
import {
  HOMEHEADERLIST,
  AVATARS,
  DEFAULT_HEADER_ICON_CONFIGS,
  HeaderIconConfig,
  PAGES,
  MODES,
  CURRENT_MODE,
} from "../common/constants";
import "./HomeHeader.css";
import HeaderIcon from "./HeaderIcon";
import React, { useEffect, useRef, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import User from "../models/user";
import { useHistory } from "react-router";
import { schoolUtil } from "../utility/schoolUtil";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from "../services/RemoteConfig";

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
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const canShowSuggestions = RemoteConfig.getBoolean(
    REMOTE_CONFIG_KEYS.CAN_SHOW_AVATAR
  )
  async function init() {
    const student = await Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.HOME);
      return;
    }
    const currMode = await schoolUtil.getCurrMode();
    setStudentMode(currMode);
    DEFAULT_HEADER_ICON_CONFIGS.forEach(async (element) => {
      // console.log("elements", element);

      console.log(currMode);
      if (
        !(
          (currMode === MODES.SCHOOL && element.headerList === HOMEHEADERLIST.ASSIGNMENT) ||
          (!(await canShowSuggestions) && element.headerList === HOMEHEADERLIST.SUGGESTIONS)
          //if Avatar is showing in home Screen then only sugesstions icons visible
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
      <div className="home-header-outer-icon">
        <HeaderIcon
          headerConfig={{
            displayName: t("Home"),
            iconSrc: "assets/icons/homeInactiveIcon.svg",
            headerList: HOMEHEADERLIST.HOME,
          }}
          currentHeader={currentHeader}
          pendingAssignmentCount={0}
          onHeaderIconClick={() => {
            if (currentHeader != HOMEHEADERLIST.HOME) {
              onHeaderIconClick(HOMEHEADERLIST.HOME);
            }
          }}
        />
      </div>

      <div id="home-header-middle-icons">
        {!!currentHeaderIconList &&
          currentHeaderIconList.map((element, index) => {
            return (
              <HeaderIcon
                key={index}
                headerConfig={element}
                currentHeader={currentHeader}
                pendingAssignmentCount={pendingAssignmentCount}
                onHeaderIconClick={() => {
                  if (currentHeader != element.headerList) {
                    onHeaderIconClick(element.headerList);
                  }
                }}
              />
            );
          })}
      </div>

      <div className="home-header-outer-icon">
        <HeaderIcon
          headerConfig={{
            displayName: student?.name ?? "Profile",
            iconSrc:
              (studentMode === MODES.SCHOOL &&
                student?.image) ||
              `assets/avatars/${student?.avatar ?? AVATARS[0]}.png`,
            headerList: HOMEHEADERLIST.PROFILE,
          }}
          currentHeader={currentHeader}
          pendingAssignmentCount={0}
          onHeaderIconClick={() => {
            if (currentHeader != HOMEHEADERLIST.PROFILE) {
              onHeaderIconClick(HOMEHEADERLIST.PROFILE);
            }
          }}
        />
      </div>
    </div>
  );
};

export default HomeHeader;
