import React, { useEffect, useState } from "react";
import { IonPage, IonRow, IonContent } from "@ionic/react";
import "./LiveQuizLeaderBoard.css";
import { ServiceConfig } from "../services/ServiceConfig";
import User from "../models/user";
import StudentAvatar from "../components/common/StudentAvatar";
import { Util } from "../utility/util";
import BackButton from "../components/common/BackButton";
import { PAGES } from "../common/constants";
import { t } from "i18next";
import { useHistory } from "react-router";

const LiveQuizLeaderBoard: React.FC = () => {
  const [sortedStudentScores, setSortedStudentScores] = useState<any>([]);
  const [students, setStudents] = useState(new Map<String, User>());
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramAssignmentId = urlSearchParams.get("liveRoomId") ?? "";
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const res = await api.getLiveQuizRoomDoc(paramAssignmentId);
      const classRef = res?.class;
      const classId = classRef?.id;
      let tempStudentMap = new Map<String, User>();
      if (!!classId) {
        const allStudents = await api.getStudentsForClass(classId);

        for (let student of allStudents) {
          tempStudentMap.set(student.docId, student);
        }
        setStudents(tempStudentMap);
      }
      const assignmentId = res?.assignment.id;
      const assignmentDoc = await api.getAssignmentById(assignmentId);

      if (!!assignmentDoc && !!assignmentDoc.results) {
        const scoresData = Object.entries(assignmentDoc.results).map(
          ([studentDocId, result]) => ({
            studentDocId,
            totalScore: result.score,
          })
        );

        scoresData.sort((a, b) => b.totalScore - a.totalScore);
        const studentIdsInClass = Array.from(tempStudentMap.keys());
        const filteredScores = scoresData.filter((score) =>
          studentIdsInClass.includes(score.studentDocId)
        ); //filtering only played students from class
        setSortedStudentScores(filteredScores);
      }
    } catch (error) {
      console.error("Error fetching LiveQuizRoom data:", error);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="leaderboard-header">
          <div className="leaderboard-back-button">
            <BackButton
              onClicked={() => {
                Util.setPathToBackButton(PAGES.HOME, history);
              }}
            />
          </div>

          <p className="header-name">{t("Live Quiz Leaderboard")}</p>
        </div>
        <div className="leaderboard-header-row">
          <div>{t("Rank")}</div>
          <div>{t("Name")}</div>
          <div>{t("Score")}</div>
        </div>
        <div className="leaderboard-container">
          {sortedStudentScores.map((scoreData, index) => (
            <IonRow
              key={index}
              className={`leaderboard-row ${index % 2 === 0 ? "even" : "odd"}`}
            >
              <div className="rank-column">{index + 1}</div>
              <div className="name-column">
                {students.has(scoreData.studentDocId) && (
                  <StudentAvatar
                    student={students.get(scoreData.studentDocId)!}
                    onClicked={() => {}}
                    width={50}
                    namePosition="right"
                  />
                )}
              </div>
              <div className="score-column">{scoreData.totalScore}</div>
            </IonRow>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LiveQuizLeaderBoard;
