// @ts-nocheck
import { HttpHeaders } from "@capacitor-community/http";
import {
  COURSES,
  CURRENT_USER,
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODES,
  TableTypes,
} from "../../common/constants";
import { Chapter } from "../../interface/curriculumInterfaces";
import Assignment from "../../models/assignment";
import Auth from "../../models/auth";
import Class from "../../models/class";
import CurriculumController from "../../models/curriculumController";
import Result from "../../models/result";
import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
// import { Chapter } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { StudentLessonResult } from "../../common/courseConstants";
import StudentProfile from "../../models/studentProfile";
import { Unsubscribe } from "@firebase/firestore";
import { AvatarObj } from "../../components/animation/Avatar";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import { DocumentData } from "firebase/firestore";
import { RoleType } from "../../interface/modelInterfaces";
import tincan from "../../tincan";

interface IGetStudentResultStatement {
  agent: {
    mbox: string;
  };
  verb?: {
    id: string;
  };
  activity?: {
    id: string;
  };
  since?: string;
  until?: string;
  limit?: number;
}

interface ICreateStudentResultStatement {
  actor: {
    name: string;
    mbox: string;
  };
  verb: {
    id: string;
    display: {
      "en-US": string;
    };
  };
  object: {
    id: string;
    definition: {
      name: {
        "en-US": string;
      };
    };
  };
}

interface course {
  code: string | null;
  color: string | null;
  created_at: string;
  curriculum_id: string | null;
  description: string | null;
  grade_id: string | null;
  id: string;
  image: string | null;
  is_deleted: boolean | null;
  name: string;
  sort_index: number | null;
  subject_id: string | null;
  updated_at: string | null;
}

export class OneRosterApi implements ServiceApi {
  public static i: OneRosterApi;
  private preQuizMap: { [key: string]: { [key: string]: Result } } = {};
  private classes: { [key: string]: Class[] } = {};
  private lessonMap: { [key: string]: { [key: string]: Result } } = {};

  getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  getAdditionalCourses(studentId: string): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }

  addCourseForParentsStudent(
    courses: Course[],
    student: User
  ): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }

  getCoursesForClassStudent(classId: string): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }

  getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null> {
    throw new Error("Method not implemented.");
  }
  getLesson(id: string): Promise<Lesson | undefined> {
    throw new Error("Method not implemented.");
  }
  getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }
  getChapterById(id: string): Promise<Chapter | undefined> {
    throw new Error("Method not implemented.");
  }
  getDifferentGradesForCourse(course: TableTypes<"course">): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }> {
    throw new Error("Method not implemented.");
  }
  getAssignmentById(id: string): Promise<TableTypes<"assignment"> | undefined> {
    throw new Error("Method not implemented.");
  }
  assignmentListner(
    classId: string,
    onDataChange: (user: Assignment | undefined) => void
  ) {
    throw new Error("Method not implemented.");
  }
  removeAssignmentChannel() {
    throw new Error("Method not implemented.");
  }
  assignmentUserListner(
    studentId: string,
    onDataChange: (user: Assignment | undefined) => void
  ) {
    throw new Error("Method not implemented.");
  }
  liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (user: LiveQuizRoomObject | undefined) => void
  ): Unsubscribe {
    throw new Error("Method not implemented.");
  }
  updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  joinLiveQuiz(
    studentId: string,
    assignmentId: string
  ): Promise<string | undefined> {
    throw new Error("Method not implemented.");
  }
  private constructor() {}
  getChaptersForCourse(courseId: string): Promise<
    {
      course_id: string | null;
      created_at: string;
      id: string;
      image: string | null;
      is_deleted: boolean | null;
      name: string | null;
      sort_index: number | null;
      sub_topics: string | null;
      updated_at: string | null;
    }[]
  > {
    throw new Error("Method not implemented.");
  }
  getLessonsForChapter(chapterId: string): Promise<
    {
      cocos_chapter_code: string | null;
      cocos_lesson_id: string | null; //     JSON.stringify(error)
      //     JSON.stringify(error)
      //   );
      cocos_subject_code: string | null;
      created_at: string;
      created_by: string | null;
      id: string;
      image: string | null;
      is_deleted: boolean | null;
      language_id: string | null;
      name: string | null;
      outcome: string | null;
      plugin_type: string | null;
      status: string | null;
      subject_id: string | null;
      target_age_from: number | null;
      target_age_to: number | null;
      updated_at: string | null;
    }[]
  > {
    throw new Error("Method not implemented.");
  }
  updateRewardsForStudent(
    studentId: string,
    unlockedReward: LeaderboardRewards
  ) {
    throw new Error("Method not implemented.");
  }

  getUserByDocId(studentId: string): Promise<TableTypes<"user"> | undefined> {
    throw new Error("Method not implemented.");
  }
  updateRewardAsSeen(studentId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getLeaderboardStudentResultFromB2CCollection(
    studentId: string
  ): Promise<LeaderboardInfo | undefined> {
    throw new Error("Method not implemented.");
  }
  getRewardsById(
    id: number,
    periodType: string
  ): Promise<TableTypes<"reward"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getUserSticker(userId: string): Promise<TableTypes<"user_sticker">[]> {
    throw new Error("Method not implemented.");
  }
  getUserBonus(userId: string): Promise<TableTypes<"user_bonus">[]> {
    throw new Error("Method not implemented.");
  }
  getUserBadge(userId: string): Promise<TableTypes<"user_badge">[]> {
    throw new Error("Method not implemented.");
  }
  getBadgesByIds(ids: string[]): Promise<TableTypes<"badge">[]> {
    throw new Error("Method not implemented.");
  }
  getStickersByIds(ids: string[]): Promise<TableTypes<"sticker">[]> {
    throw new Error("Method not implemented.");
  }
  getAvatarInfo(): Promise<AvatarObj | undefined> {
    throw new Error("Method not implemented.");
  }
  updateTcAccept(userId: string) {
    throw new Error("Method not implemented.");
  }

  deleteAllUserData(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getCoursesByGrade(gradeDocId: any): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  async getAllCourses(): Promise<TableTypes<"course">[]> {
    try {
      const jsonFile = "assets/courses/" + id + "/res/course.json";
      const courseJson = await Util.loadJson(jsonFile);
      const metaC = courseJson.metadata;

      console.log("getCourses data ", courseJson.metadata);
      let tCourse: TableTypes<"course"> = {
        code: metaC.courseCode,
        color: metaC.color,
        created_at: "",
        curriculum_id: metaC.curriculum,
        description: null,
        grade_id: metaC.grade,
        id: "",
        image: metaC.thumbnail,
        is_deleted: null,
        name: metaC.title,
        sort_index: metaC.sortIndex,
        subject_id: metaC.subject,
        updated_at: null,
      };
      return tCourse;
    } catch (error) {
      console.error("Error fetching JSON:", error);
    }
  }
  getSchoolById(id: string): Promise<TableTypes<"school"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getLeaderboardResults(
    sectionId: string,
    isWeeklyData: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined> {
    throw new Error("Method not implemented.");
  }

  subscribeToClassTopic(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getAllLessonsForCourse(courseId: string): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }
  getLiveQuizLessons(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    throw new Error("Method not implemented.");
  }
  getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<DocumentData | undefined> {
    throw new Error("Method not implemented.");
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string
  ): Promise<Lesson | undefined> {
    throw new Error("Method not implemented.");
  }
  getDataByInviteCode(inviteCode: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  linkStudent(inviteCode: number, studentId: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]> {
    throw new Error("Method not implemented.");
  }
  async getStudentProgress(studentId: string): Promise<Map<string, string>> {
    const agentEmail = "karan@gmail.com"; // This should be replaced with the local storage login email

    const currentDate = new Date().toISOString();
    const queryStatement: IGetStudentResultStatement = {
      agent: {
        mbox: `mailto:${agentEmail}`,
      },
      verb: {},
      activity: {
        id: "http://example.com/activity/12345",
      },
      since: currentDate,
    };

    // Retrieve the statements for the agent
    const statements = await this.getStatements(agentEmail, queryStatement);
    return statements;
  }

  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result"> }> {
    const agentEmail = "karan@gmail.com"; // This should be replaced with the local storage login email
    const currentDate = new Date().toISOString();
    const queryStatement: IGetStudentResultStatement = {
      agent: {
        mbox: `mailto:${agentEmail}`,
      },
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
      },
      activity: {
        id: "http://example.com/activity/12345",
      },
      since: currentDate,
    };

    // Retrieve the statements for the agent
    await this.sendStatement();
    const statements = await this.getStatements(agentEmail, queryStatement);

    return statements;
  }

  sendStatement = async (): Promise<void> => {
    const statement = this.createStatement();
    try {
      await tincan.sendStatement(statement as any);
      console.log("Statement sent successfully:", statement);
    } catch (error) {
      console.error("Error sending statement:", error);
    }
  };

  getClassById(id: string): Promise<TableTypes<"class"> | undefined> {
    throw new Error("Method not implemented.");
  }
  isStudentLinked(studentId: string, fromCache: boolean): Promise<boolean> {
    // throw new Error("Method not implemented.");
    return true;
  }
  getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    throw new Error("Method not implemented.");
  }
  getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    return [];
  }

  isUserTeacher(userId: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getClassesForSchool(
    schoolId: string,
    userId: string
  ): Promise<TableTypes<"class">[]> {
    throw new Error("Method not implemented.");
  }
  getStudentsForClass(classId: string): Promise<TableTypes<"user">[]> {
    throw new Error("Method not implemented.");
  }
  get currentMode(): MODES {
    // throw new Error("Method not implemented.");
    return "PARENT";
  }

  set currentMode(value: MODES) {
    // throw new Error("Method not implemented.");
    console.log("Parents");
  }

  getSubject(id: string): Promise<TableTypes<"subject"> | undefined> {
    throw new Error("Method not implemented.");
  }

  async getCourse(id: string): Promise<TableTypes<"course"> | undefined> {
    try {
      const jsonFile = "assets/courses/" + id + "/res/course.json";
      const courseJson = await Util.loadJson(jsonFile);
      const metaC = courseJson.metadata;

      console.log("getCourses data ", courseJson.metadata);
      let tCourse: TableTypes<"course"> = {
        code: metaC.courseCode,
        color: metaC.color,
        created_at: "",
        curriculum_id: metaC.curriculum,
        description: null,
        grade_id: metaC.grade,
        id: "",
        image: metaC.thumbnail,
        is_deleted: null,
        name: metaC.title,
        sort_index: metaC.sortIndex,
        subject_id: metaC.subject,
        updated_at: null,
      };
      return tCourse;
    } catch (error) {
      console.error("Error fetching JSON:", error);
    }
  }

  deleteProfile(studentId: string) {
    throw new Error("Method not implemented.");
  }

  updateStudent(
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
    throw new Error("Method not implemented.");
  }

  updateUserProfile(
    user: TableTypes<"user">,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined
  ): Promise<TableTypes<"user">> {
    throw new Error("Method not implemented.");
  }

  updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getCoursesByClassId(classId: string): Promise<TableTypes<"class_course">[]> {
    throw new Error("Method not implemented.");
  }
  deleteUserFromClass(userId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    throw new Error("Method not implemented.");
  }
  updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<"favorite_lesson">> {
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
  getLanguageWithId(id: string): Promise<TableTypes<"language"> | undefined> {
    throw new Error("Method not implemented.");
    // console.log("hello");
  }
  getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    throw new Error("Method not implemented.");
  }
  getAllGrades(): Promise<TableTypes<"grade">[]> {
    throw new Error("Method not implemented.");
  }
  getAllLanguages(): Promise<TableTypes<"language">[]> {
    throw new Error("Method not implemented.");
  }
  getParentStudentProfiles(): any {
    const users = localStorage.getItem(CURRENT_USER);
    const currentUser = JSON.parse(users);
    console.log(
      "OneRosterApi ~ getParentStudentProfiles ~ Ln:442",
      currentUser.actor.name
    );
    const { actor, given_name, registration } = currentUser;
    const user: TableTypes<"user"> = {
      respectLaunchVersion: 1.1,
      age: null,
      avatar: "/assets/avatar/Aligator.png",
      created_at: "null",
      curriculum_id: "7d560737-746a-4931-a49f-02de1ca526bd",
      email: actor.mbox[0],
      fcm_token: null,
      gender: "male",
      grade_id: "c802dce7-0840-4baf-b374-ef6cb4272a76",
      id: "0315757f-c525-4166-9370-ff8d0b3c7333",
      image: null,
      is_deleted: null,
      is_tc_accepted: true,
      language_id: "en",
      music_off: null,
      name: given_name,
      phone: null,
      sfx_off: null,
      student_id: "23",
      updated_at: null,
    };
    return user;
  }

  getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined
  ): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }

  updateSoundFlag(userId: string, value: boolean) {
    throw new Error("Method not implemented.");
  }
  updateMusicFlag(userId: string, value: boolean) {
    throw new Error("Method not implemented.");
  }
  updateLanguage(userId: string, value: string) {
    throw new Error("Method not implemented.");
  }
  updateFcmToken(userId: string) {
    throw new Error("Method not implemented.");
  }

  getStudentClassesAndSchools(studentId: string): Promise<any> {
    return [];
  }

  get currentStudent(): TableTypes<"user"> | undefined {
    // throw new Error("Method not implemented.");
    return [];
  }
  set currentStudent(value: TableTypes<"user"> | undefined) {
    // throw new Error("Method not implemented.");
    return [];
  }
  get currentClass(): TableTypes<"class"> | undefined {
    throw new Error("Method not implemented.");
  }
  set currentClass(value: TableTypes<"class"> | undefined) {
    throw new Error("Method not implemented.");
  }
  get currentSchool(): TableTypes<"school"> | undefined {
    throw new Error("Method not implemented.");
  }
  set currentSchool(value: TableTypes<"school"> | undefined) {
    throw new Error("Method not implemented.");
  }

  get currentCourse():
    | Map<string, TableTypes<"course"> | undefined>
    | undefined {
    throw new Error("Method not implemented.");
  }
  set currentCourse(
    value: Map<string, TableTypes<"course"> | undefined> | undefined
  ) {
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
  ): Promise<TableTypes<"user">> {
    throw new Error("Method not implemented.");
  }
  createStudentProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | null,
    gradeDocId: string | null,
    languageDocId: string | null,
    classId: string,
    role: string,
    studentId: string
  ): Promise<TableTypes<"user">> {
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
    //       updatedAt: "..Date/Time..",
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
    //     preQuiz.updatedAt = date;
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

  public async getCoursesFromLesson(
    lessonId: string
  ): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }

  searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }
  createOrUpdateAssignmentCart(
    userId: string,
    lessons: string
  ): Promise<boolean | undefined> {
    throw new Error("Method not implemented.");
  }
  getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<"assignment_cart"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string
  ): Promise<String | undefined> {
    throw new Error("Method not implemented.");
  }
  getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseId: string,
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean
  ): Promise<TableTypes<"assignment">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  getStudentLastTenResults(
    studentId: string,
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[]> {
    throw new Error("Method not implemented.");
  }
  getResultByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  getStudentResultByDate(
    studentId: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  getLessonsBylessonIds(
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"lesson">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    throw new Error("Method not implemented.");
  }

  private createStatement = (
    name: string,
    lesson: string
  ): ICreateStudentResultStatement => {
    return {
      actor: {
        name: name,
        mbox: `mailto:${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
      },
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: { "en-US": "completed" },
      },
      object: {
        // id: `http://example.com/activities/${lesson}`,
        lessonId: "hindi",
        chapterId: "chhava",
        definition: {
          name: { "en-US": lesson },
        },
      },
    };
  };

  sendStatement = async (): Promise<void> => {
    const statement = this.createStatement("John Doe", "Sample Lesson");
    try {
      await tincan.sendStatement(statement as any);
      console.log("Statement sent successfully:", statement);
      return true;
    } catch (error) {
      console.error("Error sending statement:", error);
      return false;
    }
  };

  getStatements = async (
    agentEmail: string,
    queryStatement?: IGetStudentResultStatement
  ): Promise<void> => {
    try {
      const query = {
        ...queryStatement,
        agent: { mbox: `mailto:${agentEmail}` },
      };

      const result = await tincan.getStatements(query);
      const statements: ICreateStudentResultStatement[] =
        result?.statements ?? [];

      console.log(`Retrieved Statements for agent: ${agentEmail}`, statements);

      // Parse statements
      const parsedStatements = statements.map((statement) => {
        const { Row, Insert, Update } = statement;
        const parsedStatement = Row ?? Insert ?? Update;
        return {
          id: parsedStatement?.id ?? null,
          studentId: parsedStatement?.student_id ?? null,
          courseId: parsedStatement?.course_id ?? null,
          score: parsedStatement?.score ?? null,
          timeSpent: parsedStatement?.time_spent ?? null,
          createdAt: parsedStatement?.created_at ?? null,
          updatedAt: parsedStatement?.updated_at ?? null,
          assignmentId: parsedStatement?.assignment_id ?? null,
          lessonId: parsedStatement?.lesson_id ?? null,
          chapterId: parsedStatement?.chapter_id ?? null,
          schoolId: parsedStatement?.school_id ?? null,
          correctMoves: parsedStatement?.correct_moves ?? null,
          wrongMoves: parsedStatement?.wrong_moves ?? null,
          isDeleted: parsedStatement?.is_deleted ?? null,
          relationships: Array.isArray(statement.Relationships)
            ? statement.Relationships.map((rel) => ({
                relation: rel?.referencedRelation ?? null,
                foreignKey: rel?.foreignKeyName ?? null,
                columns: rel?.columns ?? null,
              }))
            : [],
        };
      });

      console.log("Parsed Statements:", parsedStatements);
    } catch (error: unknown) {
      console.error("Error fetching statements:", error);
    }
  };
}
