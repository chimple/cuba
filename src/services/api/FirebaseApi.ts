import {
  DocumentReference,
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  doc,
  updateDoc,
  getFirestore,
  getDocs,
  getDoc,
  query,
  where,
  DocumentData,
  limit,
  orderBy,
} from "firebase/firestore";
import {
  LeaderboardInfo,
  ServiceApi,
  StudentLeaderboardInfo,
} from "./ServiceApi";
import { DEFAULT_COURSE_IDS } from "../../common/constants";
import { RoleType } from "../../interface/modelInterfaces";
import User from "../../models/user";
import { ServiceConfig } from "../ServiceConfig";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import {
  ASSIGNMENT_COMPLETED_IDS,
  Chapter,
  CollectionIds,
  StudentLessonResult,
} from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import Result from "../../models/result";
import Subject from "../../models/subject";
import { getFunctions, httpsCallable } from "firebase/functions";
import StudentProfile from "../../models/studentProfile";
import Class from "../../models/class";
import School from "../../models/school";
import Assignment from "../../models/assignment";

export class FirebaseApi implements ServiceApi {
  public static i: FirebaseApi;
  private _db = getFirestore();
  private _currentStudent: User | undefined;
  private _subjectsCache: { [key: string]: Subject } = {};
  private _classCache: { [key: string]: Class } = {};
  private _schoolCache: { [key: string]: School } = {};
  private _studentResultCache: { [key: string]: StudentProfile } = {};

  private constructor() {}

  public static getInstance(): FirebaseApi {
    if (!FirebaseApi.i) {
      FirebaseApi.i = new FirebaseApi();
    }
    return FirebaseApi.i;
  }

  public async createProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined
  ): Promise<User> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";
    let courseIds: DocumentReference[] = [];
    const courses = await this.getAllCourses();
    if (!!courses && courses.length > 0) {
      courses.forEach((course) => {
        courseIds.push(doc(this._db, CollectionIds.COURSE, course.docId));
      });
    } else {
      courseIds = DEFAULT_COURSE_IDS.map((id) =>
        doc(this._db, `${CollectionIds.COURSE}/${id}`)
      );
    }

    // if (!!languageDocId && !!LANGUAGE_COURSE_MAP[languageDocId]) {
    //   courseIds.splice(
    //     1,
    //     0,
    //     doc(
    //       this._db,
    //       `${CollectionIds.COURSE}/${LANGUAGE_COURSE_MAP[languageDocId]}`
    //     )
    //   );
    // }
    const boardRef = doc(this._db, `${CollectionIds.CURRICULUM}/${boardDocId}`);
    const gradeRef = doc(this._db, `${CollectionIds.GRADE}/${gradeDocId}`);
    const languageRef = doc(
      this._db,
      `${CollectionIds.LANGUAGE}/${languageDocId}`
    );
    const student = new User(
      _currentUser?.username,
      [],
      name,
      RoleType.STUDENT,
      _currentUser.uid,
      courseIds,
      age,
      image,
      gender,
      boardRef,
      gradeRef,
      languageRef,
      avatar,
      Timestamp.now(),
      Timestamp.now(),
      null!
    );
    const studentDoc = await addDoc(
      collection(this._db, CollectionIds.USER),
      student.toJson()
    );
    student.docId = studentDoc.id;
    await updateDoc(
      doc(this._db, `${CollectionIds.USER}/${_currentUser.docId}`),
      {
        users: arrayUnion(studentDoc),
        dateLastModified: Timestamp.now(),
      }
    );
    if (!_currentUser.users) _currentUser.users = [];
    _currentUser.users.push(studentDoc);
    return student;
  }

  public async deleteProfile(studentId: string) {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    const studentDoc = await doc(
      this._db,
      `${CollectionIds.USER}/${studentId}`
    );
    let userList = _currentUser.users;
    console.log("before userList ", _currentUser, userList);
    // userList.findIndex(studentDoc);
    for (let i = 0; i < userList.length; i++) {
      const element = userList[i];
      console.log("element", element.id, studentDoc.id);
      if (element.id === studentDoc.id) {
        userList.splice(i, 1);
        console.log("enter if", userList);
      }
    }

    console.log("userList ", studentDoc.id, userList);

    const functions = getFunctions();
    const generateInviteCode = httpsCallable(
      functions,
      "DeleteStudentByParent"
    );
    const result = await generateInviteCode({
      studentId: studentId,
    });
    // const studentDocRef = await doc(
    //   this._db,
    //   `${CollectionIds.USER}/${studentDoc.id}`
    // );

    // await deleteDoc(studentDoc);
    // await updateDoc(
    //   doc(this._db, `${CollectionIds.USER}/${_currentUser?.docId}`),
    //   {
    //     // users: userList,
    //     users: arrayRemove(studentDoc),
    //     dateLastModified: Timestamp.now(),
    //   }
    // );
    _currentUser.users = userList;
    ServiceConfig.getI().authHandler.currentUser = _currentUser;
  }

  public async getAllCurriculums(): Promise<Curriculum[]> {
    const querySnapshot = await getDocs(
      collection(this._db, CollectionIds.CURRICULUM)
    );
    const curriculums: Curriculum[] = [];
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
      const curriculum = doc.data() as Curriculum;
      curriculum.docId = doc.id;
      curriculums.push(curriculum);
    });
    return curriculums;
  }

  public async getAllGrades(): Promise<Grade[]> {
    const querySnapshot = await getDocs(
      collection(this._db, CollectionIds.GRADE)
    );
    const grades: Grade[] = [];
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
      const grade = doc.data() as Grade;
      grade.docId = doc.id;
      grades.push(grade);
    });
    return grades;
  }

  public async getAllLanguages(): Promise<Language[]> {
    const querySnapshot = await getDocs(
      collection(this._db, CollectionIds.LANGUAGE)
    );
    const languages: Language[] = [];
    querySnapshot.forEach((doc) => {
      // console.log(`${doc.id} => ${doc.data()}`);
      const language = doc.data() as Language;
      language.docId = doc.id;
      languages.push(language);
    });
    return languages;
  }

  public async getParentStudentProfiles(): Promise<User[]> {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw "User is not Logged in";
    if (!currentUser.users || currentUser.users.length < 1) return [];
    const tempUsers = await Promise.all(
      currentUser.users.map(async (user) => {
        const userDoc = await getDoc(user);
        if (userDoc.exists()) {
          const newUser = userDoc.data() as User;
          if (newUser) newUser.docId = userDoc.id;
          return newUser;
        }
      })
    );
    const users: User[] = [];
    tempUsers.forEach((user) => {
      if (!!user) {
        users.push(user);
      }
    });
    return users;
  }

  public updateSoundFlag = async (user: User, value: boolean) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        soundFlag: value,
        dateLastModified: Timestamp.now(),
      });
      user.soundFlag = value;
      ServiceConfig.getI().authHandler.currentUser = user;
    }
  };

  public updateMusicFlag = async (user: User, value: boolean) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        musicFlag: value,
        dateLastModified: Timestamp.now(),
      });
      currentUser.musicFlag = value;
      ServiceConfig.getI().authHandler.currentUser = currentUser;
    }
  };

  public updateLanguage = async (user: User, value: string) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      currentUser.language = doc(this._db, `Language/${value}`);
      ServiceConfig.getI().authHandler.currentUser = currentUser;
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        language: currentUser.language,
        dateLastModified: Timestamp.now(),
      });
    }
  };

  async getLanguageWithId(id: string): Promise<Language | undefined> {
    const result = await getDoc(
      doc(this._db, `${CollectionIds.LANGUAGE}/${id}`)
    );
    if (!result.data()) return;
    return result.data() as Language;
  }

  async getCoursesForParentsStudent(student: User): Promise<Course[]> {
    const subjects: Course[] = [];
    if (!student?.courses || student.courses.length < 1) return subjects;
    const courseDocs = await Promise.all(
      student.courses.map((course) => getDoc(course))
    );
    courseDocs.forEach((courseDoc) => {
      if (courseDoc && courseDoc.data()) {
        const course = courseDoc.data() as Course;
        course.docId = courseDoc.id;
        subjects.push(course);
      }
    });
    return subjects;
  }

  async getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    const studentLessons = await getDoc(
      doc(this._db, `${CollectionIds.STUDENTPROFILE}/${studentId}`)
    );
    const lessonsData: DocumentData = studentLessons.data()!;
    if (lessonsData == undefined || lessonsData.lessons == undefined) return;
    console.log("lessonsData.lessons ", lessonsData.lessons);
    const lessonsMap: Map<string, StudentLessonResult> = new Map(
      Object.entries(lessonsData.lessons)
    );

    return lessonsMap;
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const lessonDoc = await getDoc(
      doc(this._db, `${CollectionIds.LESSON}/${id}`)
    );
    if (!lessonDoc.exists) return;
    const lesson = lessonDoc.data() as Lesson;
    lesson.docId = lessonDoc.id;
    return lesson;
  }

  async getLessonsForChapter(chapter: Chapter): Promise<Lesson[]> {
    const lessons: Lesson[] = [];
    if (chapter.lessons && chapter.lessons.length > 0) {
      for (let lesson of chapter.lessons) {
        if (lesson instanceof DocumentReference) {
          const lessonObj = await this.getLesson(lesson.id);
          if (lessonObj) {
            lessons.push(lessonObj);
          }
        } else {
          lessons.push(lesson);
        }
      }
    }
    return lessons;
  }

  async getAllLessonsForCourse(course: Course): Promise<{
    [key: string]: {
      [key: string]: Lesson;
    };
  }> {
    let lessons: {
      [key: string]: {
        [key: string]: Lesson;
      };
    } = JSON.parse(localStorage.getItem("CourseLessons")!);
    console.log("lessons ", lessons);
    if (!lessons) {
      lessons = {};
    }
    if (lessons != undefined && lessons[course.courseCode]) {
      return lessons;
    }
    let lesMap: {
      [key: string]: Lesson;
    } = {};
    for (let i = 0; i < course.chapters.length; i++) {
      const chapter = course.chapters[i];
      if (chapter.lessons && chapter.lessons.length > 0) {
        for (let lesson of chapter.lessons) {
          if (lesson instanceof DocumentReference) {
            const lessonObj = await this.getLesson(lesson.id);
            if (lessonObj) {
              lesMap[lesson.id] = lessonObj as Lesson;
            }
          } else {
            lesMap[lesson.id] = lesson as Lesson;
          }
        }
      }
    }
    console.log("lesMap", lesMap);
    lessons[course.courseCode] = lesMap;
    console.log("after lessons", lessons, JSON.stringify(lessons));

    localStorage.setItem("CourseLessons", JSON.stringify(lessons));
    return lessons;
  }

  async getLessonFromCourse(
    course: Course,
    lessonId: string
  ): Promise<Lesson | undefined> {
    let lessons: {
      [key: string]: {
        [key: string]: Lesson;
      };
    } = JSON.parse(localStorage.getItem("CourseLessons")!);
    if (!lessons) {
      lessons = {};
    }
    // console.log("lessons ", lessons);
    if (
      lessons != undefined &&
      lessons[course.courseCode] != undefined &&
      lessons[course.courseCode][lessonId]
    ) {
      // console.log("lesson is already exist");
      return lessons[course.courseCode][lessonId];
    }
    let lesMap: {
      [key: string]: Lesson;
    } = {};
    for (let i = 0; i < course.chapters.length; i++) {
      const chapter = course.chapters[i];
      if (chapter.lessons && chapter.lessons.length > 0) {
        for (let lesson of chapter.lessons) {
          if (lesson.id === lessonId) {
            // console.log("lesson id Found", lesson);
            if (lesson instanceof DocumentReference) {
              const lessonObj = await this.getLesson(lesson.id);
              if (lessonObj) {
                lesMap[lesson.id] = lessonObj as Lesson;
              }
            } else {
              lesMap[lesson.id] = lesson as Lesson;
            }
            // console.log("lesMap", lesMap);
            lessons[course.courseCode] = lesMap;
            // console.log("after CourseLessons", lessons);

            // localStorage.setItem("CourseLessons", JSON.stringify(lessons));
            return lessons[course.courseCode][lessonId];
          }
        }
      }
    }
  }

  async getDifferentGradesForCourse(
    course: Course
  ): Promise<{ grades: Grade[]; courses: Course[] }> {
    const q = query(
      collection(this._db, CollectionIds.COURSE),
      where("subject", "==", course.subject),
      where("curriculum", "==", course.curriculum)
    );
    const queryResult = await getDocs(q);
    const gradeMap: {
      grades: Grade[];
      courses: Course[];
    } = { grades: [], courses: [] };
    await Promise.all(
      queryResult.docs.map(
        async (
          courseDoc
        ): Promise<{ grade: Grade; course: Course } | undefined> => {
          const course = courseDoc.data() as Course;
          course.docId = courseDoc.id;
          const gradeDoc = await getDoc(course.grade);
          const grade = gradeDoc.data() as Grade;
          const gradeAlreadyExists = gradeMap.grades.find(
            (_grade) => _grade.docId === gradeDoc.id
          );
          if (!!gradeAlreadyExists) return;
          grade.docId = gradeDoc.id;
          gradeMap.courses.push(course);
          gradeMap.grades.push(grade);
          return { grade: grade, course: course };
        }
      )
    );
    return gradeMap;
  }

  async updateResult(
    student: User,
    courseId: string | undefined,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    assignmentId: string | undefined,
    classId: string | undefined,
    schoolId: string | undefined
  ): Promise<Result> {
    const courseRef = courseId
      ? doc(this._db, CollectionIds.COURSE, courseId)
      : undefined;
    const assignmentRef = assignmentId
      ? doc(this._db, CollectionIds.ASSIGNMENT, assignmentId)
      : undefined;
    const classRef = classId
      ? doc(this._db, CollectionIds.CLASS, classId)
      : undefined;
    const schoolRef = schoolId
      ? doc(this._db, CollectionIds.SCHOOL, schoolId)
      : undefined;
    const lessonRef = doc(this._db, CollectionIds.LESSON, lessonId);
    const studentRef = doc(this._db, CollectionIds.USER, student.docId);
    const result = new Result(
      undefined,
      Timestamp.now(),
      Timestamp.now(),
      assignmentRef,
      classRef,
      courseRef,
      lessonRef,
      schoolRef,
      score,
      correctMoves,
      wrongMoves,
      timeSpent,
      studentRef,
      null!
    );
    const resultDoc = await addDoc(
      collection(this._db, CollectionIds.RESULT),
      result.toJson()
    );
    console.log(
      "🚀 ~ file: FirebaseApi.ts:330 ~ FirebaseApi ~ resultDoc:",
      resultDoc
    );
    result.docId = resultDoc.id;
    let playedResult: StudentLessonResult = {
      date: result.dateLastModified,
      course: result.course!,
      score: result.score,
      timeSpent: result.timeSpent,
    };
    console.log("playedResult", result.lesson.id, JSON.stringify(playedResult));

    this._studentResultCache[student.docId].lessons[result.lesson.id] =
      playedResult;
    console.log(
      "this._studentResultCache[student.docId] ",
      JSON.stringify(this._studentResultCache[student.docId])
    );

    return result;
  }

  async updateStudent(
    student: User,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string
  ): Promise<User> {
    const boardRef = doc(this._db, `${CollectionIds.CURRICULUM}/${boardDocId}`);
    const gradeRef = doc(this._db, `${CollectionIds.GRADE}/${gradeDocId}`);
    const languageRef = doc(
      this._db,
      `${CollectionIds.LANGUAGE}/${languageDocId}`
    );
    const now = Timestamp.now();
    await updateDoc(doc(this._db, `${CollectionIds.USER}/${student.docId}`), {
      age: age,
      avatar: avatar,
      board: boardRef,
      dateLastModified: now,
      gender: gender,
      grade: gradeRef,
      image: image ?? null,
      language: languageRef,
      name: name,
    });
    student.age = age;
    student.avatar = avatar;
    student.board = boardRef;
    student.dateLastModified = now;
    student.gender = gender;
    student.grade = gradeRef;
    student.image = image;
    student.language = languageRef;
    student.name = name;
    return student;
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    if (!!this._subjectsCache[id]) return this._subjectsCache[id];
    const subjectDoc = await getDoc(doc(this._db, CollectionIds.SUBJECT, id));
    if (!subjectDoc.exists) return;
    const subject = subjectDoc.data() as Subject;
    if (!subject) return;
    subject.docId = id;
    this._subjectsCache[id] = subject;
    return subject;
  }

  async getDataByInviteCode(inviteCode: number): Promise<any> {
    const functions = getFunctions();
    const generateInviteCode = httpsCallable(functions, "GetDataByInviteCode");
    const result = await generateInviteCode({
      inviteCode: inviteCode,
    });
    return result.data;
  }

  async linkStudent(inviteCode: number): Promise<any> {
    const functions = getFunctions();
    const generateInviteCode = httpsCallable(functions, "LinkStudent");
    const result = await generateInviteCode({
      inviteCode: inviteCode,
      studentId: this._currentStudent?.docId,
    });
    return result.data;
  }

  async getStudentResult(
    studentId: string,
    fromCache: boolean = false
  ): Promise<StudentProfile | undefined> {
    if (!!this._studentResultCache[studentId] && fromCache)
      return this._studentResultCache[studentId];
    const studentProfileDoc = await getDoc(
      doc(this._db, CollectionIds.STUDENTPROFILE, studentId)
    );
    console.log("studentProfileDoc", studentProfileDoc);

    if (!studentProfileDoc.exists) return;
    const studentProfile = studentProfileDoc.data() as StudentProfile;
    console.log("studentProfile", studentProfile);
    if (studentProfile === undefined) return;
    studentProfile.docId = studentId;
    this._studentResultCache[studentId] = studentProfile;
    return studentProfile;
  }

  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: StudentLessonResult } | undefined> {
    const lessonsData = await this.getStudentResult(studentId);
    console.log(
      "getStudentResultInMap lessonsData ",
      JSON.stringify(lessonsData)
    );
    if (!lessonsData) return;
    return lessonsData.lessons;
  }

  async getClassById(id: string): Promise<Class | undefined> {
    if (!!this._classCache[id]) return this._classCache[id];
    const classDoc = await getDoc(doc(this._db, CollectionIds.CLASS, id));
    if (!classDoc.exists) return;
    const classData = classDoc.data() as Class;
    classData.docId = id;
    this._classCache[id] = classData;
    return classData;
  }

  async getSchoolById(id: string): Promise<School | undefined> {
    if (!!this._schoolCache[id]) return this._schoolCache[id];
    const schoolDoc = await getDoc(doc(this._db, CollectionIds.SCHOOL, id));
    if (!schoolDoc.exists) return;
    const schoolData = schoolDoc.data() as School;
    schoolData.docId = id;
    this._schoolCache[id] = schoolData;
    return schoolData;
  }

  async isStudentLinked(
    studentId: string,
    fromCache: boolean = false
  ): Promise<boolean> {
    try {
      const result = await this.getStudentResult(studentId, fromCache);
      if (!result) return false;
      return !!result.classes && result.classes.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<Assignment[]> {
    const classDocRef = doc(this._db, CollectionIds.CLASS, classId);
    const q = query(
      collection(this._db, CollectionIds.ASSIGNMENT),
      where("class", "==", classDocRef),
      // where("results." + studentId + ".score", "!=", 1)
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const queryResult = await getDocs(q);
    const assignments: Assignment[] = [];
    queryResult.docs.forEach((_assignment) => {
      const assignment = _assignment.data() as Assignment;
      assignment.docId = _assignment.id;
      const doneAssignment = assignment.completedStudents?.find(
        (data) => data === studentId
      );
      let tempAssignmentCompletedIds = localStorage.getItem(
        ASSIGNMENT_COMPLETED_IDS
      );
      let assignmentCompletedIds = JSON.parse(
        tempAssignmentCompletedIds ?? "{}"
      );
      console.log(
        "🚀 ~ file: FirebaseApi.ts:546 ~ FirebaseApi ~ queryResult.docs.forEach ~ assignmentCompletedIds:",
        assignmentCompletedIds
      );

      const doneAssignmentLocally = assignmentCompletedIds[studentId]?.find(
        (assignmentId) => assignmentId === assignment.docId
      );
      console.log(
        "🚀 ~ file: FirebaseApi.ts:554 ~ FirebaseApi ~ queryResult.docs.forEach ~ doneAssignmentLocally:",
        doneAssignmentLocally
      );

      if (!doneAssignment && !doneAssignmentLocally)
        assignments.push(assignment);
    });
    console.log(
      "🚀 ~ file: FirebaseApi.ts:533 ~ FirebaseApi ~ assignments:",
      assignments
    );
    return assignments;
  }

  public async getLeaderboardResults(
    sectionId: string,
    isWeeklyData: boolean
  ): Promise<LeaderboardInfo | undefined> {
    console.log(
      "async getLeaderboard called",
      isWeeklyData ? "weeklyScore" : "allTimeScore"
    );

    const leaderBoardList: LeaderboardInfo = {
      weekly: [],
      allTime: [],
    };

    if (sectionId === undefined || sectionId?.length <= 0) {
      const q = query(
        collection(
          this._db,
          CollectionIds.LEADERBOARD + "/b2c/genericLeaderboard/"
        ),
        orderBy(isWeeklyData ? "weeklyScore" : "allTimeScore", "desc"),
        limit(50)
      );

      const queryResult = await getDocs(q);

      for (const d of queryResult.docs) {
        const res = d.data();
        console.log("isWeeklyData", isWeeklyData);
        if (isWeeklyData) {
          leaderBoardList.weekly.push({
            name: d.get("name"),
            score: d.get("weeklyScore"),
            timeSpent: d.get("weeklyTimeSpent"),
            lessonsPlayed: d.get("weeklyLessonPlayed"),
            userId: d.id,
          });
        } else {
          leaderBoardList.allTime.push({
            name: d.get("name"),
            score: d.get("allTimeScore"),
            timeSpent: d.get("allTimeTimeSpent"),
            lessonsPlayed: d.get("allTimeLessonPlayed"),
            userId: d.id,
          });
        }
      }
    } else {
      const queryResult = await getDoc(
        doc(this._db, `${CollectionIds.LEADERBOARD}/${sectionId}`)
      );
      if (!queryResult.data()) return;
      const data = queryResult.data();
      if (!data) return;
      const weekly: StudentLeaderboardInfo[] = [];
      const allTime: StudentLeaderboardInfo[] = [];
      console.log("school mode Data ", data, data.d, Object.keys(data));
      for (const i of Object.keys(data.d)) {
        console.log("Object.keys(data) ", i, data.d[i]);
        weekly.push({
          name: data.d[i].n,
          score: data.d[i].w.s,
          timeSpent: data.d[i].w.t,
          lessonsPlayed: data.d[i].w.l,
          userId: i,
        });
        allTime.push({
          name: data.d[i].n,
          score: data.d[i].a.s,
          timeSpent: data.d[i].a.t,
          lessonsPlayed: data.d[i].a.l,
          userId: i,
        });
      }
      console.log("weekly", weekly, "allTime", allTime);

      const sortLeaderboard = (arr: Array<any>) =>
        arr.sort((a, b) => b.score - a.score);
      sortLeaderboard(weekly);
      sortLeaderboard(allTime);
      let result: LeaderboardInfo = {
        weekly: [],
        allTime: [],
      };
      result = {
        weekly: weekly,
        allTime: allTime,
      };
      console.log("result", result);

      return result;
    }

    console.log("result in FirebaseAPI", leaderBoardList);

    return leaderBoardList;
  }

  public async getAllCourses(): Promise<Course[]> {
    const querySnapshot = await getDocs(
      collection(this._db, CollectionIds.COURSE)
    );
    const courses: Course[] = [];
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      const course = doc.data() as Course;
      course.docId = doc.id;
      courses.push(course);
    });
    return courses;
  }

  public async deleteAllUserData(): Promise<void> {
    const functions = getFunctions();
    const deleteAllUserDataFunction = httpsCallable(
      functions,
      "DeleteAllUserData"
    );
    await deleteAllUserDataFunction();
  }
}
