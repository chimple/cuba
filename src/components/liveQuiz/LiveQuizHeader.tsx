import { FC, useEffect, useState } from "react";
import "./LiveQuizHeader.css";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import User from "../../models/user";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";

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
  const getStudents = async () => {
    const students = await api.getStudentsForClass(roomDoc.class.id);
    const tempStudentsMap = {};
    students.forEach((student) => {
      tempStudentsMap[student.docId] = student;
    });
    setStudentIdMap(tempStudentsMap);
    console.log(
      "🚀 ~ file: LiveQuizHeader.tsx:37 ~ getStudents ~ tempStudentsMap:",
      tempStudentsMap
    );
  };

  return <div></div>;
};

export default LiveQuizHeader;
