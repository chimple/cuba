import React, { useEffect, useState } from "react";
import { IonPage, IonRow, IonContent } from "@ionic/react";
import "./LiveQuizLeaderBoard.css"; // Import your custom styles
import { ServiceConfig } from "../services/ServiceConfig";
import User from "../models/user";
import StudentAvatar from "../components/common/StudentAvatar";
import { Util } from "../utility/util";
import BackButton from "../components/common/BackButton";
import { PAGES } from "../common/constants";
import { useHistory } from "react-router";
import { t } from "i18next";
interface Participant {
  studentDocId: string;
  totalScore: number;
}

const LiveQuizLeaderBoard: React.FC<{ liveQuizRoomDocId?: string }> = ({
  liveQuizRoomDocId,
}) => {
  const [sortedStudentScores, setSortedStudentScores] = useState<Participant[]>(
    []
  );
  const [students, setStudents] = useState(new Map<String, User>());
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  useEffect(() => {
    fetchLiveQuizResults();
  }, [students]);
  const fetchLiveQuizResults = async () => {
    try {
      const currentStudent = Util.getCurrentStudent();

      if (!currentStudent) return;

      const linked = await api.isStudentLinked(currentStudent.docId, true);
      if (!linked) return;

      const studentResult = await api.getStudentResult(currentStudent.docId);
      if (
        !studentResult ||
        !studentResult.classes ||
        studentResult.classes.length < 1
      )
        return;

      const classId = studentResult.classes[0];
      if (!classId) return;

      const studentsData = await api.getStudentsForClass(classId);
      const tempStudentMap = new Map<String, User>();
      for (let student of studentsData) {
        tempStudentMap.set(student.docId, student);
      }
      setStudents(tempStudentMap);
      const res = await api.getResultsOfLiveQuiz(liveQuizRoomDocId);
      if (res) {
        const allStudentScoresData = res.map((result: any) => ({
          studentDocId: result.studentDocId,
          totalScore: result.totalScore,
        }));

        const sortedScores = allStudentScoresData.sort(
          (a, b) => b.totalScore - a.totalScore
        );
        setSortedStudentScores(sortedScores);
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
                Util.setPathToBackButton(PAGES.LIVE_QUIZ_ROOM_RESULT, history);
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
