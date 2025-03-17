import { FC, useEffect, useState } from "react";
import "./LiveQuizHeader.css";
import { PAGES, TableTypes } from "../../common/constants";
import { useHistory } from "react-router";
import LiveQuizStudentAvatar from "./LiveQuizStudentAvatar";
import {
  LIVE_QUIZ_QUESTION_TIME,
  LiveQuizQuestion,
} from "../../models/liveQuiz";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import ORUser from "../../models/OneRoster/ORUser";

const LiveQuizHeader: FC<{
  roomDoc: TableTypes<"live_quiz_room">;
  remainingTime: number | undefined;
  showAnswer: boolean;
  currentQuestion: LiveQuizQuestion | undefined;
  currentQuestionIndex: number | undefined;
}> = ({
  roomDoc,
  remainingTime,
  showAnswer,
  currentQuestion,
  currentQuestionIndex,
}) => {
  const [studentIdMap, setStudentIdMap] = useState<{
    [id: string]: ORUser;
  }>({});
  const [sortedStudents, setSortedStudents] = useState<
    {
      student: ORUser;
      score?: number;
      rank?: number;
    }[]
  >([]);

  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const student = Util.getCurrentStudent();
  useEffect(() => {
    if (!roomDoc) {
      return;
    }
    if (!student) {
      history.replace(PAGES.HOME);
      return;
    }
    getStudents();
  }, [roomDoc, student]);

  useEffect(() => {
    sortedStudentsWithScore();
  }, [roomDoc, showAnswer, studentIdMap]);

  const getStudents = async () => {
    if (roomDoc && roomDoc.participants && roomDoc.participants.length > 0) {
      const tempStudentsMap: { [id: string]: ORUser } = {};
      const studentsData = await api.getStudentResultsByAssignmentId(
        roomDoc.assignment_id
      );

      if (studentsData) {
        let userData: ORUser[] = studentsData[0].user_data;
        if (userData) {
          userData.forEach((user) => {
            if (roomDoc.participants) {
              if (roomDoc.participants.includes(user.id)) {
                tempStudentsMap[user.id] = user;
              }
            }
          });
          setStudentIdMap(tempStudentsMap);
        }
      }
    }
  };

  const sortedStudentsWithScore = () => {
    const tempSortedStudents: {
      student: ORUser;
      score?: number;
      lastQuestionId?: string;
    }[] = [];

    roomDoc.participants?.forEach((studentId: string) => {
      if (studentIdMap[studentId]) {
        const studentResult: any[] = roomDoc.results?.[studentId];
        if (studentResult && studentResult.length > 0) {
          const totalScore = studentResult.reduce(
            (acc: number, question) => acc + question.score,
            0
          );
          tempSortedStudents.push({
            student: studentIdMap[studentId],
            score: showAnswer
              ? Number(totalScore.toFixed(1))
              : (sortedStudents.find(
                  (student) => student.student.id === studentId
                )?.score ?? 0),
            lastQuestionId:
              studentResult[studentResult.length - 1]?.question_id,
          });
        } else {
          tempSortedStudents.push({
            student: studentIdMap[studentId],
          });
        }
      }
    });

    tempSortedStudents.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const rankedStudents = tempSortedStudents.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));

    if (student) {
      const currentStudentIndex = rankedStudents.findIndex(
        (stud) => stud.student.id === student.id
      );
      if (currentStudentIndex !== -1) {
        const [currentStudent] = rankedStudents.splice(currentStudentIndex, 1);
        rankedStudents.unshift(currentStudent);
      }
    }

    setSortedStudents(rankedStudents);
  };

  return (
    <div>
      <div className="live-quiz-header">
        {sortedStudents &&
          sortedStudents.map((studentMap) => {
            const studentResult = roomDoc.results
              ? roomDoc.results[studentMap.student.id]
              : undefined;
            const lastAnswer = studentResult?.[studentResult.length - 1];
            const currentQuestionResult = currentQuestion
              ? studentResult?.find(
                  (result) => result.question_id === currentQuestion.id
                )
              : null;
            return (
              <div
                key={studentMap.student.id}
                className="student-avatar-container"
              >
                {currentQuestionIndex && currentQuestionIndex > 0 ? (
                  <div
                    className={`top-performer-circle color-${studentMap.rank}`}
                  >
                    {studentMap.rank}
                  </div>
                ) : null}
                <LiveQuizStudentAvatar
                  student={studentMap.student}
                  score={studentMap.score}
                  key={studentMap.student.id}
                  isCorrect={
                    !showAnswer
                      ? undefined
                      : currentQuestionResult != null &&
                        currentQuestionResult.score > 0
                  }
                  percentage={
                    !currentQuestion ||
                    currentQuestion.id === lastAnswer?.question_id ||
                    !remainingTime
                      ? undefined
                      : ((LIVE_QUIZ_QUESTION_TIME - remainingTime) /
                          LIVE_QUIZ_QUESTION_TIME) *
                        100
                  }
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default LiveQuizHeader;
