import { useEffect, useState } from "react";
import "./Leaderboard.css";
import {
  AVATARS,
  CURRENT_STUDENT,
  LANG,
  LEADERBOARDHEADERLIST,
  PAGES,
  MODES,
  TableTypes,
  LANGUAGE,
  LeaderboardDropdownList,
  HOMEHEADERLIST,
  CURRENT_MODE,
  CLASS,
  CURRENT_CLASS,
} from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import BackButton from "../components/common/BackButton";
import { useHistory } from "react-router-dom";
import Loading from "../components/Loading";
import { IonCol, IonPage, IonRow } from "@ionic/react";
import User from "../models/user";
import React from "react";
import { LeaderboardInfo } from "../services/api/ServiceApi";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import StudentProfile from "../models/studentProfile";
import { t } from "i18next";
import { Util } from "../utility/util";
import i18n from "../i18n";
import IconButton from "../components/IconButton";
import { schoolUtil } from "../utility/schoolUtil";
import DropDown from "../components/DropDown";
import LeaderboardRewards from "../components/leaderboard/LeaderboardRewards";
import SkeltonLoading from "../components/SkeltonLoading";
import { AvatarObj } from "../components/animation/Avatar";
import { App } from "@capacitor/app";
import { school } from "../stories/school/SchoolClassSubjectsTab.stories";
import ORUser from "../models/OneRoster/ORUser";

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<ORUser>();
  // const [isWeeklyFlag, setIsWeeklyFlag] = useState<boolean>(true);
  const [leaderboardDataInfo, setLeaderboardDataInfo] =
    useState<LeaderboardInfo>({
      weekly: [],
      allTime: [],
      monthly: [],
    });
  const [leaderboardData, setLeaderboardData] = useState<any[][]>([]);
  const [currentUserDataContent, setCurrentUserDataContent] = useState<
    string[][]
  >([]);
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();

  const [weeklyList, setWeeklyList] = useState<
    {
      id: string;
      displayName: string;
      type: LeaderboardDropdownList;
    }[]
  >([]);
  const [weeklySelectedValue, setWeeklySelectedValue] = useState<string>();
  const [currentClassAndSchool, setCurrentClassAndSchool] = useState<{
    classes: TableTypes<"class">[];
    schools: TableTypes<"school">[];
  }>();

  useEffect(() => {
    setIsLoading(true);
    inti();
    const urlParams = new URLSearchParams(window.location.search);
    const rewardsTab = urlParams.get("tab");
    let currentTab = LEADERBOARDHEADERLIST.LEADERBOARD;
    if (rewardsTab) {
      if (rewardsTab === LEADERBOARDHEADERLIST.REWARDS.toLowerCase()) {
        currentTab = LEADERBOARDHEADERLIST.REWARDS;
      }
    }
    setTabIndex(currentTab);
  }, []);

  useEffect(() => {}, []);
  const urlOpen = () => {
    App.addListener("appUrlOpen", (event) => {
      const url = new URL(event.url);
      Util.setPathToBackButton(
        `${PAGES.HOME}?page=/${url.pathname.substring(1)}&classCode=${url.searchParams.get("classCode")}`,
        history
      );
    });
  };
  App.addListener("appStateChange", urlOpen);
  async function inti() {
    console.log("init method called");
    const weekOptions = [
      { text: t("Weekly"), type: LeaderboardDropdownList.WEEKLY },
      { text: t("Monthly"), type: LeaderboardDropdownList.MONTHLY },
      { text: t("ALL Time"), type: LeaderboardDropdownList.ALL_TIME },
    ];
    let weekOptionsList: {
      id: string;
      displayName: string;
      type: LeaderboardDropdownList;
    }[] = [];
    weekOptions.forEach((element, i) => {
      weekOptionsList.push({
        id: i.toString(),
        displayName: element.text,
        type: element.type,
      });
    });
    setWeeklyList(weekOptionsList);
    const api = ServiceConfig.getI().apiHandler;
    const currentStudent = Util.getCurrentStudent();
    if (currentStudent != undefined) {
      const getClass = await api.getStudentClassesAndSchools(currentStudent.id);
      const currMode = await schoolUtil.getCurrMode();
      setStudentMode(currMode);
      if (getClass?.classes && getClass?.classes.length > 0) {
        fetchLeaderBoardData(
          currentStudent,
          LeaderboardDropdownList.WEEKLY,
          getClass?.classes[0].id
        );
        setCurrentClassAndSchool(getClass);
      } else {
        fetchLeaderBoardData(
          currentStudent,
          LeaderboardDropdownList.WEEKLY,
          ""
        );
      }
      console.log("currentStudent ", currentStudent);
      setCurrentStudent(currentStudent);

      // setIsLoading(false);
    }
  }
  async function fetchLeaderBoardData(
    currentStudent: ORUser,
    leaderboardDropdownType: LeaderboardDropdownList,
    classId: string
  ) {
    setIsLoading(true);
    const api = ServiceConfig.getI().apiHandler;
    console.log(
      "leaderboardDataInfo.weekly.length <= 0 leaderboardDataInfo.allTime.length <= 0",
      leaderboardDataInfo.weekly.length <= 0 ||
        leaderboardDataInfo.allTime.length <= 0,
      leaderboardDropdownType
        ? "leaderboardDataInfo.weekly"
        : "leaderboardDataInfo.allTime"
    );
    let currentUserDataContent: any[][] = [];
    let leaderboardDataArray: any[][] = [];
    currentUserDataContent = [
      [t("Rank"), "--"],
      [t("Lessons Played"), "--"],
      [t("Score"), "--"],
      [t("Time Spent"), "--" + t("min") + " --" + t("sec")],
    ];
    leaderboardDataArray.push([
      "#",
      t("Name"),
      t("Lessons Played"),
      t("Score"),
      t("Time Spent"),
    ]);
    let dummyData = [
      "--",
      currentStudent.name,
      "--",
      "--",
      "--" + t("min") + " --" + t("sec"),
    ];
    leaderboardDataArray.push(dummyData);
    setCurrentUserDataContent(currentUserDataContent);
    setLeaderboardData(leaderboardDataArray);
    setIsLoading(false);
    const tempLeaderboardData: LeaderboardInfo = (leaderboardDataInfo.weekly
      .length <= 0 ||
    leaderboardDataInfo.allTime.length <= 0 ||
    leaderboardDataInfo.monthly.length <= 0
      ? await api.getLeaderboardResults(classId, leaderboardDropdownType)
      : leaderboardDataInfo) || {
      weekly: [],
      allTime: [],
      monthly: [],
    };

    // if (isWeeklyFlag) {
    //   setLeaderboardDataInfo(tempLeaderboardData);
    // } else {
    setLeaderboardDataInfo(tempLeaderboardData);
    // }

    const tempData =
      leaderboardDropdownType === LeaderboardDropdownList.WEEKLY
        ? tempLeaderboardData.weekly
        : leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
          ? tempLeaderboardData.monthly
          : tempLeaderboardData.allTime;

    let tempLeaderboardDataArray: any[][] = [];
    let tempCurrentUserDataContent: any[][] = [];
    tempLeaderboardDataArray.push([
      "#",
      t("Name"),
      t("Lessons Played"),
      t("Score"),
      t("Time Spent"),
    ]);
    let isCurrentStudentDataFetched = false;
    for (let i = 0; i < tempData.length; i++) {
      const element = tempData[i];
      var computeMinutes = Math.floor(element.timeSpent / 60);
      var computeSeconds = element.timeSpent % 60;
      tempLeaderboardDataArray.push([
        i + 1,
        element.name,
        element.lessonsPlayed,
        element.score,
        computeMinutes + " " + t("min") + " " + computeSeconds + " " + t("sec"),
      ]);

      if (currentStudent.id == element.userId) {
        isCurrentStudentDataFetched = true;
        tempCurrentUserDataContent = [
          // ["Name", element.name],
          [t("Rank"), i + 1],
          [t("Lessons Played"), element.lessonsPlayed],
          [t("Score"), Math.round(element.score)],
          [
            t("Time Spent"),
            computeMinutes + t(" min") + computeSeconds + " " + t("sec"),
          ],
        ];
      }
    }
    if (!isCurrentStudentDataFetched && !classId) {
      const b2cData = await api.getLeaderboardStudentResultFromB2CCollection(
        currentStudent.id
      );
      if (b2cData) {
        const tempData =
          leaderboardDropdownType === LeaderboardDropdownList.WEEKLY
            ? b2cData.weekly
            : leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
              ? b2cData.monthly
              : b2cData.allTime;
        if (tempData && tempData.length > 0) {
          var computeMinutes = Math.floor(tempData[0].timeSpent / 60);
          var computeSeconds = tempData[0].timeSpent % 60;
          const cUserRank = tempLeaderboardDataArray.length.toString() + "+";
          tempCurrentUserDataContent = [
            // ["Name", element.name],
            [t("Rank"), cUserRank],
            [t("Lessons Played"), tempData[0].lessonsPlayed],
            [t("Score"), tempData[0].score],
            [
              t("Time Spent"),
              computeMinutes +
                t(" min") +
                " " +
                computeSeconds +
                " " +
                t("sec"),
            ],
          ];
          tempLeaderboardDataArray.push([
            cUserRank,
            tempData[0].name,
            tempData[0].lessonsPlayed,
            tempData[0].score,
            computeMinutes + t(" min") + " " + computeSeconds + " " + t("sec"),
          ]);
        }
      }
    }
    if (tempCurrentUserDataContent.length <= 0) {
      tempCurrentUserDataContent = currentUserDataContent;
      tempLeaderboardDataArray.push(dummyData);
    }
    setCurrentUserDataContent(tempCurrentUserDataContent);
    setLeaderboardData(tempLeaderboardDataArray);
    setIsLoading(false);
  }

  let headerRowIndicator = -1;
  let currentUserHeaderRowIndicator = -1;

  function leaderboardUI() {
    console.log("weeklySelectedValue", weeklySelectedValue);

    return (
      <div id="leaderboard-UI">
        <div id="leaderboard-left-UI">
          <DropDown
            placeholder={weeklySelectedValue || weeklyList[0]?.displayName}
            optionList={weeklyList}
            currentValue={weeklySelectedValue || weeklyList[0]?.id}
            width="26vw"
            onValueChange={(selectedValue) => {
              // if (weekOptionsList[0] != weekOptionsList[selectedValue]) {
              // setIsWeeklyFlag(true);
              if (weeklyList[selectedValue]?.displayName != undefined) {
                console.log(
                  "selected value",
                  selectedValue,
                  weeklyList[selectedValue]?.displayName,
                  weeklyList[0] === weeklyList[selectedValue]
                );
                setWeeklySelectedValue(weeklyList[selectedValue]?.id);
                fetchLeaderBoardData(
                  currentStudent!,
                  // weeklyList[0] === weeklyList[selectedValue],
                  weeklyList[selectedValue].type ??
                    LeaderboardDropdownList.WEEKLY,
                  currentClassAndSchool?.classes[0].id || ""
                );
                //  }
              }
            }}
          ></DropDown>
          <div
            key={currentStudent?.id}
            // onClick={() => onStudentClick(student)}
            className="avatar"
            id="leaderboard-avatar"
          >
            <img
              className="avatar-img"
              src={
                (studentMode === MODES.SCHOOL && currentStudent?.image) ||
                "assets/avatars/" +
                  (currentStudent?.avatar ?? AVATARS[0]) +
                  ".png"
              }
              alt=""
            />
            <span id="leaderboard-student-name">{currentStudent?.name}</span>
          </div>
          <div>
            {currentUserDataContent.map((e) => {
              let i = -1;
              return (
                <IonRow>
                  {e.map((d) => {
                    i++;
                    currentUserHeaderRowIndicator++;
                    console.log(
                      "color: i === 1 && j === 1 ? white : ",
                      i,
                      currentUserHeaderRowIndicator,
                      i === 1 && currentUserHeaderRowIndicator === 1
                    );

                    return (
                      <IonCol key={d} size="0" size-sm="6">
                        <p
                          style={{
                            color:
                              i === 1 && currentUserHeaderRowIndicator === 1
                                ? "black"
                                : "",
                            backgroundColor:
                              i === 1 && currentUserHeaderRowIndicator === 1
                                ? "white"
                                : "",
                            borderRadius:
                              i === 1 && currentUserHeaderRowIndicator === 1
                                ? "100vw"
                                : "",
                            width:
                              i === 1 && currentUserHeaderRowIndicator === 1
                                ? "3vw"
                                : "",
                            textAlign:
                              i === 1 && currentUserHeaderRowIndicator === 1
                                ? "center"
                                : "left",
                          }}
                          id="leaderboard-left-UI-content"
                        >
                          {d || "0"}
                        </p>
                      </IonCol>
                    );
                  })}
                </IonRow>
              );
            })}
          </div>
          <p id="leaderboard-left-note-message">
            {t(
              "***Be among the top performers in your class to win an exciting reward"
            )}
          </p>
        </div>
        <div id="leaderboard-right-UI">
          {leaderboardData.map((e) => {
            let columnWidth = ["3vw", "14vw", "15vw", "7vw", "18vw"];
            let rankColors = ["", "#FFC32C", "#C4C4C4", "#D39A66", "#959595"];
            let i = -1;
            headerRowIndicator++;
            console.log(
              "headerRowIndicator",
              headerRowIndicator,
              Number(currentUserDataContent[0][1]),
              Number(currentUserDataContent[0][1]) === headerRowIndicator,
              headerRowIndicator + "+",
              Number(currentUserDataContent[0][1]) === headerRowIndicator ||
                currentUserDataContent[0][1] === headerRowIndicator + "+"
            );
            // if (currentUserDataContent[0][1] === i.toString()) {
            //   console.log("User e", e);
            //   // headerRowIndicator = true;
            // }

            return (
              // <IonGrid>
              <IonRow
                style={{
                  backgroundColor:
                    headerRowIndicator === 0
                      ? "rgb(200 200 200)"
                      : Number(currentUserDataContent[0][1]) ===
                            headerRowIndicator ||
                          currentUserDataContent[0][1] ===
                            headerRowIndicator + "+"
                        ? "#FF7925"
                        : "",
                  padding:
                    headerRowIndicator === 0
                      ? "1vh 2vh"
                      : Number(currentUserDataContent[0][1]) ===
                            headerRowIndicator ||
                          currentUserDataContent[0][1] ===
                            headerRowIndicator + "+"
                        ? "0vh 2vh"
                        : "1vh 2vh ",
                  position: "sticky",
                  zIndex: headerRowIndicator === 0 ? "3" : "0",
                  top: "0px",
                }}
              >
                {e.map((d) => {
                  i++;

                  return (
                    <IonCol size="auto">
                      <p
                        style={{
                          color:
                            i === 0 && headerRowIndicator != 0
                              ? Number(currentUserDataContent[0][1]) ===
                                headerRowIndicator
                                ? "black"
                                : "white"
                              : "",
                          backgroundColor:
                            i === 0 && headerRowIndicator != 0
                              ? Number(currentUserDataContent[0][1]) ===
                                headerRowIndicator
                                ? "white"
                                : rankColors[Number(e[0])] || rankColors[4]
                              : "",
                          borderRadius:
                            i === 0 && headerRowIndicator != 0 ? "100vw" : "",
                          height:
                            i === 0 && headerRowIndicator != 0
                              ? columnWidth[i]
                              : "",
                          fontSize: "1.5vw",
                          width: columnWidth[i],
                          textAlign: i === 0 ? "center" : "left",
                        }}
                        id="leaderboard-right-UI-content"
                      >
                        {i === 1 ? (
                          <p id="leaderboard-profile-name">
                            {Number(currentUserDataContent[0][1]) ===
                              headerRowIndicator && currentStudent?.name
                              ? currentStudent?.name
                              : d}
                          </p>
                        ) : isNaN(Math.round(d)) ? (
                          d
                        ) : (
                          Math.round(d)
                        )}
                      </p>
                    </IonCol>
                  );
                })}
              </IonRow>
              // </IonGrid>
            );
          })}
        </div>
      </div>
    );
  }

  const [tabIndex, setTabIndex] = useState(LEADERBOARDHEADERLIST.LEADERBOARD);

  const handleChange = (
    event: React.SyntheticEvent,
    newValue: LEADERBOARDHEADERLIST
  ) => {
    // setValue(newValue);
    setTabIndex(newValue);
  };

  return (
    // <IonPage>
    //   {!isLoading ? (
    //     <div id="leaderboard-page">
    //       <div>
    //         <BackButton
    //           // iconSize={"8vh"}
    //           onClicked={() => {
    //             history.replace(PAGES.HOME);
    //           }}
    //         ></BackButton>
    //       </div>
    //       {currentHeader === LEADERBOARDHEADERLIST.LEADERBOARD ? (
    //         <div>{leaderboardUI()}</div>
    //       ) : null}
    //       {currentHeader === LEADERBOARDHEADERLIST.EVENTS ? <div></div> : null}
    //     </div>
    //   ) : null}
    //   <Loading isLoading={isLoading} />
    // </IonPage>

    <IonPage>
      {!isLoading ? (
        <Box>
          <div id="LeaderBoard-Header">
            <BackButton
              // iconSize={"8vh"}
              onClicked={() => {
                Util.setPathToBackButton(PAGES.HOME, history);
              }}
            ></BackButton>
            <Box>
              <AppBar
                id="LeaderBoard-AppBar"
                position="static"
                sx={{
                  flexDirection: "inherit",
                  justifyContent: "space-between",
                  padding: "1vh 1vw",
                  backgroundColor: "#e2dede !important",
                  boxShadow: "0px 0px 0px 0px !important",
                }}
              >
                <Tabs
                  value={tabIndex}
                  onChange={handleChange}
                  textColor="secondary"
                  indicatorColor="secondary"
                  aria-label="secondary tabs example"
                  // variant="scrollable"
                  scrollButtons="auto"
                  // aria-label="scrollable auto tabs example"
                  centered
                  sx={{
                    // "& .MuiAppBar-root": { backgroundColor: "#FF7925 !important" },
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#000000 !important",
                      bottom: "15% !important",
                    },
                    "& .MuiTab-root": { color: "#000000 !important" },
                    "& .Mui-selected": { color: "#000000 !important" },
                  }}
                >
                  <Tab
                    value={LEADERBOARDHEADERLIST.LEADERBOARD}
                    label={t(LEADERBOARDHEADERLIST.LEADERBOARD)}
                    id="parent-page-tab-bar"
                    // sx={{
                    //   // fontSize:"5vh"
                    //   marginRight: "5vw",
                    // }}
                  />
                  {/* <Tab
                    id="parent-page-tab-bar"
                    value={LEADERBOARDHEADERLIST.EVENTS}
                    label={t(LEADERBOARDHEADERLIST.EVENTS)}
                  /> */}
                  <Tab
                    id="parent-page-tab-bar"
                    value={LEADERBOARDHEADERLIST.REWARDS}
                    label={t(LEADERBOARDHEADERLIST.REWARDS)}
                  />
                </Tabs>
              </AppBar>
            </Box>
            <div
              id="leaderboard-switch-user-button"
              onClick={async () => {
                Util.setCurrentStudent(null);
                localStorage.removeItem(CURRENT_STUDENT);
                localStorage.removeItem(CLASS);
                // await Util.setCurrentStudent(null);
                AvatarObj.destroyInstance();
                const user = await auth.getCurrentUser();
                // console.log("supabase user:", user);
                if (!!user && !!user.language_id) {
                  const langDoc = await api.getLanguageWithId(user.language_id);
                  if (langDoc) {
                    const tempLangCode = langDoc.code ?? LANG.ENGLISH;
                    localStorage.setItem(LANGUAGE, tempLangCode);
                    await i18n.changeLanguage(tempLangCode);
                  }
                }
                const currentMOde = localStorage.getItem(CURRENT_MODE);
                await api.removeAssignmentChannel();
                if (currentMOde === MODES.PARENT) {
                  Util.setPathToBackButton(PAGES.DISPLAY_STUDENT, history);
                } else {
                  Util.setPathToBackButton(PAGES.SELECT_MODE, history);
                  Util.setPathToBackButton(
                    PAGES.SELECT_MODE + "?tab=" + "class",
                    history
                  );
                }
              }}
            >
              <img
                id="leaderboard-switch-user-button-img"
                alt={"assets/icons/SignOutIcon.svg"}
                src={"assets/icons/SignOutIcon.svg"}
              />
              <p className="child-Name">{t("Switch Profile")}</p>
            </div>
          </div>
          <Box sx={{}}>
            {tabIndex === LEADERBOARDHEADERLIST.LEADERBOARD && (
              <Box>
                <div>{leaderboardUI()}</div>
              </Box>
            )}
            {/* {tabIndex === LEADERBOARDHEADERLIST.EVENTS && <Box></Box>} */}
            {tabIndex === LEADERBOARDHEADERLIST.REWARDS && (
              <Box>
                <LeaderboardRewards />
              </Box>
            )}
          </Box>
        </Box>
      ) : null}
      <SkeltonLoading
        isLoading={isLoading}
        header={LEADERBOARDHEADERLIST.LEADERBOARD}
      />
    </IonPage>
  );
};

export default Leaderboard;
