import { IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import { FirebaseApi } from "../services/api/FirebaseApi";
import { Util } from "../utility/util";
import User from "../models/user";
import { useHistory } from "react-router";

const LiveQuizRoom: React.FC = () => {
  const [students, setStudents] = useState(new Map<String, User>());
  // const [liveStudents, setLiveStudents] = useState<User[]>([]);
  const [prevPlayedStudents, setPrevPlayedStudents] = useState<User[]>([]);
  const [notPlayedStudents, setNotPlayedStudents] = useState<User[]>([]);
  const api = FirebaseApi.getInstance();
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramAssignmentId = urlSearchParams.get("assignmentId");
  const state = (history.location.state as any) ?? {};
  const assignmentDocId = state.assignmentId ?? paramAssignmentId;
  // const liveQuizRoomId = state.roomId ?? paramRoomId;
  useEffect(() => {
    // const unSub = api.liveQuizListener(liveQuizRoomId, handleLiveQuizChange);
    init();
    // if (!!unSub) {
    //   return unSub();
    // }
  }, []);
  // const handleLiveQuizChange = async (
  //   // roomDoc: LiveQuizRoomObject,
  //   studentsData?: Map<String, User>
  // ) => {
  //   const allStudents = studentsData ?? students;
  //   let tempPrevPlayedStudents: User[] = prevPlayedStudents;
  //   let tempNotPlayedStudents: User[] = [];
  //   // const tempLiveStudents: User[] = [];
  //   if (tempPrevPlayedStudents.length < 1) {
  //     const assignment = await api.getAssignmentById(assignmentDocId);
  //     if (
  //       !!assignment &&
  //       !!assignment.completedStudents &&
  //       assignment.completedStudents.length > 0
  //     ) {
  //       tempPrevPlayedStudents = assignment.completedStudents.map(
  //         (value) => allStudents[value]
  //       );
  //     }
  //   }
  //   // for (let participant of roomDoc.participants) {
  //   //   if (!!allStudents[participant]) {
  //   //     tempLiveStudents.push(allStudents[participant]);
  //   //   }
  //   // }
  //   tempNotPlayedStudents = Array.from(allStudents.values()).filter(
  //     (student) => {
  //       const hasPlayedBefore = tempPrevPlayedStudents.some(
  //         (prevStudent) => prevStudent.docId === student.docId
  //       );
  //       return !hasPlayedBefore;
  //       // if (hasPlayedBefore) return !hasPlayedBefore;
  //       // const isCurrentlyPlaying = tempLiveStudents.some(
  //       //   (liveStudent) => liveStudent.docId === student.docId
  //       // );
  //       // return !isCurrentlyPlaying;
  //     }
  //   );
  //   setPrevPlayedStudents(tempPrevPlayedStudents);
  //   setNotPlayedStudents(tempNotPlayedStudents);
  //   // setLiveStudents(tempLiveStudents);
  // };
  const init = async () => {
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
    // if (!!liveRoomDoc) {
    // handleLiveQuizChange(tempStudentMap);
    // }

    const allStudents = tempStudentMap ?? students;
    let tempPrevPlayedStudents: User[] = prevPlayedStudents;
    let tempNotPlayedStudents: User[] = [];
    // const tempLiveStudents: User[] = [];
    if (tempPrevPlayedStudents.length < 1) {
      const assignment = await api.getAssignmentById(assignmentDocId);
      if (
        !!assignment &&
        !!assignment.completedStudents &&
        assignment.completedStudents.length > 0
      ) {
        tempPrevPlayedStudents = assignment.completedStudents.map(
          (value) => allStudents[value]
        );
      }
    }
    // for (let participant of roomDoc.participants) {
    //   if (!!allStudents[participant]) {
    //     tempLiveStudents.push(allStudents[participant]);
    //   }
    // }
    tempNotPlayedStudents = Array.from(allStudents.values()).filter(
      (student) => {
        const hasPlayedBefore = tempPrevPlayedStudents.some(
          (prevStudent) => prevStudent.docId === student.docId
        );
        return !hasPlayedBefore;
        // if (hasPlayedBefore) return !hasPlayedBefore;
        // const isCurrentlyPlaying = tempLiveStudents.some(
        //   (liveStudent) => liveStudent.docId === student.docId
        // );
        // return !isCurrentlyPlaying;
      }
    );
    setPrevPlayedStudents(tempPrevPlayedStudents);
    setNotPlayedStudents(tempNotPlayedStudents);
    // setLiveStudents(tempLiveStudents);
  };
  return (
    <IonPage>
      <p>Prev Students</p>
      {prevPlayedStudents.map((student) => (
        <div>{student.name}</div>
      ))}

      <p>Not Played Students</p>
      {notPlayedStudents.map((student) => (
        <div>{student.name}</div>
      ))}
    </IonPage>
  );
};
export default LiveQuizRoom;
