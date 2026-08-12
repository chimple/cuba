import { IonButton, IonPage } from '@ionic/react';
import { useEffect, useState } from 'react';
import { Util } from '../utility/util';
import { useHistory } from 'react-router';
import StudentAvatar from '../components/common/StudentAvatar';
import { PAGES, SOURCE, TableTypes } from '../common/constants';
import { t } from 'i18next';
import BarLoader from 'react-spinners/BarLoader';
import { FaHeart } from 'react-icons/fa';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';
import BackButton from '../components/common/BackButton';
import SkeltonLoading from '../components/SkeltonLoading';
import { ServiceConfig } from '../services/ServiceConfig';
import { getAppSearchParams } from '../utility/routerLocation';
import { parsePath } from 'history';

export const useLiveQuizRoom = () => {
  const [students, setStudents] = useState(
    new Map<String, TableTypes<'user'>>(),
  );
  const [prevPlayedStudents, setPrevPlayedStudents] = useState<
    TableTypes<'user'>[]
  >([]);
  const [notPlayedStudents, setNotPlayedStudents] = useState<
    TableTypes<'user'>[]
  >([]);
  const [currentAssignment, setCurrentAssignment] =
    useState<TableTypes<'assignment'>>();
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const urlSearchParams = getAppSearchParams();
  const paramAssignmentId = urlSearchParams.get('assignmentId') ?? '';
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [lesson, setLesson] = useState<TableTypes<'lesson'> | undefined>();
  const [course, setCourse] = useState<TableTypes<'course'> | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  let lessonId: string | undefined;
  let courseId: string | undefined;
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [assignmentResult, setAssignmentResult] =
    useState<TableTypes<'result'>[]>();

  const state = (history.location.state ?? {}) as {
    assignment?: string;
    source?: SOURCE;
  };
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent();

    if (!currentStudent) return;
    let assignment;
    if (!!state?.assignment) {
      const tempAssignment: TableTypes<'assignment'> = JSON.parse(
        state.assignment,
      );
      if (
        tempAssignment?.created_by &&
        tempAssignment?.class_id &&
        tempAssignment?.lesson_id &&
        tempAssignment?.school_id &&
        tempAssignment?.course_id
      ) {
        assignment = tempAssignment;
      }
    }
    if (!assignment) {
      assignment = await api.getAssignmentById(paramAssignmentId);
    }
    lessonId = assignment?.lesson_id;
    courseId = assignment?.course_id ?? undefined;
    if (!lessonId || !courseId) return;
    const tempLesson = await api.getLesson(lessonId);
    if (!!tempLesson) {
      setLesson(tempLesson);
    }
    const tempCourse = await api.getCourse(courseId);
    if (!!tempCourse) {
      setCourse(tempCourse);
    }
    if (!assignment?.lesson_id) return;
    setCurrentAssignment(assignment);
    if (tempLesson?.cocos_lesson_id) {
      downloadQuiz(tempLesson);
    }
    const linked = await api.isStudentLinked(currentStudent.id, true);
    if (!linked) return;

    const studentResult = await api.getStudentClassesAndSchools(
      currentStudent.id,
    );
    if (
      !studentResult ||
      !studentResult.classes ||
      studentResult.classes.length < 1
    )
      return;
    const classId = studentResult.classes[0];
    if (!classId) return;
    const results =
      await api.getStudentResultsByAssignmentId(paramAssignmentId);
    const studentsData = results[0];
    const tempStudentMap = new Map<String, TableTypes<'user'>>();
    studentsData.user_data.map((student) => {
      tempStudentMap.set(student.id, student);
    });
    setStudents(tempStudentMap);

    const allStudents = tempStudentMap ?? students;
    let tempPrevPlayedStudents: TableTypes<'user'>[] = prevPlayedStudents;
    let tempNotPlayedStudents: TableTypes<'user'>[] = [];
    // const tempLiveStudents: User[] = [];
    if (tempPrevPlayedStudents.length < 1) {
      let resultData: TableTypes<'result'>[] | null = studentsData.result_data;
      let userData: TableTypes<'user'>[] | null = studentsData.user_data;
      if (results) {
        setAssignmentResult(resultData);
        const uniqueUserIds = new Set<string>();
        for (let userResult of resultData) {
          for (let user of userData) {
            if (user.id === userResult.student_id) {
              if (user && !uniqueUserIds.has(user.id)) {
                tempPrevPlayedStudents.push(user);
                uniqueUserIds.add(user.id);
              }
            }
          }
        }
      }
    }
    tempNotPlayedStudents = Array.from(allStudents.values()).filter(
      (student) => {
        const hasPlayedBefore = tempPrevPlayedStudents.some(
          (prevStudent) => prevStudent.id === student.id,
        );
        return !hasPlayedBefore;
      },
    );
    setPrevPlayedStudents(tempPrevPlayedStudents);
    setNotPlayedStudents(tempNotPlayedStudents);
    setIsLoading(false);
  };

  const downloadQuiz = async (lesson: TableTypes<'lesson'>) => {
    const dow = await Util.downloadZipBundle([lesson]);
    setIsDownloaded(dow);
  };
  const joinQuiz = async (studentId: string, assignmentId: string) => {
    setIsJoining(true);
    const res = await api.joinLiveQuiz(assignmentId, studentId);
    if (!res || !online) {
      setIsJoining(false);
      history.replace(PAGES.LIVE_QUIZ_JOIN);
      return;
    } else {
      const gamePath = PAGES.LIVE_QUIZ_GAME + '?liveRoomId=' + res;
      if (state.source) {
        history.replace({
          ...parsePath(gamePath),
          state: { source: state.source },
        });
      } else {
        history.replace(gamePath);
      }
      setIsJoining(false);
      return;
    }
  };
  return {
    BackButton,
    BarLoader,
    FaHeart,
    IonButton,
    IonPage,
    PAGES,
    SkeltonLoading,
    StudentAvatar,
    Util,
    assignmentResult,
    course,
    currentAssignment,
    history,
    isDownloaded,
    isJoining,
    isLoading,
    joinQuiz,
    lesson,
    notPlayedStudents,
    online,
    presentToast,
    prevPlayedStudents,
    t,
  };
};
