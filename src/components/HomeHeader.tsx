import { useTranslation } from "react-i18next";
import {
  HOMEHEADERLIST,
  AVATARS,
  DEFAULT_HEADER_ICON_CONFIGS,
  HeaderIconConfig,
  PAGES,
  MODES,
  CURRENT_MODE,
  TableTypes,
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
  pendingLiveQuizCount: number;
}> = ({
  currentHeader,
  onHeaderIconClick,
  pendingAssignmentCount,
  pendingLiveQuizCount,
}) => {
  const { t } = useTranslation();
  const [currentHeaderIconList, setCurrentHeaderIconList] =
    useState<HeaderIconConfig[]>();
  var headerIconList: HeaderIconConfig[] = [];

  const history = useHistory();
  const [student, setStudent] = useState<TableTypes<"user">>();
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const [canShowAvatar, setCanShowAvatar] = useState<boolean>();

  const [isLinked, setIsLinked] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const init = async (fromCache: boolean = true) => {
    try {
      const [canShowAvatarValue, student, currMode] = await Promise.all([
        Util.getCanShowAvatar(),
        Util.getCurrentStudent(),
        schoolUtil.getCurrMode(),
      ]);
      if (!student) {
        history.replace(PAGES.SELECT_MODE);
        return;
      }
      const linked = await api.isStudentLinked(student.id, fromCache);
      setIsLinked(linked);
      setStudentMode(currMode);

      DEFAULT_HEADER_ICON_CONFIGS.forEach(async (element) => {
        console.log("element.headerList", element.headerList);
        if (
          !(
            (currMode === MODES.SCHOOL &&
              element.headerList === HOMEHEADERLIST.ASSIGNMENT) ||
            (canShowAvatarValue === false &&
              element.headerList === HOMEHEADERLIST.SUGGESTIONS)
          )
        ) {
          headerIconList.push(element);
        }
      });

      if (!headerIconList) return;

      setCurrentHeaderIconList(headerIconList);
      setStudent(student);
    } catch (error) {
      console.error("Error in init:", error);
    }
  };

  useEffect(() => {
    init();
    window.addEventListener("JoinClassListner", handleJoinClassListner);
  }, []);
  const handleJoinClassListner = () => {
    setIsLinked(true);
    window.removeEventListener("JoinClassListner", handleJoinClassListner);
  };
  // const student =await Util.getCurrentStudent();
  return (
    <div id="home-header-icons">
      <div className="home-header-outer-icon">
        <HeaderIcon
          headerConfig={{
            displayName: t("Home"),
            iconSrc: "assets/icons/HomeIconInactive.svg",
            headerList: HOMEHEADERLIST.HOME,
          }}
          currentHeader={currentHeader}
          pendingAssignmentCount={0}
          pendingLiveQuizCount={0}
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
            if (!isLinked && element.headerList === HOMEHEADERLIST.LIVEQUIZ) {
              return null;
            }
            return (
              <HeaderIcon
                key={index}
                headerConfig={element}
                currentHeader={currentHeader}
                pendingAssignmentCount={pendingAssignmentCount}
                pendingLiveQuizCount={pendingLiveQuizCount}
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
              (studentMode === MODES.SCHOOL && student?.image) ||
              `assets/avatars/${student?.avatar ?? AVATARS[0]}.png`,
            headerList: HOMEHEADERLIST.PROFILE,
          }}
          currentHeader={currentHeader}
          pendingAssignmentCount={0}
          pendingLiveQuizCount={0}
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
