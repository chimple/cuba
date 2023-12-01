import { IonButton, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import { FirebaseApi } from "../services/api/FirebaseApi";
import { Util } from "../utility/util";
import User from "../models/user";
import { useHistory } from "react-router";
import Assignment from "../models/assignment";
import StudentAvatar from "../components/common/StudentAvatar";

const LiveQuizRoom: React.FC = () => {
  const [students, setStudents] = useState(new Map<String, User>());
  const [prevPlayedStudents, setPrevPlayedStudents] = useState<User[]>([]);
  const [notPlayedStudents, setNotPlayedStudents] = useState<User[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment>();
  const api = FirebaseApi.getInstance();
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramAssignmentId = urlSearchParams.get("assignmentId") ?? "";
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const state = (history.location.state as any) ?? {};
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const currentStudent = Util.getCurrentStudent();

    if (!currentStudent) return;
    let assignment: Assignment | undefined;
    if (!!state?.assignment) {
      const tempAssignment = JSON.parse(state.assignment);
      if (
        tempAssignment?.assigner &&
        tempAssignment?.class &&
        tempAssignment?.lesson &&
        tempAssignment?.school &&
        tempAssignment?.course
      ) {
        tempAssignment.assigner = Util.getRef(tempAssignment?.assigner);
        tempAssignment.class = Util.getRef(tempAssignment?.class);
        tempAssignment.lesson = Util.getRef(tempAssignment?.lesson);
        tempAssignment.school = Util.getRef(tempAssignment?.school);
        tempAssignment.course = Util.getRef(tempAssignment?.course);
        assignment = tempAssignment;
      }
    }
    if (!assignment) {
      assignment = await api.getAssignmentById(paramAssignmentId);
    }
    if (!assignment?.lesson?.id) return;
    setCurrentAssignment(assignment);
    downloadQuiz(assignment.lesson.id);
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

    const allStudents = tempStudentMap ?? students;
    let tempPrevPlayedStudents: User[] = prevPlayedStudents;
    let tempNotPlayedStudents: User[] = [];
    // const tempLiveStudents: User[] = [];
    if (tempPrevPlayedStudents.length < 1) {
      if (
        !!assignment &&
        !!assignment.completedStudents &&
        assignment.completedStudents.length > 0
      ) {
        tempPrevPlayedStudents = assignment.completedStudents.map(
          (value) => allStudents.get(value)!
        );
      }
    }
    console.log(
      "🚀 ~ file: LiveQuizRoom.tsx:98 ~ hasPlayedBefore ~ tempPrevPlayedStudents:",
      tempPrevPlayedStudents
    );
    tempNotPlayedStudents = Array.from(allStudents.values()).filter(
      (student) => {
        const hasPlayedBefore = tempPrevPlayedStudents.some(
          (prevStudent) => prevStudent.docId === student.docId
        );
        return !hasPlayedBefore;
      }
    );
    setPrevPlayedStudents(tempPrevPlayedStudents);
    setNotPlayedStudents(tempNotPlayedStudents);
  };

  const downloadQuiz = async (lessonId: string) => {
    const dow = await Util.downloadZipBundle([lessonId]);
    console.log("🚀 ~ file: LiveQuizRoom.tsx:103 ~ downloadQuiz ~ dow:", dow);
    setIsDownloaded(dow);
  };
  const joinQuiz = async (studentId: string, assignmentId: string) => {
    console.log(
      "🚀 ~ file: LiveQuizRoom.tsx:111 ~ joinQuiz ~ assignmentId:",
      assignmentId
    );
    console.log(
      "🚀 ~ file: LiveQuizRoom.tsx:111 ~ joinQuiz ~ studentId:",
      studentId
    );
    setIsJoining(true);
    const res = await api.joinLiveQuiz(studentId, assignmentId);
    console.log("🚀 ~ file: LiveQuizRoom.tsx:108 ~ joinQuiz ~ res:", res);
    setIsJoining(false);
    //push to live quiz
  };

  return (
    <IonPage>
      <h1>Prev Students</h1>
      {prevPlayedStudents.map((student) => (
        <StudentAvatar
          key={student.docId}
          student={student}
          onClicked={() => {}}
        />
      ))}

      <h1>Not Played Students</h1>
      {notPlayedStudents.map((student) => (
        <StudentAvatar
          key={student.docId}
          student={student}
          onClicked={() => {}}
        />
      ))}
      <IonButton
        disabled={!isDownloaded || isJoining}
        onClick={() => {
          if (!!currentAssignment?.docId) {
            joinQuiz(Util.getCurrentStudent()?.docId!, currentAssignment.docId);
          }
        }}
      >
        {isDownloaded
          ? isJoining
            ? "Joining..."
            : "join Now"
          : "Downloading..."}
      </IonButton>
    </IonPage>
  );
};
export default LiveQuizRoom;
