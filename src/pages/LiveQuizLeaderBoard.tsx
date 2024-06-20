import React, { useEffect, useState } from "react";
import { IonPage, IonRow, IonContent } from "@ionic/react";
import "./LiveQuizLeaderBoard.css";
import { ServiceConfig } from "../services/ServiceConfig";
import StudentAvatar from "../components/common/StudentAvatar";
import { PAGES, TableTypes } from "../common/constants";
import { t } from "i18next";
import { useHistory } from "react-router";
import NextButton from "../components/common/NextButton";

const LiveQuizLeaderBoard: React.FC = () => {
  const [combinedStudentScores, setCombinedStudentScores] = useState<any>([]);
  const [students, setStudents] = useState(
    new Map<String, TableTypes<"user">>()
  );
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId") ?? "";
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  let resultData: TableTypes<"result">[] | null = [];
  let userData: TableTypes<"user">[] | null = [];
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const liveQuizRoomDoc = await api.getLiveQuizRoomDoc(paramLiveRoomId);
      const liveQuizRoomResults = liveQuizRoomDoc?.results;
      console.log("liveQuizRoomResults..", liveQuizRoomResults);
      type Participant = {
        studentDocId: string;
        totalScore: number;
        totalTimeSpent: number;
      };
      const studentResults: Participant[] = [];
      if (!!liveQuizRoomResults) {
        Object.keys(liveQuizRoomResults).forEach((studentDocId) => {
          const studentResult = liveQuizRoomResults[studentDocId];
          const { totalScore, totalTimeSpent } = studentResult.reduce(
            (acc, question) => {
              acc.totalScore += question.score;
              acc.totalTimeSpent += question.timeSpent;
              return acc;
            },
            { totalScore: 0, totalTimeSpent: 0 }
          );

          studentResults.push({
            studentDocId,
            totalScore,
            totalTimeSpent,
          });
        });
        console.log("studentresults!!!", studentResults);

        const liveQuizRoomScores: Participant[] = studentResults;
        const leaderboardScores = await fetchAssignmentResults();

        const combinedScores = combineScores(
          liveQuizRoomScores,
          leaderboardScores
        );
        combinedScores.sort((a, b) => b.totalScore - a.totalScore);
        console.log("combinedSortedScores..", combinedScores);
        setCombinedStudentScores(combinedScores);
        const tempStudentsMap = new Map<string, TableTypes<"user">>();
        await Promise.all(
          combinedScores.map(async (participant) => {
            if (!!userData) {
              for (let user of userData) {
                if (participant.studentDocId === user.id) {
                  tempStudentsMap.set(participant.studentDocId, user);
                }
              }
            }
          })
        );
        console.log("tempStudentsMap..", tempStudentsMap);
        setStudents(tempStudentsMap);
      }
    } catch (error) {
      console.error(
        "🚀 ~ file:LiveQuizLeaderBoard.tsx:80~Error fetching liveQuiz room data:",
        error
      );
    }
  };
  const fetchAssignmentResults = async () => {
    const res = await api.getLiveQuizRoomDoc(paramLiveRoomId);
    if (res) {
      const assignmentId = res?.assignment_id;
      const assignmentDoc = await api.getAssignmentById(assignmentId);
      console.log("AssignmentDoc:", assignmentDoc);
      let scoresData: any;

      if (assignmentDoc) {
        const results = await api.getStudentResultsByAssignmentId(
          assignmentDoc?.id
        );
        userData = results[0].user_data;
        resultData = results[0].result_data;
        const playedStudentIds = [
          ...new Set(resultData.map((result) => result.student_id)),
        ];

        scoresData = playedStudentIds.map((studentDocId) => {
          const totalScore = resultData
            ?.filter((data) => data.student_id === studentDocId)
            .reduce((sum, data) => sum + (data.score || 0), 0);

          return {
            studentDocId,
            totalScore,
          };
        });
      }
      console.log("Scores Data:", scoresData);

      return scoresData;
    }
  };
  const combineScores = (roomResultScores, leaderboardScores) => {
    console.log("roomResultScores", roomResultScores);
    console.log("leaderboardScores", leaderboardScores);
    const uniqueStudentDocIds = Array.from(
      new Set([
        ...roomResultScores.map((res) => res.studentDocId),
        ...leaderboardScores.map((res) => res.studentDocId),
      ])
    );
    console.log("uniqueStudentDocIds..", uniqueStudentDocIds);

    const combinedScores = uniqueStudentDocIds.map((studentDocId) => {
      const roomResultScore = roomResultScores.find(
        (res) => res.studentDocId === studentDocId
      );
      const leaderboardScore = leaderboardScores.find(
        (res) => res.studentDocId === studentDocId
      );
      if (!!roomResultScore && !!leaderboardScore) {
        return {
          studentDocId,
          totalScore: roomResultScore.totalScore,
        };
      } else {
        return roomResultScore || leaderboardScore;
      }
    });

    return combinedScores;
  };

  return (
    <IonPage>
      <IonContent>
        <div className="livequiz-leaderboard">
          <div className="leaderboard-header">
            <div className="empty"></div>

            <p className="header-name">{t("Live Quiz Leaderboard")}</p>
            <div id="leaderboard-next-button">
              <NextButton
                onClicked={() => {
                  history.replace(PAGES.HOME);
                }}
                disabled={false}
              />
            </div>
          </div>
          <div className="leaderboard-header-row">
            <div>{t("Rank")}</div>
            <div>{t("Name")}</div>
            <div>{t("Score")}</div>
          </div>
        </div>
        <div className="leaderboard-container">
          {combinedStudentScores
            .filter((scoreData) => students.has(scoreData.studentDocId))
            .map((scoreData, index) => (
              <IonRow
                key={index}
                className={`leaderboard-row ${
                  index % 2 === 0 ? "even" : "odd"
                }`}
              >
                <div className="rank-column">{index + 1}</div>
                <div className="name-column">
                  <StudentAvatar
                    student={students.get(scoreData.studentDocId)!}
                    onClicked={() => {}}
                    width={50}
                    namePosition="right"
                  />
                </div>
                <div className="score-column">
                  {Math.round(scoreData.totalScore)}
                </div>
              </IonRow>
            ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LiveQuizLeaderBoard;
