import { useEffect, useState } from "react";
import "./Leaderboard.css";
import { AVATARS, PAGES, PARENTHEADERLIST } from "../common/constants";
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
// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<User>();
  const [isWeeklyFlag, setIsWeeklyFlag] = useState<boolean>(true);
  const [leaderboardDataInfo, setLeaderboardDataInfo] =
    useState<LeaderboardInfo>({
      weekly: [],
      allTime: [],
    });
  const [leaderboardData, setLeaderboardData] = useState<any[][]>([]);
  const [currentUserDataContent, setCurrentUserDataContent] = useState<
    string[][]
  >([]);
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  const history = useHistory();

  const weekOptions = ["Weekly", "ALL Time"];
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
  const [weeklySelectedValue, setWeeklySelectedValue] = useState<string>(
    weekOptions[0]
  );

  useEffect(() => {
    setIsLoading(true);
    inti();
  }, []);

  async function inti() {
    console.log("init method called");
    const api = ServiceConfig.getI().apiHandler;
    const currentStudent = await api.currentStudent;

    console.log("currentStudent ", currentStudent);
    if (currentStudent != undefined) {
      fetchLeaderBoardData(currentStudent);
      console.log("currentStudent ", currentStudent);
      setCurrentStudent(currentStudent);

      setIsLoading(false);
    }
  }

  async function fetchLeaderBoardData(currentStudent: User) {
    const tempLeaderboardData: StudentLeaderboardInfo[] =
      await FirebaseApi.i.getLeaderboard(
        "studentId",
        "sectionId",
        "schoolId",
        isWeeklyFlag
      );
    if (isWeeklyFlag) {
      setLeaderboardDataInfo({
        weekly: tempLeaderboardData,
        allTime: leaderboardDataInfo.allTime,
      });
    } else {
      setLeaderboardDataInfo({
        weekly: leaderboardDataInfo.weekly,
        allTime: tempLeaderboardData,
      });
    }

    let tempLeaderboardDataArray: any[][] = [];
    let tempCurrentUserDataContent: any[][] = [];
    for (let i = 0; i < tempLeaderboardData.length; i++) {
      const element = tempLeaderboardData[i];
      tempLeaderboardDataArray.push([
        i + 1,
        element.name,
        element.lessonsPlayed,
        element.score,
        element.timeSpent,
      ]);
      // console.log(
      //   "currentStudent.uid == element.userId",
      //   currentStudent.uid == element.userId,
      //   currentStudent.uid,
      //   element.userId
      // );

      if (currentStudent.docId == element.userId) {
        tempCurrentUserDataContent = [
          // ["Name", element.name],
          ["Rank", i + 1],
          ["Last Played", element.lessonsPlayed],
          ["Score", element.score],
          ["Time Spent", element.timeSpent],
        ];
      }
    }
    setCurrentUserDataContent(tempCurrentUserDataContent);
    setLeaderboardData(tempLeaderboardDataArray);
  }

  function leaderboardUI() {
    console.log("weeklySelectedValue", weeklySelectedValue);

    return (
      <div id="leaderboard-UI">
        <div id="leaderboard-left-UI">
          <RectangularOutlineDropDown
            placeholder={weeklySelectedValue}
            optionList={weekOptionsList}
            currentValue={weeklySelectedValue}
            width="26vw"
            onValueChange={(selectedValue) => {
              console.log(
                "selected value",
                selectedValue,
                weekOptions[selectedValue],
                weekOptions[0] === weekOptions[selectedValue]
                // weekOptionsList[selectedValue],
                // weekOptionsList[selectedValue]?.displayName
              );
              if (weekOptions[0] === weekOptions[selectedValue]) {
                // setIsWeeklyFlag(true);
                setWeeklySelectedValue(weekOptions[0]);
              } else {
                // setIsWeeklyFlag(false);
                setWeeklySelectedValue(weekOptions[1]);
              }
              // fetchLeaderBoardData(currentStudent!);
            }}
          ></RectangularOutlineDropDown>
          <div
            key={currentStudent?.docId}
            // onClick={() => onStudentClick(student)}
            className="avatar"
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
            {currentStudent?.name}
          </div>
          <div>
            {currentUserDataContent.map((e) => {
              return (
                <IonRow>
                  {e.map((d) => {
                    return (
                      <IonCol key={d} size="0" size-sm="6">
                        <p id="leaderboard-left-UI-content">{d || "Empty"}</p>
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
            return (
              <IonGrid>
                <IonRow>
                  {e.map((d) => {
                    return (
                      <IonCol size="auto" size-sm="2">
                        <p id="leaderboard-right-UI-content">{d}</p>
                      </IonCol>
                    );
                  })}
                </IonRow>
              </IonGrid>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <IonPage>
      {!isLoading ? (
        <div id="leaderboard-page">
          <BackButton
            // iconSize={"8vh"}
            onClicked={() => {
              history.replace(PAGES.HOME);
            }}
          ></BackButton>
          {leaderboardUI()}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default Leaderboard;
