import { FC, useEffect, useState } from "react";
import "./LiveQuizHeader.css";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import User from "../../models/user";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import LiveQuizStudentAvatar from "./LiveQuizStudentAvatar";

const LiveQuizHeader: FC<{
  roomDoc: LiveQuizRoomObject;
}> = ({ roomDoc }) => {
  const [studentIdMap, setStudentIdMap] = useState<{ [id: string]: User }>();
  const [sortedStudents, setSortedStudents] =
    useState<{ student: User; score: number }[]>();

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
  }, [roomDoc]);
  const getStudents = async () => {
    const students = await api.getStudentsForClass(roomDoc.class.id);
    const tempStudentsMap = {};
    students.forEach((student) => {
      tempStudentsMap[student.docId] = student;
    });
    setStudentIdMap(tempStudentsMap);
    sortedStudentsWithScore(tempStudentsMap);
    console.log(
      "🚀 ~ file: LiveQuizHeader.tsx:37 ~ getStudents ~ tempStudentsMap:",
      tempStudentsMap
    );
  };

  const sortedStudentsWithScore = (studentIdMap: { [id: string]: User }) => {
    const tempSortedStudents: { student: User; score: number }[] = [];
    roomDoc.participants.forEach((studentId: string) => {
      const studentResult = roomDoc.results?.[studentId];
      const totalScore =
        studentResult?.reduce(
          (acc: number, question) => acc + question.score,
          0
        ) ?? 0;
      tempSortedStudents.push({
        student: studentIdMap[studentId],
        score: Number(totalScore.toFixed(1)),
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
    setSortedStudents(tempSortedStudents);
  };

  return (
    <div>
      <div className="live-quiz-header">
        {sortedStudents &&
          sortedStudents.map((studentMap) => (
            <LiveQuizStudentAvatar
              student={studentMap.student}
              score={studentMap.score}
              key={studentMap.student.docId}
            />
          ))}
      </div>
    </div>
  );
};

export default LiveQuizHeader;
