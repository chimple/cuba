import { useEffect, useState } from "react";
import "./Leaderboard.css";
import {
  AVATARS,
  CURRENT_STUDENT,
  LANG,
  LEADERBOARDHEADERLIST,
  PAGES,
  PARENTHEADERLIST,
} from "../common/constants";
// import LeftTitleRectangularIconButton from "../components/parent/LeftTitleRectangularIconButton";
import { ServiceConfig } from "../services/ServiceConfig";
import BackButton from "../components/common/BackButton";
import { useHistory } from "react-router-dom";
import Loading from "../components/Loading";
import { IonCol, IonGrid, IonPage, IonRow } from "@ionic/react";
import User from "../models/user";
import RectangularOutlineDropDown from "../components/parent/RectangularOutlineDropDown";
import React from "react";
import { FirebaseApi } from "../services/api/FirebaseApi";
import {
  LeaderboardInfo,
  StudentLeaderboardInfo,
} from "../services/api/ServiceApi";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import { grey } from "@mui/material/colors";
import StudentProfile from "../models/studentProfile";
import { t } from "i18next";
// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";
import { Util } from "../utility/util";
// import auth from "../models/auth";
import i18n from "../i18n";
import IconButton from "../components/IconButton";

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<User>();
  // const [isWeeklyFlag, setIsWeeklyFlag] = useState<boolean>(true);
  const [leaderboardDataInfo, setLeaderboardDataInfo] =
    useState<LeaderboardInfo>({
      weekly: [],
      allTime: [],
    });
  const [leaderboardData, setLeaderboardData] = useState<any[][]>([]);
  const [currentUserDataContent, setCurrentUserDataContent] = useState<
    string[][]
  >([]);
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();

  const [weeklyList, setWeeklyList] = useState<
    {
      id: string;
      displayName: string;
    }[]
  >([]);
  const [weeklySelectedValue, setWeeklySelectedValue] = useState<string>();
  const [currentClass, setCurrentClass] = useState<StudentProfile>();

  useEffect(() => {
    setIsLoading(true);
    inti();
  }, []);

  async function inti() {
    console.log("init method called");
    const weekOptions = [t("Weekly"), t("ALL Time")];
    let weekOptionsList: {
      id: string;
      displayName: string;
    }[] = [];
    weekOptions.forEach((element, i) => {
      weekOptionsList.push({
        id: i.toString(),
        displayName: element,
      });
    });
    setWeeklyList(weekOptionsList);
    // const api = ServiceConfig.getI().apiHandler;
    const currentStudent = await Util.getCurrentStudent();
    if (currentStudent != undefined) {
      const getClass = await FirebaseApi.i.getStudentResult(
        currentStudent.docId
      );
      if (getClass?.classes != undefined) {
        fetchLeaderBoardData(currentStudent, true, getClass?.classes[0]);
        setCurrentClass(getClass);
      } else {
        fetchLeaderBoardData(currentStudent, true, "");
      }
      console.log("currentStudent ", currentStudent);
      setCurrentStudent(currentStudent);

      // setIsLoading(false);
    }
  }

  async function fetchLeaderBoardData(
    currentStudent: User,
    isWeeklyFlag: boolean,
    classId: string
  ) {
    setIsLoading(true);
    const api = ServiceConfig.getI().apiHandler;
    console.log(
      "leaderboardDataInfo.weekly.length <= 0 leaderboardDataInfo.allTime.length <= 0",
      leaderboardDataInfo.weekly.length <= 0 ||
        leaderboardDataInfo.allTime.length <= 0,
      isWeeklyFlag
        ? "leaderboardDataInfo.weekly"
        : "leaderboardDataInfo.allTime"
    );

    const tempLeaderboardData: LeaderboardInfo = (leaderboardDataInfo.weekly
      .length <= 0 || leaderboardDataInfo.allTime.length <= 0
      ? await api.getLeaderboardResults(classId, isWeeklyFlag)
      : leaderboardDataInfo) || {
      weekly: [],
      allTime: [],
    };

    // if (isWeeklyFlag) {
    //   setLeaderboardDataInfo(tempLeaderboardData);
    // } else {
    setLeaderboardDataInfo(tempLeaderboardData);
    // }

    const tempData = isWeeklyFlag
      ? tempLeaderboardData.weekly
      : tempLeaderboardData.allTime;

    let tempLeaderboardDataArray: any[][] = [];
    let tempCurrentUserDataContent: any[][] = [];
    tempLeaderboardDataArray.push([
      "#",
      t("Name"),
      t("Lesson Played"),
      t("Score"),
      t("Time Spent"),
    ]);

    for (let i = 0; i < tempData.length; i++) {
      const element = tempData[i];
      var computeMinutes = Math.floor(element.timeSpent / 60);
      var result = element.timeSpent % 60;
      tempLeaderboardDataArray.push([
        i + 1,
        element.name,
        element.lessonsPlayed,
        element.score,
        computeMinutes + "min" + " " + result + " " + "sec",
      ]);

      if (currentStudent.docId == element.userId) {
        tempCurrentUserDataContent = [
          // ["Name", element.name],
          [t("Rank"), i + 1],
          [t("Last Played"), element.lessonsPlayed],
          [t("Score"), element.score],
          [
            t("Time Spent"),
            computeMinutes + t("min") + result + " " + t("sec"),
          ],
        ];
      }
    }
    if (tempCurrentUserDataContent.length <= 0) {
      tempCurrentUserDataContent = [
        // ["Name", element.name],
        [t("Rank"), "--"],
        [t("Last Played"), "--"],
        [t("Score"), "--"],
        [t("Time Spent"), "--" + t("min") + " --" + t("sec")],
      ];
      tempLeaderboardDataArray.push([
        "--",
       currentStudent.name,
        "--",
        "--",
        "--" + t("min") + " --" + t("sec"),
      ]);
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
          <RectangularOutlineDropDown
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
                  weeklyList[0] === weeklyList[selectedValue],
                  currentClass?.classes[0] || ""
                );
                //  }
              }
            }}
          ></RectangularOutlineDropDown>
          <div
            key={currentStudent?.docId}
            // onClick={() => onStudentClick(student)}
            className="avatar"
            id="leaderboard-avatar"
          >
            <img
              className="avatar-img"
              src={
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
                                ? "2.5vw"
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
        </div>
        <div id="leaderboard-right-UI">
          {leaderboardData.map((e) => {
            let columnWidth = ["3vw", "14vw", "15vw", "7vw", "14vw"];
            let rankColors = ["", "#FFC32C", "#C4C4C4", "#D39A66", "#959595"];
            let i = -1;
            headerRowIndicator++;
            console.log(
              "headerRowIndicator",
              headerRowIndicator,
              currentUserDataContent[0][1],
              // i.toString(),
              Number(currentUserDataContent[0][1]),
              Number(currentUserDataContent[0][1]) === headerRowIndicator
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
                        headerRowIndicator
                      ? "#FF7925"
                      : "",
                  padding:
                    headerRowIndicator === 0
                      ? "1vh 2vh"
                      : Number(currentUserDataContent[0][1]) ===
                        headerRowIndicator
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
                        {d}
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
                history.replace(PAGES.HOME);
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
                  <Tab
                    id="parent-page-tab-bar"
                    value={LEADERBOARDHEADERLIST.EVENTS}
                    label={t(LEADERBOARDHEADERLIST.EVENTS)}
                  />
                </Tabs>
              </AppBar>
            </Box>
            <div>
              <IconButton
                name={t("Switch")}
                iconSrc="assets/icons/SignOutIcon.svg"
                onClick={async () => {
                  localStorage.removeItem(CURRENT_STUDENT);
                  const user = await auth.getCurrentUser();
                  if (!!user && !!user.language?.id) {
                    const langDoc = await api.getLanguageWithId(
                      user.language.id
                    );
                    if (langDoc) {
                      const tempLangCode = langDoc.code ?? LANG.ENGLISH;
                      await i18n.changeLanguage(tempLangCode);
                    }
                  }
                  // history.replace(PAGES.DISPLAY_STUDENT);
                  history.replace(PAGES.SELECT_MODE);
                }}
              />
            </div>
          </div>
          <Box sx={{}}>
            {tabIndex === LEADERBOARDHEADERLIST.LEADERBOARD && (
              <Box>
                <div>{leaderboardUI()}</div>
              </Box>
            )}
            {tabIndex === LEADERBOARDHEADERLIST.EVENTS && <Box></Box>}
          </Box>
        </Box>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default Leaderboard;
