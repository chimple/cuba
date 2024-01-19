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
  getDocFromCache,
  DocumentSnapshot,
  getDocsFromCache,
  QuerySnapshot,
  Query,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import {
  LeaderboardInfo,
  ServiceApi,
  StudentLeaderboardInfo,
} from "./ServiceApi";
import {
  COURSES,
  DEFAULT_COURSE_IDS,
  LIVE_QUIZ,
  LeaderboardDropdownList,
  MODES,
  aboveGrade3,
  belowGrade1,
  grade1,
  grade2,
  grade3,
} from "../../common/constants";
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
import { AvatarObj } from "../../components/animation/Avatar";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import Badge from "../../models/Badge";
import Rewards from "../../models/Rewards";

export class FirebaseApi implements ServiceApi {
  public static i: FirebaseApi;
  private _db = getFirestore();
  private _currentStudent: User | undefined;
  private _currentClass: Class | undefined;
  private _currentSchool: School | undefined;
  private _subjectsCache: { [key: string]: Subject } = {};
  private _CourseCache: { [key: string]: Course } = {};
  private _classCache: { [key: string]: Class } = {};
  private _schoolCache: { [key: string]: School } = {};
  private _studentResultCache: { [key: string]: StudentProfile } = {};
  private _schoolsCache: { [userId: string]: School[] } = {};
  private _currentMode: MODES;
  private _allCourses: Course[];
  private constructor() {}

  public static getInstance(): FirebaseApi {
    if (!FirebaseApi.i) {
      FirebaseApi.i = new FirebaseApi();
    }
    return FirebaseApi.i;
  }

  public async getCourseByUserGradeId(
    gradeDocId: string | undefined
  ): Promise<DocumentReference<DocumentData>[]> {
    let courseIds: DocumentReference[] = [];

    if (gradeDocId) {
      // Initialize isGrade1 and isGrade2
      let isGrade1: string | boolean = false;
      let isGrade2: string | boolean = false;

      // Check if gradeDocId matches any of the specified grades and assign the value to isGrade1 or isGrade2
      if (gradeDocId === grade1 || gradeDocId === belowGrade1) {
        isGrade1 = true;
      } else if (
        gradeDocId === grade2 ||
        gradeDocId === grade3 ||
        gradeDocId === aboveGrade3
      ) {
        isGrade2 = true;
      } else {
        // If it's neither grade1 nor grade2, assume grade2
        isGrade2 = true;
      }

      if (isGrade1 || isGrade2) {
        // Use the value of isGrade1 or isGrade2 as the gradeDocId when fetching courses
        const gradeCourses = await this.getCoursesByGrade(
          isGrade1 ? grade1 : isGrade2 ? grade2 : gradeDocId
        );
        console.log(
          "----------------line 182 courses related to grades",
          gradeCourses
        );

        gradeCourses.forEach((course) => {
          courseIds.push(doc(this._db, CollectionIds.COURSE, course.docId));
        });
      }
    }

    if (courseIds.length === 0) {
      // If no courses were added, use the default course IDs
      courseIds = DEFAULT_COURSE_IDS.map((id) =>
        doc(this._db, `${CollectionIds.COURSE}/${id}`)
      );
    }

    return courseIds;
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

    // Created a variable to check the username is defined or an empty
    const username = _currentUser.username || "";

    // let courseIds: DocumentReference[] = [];
    // const courses = await this.getAllCourses();
    // if (!!courses && courses.length > 0) {
    //   courses.forEach((course) => {
    //     courseIds.push(doc(this._db, CollectionIds.COURSE, course.docId));
    //   });
    // } else {
    //   courseIds = DEFAULT_COURSE_IDS.map((id) =>
    //     doc(this._db, `${CollectionIds.COURSE}/${id}`)
    //   );
    // }
    // let courseIds: DocumentReference[] = await this.getCourseByGradeId(
    let courseIds: DocumentReference[] = await this.getCourseByUserGradeId(
      gradeDocId
    );

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
      username,
      [],
      name,
      RoleType.STUDENT,
      _currentUser.docId,
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
        updatedAt: Timestamp.now(),
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
    //     updatedAt: Timestamp.now(),
    //   }
    // );
    _currentUser.users = userList;
    ServiceConfig.getI().authHandler.currentUser = _currentUser;
  }

  public async getAllCurriculums(): Promise<Curriculum[]> {
    try {
      const querySnapshot = await this.getDocsFromOffline(
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
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:206 ~ FirebaseApi ~ getAllCurriculums ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }

  // public async getCoursesByGradeId(): Promise<COURSES[]>{

  // }

  public async getAllGrades(): Promise<Grade[]> {
    try {
      const querySnapshot = await this.getDocsFromOffline(
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
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:228 ~ FirebaseApi ~ getAllGrades ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }

  public async getAvatarInfo(): Promise<AvatarObj | undefined> {
    try {
      // let response = await fetch(
      //   "https://raw.githubusercontent.com/chimple/course-kn/main/kn0001/res/kn0001.json"
      // );

      let response = await fetch(
        "/public/assets/animation/avatarSugguestions.json"
      );
      let responseJson = await response.json();
      console.log("Avatar Sugguestion Json ", responseJson);

      const avatarDocId = "AvatarInfo";
      console.log(
        "getAvatarInfo(): entred",
        doc(this._db, CollectionIds.AVATAR + "/" + avatarDocId)
      );
      const documentSnapshot = await this.getDocFromOffline(
        doc(this._db, CollectionIds.AVATAR + "/" + avatarDocId)
      );
      const avatarInfoData = documentSnapshot.data() as AvatarObj;
      console.log("const avatarInfoData", avatarInfoData);

      return avatarInfoData;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:262 ~ FirebaseApi ~ getAvatarInfo ~ error:",
        JSON.stringify(error)
      );
      return;
    }
  }

  public async getAllLanguages(): Promise<Language[]> {
    try {
      const querySnapshot = await this.getDocsFromOffline(
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
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:250 ~ FirebaseApi ~ getAllLanguages ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }

  public async getParentStudentProfiles(): Promise<User[]> {
    try {
      const currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
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
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:280 ~ FirebaseApi ~ getParentStudentProfiles ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }

  public get currentMode(): MODES {
    return this._currentMode;
  }

  public set currentMode(value: MODES) {
    this._currentMode = value;
  }

  public updateSoundFlag = async (user: User, value: boolean) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        soundFlag: value,
        updatedAt: Timestamp.now(),
      });
      user.soundFlag = value;
      ServiceConfig.getI().authHandler.currentUser = user;
    }
  };
  public updateTcAccept = async (user: User, value: boolean) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        tcAccept: value,
        updatedAt: Timestamp.now(),
      });
      user.tcAccept = value;
      ServiceConfig.getI().authHandler.currentUser = user;
    }
  };

  public updateMusicFlag = async (user: User, value: boolean) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        musicFlag: value,
        updatedAt: Timestamp.now(),
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
        updatedAt: Timestamp.now(),
      });
    }
  };

  async getLanguageWithId(id: string): Promise<Language | undefined> {
    try {
      const result = await getDoc(
        doc(this._db, `${CollectionIds.LANGUAGE}/${id}`)
      );
      if (!result.data()) return;
      return result.data() as Language;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:360 ~ FirebaseApi ~ getLanguageWithId ~ error:",
        error
      );
    }
  }

  async sortSubject(subjects) {
    subjects.sort((a, b) => {
      //Number.MAX_SAFE_INTEGER is using when sortIndex is not found COURSES (i.e it gives default value)
      const sortIndexA = a.sortIndex || Number.MAX_SAFE_INTEGER;
      const sortIndexB = b.sortIndex || Number.MAX_SAFE_INTEGER;

      return sortIndexA - sortIndexB;
    });
    return subjects;
  }

  async getCoursesForParentsStudent(student: User): Promise<Course[]> {
    try {
      const subjects: Course[] = [];
      if (!student?.courses || student.courses.length < 1) return subjects;
      const courseDocs = await Promise.all(
        student.courses.map((course) => this.getDocFromOffline(course))
      );
      courseDocs.forEach((courseDoc) => {
        if (courseDoc && courseDoc.data()) {
          const course = courseDoc.data() as Course;
          course.docId = courseDoc.id;
          subjects.push(course);
        }
      });
      return this.sortSubject(subjects);
      return this.sortSubject(subjects);
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:358 ~ FirebaseApi ~ getCoursesForParentsStudent ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }

  async getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    try {
      const studentLessons = await getDoc(
        doc(this._db, `${CollectionIds.STUDENT_PROFILE}/${studentId}`)
      );
      const lessonsData: DocumentData = studentLessons.data()!;
      if (lessonsData == undefined || lessonsData.lessons == undefined) return;
      console.log("lessonsData.lessons ", lessonsData.lessons);
      const lessonsMap: Map<string, StudentLessonResult> = new Map(
        Object.entries(lessonsData.lessons)
      );

      return lessonsMap;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:382 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
    }
  }

  async getCoursesForClassStudent(currClass: Class): Promise<Course[]> {
    const subjects: Course[] = [];
    try {
      if (!currClass?.courses || currClass.courses.length < 1) return subjects;
      const courseDocs = await Promise.all(
        currClass.courses.map((course) => getDoc(doc(this._db, course)))
      );
      courseDocs.forEach((courseDoc) => {
        if (courseDoc && courseDoc.data) {
          const course = courseDoc.data() as Course;
          course.docId = courseDoc.id;
          subjects.push(course);
        }
      });
      return this.sortSubject(subjects);
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:444 ~ FirebaseApi ~ getCoursesForClassStudent ~ error:",
        error
      );
      return [];
    }
  }

  async getLesson(
    id: string,
    chapter: Chapter | undefined = undefined,
    loadChapterTitle: boolean = false,
    assignment: Assignment | undefined = undefined
  ): Promise<Lesson | undefined> {
    try {
      const lessonDoc = await this.getDocFromOffline(
        doc(this._db, `${CollectionIds.LESSON}/${id}`)
      );
      if (!lessonDoc.exists) return;
      const lesson = lessonDoc.data() as Lesson;
      lesson.docId = lessonDoc.id;

      if (!!chapter) lesson.chapterTitle = chapter.title;
      else if (loadChapterTitle) {
        if (!this._allCourses) {
          this._allCourses = await this.getAllCourses();
        }
        const tmpCourse = this._allCourses?.find(
          (course) => course.docId === assignment?.course.id
        );
        const chapter = tmpCourse?.chapters.find(
          (chapter) => chapter.id === lesson.cocosChapterCode
        );
        lesson.chapterTitle = chapter?.title;
      }
      return lesson;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:399 ~ FirebaseApi ~ getLesson ~ error:",
        JSON.stringify(error)
      );
    }
  }
  async getLessonsForChapter(chapter: Chapter): Promise<Lesson[]> {
    const lessons: Lesson[] = [];
    try {
      if (chapter.lessons && chapter.lessons.length > 0) {
        for (let lesson of chapter.lessons) {
          if (lesson instanceof DocumentReference) {
            const lessonObj = await this.getLesson(lesson.id, chapter);
            if (lessonObj) {
              lessons.push(lessonObj);
            }
          } else {
            lessons.push(lesson);
          }
        }
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:367 ~ FirebaseApi ~ getLessonsForChapter ~ error:",
        JSON.stringify(error)
      );
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
            const lessonObj = await this.getLesson(lesson.id, chapter);
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
    try {
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
                const lessonObj = await this.getLesson(lesson.id, chapter);
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
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:523 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
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
    const queryResult = await this.getDocsFromOffline(q);
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
          const gradeDoc = await this.getDocFromOffline(course.grade);
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
    gradeMap.grades.sort((a, b) => {
      //Number.MAX_SAFE_INTEGER is using when sortIndex is not found GRADES (i.e it gives default value)
      const sortIndexA = a.sortIndex || Number.MAX_SAFE_INTEGER;
      const sortIndexB = b.sortIndex || Number.MAX_SAFE_INTEGER;

      return sortIndexA - sortIndexB;
    });
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
    isLoved: boolean,
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
      null!,
      isLoved
    );
    const resultDoc = doc(collection(this._db, CollectionIds.RESULT));
    if (navigator.onLine) {
      await setDoc(resultDoc, result.toJson());
    } else {
      setDoc(resultDoc, result.toJson());
    }
    result.docId = resultDoc.id;
    let playedResult: StudentLessonResult = {
      date: result.updatedAt,
      course: result.course!,
      score: result.score,
      isLoved: result.isLoved,
      timeSpent: result.timeSpent,
    };
    console.log("playedResult", result.lesson.id, JSON.stringify(playedResult));

    if (this._studentResultCache[student.docId] === undefined) {
      const studentProfileData = await this.getStudentResult(student.docId);
      if (studentProfileData) {
        const lastPlayedCourse: DocumentReference | undefined =
          studentProfileData.lastPlayedCourse;

        const studentProfile = new StudentProfile(
          lastPlayedCourse,
          studentProfileData.classes,
          studentProfileData.last5Lessons,
          studentProfileData.lessons,
          studentProfileData.schools,
          studentProfileData.updatedAt,
          studentProfileData.createdAt,
          student.docId
        );

        studentProfile.lessons[result.lesson.id] = playedResult;
        this._studentResultCache[student.docId] = studentProfile;
      } else {
        const studentProfile = new StudentProfile(
          playedResult.course,
          [],
          {},
          {},
          [],
          Timestamp.fromDate(new Date()),
          Timestamp.fromDate(new Date()),
          student.docId
        );
        studentProfile.lessons[result.lesson.id] = playedResult;
        this._studentResultCache[student.docId] = studentProfile;
      }
    } else {
      this._studentResultCache[student.docId].lastPlayedCourse =
        playedResult.course;
      this._studentResultCache[student.docId].lessons[result.lesson.id] =
        playedResult;
    }
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
    let tempCourse;
    if (!student.courses && gradeDocId) {
      tempCourse = await this.getCourseByUserGradeId(gradeDocId);
    }
    const boardRef = doc(this._db, `${CollectionIds.CURRICULUM}/${boardDocId}`);
    const gradeRef = doc(this._db, `${CollectionIds.GRADE}/${gradeDocId}`);
    const languageRef = doc(
      this._db,
      `${CollectionIds.LANGUAGE}/${languageDocId}`
    );
    const now = Timestamp.now();
    const updateDocWithCourse: any = {
      age: age,
      avatar: avatar,
      board: boardRef,
      updatedAt: now,
      gender: gender,
      grade: gradeRef,
      image: image ?? null,
      language: languageRef,
      name: name,
    };
    if (!!tempCourse) {
      updateDocWithCourse.courses = tempCourse;
      student.courses = tempCourse;
    }
    await updateDoc(
      doc(this._db, `${CollectionIds.USER}/${student.docId}`),
      updateDocWithCourse
    );
    student.age = age;
    student.avatar = avatar;
    student.board = boardRef;
    student.updatedAt = now;
    student.gender = gender;
    student.grade = gradeRef;
    student.image = image;
    student.language = languageRef;
    student.name = name;
    return student;
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    try {
      if (!!this._subjectsCache[id]) return this._subjectsCache[id];
      const subjectDoc = await this.getDocFromOffline(
        doc(this._db, CollectionIds.SUBJECT, id)
      );
      if (!subjectDoc.exists) return;
      const subject = subjectDoc.data() as Subject;
      if (!subject) return;
      subject.docId = id;
      this._subjectsCache[id] = subject;
      return subject;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:623 ~ FirebaseApi ~ getSubject ~ error:",
        JSON.stringify(error)
      );
      return;
    }
  }

  async getCourse(id: string): Promise<Course | undefined> {
    try {
      if (!!this._CourseCache[id]) return this._CourseCache[id];
      const CourseDoc = await this.getDocFromOffline(
        doc(this._db, CollectionIds.COURSE, id)
      );
      if (!CourseDoc.exists) return;
      const course = CourseDoc.data() as Course;
      if (!course) return;
      course.docId = id;
      this._CourseCache[id] = course;
      return course;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:623 ~ FirebaseApi ~ getSubject ~ error:",
        JSON.stringify(error)
      );
      return;
    }
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
    try {
      if (!!this._studentResultCache[studentId] && fromCache)
        return this._studentResultCache[studentId];
      const studentProfileDoc = await getDoc(
        doc(this._db, CollectionIds.STUDENT_PROFILE, studentId)
      );
      console.log("studentProfileDoc", studentProfileDoc);

      if (!studentProfileDoc.exists) return;
      const studentProfile = studentProfileDoc.data() as StudentProfile;
      console.log("studentProfile", studentProfile);
      if (studentProfile === undefined) return;
      studentProfile.docId = studentId;
      if (!studentProfile.lessons) studentProfile.lessons = {};
      this._studentResultCache[studentId] = studentProfile;
      return studentProfile;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:734 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
    }
  }

  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: StudentLessonResult } | undefined> {
    try {
      const lessonsData = await this.getStudentResult(studentId);
      console.log(
        "getStudentResultInMap lessonsData ",
        JSON.stringify(lessonsData)
      );
      if (!lessonsData) return;
      return lessonsData.lessons;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:753 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
    }
  }

  async getClassById(id: string): Promise<Class | undefined> {
    try {
      if (!!this._classCache[id]) return this._classCache[id];
      const classDoc = await this.getDocFromOffline(
        doc(this._db, CollectionIds.CLASS, id)
      );
      if (!classDoc.exists) return;
      const classData = classDoc.data() as Class;
      classData.docId = id;
      this._classCache[id] = classData;
      return classData;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:770 ~ FirebaseApi ~ getClassById ~ error:",
        JSON.stringify(error)
      );
    }
  }

  async getSchoolById(id: string): Promise<School | undefined> {
    try {
      if (!!this._schoolCache[id]) return this._schoolCache[id];
      const schoolDoc = await this.getDocFromOffline(
        doc(this._db, CollectionIds.SCHOOL, id)
      );
      if (!schoolDoc.exists) return;
      const schoolData = schoolDoc.data() as School;
      schoolData.docId = id;
      this._schoolCache[id] = schoolData;
      return schoolData;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:787 ~ FirebaseApi ~ getSchoolById ~ error:",
        JSON.stringify(error)
      );
    }
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
    try {
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
      const currentTimestamp = new Date().getTime();

      const filteredAssignments = assignments.filter((assignment) => {
        if (!!assignment && assignment.type === LIVE_QUIZ) {
          if (assignment.startsAt && assignment.endsAt) {
            const startsAtTimestamp = assignment.startsAt.toDate().getTime();
            if (startsAtTimestamp <= currentTimestamp) {
              const endsAtTimestamp = assignment.endsAt.toDate().getTime();
              return endsAtTimestamp >= currentTimestamp;
            }
            return false;
          }
        }
        return true;
      });
      console.log("Filtered assignments....", filteredAssignments);

      return filteredAssignments;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:856 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }

  async getSchoolsForUser(user: User): Promise<School[]> {
    try {
      if (!!this._schoolsCache[user.docId])
        return this._schoolsCache[user.docId];
      const q = query(
        collection(this._db, CollectionIds.SCHOOL_CONNECTION),
        where("roles", "array-contains", user.docId)
      );
      const queryResult = await getDocs(q);
      const schools: School[] = [];
      await Promise.all(
        queryResult.docs.map(async (connectionDoc) => {
          const schoolId = connectionDoc.id.split("_")[1];
          const connectionId = connectionDoc.id.split("_")[0];
          if (connectionId != "PT") {
            const schoolDoc = await getDoc(
              doc(this._db, CollectionIds.SCHOOL, schoolId)
            );
            if (schoolDoc.exists() && !!schoolDoc.id) {
              const school = schoolDoc.data() as School;
              school.docId = schoolDoc.id;
              switch (connectionId) {
                case "PR":
                  school.role = RoleType.PRINCIPAL;
                  break;
                case "CO":
                  school.role = RoleType.COORDINATOR;
                  break;
                case "TE":
                  school.role = RoleType.TEACHER;
                  break;
                case "SP":
                  school.role = RoleType.SPONSOR;
                  break;
              }
              schools.push(school);
            }
          }
        })
      );
      this._schoolsCache[user.docId] = schools;
      return schools;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:904 ~ FirebaseApi ~ getSchoolsForUser ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }

  async isUserTeacher(user: User): Promise<boolean> {
    try {
      const isParent = user.role === RoleType.PARENT;
      console.log("this is the role  " + user.role);
      if (isParent) return false;
      const schools = await this.getSchoolsForUser(user);
      if (!!schools && schools.length > 0) return true;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:921 ~ FirebaseApi ~ isUserTeacher ~ error:",
        JSON.stringify(error)
      );
    }
    return false;
  }

  async getClassesForSchool(school: School, user: User): Promise<Class[]> {
    try {
      const classes: Class[] = [];
      const isTeacher = school.role === RoleType.TEACHER;
      if (isTeacher) {
        const q = query(
          collection(this._db, CollectionIds.CLASS_CONNECTION),
          where("roles", "array-contains", user.docId),
          where(
            "school",
            "==",
            doc(this._db, CollectionIds.SCHOOL, school.docId)
          )
        );
        const queryResult = await getDocs(q);
        await Promise.all(
          queryResult.docs.map(async (connectionDoc) => {
            const classId = connectionDoc.id.slice(3);
            const classDoc = await getDoc(
              doc(this._db, CollectionIds.CLASS, classId)
            );
            if (classDoc.exists() && !!classDoc.id) {
              const _class = classDoc.data() as Class;
              _class.docId = classDoc.id;
              classes.push(_class);
            }
          })
        );
      } else {
        const q = query(
          collection(this._db, CollectionIds.CLASS),
          where(
            "school",
            "==",
            doc(this._db, CollectionIds.SCHOOL, school.docId)
          )
        );
        const queryResult = await getDocs(q);
        queryResult.docs.forEach((classDoc) => {
          const _class = classDoc.data() as Class;
          _class.docId = classDoc.id;
          classes.push(_class);
        });
      }
      return classes;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:967 ~ FirebaseApi ~ getClassesForSchool ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }
  async getStudentsForClass(classId: string): Promise<User[]> {
    try {
      const students: User[] = [];
      const classConnectionDoc = await getDoc(
        doc(this._db, CollectionIds.CLASS_CONNECTION, "ST_" + classId)
      );
      const roles: string[] = classConnectionDoc.get("roles");
      if (classConnectionDoc.exists() && !!roles && roles.length > 0) {
        await Promise.all(
          roles.map(async (userId) => {
            const userDoc = await this.getDocFromOffline(
              doc(this._db, CollectionIds.USER, userId)
            );
            if (userDoc.exists() && !!userDoc.id) {
              const user = userDoc.data() as User;
              user.docId = userDoc.id;
              students.push(user);
            }
          })
        );
      }
      return students;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:1006 ~ FirebaseApi ~ getStudentsForClass ~ error:",
        error
      );
      return [];
    }
  }

  public async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined> {
    try {
      const leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      if (sectionId === undefined || sectionId?.length <= 0) {
        const q = query(
          collection(
            this._db,
            CollectionIds.LEADERBOARD + "/b2c/genericLeaderboard/"
          ),
          orderBy(
            leaderboardDropdownType === LeaderboardDropdownList.WEEKLY
              ? "weeklyScore"
              : leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
              ? "monthlyScore"
              : "allTimeScore",
            "desc"
          ),
          limit(50)
        );

        const queryResult = await getDocs(q);

        for (const d of queryResult.docs) {
          if (leaderboardDropdownType === LeaderboardDropdownList.WEEKLY) {
            leaderBoardList.weekly.push({
              name: d.get("name"),
              score: d.get("weeklyScore"),
              timeSpent: d.get("weeklyTimeSpent"),
              lessonsPlayed: d.get("weeklyLessonPlayed"),
              userId: d.id,
            });
          } else if (
            leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
          ) {
            leaderBoardList.monthly.push({
              name: d.get("name"),
              score: d.get("monthlyScore"),
              timeSpent: d.get("monthlyTimeSpent"),
              lessonsPlayed: d.get("monthlyLessonPlayed"),
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
        const monthly: StudentLeaderboardInfo[] = [];
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
          monthly.push({
            name: data.d[i].n,
            score: data.d[i]?.m?.s ?? 0,
            timeSpent: data.d[i]?.m?.t ?? 0,
            lessonsPlayed: data.d[i]?.m?.l ?? 0,
            userId: i,
          });
        }
        const sortLeaderboard = (arr: Array<any>) =>
          arr.sort((a, b) => b.score - a.score);
        sortLeaderboard(weekly);
        sortLeaderboard(monthly);
        sortLeaderboard(allTime);
        let result: LeaderboardInfo = {
          weekly: [],
          allTime: [],
          monthly: [],
        };
        result = {
          weekly: weekly,
          allTime: allTime,
          monthly: monthly,
        };
        console.log("result", result);

        return result;
      }

      console.log("result in FirebaseAPI", leaderBoardList);

      return leaderBoardList;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:971 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
    }
  }

  public async getLeaderboardStudentResultFromB2CCollection(
    studentId: string
  ): Promise<LeaderboardInfo | undefined> {
    try {
      const leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      const queryResult = await getDoc(
        doc(
          this._db,
          CollectionIds.LEADERBOARD + "/b2c/genericLeaderboard/" + studentId
        )
      );
      console.log("if (!queryResult.data()) return;", queryResult);
      if (!queryResult.data()) return;

      const data = queryResult.data();
      console.log("if (!queryResult.data()) const data ", data);
      if (!data) return;
      console.log("if (!data) return;", data.name);

      leaderBoardList.weekly.push({
        name: data.name,
        score: data.weeklyScore,
        timeSpent: data.weeklyTimeSpent,
        lessonsPlayed: data.weeklyLessonPlayed,
        userId: studentId,
      });
      console.log("leaderBoardList.weekly", leaderBoardList.weekly);

      leaderBoardList.monthly.push({
        name: data.name,
        score: data.monthlyScore,
        timeSpent: data.monthlyTimeSpent,
        lessonsPlayed: data.monthlyLessonPlayed,
        userId: studentId,
      });
      console.log("leaderBoardList.monthly", leaderBoardList.monthly);
      leaderBoardList.allTime.push({
        name: data.name,
        score: data.allTimeScore,
        timeSpent: data.allTimeTimeSpent,
        lessonsPlayed: data.allTimeLessonPlayed,
        userId: studentId,
      });
      console.log("leaderBoardList.allTime", leaderBoardList.allTime);

      console.log("result in FirebaseAPI", leaderBoardList, data);

      return leaderBoardList;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:971 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
    }
  }

  public async getCoursesByGrade(gradeDocId: any): Promise<Course[]> {
    try {
      const gradeQuerySnapshot = await getDocs(
        query(
          collection(this._db, CollectionIds.COURSE),
          where("grade", "==", doc(this._db, CollectionIds.GRADE, gradeDocId))
        )
      );
      const puzzleQuerySnapshot = await getDocs(
        query(
          collection(this._db, CollectionIds.COURSE),
          where("courseCode", "==", COURSES.PUZZLE)
        )
      );
      const courses: Course[] = [];
      gradeQuerySnapshot.forEach((doc) => {
        const course = doc.data() as Course;
        course.docId = doc.id;
        courses.push(course);
      });
      puzzleQuerySnapshot.forEach((doc) => {
        const course = doc.data() as Course;
        course.docId = doc.id;
        courses.push(course);
      });
      return courses;
    } catch (error) {
      console.error("Error fetching courses by grade:", error);
      return [];
    }
  }

  public async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<Lesson | null> {
    try {
      const lessonQuerySnapshot = await this.getDocsFromOffline(
        query(
          collection(this._db, CollectionIds.LESSON),
          where("id", "==", lessonId)
        )
      );

      if (!lessonQuerySnapshot.empty) {
        // If there is a matching lesson, return it
        const lessonDoc = lessonQuerySnapshot.docs[0];
        const lesson = lessonDoc.data() as Lesson;
        lesson.docId = lessonDoc.id;
        return lesson;
      } else {
        // Lesson not found
        return null;
      }
    } catch (error) {
      console.error("Error fetching lesson by ID:", error);
      return null;
    }
  }

  public async getAllCourses(): Promise<Course[]> {
    try {
      const querySnapshot = await this.getDocsFromOffline(
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
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:1132 ~ FirebaseApi ~ getAllCourses ~ error:",
        JSON.stringify(error)
      );
      return [];
    }
  }
  public async deleteAllUserData(): Promise<void> {
    const functions = getFunctions();
    const deleteAllUserDataFunction = httpsCallable(
      functions,
      "DeleteAllUserData"
    );
    await deleteAllUserDataFunction();
  }
  get currentStudent(): User | undefined {
    return this._currentStudent;
  }
  set currentStudent(value: User | undefined) {
    this._currentStudent = value;
  }
  get currentClass(): Class | undefined {
    return this._currentClass;
  }
  set currentClass(value: Class | undefined) {
    this._currentClass = value;
  }
  get currentSchool(): School | undefined {
    return this._currentSchool;
  }
  set currentSchool(value: School | undefined) {
    this._currentSchool = value;
  }

  private async getDocFromOffline(
    reference: DocumentReference<DocumentData>
  ): Promise<DocumentSnapshot<DocumentData>> {
    let doc: DocumentSnapshot<DocumentData>;
    try {
      doc = await getDocFromCache(reference);
      if (!doc.exists() || !doc.data()) throw "not found in cache";
    } catch (error) {
      doc = await getDoc(reference);
    }
    return doc;
  }

  private async getDocsFromOffline(query: Query<DocumentData>) {
    let querySnapshot: QuerySnapshot<DocumentData>;
    try {
      querySnapshot = await getDocsFromCache(query);
      if (querySnapshot.empty) throw "not found in cache";
      getDocs(query);
    } catch (er) {
      querySnapshot = await getDocs(query);
    }
    return querySnapshot;
  }
  //getting lessons for quiz
  public async getLiveQuizLessons(
    classId: string,
    studentId: string
  ): Promise<Assignment[] | []> {
    try {
      const now = new Date();
      const classDocRef = doc(this._db, CollectionIds.CLASS, classId);

      const q = query(
        collection(this._db, CollectionIds.ASSIGNMENT),
        where("class", "==", classDocRef),
        where("type", "==", LIVE_QUIZ),
        where("startsAt", "<=", now),
        orderBy("startsAt", "desc")
      );
      console.log("query result:", q);

      const liveQuizLessons: Assignment[] = [];
      const liveQuizDocs = await getDocs(q);
      console.log("live quiz count", liveQuizDocs.size);

      if (liveQuizDocs.size > 0) {
        liveQuizDocs.docs.forEach((_assignment) => {
          const endsAt = _assignment.get("endsAt");
          const endsAtDate = endsAt.toDate();
          if (endsAtDate > now) {
            const assignment = _assignment.data() as Assignment;
            assignment.docId = _assignment.id;
            const liveQuiz = _assignment.data() as Assignment;
            liveQuiz.docId = _assignment.id;
            const doneLiveQuiz = liveQuiz.completedStudents?.find(
              (data) => data === studentId
            );
            let tempLiveQuizCompletedIds = localStorage.getItem(
              ASSIGNMENT_COMPLETED_IDS
            );
            let liveQuizcompletedIds = JSON.parse(
              tempLiveQuizCompletedIds ?? "{}"
            );
            console.log("liveQuizcompletedIds:", liveQuizcompletedIds);

            const doneliveQuizLocally = liveQuizcompletedIds[studentId]?.find(
              (assignmentId) => assignmentId === liveQuiz.docId
            );
            console.log("doneliveQuizLocally:", doneliveQuizLocally);

            if (!doneLiveQuiz && !doneliveQuizLocally)
              liveQuizLessons.push(liveQuiz);
          }
        });
      } else {
        console.log("Live Quiz has ended. Skipping.");
      }
      console.log("Live quiz lessons", liveQuizLessons);
      return liveQuizLessons;
    } catch (error) {
      console.error("Error fetching live quiz lessons:", error);
      throw new Error("Error fetching live quiz lessons");
    }
  }

  public async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<DocumentData | undefined> {
    try {
      const liveQuizRoomDoc = await getDoc(
        doc(this._db, `${CollectionIds.LIVE_QUIZ_ROOM}/${liveQuizRoomDocId}`)
      );

      if (liveQuizRoomDoc.exists()) {
        console.log("inside if..");
        const res = liveQuizRoomDoc.data() as LiveQuizRoomObject;
        console.log("res", res);
        return res;
      }
    } catch (error) {
      console.error("Error fetching LiveQuizRoom data:", error);
      throw error;
    }
    return undefined;
  }

  public async getCourseFromLesson(
    lesson: Lesson
  ): Promise<Course | undefined> {
    if (!this._allCourses) {
      this._allCourses = await this.getAllCourses();
    }

    const tmpCourse = this._allCourses?.find(
      (course) => course.courseCode === lesson.cocosSubjectCode
    );
    return tmpCourse;
  }

  public liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: LiveQuizRoomObject) => void
  ): Unsubscribe {
    const unSub = onSnapshot(
      doc(this._db, CollectionIds.LIVE_QUIZ_ROOM, liveQuizRoomDocId),
      (doc) => {
        console.log("Current data: ", doc.data());
        const roomDoc = doc.data() as LiveQuizRoomObject;
        roomDoc.docId = doc.id;
        onDataChange(roomDoc);
      }
    );
    return unSub;
  }
  public async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
  ): Promise<void> {
    try {
      await updateDoc(doc(this._db, CollectionIds.LIVE_QUIZ_ROOM, roomDocId), {
        [`results.${studentId}`]: arrayUnion({
          score: score,
          timeSpent: timeSpent,
          id: questionId,
        }),
      });
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:1571 ~ FirebaseApi ~ error:",
        error
      );
    }
  }
  public async joinLiveQuiz(
    studentId: string,
    assignmentId: string
  ): Promise<string | undefined> {
    try {
      const functions = getFunctions();
      const joinLiveQuiz = httpsCallable(functions, "joinLiveQuiz");
      const result = await joinLiveQuiz({
        studentId,
        assignmentId,
      });
      return result.data as string;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:1573 ~ FirebaseApi ~ error:",
        error
      );
    }
  }
  public async getAssignmentById(id: string): Promise<Assignment | undefined> {
    try {
      const assignmentDoc = await getDoc(
        doc(this._db, CollectionIds.ASSIGNMENT, id)
      );
      if (!assignmentDoc.exists) return;
      const assignmentData = assignmentDoc.data() as Assignment;
      assignmentData.docId = id;
      return assignmentData;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:1600 ~ FirebaseApi ~ getAssignmentById ~ error:",
        error
      );
    }
  }

  public async getBadgeById(id: string): Promise<Badge | undefined> {
    try {
      const badgeDoc = await this.getDocFromOffline(
        doc(this._db, CollectionIds.BADGE, id)
      );
      if (!badgeDoc.exists) return;
      const data = badgeDoc.data() as Badge;
      data.docId = id;
      return data;
    } catch (error) {
      console.log("🚀 ~ FirebaseApi ~ getBadgeById ~ error:", error);
    }
  }

  public async getRewardsById(id: string): Promise<Rewards | undefined> {
    try {
      const rewardDoc = await this.getDocFromOffline(
        doc(this._db, CollectionIds.REWARDS, id)
      );
      if (!rewardDoc.exists) return;
      const data = rewardDoc.data() as Rewards;
      data.docId = id;
      return data;
    } catch (error) {
      console.log("🚀 ~ FirebaseApi ~ getRewardById ~ error:", error);
    }
  }
  public async updateRewardAsSeen(studentId: string): Promise<void> {
    const studentDocRef = doc(this._db, CollectionIds.USER, studentId);
    const studentDoc = await getDoc(studentDocRef);
    if (!studentDoc || !studentDoc.data() || !studentDoc.get("rewards")) return;
    const student: User = studentDoc.data() as User;
    student.docId = studentDoc.id;
    const rewards = student.rewards;
    if (!rewards) return;
    function markAllAsSeen(obj: any): any {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = obj[key].map((item: any) => ({ ...item, seen: true }));
        }
      }
      return obj;
    }
    const finalRewards = markAllAsSeen(rewards);
    await updateDoc(studentDocRef, {
      rewards: finalRewards,
    });
  }
}
