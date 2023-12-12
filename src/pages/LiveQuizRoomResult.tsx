import React, { useEffect, useState } from "react";
import "./LiveQuizRoomResult.css"; // Import your CSS styles
import { ServiceConfig } from "../services/ServiceConfig";
import StudentAvatar from "../components/common/StudentAvatar";
import User from "../models/user";
import Confetti from "react-confetti";
import { Util } from "../utility/util";
import NextButton from "../components/common/NextButton";
import { useHistory } from "react-router";
import { PAGES } from "../common/constants";
import { GiCrown } from "react-icons/gi";

const LiveQuizRoomResult: React.FC<{ liveQuizRoomDocId?: string }> = ({
  liveQuizRoomDocId,
}) => {
  const [topThreeStudents, setTopThreeStudents] = useState<User[]>([]);
  const [students, setStudents] = useState(new Map<String, User>());
  const [showConfetti, setShowConfetti] = useState(true);
  const [allStudentScores, setAllStudentScores] = useState<
    { studentDocId: string; totalScore: number }[] | undefined
  >([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const history = useHistory();
  const [sortedStudentScores, setSortedStudentScores] = useState<
    { studentDocId: string; totalScore: number }[] | undefined
  >([]);

  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchData();
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  }, [students]);
  const fetchData = async () => {
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
    console.log("all students", students);

    const res = await api.getResultsOfLiveQuiz("0KtjEooS3ylz4VRhjHzJ");
    const allStudentScoresData = res?.map((result: any) => ({
      studentDocId: result.studentDocId,
      totalScore: result.totalScore,
    }));

    console.log("allStudentScoresData", allStudentScoresData);

    const sortedScores = allStudentScoresData?.sort(
      (a, b) => b.totalScore - a.totalScore
    );
    setSortedStudentScores(sortedScores);
    console.log("sortedScores", sortedScores);
    const topThreePerformers = sortedScores?.slice(0, 3);
    setTopThreeStudents(
      topThreePerformers
        ?.map((perf) => students.get(perf.studentDocId))
        .filter(Boolean) as User[]
    );
    setAllStudentScores(sortedScores);

    console.log("allStudentScores", allStudentScores);

    //filtering participants to display all students with scores
    const participantDocIds = res?.map((result: any) => result.studentDocId);
    const participantStudents = Array.from(students.values()).filter(
      (student) => participantDocIds?.includes(student.docId)
    );
    console.log("participantStudents..", participantStudents);
    setParticipants(participantStudents);
  };
  const handleNextClick = () => {
    history.replace(PAGES.LIVE_QUIZ_LEADERBOARD);
  };
  function getOrdinal(number: number): string {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = number % 100;
    return v + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }
  return (
    <div className="result-page">
      <div className="next-button">
        <NextButton disabled={false} onClicked={handleNextClick} />
      </div>

      <div className="live-quiz-room-result-container">
        <div className="top-performers">
          {topThreeStudents.slice(0, 1).map((student, index) => (
            <div key={index} className={`performer-${index + 1}`}>
              {showConfetti && (
                <Confetti
                  recycle={false}
                  numberOfPieces={1000}
                  initialVelocityY={{ min: 50, max: 100 }}
                />
              )}
              <div className="student-avatar-container">
                <StudentAvatar
                  key={student.docId}
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

        <div className="top-performers-horizontal">
          {topThreeStudents.slice(1).map((student, index) => (
            <div key={index + 1} className={`performer-${index + 2}`}>
              <StudentAvatar
                key={student.docId}
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
                    key={student.docId}
                    student={student}
                    onClicked={() => {}}
                    namePosition="above"
                    width={70}
                  />
                )}
                <div className="student-score">{scoreData.totalScore}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LiveQuizRoomResult;
