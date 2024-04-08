import { FC, useEffect, useState } from "react";
import "./LiveQuizHeader.css";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import User from "../../models/user";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import LiveQuizStudentAvatar from "./LiveQuizStudentAvatar";
import {
  LIVE_QUIZ_QUESTION_TIME,
  LiveQuizQuestion,
} from "../../models/liveQuiz";

const LiveQuizHeader: FC<{
  roomDoc: LiveQuizRoomObject;
  remainingTime: number | undefined;
  showAnswer: boolean;
  currentQuestion: LiveQuizQuestion | undefined;
}> = ({ roomDoc, remainingTime, showAnswer, currentQuestion }) => {
  const [studentIdMap, setStudentIdMap] = useState<{ [id: string]: User }>();
  const [sortedStudents, setSortedStudents] = useState<
    {
      student: User;
      score: number;
      isTopPerformer: boolean;
    }[]
  >();

  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  const student = Util.getCurrentStudent();
  useEffect(() => {
    if (!roomDoc) return;
    if (!student) {
      history.replace(PAGES.HOME);
      return;
    }
    getStudents();
  }, []);
  useEffect(() => {
    if (studentIdMap) {
      sortedStudentsWithScore(studentIdMap);
    }
  }, [roomDoc, showAnswer]);
  const getStudents = async () => {
    const students = await api.getStudentsForClass(roomDoc.class.id);
    const tempStudentsMap = {};
    students.forEach((student) => {
      tempStudentsMap[student.docId] = student;
    });
    setStudentIdMap(tempStudentsMap);
    sortedStudentsWithScore(tempStudentsMap);
  };

  const sortedStudentsWithScore = (studentIdMap: { [id: string]: User }) => {
    const tempSortedStudents: {
      student: User;
      score: number;
      lastQuestionId: string;
      isTopPerformer: boolean;
    }[] = [];
    roomDoc.participants.forEach((studentId: string) => {
      const studentResult = roomDoc.results?.[studentId];
      const totalScore =
        studentResult?.reduce(
          (acc: number, question) => acc + question.score,
          0
        ) ?? 0;
      tempSortedStudents.push({
        student: studentIdMap[studentId],
        score: showAnswer
          ? Number(totalScore.toFixed(1))
          : sortedStudents?.find(
              (student) => student.student.docId === studentId
            )?.score ?? 0,
        lastQuestionId: studentResult?.[studentResult.length - 1]?.id,
        isTopPerformer: false,
      });
    });
    tempSortedStudents.sort((a, b) => {
      if (a.student.docId === student?.docId) {
        return -1;
      } else if (b.student.docId === student?.docId) {
        return 1;
      } else {
        return b.score - a.score;
      }
    });
    tempSortedStudents.sort((a, b) => b.score - a.score);
    tempSortedStudents.slice(0, 3).forEach((student) => {
      student.isTopPerformer = true;
    });
    setSortedStudents(tempSortedStudents);
  };

  return (
    <div>
      <div className="live-quiz-header">
        {sortedStudents &&
          sortedStudents.map((studentMap, index) => {
            const studentResult = roomDoc.results?.[studentMap.student.docId];
            const lastAnswer = studentResult?.[studentResult.length - 1];
            const currentQuestionResult = currentQuestion
              ? studentResult?.find(
                  (result) => result.id === currentQuestion.id
                )
              : null;
            return (
              <div
                key={studentMap.student.docId}
                className="student-avatar-container"
              >
                {studentMap.isTopPerformer && (
                  <div className={`top-performer-circle color-${index + 1}`}>
                    {index + 1}
                  </div>
                )}
                <LiveQuizStudentAvatar
                  student={studentMap.student}
                  score={studentMap.score}
                  key={studentMap.student.docId}
                  isCorrect={
                    !showAnswer
                      ? undefined
                      : currentQuestionResult != null &&
                        currentQuestionResult.score > 0
                  }
                  percentage={
                    !currentQuestion ||
                    currentQuestion.id === lastAnswer?.id ||
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
