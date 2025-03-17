import React, { useEffect, useState } from "react";
import "./LiveQuizRoomResult.css";
import { ServiceConfig } from "../services/ServiceConfig";
import StudentAvatar from "../components/common/StudentAvatar";
import User from "../models/user";
import Confetti from "react-confetti";
import NextButton from "../components/common/NextButton";
import { useHistory } from "react-router";
import { PAGES, TableTypes } from "../common/constants";
import { GiCrown } from "react-icons/gi";
import { t } from "i18next";
import { IonPage } from "@ionic/react";
import ORUser from "../models/OneRoster/ORUser";

const LiveQuizRoomResult: React.FC = () => {
  const [topThreeStudents, setTopThreeStudents] = useState<ORUser[]>([]);
  const [students, setStudents] = useState<Map<String, ORUser>>(new Map());
  const [showConfetti, setShowConfetti] = useState(true);
  const history = useHistory();
  const [sortedStudentScores, setSortedStudentScores] = useState<any[]>([]);
  const [isCongratsVisible, setCongratsVisible] = useState(true);
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId") ?? "";
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const tempStudentMap = new Map<String, ORUser>();
      const liveQuizRoomDoc = await api.getLiveQuizRoomDoc(paramLiveRoomId);
      const classId = liveQuizRoomDoc?.class_id;
      if (!!classId) {
        const results = await api.getStudentResultsByAssignmentId(
          liveQuizRoomDoc.assignment_id
        );
        const studentsData = results[0];
        studentsData.user_data.map((student) => {
          tempStudentMap.set(student.id, student);
        });
        setStudents(tempStudentMap);
      }

      const liveQuizRoomResults = liveQuizRoomDoc?.results;
      console.log("liveQuizRoomResults..", liveQuizRoomResults);
      type Participant = {
        studentDocId: string;
        totalScore: number;
        totalTimeSpent: number;
      };
      const studentResults: Participant[] = [];
      if (liveQuizRoomResults) {
        Object.keys(liveQuizRoomResults).forEach((studentDocId) => {
          const studentResult = liveQuizRoomResults[studentDocId];
          const totalScore = studentResult.reduce(
            (acc: number, question) => acc + question.score,
            0
          );
          console.log("totalScore!!", totalScore);

          const totalTimeSpent = studentResult.reduce(
            (acc: number, question) => acc + question.timeSpent,
            0
          );
          console.log("totalTimeSpent!!", totalTimeSpent);
          studentResults.push({
            studentDocId,
            totalScore,
            totalTimeSpent,
          });
        });

        studentResults.sort((a, b) => {
          if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
          } else {
            return a.totalTimeSpent - b.totalTimeSpent;
          }
        });
        console.log("studentresults!!!", studentResults);

        const sortedScores: Participant[] = studentResults;
        setSortedStudentScores(sortedScores);

        const topThreePerformers = sortedScores.slice(0, 3);
        const topThreeStudents = topThreePerformers
          .map((perf) => tempStudentMap.get(perf.studentDocId))
          .filter((student) => !!student) as ORUser[];
        setTopThreeStudents(topThreeStudents);
      }
    } catch (error) {
      console.error("Error fetching LiveQuizRoom data:", error);
    }
    setTimeout(() => {
      setCongratsVisible(false);
      setShowConfetti(false);
    }, 5000);
  }

  const handleNextClick = () => {
    history.replace(
      PAGES.LIVE_QUIZ_LEADERBOARD + "?liveRoomId=" + paramLiveRoomId
    );
  };
  function getOrdinal(number: number): string {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = number % 100;
    return v + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }
  return (
    <IonPage className="result-page">
      <div id="next-button">
        <NextButton disabled={false} onClicked={handleNextClick} />
      </div>

      <div className="live-quiz-room-result-container">
        <div className="top-performers">
          {topThreeStudents.slice(0, 1).map((student, index) => (
            <div key={index} className={`performer-${index + 1}`}>
              {showConfetti && (
                <Confetti
                  recycle={false}
                  numberOfPieces={500}
                  initialVelocityY={{ min: 0, max: 100 }}
                />
              )}

              <div className="student-avatar-container">
                <StudentAvatar
                  key={student.id}
                  student={student}
                  onClicked={() => {}}
                  nameLabel="1st"
                />
                <div className="crown-container">
                  <GiCrown id="crown-icon" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {showConfetti && isCongratsVisible && (
          <p id="congrats-text">
            <i>{t("Congratulations!")}</i>
          </p>
        )}
        <div className="top-performers-horizontal">
          {topThreeStudents.slice(1).map((student, index) => (
            <div key={index + 1} className={`performer-${index + 2}`}>
              <StudentAvatar
                key={student.id}
                student={student}
                onClicked={() => {}}
                nameLabel={getOrdinal(index + 2)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="score-container">
        <div className="all-students">
          {sortedStudentScores?.map((scoreData) => {
            const student = students.get(scoreData.studentDocId);
            return (
              <div key={scoreData.studentDocId} className="student-info">
                {student && (
                  <StudentAvatar
                    key={student.id}
                    student={student}
                    onClicked={() => {}}
                    namePosition="above"
                    width={70}
                  />
                )}
                <div className="student-score">
                  {Math.round(scoreData.totalScore)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </IonPage>
  );
};

export default LiveQuizRoomResult;
