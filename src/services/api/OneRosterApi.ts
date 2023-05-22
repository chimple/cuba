import { HttpHeaders } from "@capacitor-community/http";
import { COURSES } from "../../common/constants";
import { Chapter } from "../../interface/curriculumInterfaces";
import Assignment from "../../models/assignment";
import Auth from "../../models/auth";
import Class from "../../models/class";
import CurriculumController from "../../models/curriculumController";
import Result from "../../models/result";
import User from "../../models/user";
import { ServiceApi } from "./ServiceApi";
import { DocumentReference, DocumentData } from "firebase/firestore";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
// import { Chapter } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { StudentLessonResult } from "../../common/courseConstants";
import Subject from "../../models/subject";

export class OneRosterApi implements ServiceApi {
  public static i: OneRosterApi;
  private preQuizMap: { [key: string]: { [key: string]: Result } } = {};
  private classes: { [key: string]: Class[] } = {};
  private lessonMap: { [key: string]: { [key: string]: Result } } = {};

  getCoursesForParentsStudent(student: User): Promise<Course[]> {
    throw new Error("Method not implemented.");
  }
  getLesson(id: string): Promise<Lesson | undefined> {
    throw new Error("Method not implemented.");
  }
  getLessonsForChapter(chapter): Promise<Lesson[]> {
    throw new Error("Method not implemented.");
  }
  getDifferentGradesForCourse(
    course: Course
  ): Promise<{ grades: Grade[]; courses: Course[] }> {
    throw new Error("Method not implemented.");
  }
  private constructor() {}
  getSubject(id: string): Promise<Subject | undefined> {
    throw new Error("Method not implemented.");
  }

  deleteProfile(studentId: string) {
    throw new Error("Method not implemented.");
  }

  updateStudent( student: User, name: string, age: number, gender: string, avatar: string, image: string, boardDocId: string, gradeDocId: string, languageDocId: string): Promise<User> {
    throw new Error("Method not implemented.");
  }
  getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    throw new Error("Method not implemented.");
  }
  updateResult(
    student: User,
    courseId: string,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number
  ): Promise<Result> {
    throw new Error("Method not implemented.");
  }
  getLanguageWithId(id: string): Promise<Language | undefined> {
    throw new Error("Method not implemented.");
  }
  getAllCurriculums(): Promise<Curriculum[]> {
    throw new Error("Method not implemented.");
  }
  getAllGrades(): Promise<Grade[]> {
    throw new Error("Method not implemented.");
  }
  getAllLanguages(): Promise<Language[]> {
    throw new Error("Method not implemented.");
  }
  getParentStudentProfiles(): Promise<User[]> {
    throw new Error("Method not implemented.");
  }

  updateSoundFlag(user: User, value: boolean) {
    throw new Error("Method not implemented.");
  }
  updateMusicFlag(user: User, value: boolean) {
    throw new Error("Method not implemented.");
  }
  updateLanguage(user: User, value: string) {
    throw new Error("Method not implemented.");
  }

  get currentStudent(): User | undefined {
    throw new Error("Method not implemented.");
  }
  set currentStudent(value: User | undefined) {
    throw new Error("Method not implemented.");
  }
  createProfile(
    name: string,
    age: number,
    gender: string,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined
  ): Promise<User> {
    throw new Error("Method not implemented.");
  }

  public static getInstance(): OneRosterApi {
    if (!OneRosterApi.i) {
      OneRosterApi.i = new OneRosterApi();
    }
    return OneRosterApi.i;
  }

  getHeaders(): HttpHeaders {
    let ipcHost;
    if (Auth.i.endpointUrl) {
      try {
        const endpointUrl = new URL(Auth.i.endpointUrl);
        ipcHost = endpointUrl.host + endpointUrl.pathname;
      } catch (error) {
        console.log(
          "🚀 ~ file: OneRosterApi.ts:53 ~ OneRosterApi ~ getHeaders ~ error:",
          JSON.stringify(error)
        );
      }
    }
    return {
      "auth-token": Auth.i.authToken,
      "ipc-host": ipcHost,
    };
  }

  async getClassesForUser(userId: string): Promise<Class[]> {
    console.log("in getClassesForUser");
    // throw new Error("Method not implemented.");
    // try {
    //   let url;
    //   if (
    //     Capacitor.getPlatform() === "android" &&
    //     Auth.i.userAccountName !== DEBUG_15
    //   ) {
    //     const port = await Util.getPort();
    //     url = `http://localhost:${port}/api/oneroster/users/${userId}/classes`;
    //   } else {
    //     url = "https://mocki.io/v1/fce49925-c014-4aa4-86b4-9196ebd3d9ac";
    //   }
    //   const response = await Http.get({
    //     url: url,
    //     headers: this.getHeaders(),
    //   }).catch((e) => {
    //     console.log("error on getResultsForStudentForClass", e);
    //   });
    //   if (response && response.status !== 200) {
    //     Util.showLog(response.data);
    //   }
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:60 ~ OneRosterApi ~ getClassesForUser ~ response:",
    //     JSON.stringify(response)
    //   );
    //   const result = response && response.status === 200 ? response.data : [];
    //   const classes: Class[] = [];
    //   if (result) {
    //     //TODO Using result instead of result.classes to match mikes schema
    //     for (let i of result) {
    //       classes.push(Class.fromJson(i));
    //     }
    //   }
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:47 ~ OneRosterApi ~ getClassesForUser ~ classes:",
    //     JSON.stringify(classes)
    //   );
    //   return classes;
    // } catch (error) {
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:57 ~ OneRosterApi ~ getClassesForUser ~ error:",
    //     error
    //   );
    return [];
    // }
  }

  async getResultsForStudentForClass(
    classId: string,
    studentId: string
  ): Promise<Result[]> {
    throw new Error("Method not implemented.");
    // try {
    //   let url;
    //   if (
    //     Capacitor.getPlatform() === "android" &&
    //     Auth.i.userAccountName !== DEBUG_15
    //   ) {
    //     const port = await Util.getPort();
    //     url = `http://localhost:${port}/api/oneroster/classes/${classId}/students/${studentId}/results`;
    //   } else {
    //     url = "https://mocki.io/v1/fc92ee9c-2d86-47f6-903f-50045ae078a1";
    //   }
    //   const response = await Http.get({
    //     url: url,
    //     headers: this.getHeaders(),
    //   }).catch((e) => {
    //     console.log("error on getResultsForStudentForClass", e);
    //   });
    //   if (response && response.status !== 200) {
    //     Util.showLog(response.data);
    //   }
    //   const data = response && response.status === 200 ? response.data : [];
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:75 ~ OneRosterApi ~ getResultsForStudentForClass ~ response :",
    //     JSON.stringify(response)
    //   );
    //   // if (Capacitor.getPlatform() === "web") {
    //   const addTempResult = (lessonId: string, score: number) => {
    //     const result = {
    //       sourcedId: "..String..",
    //       status: "active",
    //       dateLastModified: "..Date/Time..",
    //       metaData: {
    //         lessonId: lessonId,
    //       },
    //       lineItem: {
    //         href: "..URI..",
    //         sourcedId: "..String..",
    //         type: "lineItem",
    //       },
    //       student: {
    //         href: "..URI..",
    //         sourcedId: "..String..",
    //         type: "user",
    //       },
    //       class: {
    //         href: "..URI..",
    //         sourcedId: "..String..",
    //         type: "class",
    //       },
    //       scoreScale: {
    //         href: "..URI..",
    //         sourcedId: "..String..",
    //         type: "scoreScale",
    //       },
    //       scoreStatus: "submitted",
    //       score: score,
    //       textScore: "..NormalizedString..",
    //       scoreDate: "..String(Date)..",
    //       comment: "..String..",
    //       learningObjectiveSet: [
    //         {
    //           source: "..select from Union..",
    //           learningObjectiveResults: [
    //             {
    //               learningObjectiveId: "..NormalizedString..",
    //               score: 20,
    //               textScore: "..NormalizedString..",
    //             },
    //           ],
    //         },
    //       ],
    //     };
    //     return result;
    //   };

    //   if (
    //     !Capacitor.isNativePlatform() ||
    //     Auth.i.userAccountName === DEBUG_15
    //   ) {
    //     const json = localStorage.getItem(TEMP_LESSONS_STORE());
    //     let lessons: any = {};
    //     if (json) {
    //       lessons = JSON.parse(json);
    //     }
    //     for (let i of Object.keys(lessons)) {
    //       data?.push(addTempResult(i, lessons[i]));
    //     }
    //   }
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:131 ~ OneRosterApi ~ getResultsForStudentForClass ~ data:",
    //     JSON.stringify(data)
    //   );
    //   // }
    //   const results: Result[] = [];
    //   if (data) {
    //     //TODO Using data instead of data.results to match mikes schema
    //     for (let i of data) {
    //       results.push(Result.fromJson(i));
    //     }
    //   }
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:134 ~ OneRosterApi ~ getResultsForStudentForClass ~ results:",
    //     JSON.stringify(results)
    //   );
    //   return results;
    // } catch (error) {
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:143 ~ OneRosterApi ~ getResultsForStudentForClass ~ error:",
    //     JSON.stringify(error)
    //   );
    return [];
    // }
  }

  async isPreQuizDone(
    subjectCode: string,
    classId: string,
    studentId: string
  ): Promise<boolean> {
    if (COURSES.PUZZLE === subjectCode) return true;
    const preQuiz = await this.getPreQuiz(subjectCode, classId, studentId);
    return !!preQuiz;
  }

  async getPreQuiz(
    subjectCode: string,
    classId: string,
    studentId: string
  ): Promise<Result | undefined> {
    // if (!this.preQuizMap[studentId]) {
    //   this.preQuizMap[studentId] = {};
    // }
    // if (this.preQuizMap[studentId][subjectCode])
    //   return this.preQuizMap[studentId][subjectCode];
    // const results = await this.getResultsForStudentForClass(classId, studentId);
    // for (let result of results)
    //   if (result.metaData?.lessonId === subjectCode + "_" + PRE_QUIZ) {
    //     this.preQuizMap[studentId][subjectCode] = result;
    //     return result;
    //   }
    return;
  }

  public async getResultsForStudentsForClassInLessonMap(
    classId: string,
    studentId: string
  ): Promise<{ [key: string]: Result }> {
    // if (!!this.lessonMap[studentId]) {
    //   await new Promise((r) => setTimeout(r, 10));
    //   return this.lessonMap[studentId];
    // }
    // const results = await this.getResultsForStudentForClass(classId, studentId);
    // const lessonMap: any = {};
    // for (let result of results) {
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:224 ~ OneRosterApi ~ result:",
    //     JSON.stringify(result)
    //   );
    //   if (
    //     !lessonMap[result.metaData?.lessonId] ||
    //     lessonMap[result.metaData?.lessonId] < result.score
    //   ) {
    //     lessonMap[result.metaData?.lessonId] = result;
    //   }
    // }
    // this.lessonMap[studentId] = lessonMap;
    // return lessonMap;
    return {};
  }

  async getLineItemForClassForLessonId(
    classId: string,
    lessonId: string
  ): Promise<Assignment | undefined> {
    // try {
    //   // const filter = encodeURIComponent(`title='${lessonId}'`)
    //   const sourcedId = lessonId + "-" + classId;
    //   // const response=await Http.get({url:`http://lineItems/${sourcedId}`})
    //   let url;
    //   if (
    //     Capacitor.getPlatform() === "android" &&
    //     Auth.i.userAccountName !== DEBUG_15
    //   ) {
    //     const port = await Util.getPort();
    //     url = `http://localhost:${port}/api/oneroster/lineItems/${sourcedId}`;
    //   } else {
    //     url = "https://mocki.io/v1/52979d15-85d7-49d2-8ba0-3017518984b7";
    //   }
    //   const response = await Http.get({
    //     url: url,
    //     headers: this.getHeaders(),
    //   }).catch((e) => {
    //     console.log("error on getResultsForStudentForClass", e);
    //   });
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:198 ~ OneRosterApi ~ getLineItemForClassForLessonId ~ response:",
    //     JSON.stringify(response)
    //   );
    //   const result =
    //     response && response.status === 200 ? response.data : undefined;
    //   const lineItem = result ? Assignment.fromJson(result) : undefined;
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:204 ~ OneRosterApi ~ getLineItemForClassForLessonId ~ lineItem:",
    //     JSON.stringify(lineItem)
    //   );
    //   return lineItem;
    // } catch (error) {
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:216 ~ OneRosterApi ~ getLineItemForClassForLessonId ~ error:",
    //     JSON.stringify(error)
    //   );
    return;
    // }
  }

  async putLineItem(classId: string, lessonId: string): Promise<Assignment> {
    // const sourcedId = lessonId + "-" + classId;
    // const assignDate = new Date().toISOString();
    // const dueDate = new Date(
    //   new Date().setFullYear(new Date().getFullYear() + 1)
    // ).toISOString();
    // const lineItem = new Assignment(
    //   lessonId,
    //   assignDate,
    //   dueDate,
    //   { href: classId, sourcedId: classId, type: "class" },
    //   { href: "category", sourcedId: "category", type: "category" },
    //   0,
    //   100,
    //   sourcedId,
    //   OneRosterStatus.ACTIVE,
    //   assignDate,
    //   {},
    //   lessonId
    // );
    // console.log("lineItem", JSON.stringify(lineItem.toJson()));
    // if (
    //   Capacitor.getPlatform() === "android" &&
    //   Auth.i.userAccountName !== DEBUG_15
    // ) {
    //   const port = await Util.getPort();
    //   const header = this.getHeaders();
    //   header["Content-Type"] = "application/json";
    //   const res = await Http.put({
    //     url: `http://localhost:${port}/api/oneroster/lineItems/${sourcedId}`,
    //     data: lineItem.toJson(),
    //     headers: header,
    //   });
    //   console.log(
    //     "🚀 ~ file: OneRosterApi.ts:236 ~ OneRosterApi ~ putLineItem ~ res:",
    //     JSON.stringify(res)
    //   );
    // }
    // return lineItem;
    throw new Error("Method not implemented.");
  }

  async putResult(
    userId: string,
    classId: string,
    lessonId: string,
    score: number,
    subjectCode: string
  ): Promise<Result | undefined> {
    throw new Error("Method not implemented.");
    // try {
    //   const lineItem: Assignment =
    //     (await this.getLineItemForClassForLessonId(classId, lessonId)) ??
    //     (await this.putLineItem(classId, lessonId));
    //   const date = new Date().toISOString();
    //   const sourcedId = uuidv4();
    //   const result = new Result(
    //     {
    //       href: lineItem?.sourcedId,
    //       sourcedId: lineItem?.sourcedId,
    //       type: "lineItem",
    //     },
    //     {
    //       href: userId,
    //       sourcedId: userId,
    //       type: "user",
    //     },
    //     lineItem.class,
    //     ScoreStatusEnum.SUBMITTED,
    //     score,
    //     date,
    //     "",
    //     sourcedId,
    //     OneRosterStatus.ACTIVE,
    //     date,
    //     { lessonId: lessonId }
    //   );
    //   console.log("results", JSON.stringify({ result: result.toJson() }));
    //   // Http.put({ url: `/results/${sourcedId}`, data: { result: result.toJson() }, headers: this.getHeaders() })
    //   if (this.lessonMap[userId] == null) {
    //     this.lessonMap[userId] = {};
    //   }
    //   this.lessonMap[userId][lessonId] = result;
    //   if (score >= MIN_PASS) {
    //     const curInstance = CurriculumController.getInstance();
    //     const lessons = await curInstance.allLessonForSubject(
    //       subjectCode,
    //       this.lessonMap[userId]
    //     );
    //     const lesson = lessons.find((lesson: Lesson) => lesson.id === lessonId);
    //     if (
    //       lesson &&
    //       lesson.type === EXAM &&
    //       lesson.chapter.lessons[lesson.chapter.lessons.length - 1].id ===
    //         lessonId
    //     ) {
    //       console.log("updating prequiz for lesson", lesson);
    //       const preQuiz = await this.updatePreQuiz(
    //         subjectCode,
    //         classId,
    //         userId,
    //         lesson.chapter.id,
    //         true
    //       );
    //       console.log("updated prequiz", preQuiz);
    //     }
    //   }
    //   if (
    //     Capacitor.getPlatform() === "android" &&
    //     Auth.i.userAccountName !== DEBUG_15
    //   ) {
    //     const port = await Util.getPort();
    //     const header = this.getHeaders();
    //     header["Content-Type"] = "application/json";
    //     const res = await Http.put({
    //       url: `http://localhost:${port}/api/oneroster/results/${sourcedId}`,
    //       data: result.toJson(),
    //       headers: header,
    //     });
    //     console.log(
    //       "🚀 ~ file: OneRosterApi.ts:281 ~ OneRosterApi ~ putResult ~ res:",
    //       JSON.stringify(res)
    //     );
    //   }
    //   return result;
    // } catch (error) {
    //   console.log(error);
    // }
  }

  async getClassForUserForSubject(
    userId: string,
    subjectCode: string
  ): Promise<Class | undefined> {
    let classes: Class[] = [];
    if (this.classes[userId] && this.classes[userId].length > 0) {
      classes = this.classes[userId];
    } else {
      classes = await this.getClassesForUser(userId);
      this.classes[userId] = classes;
    }
    const classForSub = classes.find(
      (value: Class, index: number, obj: Class[]) =>
        value.classCode === subjectCode
    );
    return classForSub ?? classes[0];
  }

  async getUser(userId: string): Promise<User | undefined> {
    throw new Error("Method not implemented.");
    // try {
    //   const response = await Http.get({
    //     url: "https://mocki.io/v1/c856c037-87d1-4722-b623-a6e0fd302ae9",
    //     headers: this.getHeaders(),
    //   }).catch((e) => {
    //     console.log("error on getResultsForStudentForClass", e);
    //   });
    //   const result = response && response.status === 200 ? response.data : {};
    //   if (result.user) return User.fromJson(result.user);
    // } catch (error) {
    //   console.log("error");
    // }
  }

  async updatePreQuiz(
    subjectCode: string,
    classId: string,
    studentId: string,
    chapterId: string,
    updateNextChapter = true
  ): Promise<Result | undefined> {
    throw new Error("Method not implemented.");
    // try {
    //   const curInstance = CurriculumController.getInstance();
    //   const chapters = await curInstance.allChapterForSubject(subjectCode);
    //   const chapterIndex = chapters.findIndex(
    //     (chapter: Chapter) => chapter.id === chapterId
    //   );
    //   let score =
    //     ((chapterIndex + (updateNextChapter ? 2 : 1)) / chapters.length) * 100;
    //   if (score > 100) score = 100;
    //   let index = (score * chapters.length) / 100 - 1;
    //   const isFloat = (x: number) => !!(x % 1);
    //   if (isFloat(index)) {
    //     index = Math.round(index);
    //   }
    //   console.log(
    //     "updatePreQuiz",
    //     score,
    //     chapterIndex,
    //     chapterId,
    //     index,
    //     chapters[Math.min(index, chapters.length - 1)]?.id
    //   );
    //   const preQuiz = await this.getPreQuiz(subjectCode, classId, studentId);
    //   const date = new Date().toISOString();
    //   let preQuizResult: Result;
    //   if (preQuiz) {
    //     preQuiz.dateLastModified = date;
    //     preQuiz.score = Math.max(score, preQuiz.score);
    //     preQuizResult = preQuiz;
    //   } else {
    //     const sourcedId = uuidv4();
    //     const lessonId = subjectCode + "_" + PRE_QUIZ;
    //     const lineItem: Assignment =
    //       (await this.getLineItemForClassForLessonId(classId, lessonId)) ??
    //       (await this.putLineItem(classId, lessonId));
    //     // const lineItems = await this.getLineItemsForClassForLessonId(classId, lessonId);
    //     // const lineItem: LineItem = (lineItems && lineItems.length > 0) ? lineItems[0] : await this.putLineItem(classId, lessonId);
    //     preQuizResult = new Result(
    //       {
    //         href: lineItem?.sourcedId,
    //         sourcedId: lineItem?.sourcedId,
    //         type: "lineItem",
    //       },
    //       {
    //         href: studentId,
    //         sourcedId: studentId,
    //         type: "user",
    //       },
    //       lineItem.class,
    //       ScoreStatusEnum.SUBMITTED,
    //       score,
    //       date,
    //       "",
    //       sourcedId,
    //       OneRosterStatus.ACTIVE,
    //       date,
    //       { lessonId: lessonId }
    //     );
    //   }
    //   if (
    //     Capacitor.getPlatform() === "android" &&
    //     Auth.i.userAccountName !== DEBUG_15
    //   ) {
    //     const port = await Util.getPort();
    //     const header = this.getHeaders();
    //     header["Content-Type"] = "application/json";
    //     const res = await Http.put({
    //       url: `http://localhost:${port}/api/oneroster/results/${preQuizResult.sourcedId}`,
    //       data: preQuizResult.toJson(),
    //       headers: header,
    //     });
    //     console.log(
    //       "🚀 ~ file: OneRosterApi.ts:370 ~ OneRosterApi ~ updatePreQuiz ~ res:",
    //       JSON.stringify(res)
    //     );
    //   }
    //   // Http.put({ url: `/results/${preQuizresult.sourcedId}`, data: { result: preQuizresult.toJson() }, headers: this.getHeaders() })
    //   if (!this.preQuizMap[studentId]) {
    //     this.preQuizMap[studentId] = {};
    //   }
    //   this.preQuizMap[studentId][subjectCode] = preQuizResult;

    //   if (this.lessonMap[studentId] == null) {
    //     this.lessonMap[studentId] = {};
    //   }
    //   this.lessonMap[studentId][subjectCode + "_" + PRE_QUIZ] = preQuizResult;

    //   //temp storing prequiz locally
    //   const json = localStorage.getItem(TEMP_LESSONS_STORE());
    //   let lessons: any = {};
    //   if (json) {
    //     lessons = JSON.parse(json);
    //   }
    //   lessons[preQuizResult.metaData.lessonId] = preQuizResult?.score;
    //   localStorage.setItem(TEMP_LESSONS_STORE(), JSON.stringify(lessons));

    //   return preQuizResult;
    // } catch (error) {
    //   console.log(error);
    // }
  }

  async getChapterForPreQuizScore(
    subjectCode: string,
    score: number,
    chapters: Chapter[] | undefined = undefined
  ): Promise<Chapter> {
    if (!chapters) {
      const curInstance = CurriculumController.getInstance();
      chapters = await curInstance.allChapterForSubject(subjectCode);
    }
    if (score > 100) score = 100;
    let index = (score * chapters.length) / 100 - 1;
    const isFloat = (x: number) => !!(x % 1);
    if (isFloat(index)) index = Math.round(index);
    console.log(
      "getChapterForPreQuizScore",
      score,
      index,
      chapters[Math.min(index, chapters.length - 1)]?.id
    );
    return chapters[Math.min(index, chapters.length - 1)] ?? chapters[1];
  }
}
