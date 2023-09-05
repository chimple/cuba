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
} from "firebase/firestore";
import {
  LeaderboardInfo,
  ServiceApi,
  StudentLeaderboardInfo,
} from "./ServiceApi";
import {
  COURSES,
  DEFAULT_COURSE_IDS,
  MODES,
  courseSortIndex,
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
import { sort } from "semver";

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
    let count = true;

    // Created a variable to check the username is defined or an empty
    const username = _currentUser.username || "";

    let courseIds: DocumentReference[] = [];
    console.log("-----------------------line 98 grade doc id", gradeDocId);
    const courses = await this.getAllCourses();
    // if (!!courses && courses.length > 0 ) {
    //   courses.forEach((course) => {
    //     if(gradeDocId === course.grade.id || course.courseCode === "puzzle" ){
    //       courseIds.push(doc(this._db, CollectionIds.COURSE, course.docId));

    //     }
    //   });
    // } else {
    //   courseIds = DEFAULT_COURSE_IDS.map((id) =>
    //     doc(this._db, `${CollectionIds.COURSE}/${id}`)
    //   );
    // }

    if (!!courses && courses.length > 0) {
      if (
        gradeDocId === "R5sDh8LKKBx7D7o1MMl0" ||
        gradeDocId === "NIAdGIaaRXi8BOl87MEu"
      ) {
        courses.forEach((course) => {

          //here it repeat all courses but adding only g1 and puzzle
          if (
            course.grade.id === "R5sDh8LKKBx7D7o1MMl0" ||
            course.courseCode === "puzzle"
          ) {
            courseIds.push(doc(this._db, CollectionIds.COURSE, course.docId));
          }
        });
      } else if (
        gradeDocId === "al0OqObeTBK3OFWSyDOg" ||
        gradeDocId === "i1paELqh4uwET2OQQl1E" ||
        gradeDocId === "rhuiXCmMzmJM1dkN8UNu"
      ) {
        courses.forEach((course) => {
          //here it repeat all courses but adding only g2 and puzzle
          if (
            course.grade.id === "al0OqObeTBK3OFWSyDOg" ||
            course.courseCode === "puzzle"
          ) {
            courseIds.push(doc(this._db, CollectionIds.COURSE, course.docId));
          }
        });
      }
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
    subjects.sort(
      (a, b) => courseSortIndex[a.courseCode] - courseSortIndex[b.courseCode]
    );
    const indexOfDigitalSkill = subjects
      .map((e) => e.courseCode)
      .indexOf(COURSES.PUZZLE);
    if (indexOfDigitalSkill) {
      const digitalSkills = subjects.splice(indexOfDigitalSkill, 1)[0];
      subjects.push(digitalSkills);
    }
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
        doc(this._db, `${CollectionIds.STUDENTPROFILE}/${studentId}`)
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
    loadChapterTitle: boolean = false
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
          (course) => course.courseCode === lesson.cocosSubjectCode
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
      updatedAt: now,
      gender: gender,
      grade: gradeRef,
      image: image ?? null,
      language: languageRef,
      name: name,
    });
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
        doc(this._db, CollectionIds.STUDENTPROFILE, studentId)
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
      return assignments;
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
        collection(this._db, CollectionIds.SCHOOLCONNECTION),
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
          collection(this._db, CollectionIds.CLASSCONNECTION),
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
        doc(this._db, CollectionIds.CLASSCONNECTION, "ST_" + classId)
      );
      const roles: string[] = classConnectionDoc.get("roles");
      if (classConnectionDoc.exists() && !!roles && roles.length > 0) {
        await Promise.all(
          roles.map(async (userId) => {
            const userDoc = await getDoc(
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
        JSON.stringify(error)
      );
      return [];
    }
  }

  public async getLeaderboardResults(
    sectionId: string,
    isWeeklyData: boolean
  ): Promise<LeaderboardInfo | undefined> {
    console.log(
      "async getLeaderboard called",
      isWeeklyData ? "weeklyScore" : "allTimeScore"
    );
    try {
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
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseApi.ts:971 ~ FirebaseApi ~ error:",
        JSON.stringify(error)
      );
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
}
