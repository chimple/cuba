import React, { useEffect, useState } from "react";
import { IonPage, IonRow, IonContent } from "@ionic/react";
import "./LiveQuizLeaderBoard.css";
import { ServiceConfig } from "../services/ServiceConfig";
import User from "../models/user";
import StudentAvatar from "../components/common/StudentAvatar";
import { PAGES } from "../common/constants";
import { t } from "i18next";
import { useHistory } from "react-router";
import NextButton from "../components/common/NextButton";

const LiveQuizLeaderBoard: React.FC = () => {
  const [combinedStudentScores, setCombinedStudentScores] = useState<any>([]);
  const [students, setStudents] = useState(new Map<String, User>());
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId") ?? "";
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

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
    const classRef = res?.class;
    const classId = classRef?.id;
    let tempStudentMap = new Map<string, User>();
    const assignmentId = res?.assignment.id;
    const assignmentDoc = await api.getAssignmentById(assignmentId);
    if (!!classId) {
      const allStudents = await Promise.all(
        Object.keys(assignmentDoc?.results ?? {}).map((studentDocId) =>
          api.getUserByDocId(studentDocId)
        )
      );
      console.log("allstudents..", allStudents);
      allStudents.forEach((student) => {
        if (student) {
          tempStudentMap.set(student.docId, student);
        }
      });
      setStudents(tempStudentMap);
    }
    console.log("AssignmentDoc:", assignmentDoc);
    let scoresData: any;

    if (!!assignmentDoc && !!assignmentDoc.results) {
      const playedStudentIds = Object.keys(assignmentDoc.results);
      console.log("Played Student IDs:", playedStudentIds);
      if (playedStudentIds.length > 0) {
        scoresData = playedStudentIds.map((studentDocId) => ({
          studentDocId,
          totalScore: assignmentDoc.results[studentDocId]?.score || 0,
        }));
      } else {
        scoresData = [];
      }
    }
    console.log("Scores Data:", scoresData);

    return scoresData;
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
