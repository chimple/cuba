// @ts-nocheck
import { HttpHeaders } from "@capacitor-community/http";
import {
  COURSES,
  CURRENT_STUDENT,
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
import { Util } from "../../utility/util";
import ApiDataProcessor from "./ApiDataProcessor";
import { APIMode, ServiceConfig } from "../ServiceConfig";



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
    objectType?: string;
    definition: {
      name: {
        "en-US": string;
      };
      extensions?: {
        "http://example.com/xapi/lessonId"?: string;
        "http://example.com/xapi/courseId"?: string;
      };
    };
  };
  result?: {
    success: boolean;
    completion: boolean;
    response: string;
    score?: {
      raw?: number;
    };
    duration?: string;
    extensions?: {
      "http://example.com/xapi/correctMoves"?: number;
      "http://example.com/xapi/wrongMoves"?: number;
      "http://example.com/xapi/assignmentId"?: string;
    };
  };
  context?: {
    extensions?: {
      "http://example.com/xapi/studentId"?: string;
      "http://example.com/xapi/schoolId"?: string;
      "http://example.com/xapi/chapterId"?: string;
      "http://example.com/xapi/isDeleted"?: boolean;
      "http://example.com/xapi/createdAt"?: string;
      "http://example.com/xapi/updatedAt"?: string;
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
  public currentCourse: TableTypes<"course"> = {};
  public currentChapter: TableTypes<"chapter"> = {};
  public currentLesson: TableTypes<"lesson"> = {};
  public allCoursesJson: { [key: string]: TableTypes<"course"> } = {};
  public allCourseIds = ["en_g1", "en_g2", "maths_g1", "maths_g2", "puzzle"]; //Later get all available courses
  private favoriteLessons: { [userId: string]: string[] } = {};
  private FAVORITE_LESSONS_STORAGE_KEY = "favorite_lessons";

  private buildXapiQuery(currentUser: { name?: string }): { agentEmail: string; queryStatement: IGetStudentResultStatement } {
    const agentEmail = `mailto:${currentUser?.name?.toLowerCase().replace(/\s+/g, "")}@example.com`;

    const queryStatement: IGetStudentResultStatement = {
      agent: {
        mbox: agentEmail,
      },
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed", // Filtering for completed lessons
      },
    };

    return { agentEmail, queryStatement };
  }

  public async loadCourseJson(courseId: string) {
    try {
      console.log("loadCourseJson ", this.allCoursesJson, this.allCoursesJson[courseId] != undefined, this.allCoursesJson[courseId] != undefined);

      if (this.allCoursesJson[courseId] != undefined) return this.allCoursesJson[courseId]
      const jsonFile = "assets/courses/" + courseId + ".json";
      const res = await Util.loadJson(jsonFile)
      console.log("const jsonFile ", jsonFile, res);
      return res;
    } catch (error) {
      console.error(`Failed to load ${courseId}:`, error);
      // throw error;
    }
  }

  async getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    try {

      // const courseJson = await this.loadCourseJson(this.currentCourse?.course_id || this.allCourseIds[0]);
      // const metaC = courseJson.metadata;

      // console.log("getCourses data ", courseJson.metadata);
      // let tCourse: TableTypes<"course"> = {
      //   code: metaC.courseCode,
      //   color: metaC.color,
      //   created_at: "null",
      //   curriculum_id: metaC.curriculum,
      //   description: null,
      //   grade_id: metaC.grade,
      //   id: this.allCourseIds[0],
      //   image: metaC.thumbnail,
      //   is_deleted: null,
      //   name: metaC.title,
      //   sort_index: metaC.sortIndex,
      //   subject_id: metaC.subject,
      //   updated_at: null,
      // };
      // let res = [];
      // res.push(tCourse);

      return this.getAllCourses()
    } catch (error) {
      console.error("Error fetching JSON:", error);
    }
  }
  async getAdditionalCourses(studentId: string): Promise<TableTypes<"course">[]> {
    try {
      let res: TableTypes<"course">[] = [];
      for (let i = 0; i < this.allCourseIds.length; i++) {
        const element = this.allCourseIds[i];
        console.log("const element = allCourseIds[i]; ", element);
        const courseJson = await this.loadCourseJson(element);
        console.log("getCourses data ", courseJson.metadata);
        const metaC = courseJson.metadata;
        let tCourse: TableTypes<"course"> = {
          code: metaC.courseCode,
          color: metaC.color,
          created_at: "null",
          curriculum_id: metaC.curriculum,
          description: null,
          grade_id: metaC.grade,
          id: metaC.courseCode,
          image: metaC.thumbnail,
          is_deleted: null,
          name: metaC.title,
          sort_index: metaC.sortIndex,
          subject_id: metaC.subject,
          updated_at: null,
        };
        res.push(tCourse);
      }
      return res;
    } catch (error) {
      console.error("Error fetching JSON:", error);
    }
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

  async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null> {
    try {

      const courseJson = await this.loadCourseJson(this.currentCourse?.course_id || this.allCourseIds[0]);
      const lessonwithCocosLessonIds = courseJson.groups

      console.log("getLessonWithCocosLessonId :", lessonwithCocosLessonIds);

      for (const group of lessonwithCocosLessonIds) {
        for (const lesson of group.navigation) {
          if (lesson.cocosChapterCode === lessonId) {
            return {
              id: lesson.id,
              name: lesson.title,
              chapter_id: group.metadata.id,
              subject_id: lesson.subject,
              outcome: lesson.outcome,
              status: lesson.status,
              type: lesson.type,
              thumbnail: lesson.thumbnail || null,
              plugin_type: lesson.pluginType,
              created_at: "null",
              updated_at: "null",
              is_deleted: null
            };
          }
        }
      }

    } catch (error) {
      console.error("Error fetching lesson by CocosLessonId:", error);
      return null;
    }
  }
  async getLesson(id: string): Promise<Lesson | undefined> {
    try {
      const courseJson = await this.loadCourseJson(this.currentCourse?.course_id || this.allCourseIds[0]);
      const getLessonData = courseJson.groups
      console.log("getLesson : ", getLessonData);

      for (const group of getLessonData) {
        for (const lesson of group.navigation) {
          if (lesson.id === id) {
            console.log("lesson:", lesson);

            return {
              id: lesson.id,
              title: lesson.title,
              chapter_id: group.metadata.id,
              chapter_title: group.metadata.title,
              subject_id: lesson.subject,
              outcome: lesson.outcome,
              status: lesson.status,
              type: lesson.type,
              thumbnail: lesson.thumbnail || null,
              plugin_type: lesson.pluginType,
              created_at: "null",
              updated_at: "null",
              is_deleted: null
            };
          }
        }
      }

    } catch (error) {
      console.error("Error fetching lesson:", error);
      return undefined;
    }
  }
  getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }
  getChapterById(id: string): Promise<Chapter | undefined> {
    throw new Error("Method not implemented.");
  }
  async getDifferentGradesForCourse(course: TableTypes<"course">): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }> {
    try {
      // const courseJson = await this.loadCourseJson(this.currentCourse?.course_id || this.allCourseIds[0]);
      // console.log("const courseJson ", courseJson);

      // const metaC = courseJson.metadata;

      // console.log("getCourses data ", courseJson.metadata);
      // let tCourse: TableTypes<"course"> = {
      //   code: metaC.courseCode,
      //   color: metaC.color,
      //   created_at: "null",
      //   curriculum_id: metaC.curriculum,
      //   description: null,
      //   grade_id: metaC.grade,
      //   id: this.allCourseIds[0],
      //   image: metaC.thumbnail,
      //   is_deleted: null,
      //   name: metaC.title,
      //   sort_index: metaC.sortIndex,
      //   subject_id: metaC.subject,
      //   updated_at: null,
      // };
      // let res = [];
      // res.push(tCourse);
      let res = await this.getAllCourses();
      console.log("let res = this.getAllCourses(); ", res);

      let gradeRes: TableTypes<"grade">[] = this.getAllGrades()
      // [
      //   {
      //     created_at: "null",
      //     description: "",
      //     id: "g1",
      //     image: null,
      //     is_deleted: null,
      //     name: "Grade 1",
      //     sort_index: 1,
      //     updated_at: "null",
      //   },
      // ];
      console.log("async getDifferentGradesForCourse() ", { grades: gradeRes, courses: res });

      return { grades: gradeRes, courses: res };
    } catch (error) {
      console.error("Error fetching JSON:", error);
    }
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
    // throw new Error("Method not implemented.");
    return undefined;
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
  private constructor() { }
  async getChaptersForCourse(courseId: string): Promise<
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
    try {
      const courseJson = await this.loadCourseJson(courseId);

      console.log("getChaptersForCourse data:", courseJson.groups);
      this.currentCourse.course_id = courseJson.metadata.courseCode;

      if (!courseJson.groups) return [];

      const chapters: TableTypes<"chapter">[] = courseJson.groups.map(
        (group: any) => ({
          id: group.metadata.id,
          name: group.metadata.title,
          image: group.metadata.thumbnail || "",
          course_id: courseId,
          created_at: null,
          updated_at: null,
          is_deleted: null,
        })
      );

      return chapters;
    } catch (error) {
      console.error("Error fetching chapters for course:", error);
    }
  }
  async getLessonsForChapter(
    chapterId: string
  ): Promise<TableTypes<"lesson">[] | undefined> {
    try {
      const courseJson = await this.loadCourseJson(this.currentCourse?.course_id || this.allCourseIds[0]);
      console.log("getLessonsForChapter data: ", this.currentCourse?.course_id || this.allCourseIds[0], courseJson.groups);
      const chapter = courseJson.groups.find(
        (group: any) => group.metadata.id === chapterId
      );
      if (!chapter || !chapter.navigation) return [];

      const lessons: TableTypes<"lesson">[] = chapter.navigation.map(
        (lesson: any) => ({
          cocos_chapter_code: lesson.cocosChapterCode,
          cocos_lesson_id: lesson.id,
          cocos_subject_code: lesson.cocosSubjectCode,
          color: lesson.color,
          created_at: null,
          created_by: null,
          id: lesson.id,
          image: lesson.thumbnail || "",
          is_deleted: null,
          language_id: lesson.language,
          name: lesson.title,
          outcome: lesson.outcome || null,
          plugin_type: lesson.pluginType,
          status: lesson.status,
          chapter_id: chapterId,
          subject_id: lesson.subject,
          target_age_from: lesson.targetAgeFrom || null,
          target_age_to: lesson.targetAgeTo || null,
        })
      );

      return lessons;
    } catch (error) {
      console.error("Error fetching lessons for chapter:", error);
    }
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
      let res: TableTypes<"course">[] = [];
      for (let i = 0; i < this.allCourseIds.length; i++) {
        const element = this.allCourseIds[i];
        console.log("const element = allCourseIds[i]; ", element);
        const courseJson = await this.loadCourseJson(element);
        console.log("getCourses data ", courseJson.metadata);
        const metaC = courseJson.metadata;
        let tCourse: TableTypes<"course"> = {
          code: metaC.courseCode,
          color: metaC.color,
          created_at: "null",
          curriculum_id: metaC.curriculum,
          description: null,
          grade_id: metaC.grade,
          id: metaC.courseCode,
          image: metaC.thumbnail,
          is_deleted: null,
          name: metaC.title,
          sort_index: metaC.sortIndex,
          subject_id: metaC.subject,
          updated_at: null,
        };
        res.push(tCourse);
      }
      console.log("getAllCourses() ", res);

      return res;
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
  async getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]> {
    try {
      const loggedStudent = await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!loggedStudent || !loggedStudent.name) {
        throw new Error("No logged-in student found");
      }

      const agentEmail = `mailto:${loggedStudent?.name?.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const queryStatement: IGetStudentResultStatement = {
        agent: {
          mbox: agentEmail,
        },
        verb: {
          id: "http://adlnet.gov/expapi/verbs/completed",
        },
      };

      const statements = await this.getStatements(agentEmail, queryStatement);
      console.log(
        "const statements = await this.getStatements(agentEmail, queryStatement); ",
        statements
      );

      return statements;
    } catch (error) {
      console.error("Error in getStudentResultInMap:", error);
      return {};
    }
  }
  async getStudentProgress(): Promise<Map<string, string>> {
    try {
      const loggedStudent = await ServiceConfig.getI().authHandler.getCurrentUser();;
      if (!loggedStudent || !loggedStudent.name) {
        throw new Error("No logged-in student found");
      }

      const agentEmail = `mailto:${loggedStudent?.name?.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const queryStatement: IGetStudentResultStatement = {
        agent: {
          mbox: agentEmail,
        },
      };

      const statements = await this.getStatements(agentEmail, queryStatement);

      return ApiDataProcessor.dataProcessorGetStudentProgress(statements);
      // return statements;
    } catch (error) {
      console.error("Error in getStudentProgress:", error);
      return new Map();
    }
  }

  async getStudentResultInMap(
    studentId?: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result"> }> {
    try {
      const loggedStudent =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      console.log("const loggedStudent ", loggedStudent);

      if (!loggedStudent || !loggedStudent.name) {
        throw new Error("No logged-in student found");
      }

      const agentEmail = `mailto:${loggedStudent?.name?.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const queryStatement: IGetStudentResultStatement = {
        agent: {
          mbox: agentEmail,
        },
        verb: {
          id: "http://adlnet.gov/expapi/verbs/completed",
        },
      };

      const statements = await this.getStatements(agentEmail, queryStatement);

      const res =
        ApiDataProcessor.dataProcessorGetStudentResultInMap(statements);
      console.log("getStudentResultInMap const statements ", res);
      return res;
    } catch (error) {
      console.error("Error in getStudentResultInMap:", error);
      return {};
    }
  }

  getClassById(id: string): Promise<TableTypes<"class"> | undefined> {
    throw new Error("Method not implemented.");
  }
  isStudentLinked(studentId: string, fromCache: boolean): Promise<boolean> {
    // throw new Error("Method not implemented.");
    return false;
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
    return MODES.PARENT;
  }

  set currentMode(value: MODES) {
    // throw new Error("Method not implemented.");
    console.log("Parents");
    this._currentMode = value;
  }

  getSubject(id: string): Promise<TableTypes<"subject"> | undefined> {
    throw new Error("Method not implemented.");
  }

  async getCourse(id: string): Promise<TableTypes<"course"> | undefined> {
    try {
      const courseJson = await this.loadCourseJson(id);
      const metaC = courseJson.metadata;

      let tCourse: TableTypes<"course"> = {
        code: metaC.courseCode,
        color: metaC.color,
        created_at: "null",
        curriculum_id: metaC.curriculum,
        description: null,
        grade_id: metaC.grade,
        id: metaC.courseCode,
        image: metaC.thumbnail,
        is_deleted: null,
        name: metaC.title,
        sort_index: metaC.sortIndex,
        subject_id: metaC.subject,
        updated_at: null,
      };
      this.currentCourse = tCourse
      console.log("getCourses data ", tCourse);
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
  async getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    try {
      const users = await ServiceConfig.getI().authHandler.getCurrentUser();;
      const currentUser = JSON.parse(users);
      if (!currentUser || !currentUser.name) {
        throw new Error("No logged-in student found");
      }
      const { agentEmail, queryStatement } = this.buildXapiQuery(currentUser);
      // Fetch xAPI statements
      const statements = await this.getStatements(agentEmail, queryStatement);
      const resultMap = new Map<string, StudentLessonResult>();

      statements.forEach((statement: TableTypes<"result">) => {
        const lessonId = statement.object?.id || ""; // Assuming lesson ID is inside 'object.id'

        if (lessonId) {
          const lessonResult: StudentLessonResult = {
            lessonId,
            score: statement.result?.score?.scaled ?? null,
            success: statement.result?.success ?? null,
            completion: statement.result?.completion ?? null,
            timeSpent: statement.result?.timeSpent,
            lastAttemptDate: tatement.result?.lastAttemptDate,
          };

          resultMap.set(lessonId, lessonResult);
        }
      });

      return resultMap;
    } catch (error) {
      console.error("Error in getLessonResultsForStudent:", error);
      return undefined;
    }
  }
  async updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<"favorite_lesson">> {
    // Initialize favorites from localStorage if not already loaded
    if (!this.favoriteLessons[studentId]) {
      const stored = localStorage.getItem(this.FAVORITE_LESSONS_STORAGE_KEY);
      this.favoriteLessons = stored ? JSON.parse(stored) : {};
    }

    // Initialize array for this user if needed
    if (!this.favoriteLessons[studentId]) {
      this.favoriteLessons[studentId] = [];
    }

    // Add lessonId if not already present
    if (!this.favoriteLessons[studentId].includes(lessonId)) {
      this.favoriteLessons[studentId].push(lessonId);
      // Persist to localStorage
      localStorage.setItem(
        this.FAVORITE_LESSONS_STORAGE_KEY,
        JSON.stringify(this.favoriteLessons)
      );
    }

    // Create and return the favorite_lesson object
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const favLesson: TableTypes<"favorite_lesson"> = {
      id: uuid,
      student_id: studentId,
      lesson_id: lessonId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    };

    return favLesson;
  }

  formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `PT${minutes}M${remainingSeconds}S`;
  };

  parseFormattedDuration = (formattedDuration: string): number | undefined => {
    const match = formattedDuration.match(/PT(\d+)M(\d+)S/);
    if (!match) {
      return undefined
      // throw new Error("Invalid duration format");
    }

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);

    return minutes * 60 + seconds;
  };

  async updateResult(
    student: User,
    courseId: string,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number, // in seconds
    assignmentId: string,
    chapterId: string,
    classId: string,
    schoolId: string
  ): Promise<Result> {
    if (!student) {
      throw new Error("Student information is missing.");
    }

    const loggedStudent = await ServiceConfig.getI().authHandler.getCurrentUser();;
    const agentEmail = `mailto:${loggedStudent?.name?.toLowerCase().replace(/\s+/g, "")}@example.com`;

    const statement = {
      id: crypto.randomUUID(),
      actor: {
        mbox: agentEmail,
        name: student.name ?? "John Doe",
      },
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: { "en-US": "completed" },
      },
      object: {
        id: `http://example.com/activity/${lessonId}`,
        definition: {
          name: { "en-US": `Lesson ${lessonId}` },
          extensions: {
            "http://example.com/xapi/courseId": courseId,
            "http://example.com/xapi/lessonId": lessonId,
          },
        },
      },
      result: {
        score: { raw: score },
        success: score > 35,
        completion: true,
        response: `Correct: ${correctMoves}, Wrong: ${wrongMoves}`,
        duration: this.formatDuration(timeSpent),
        extensions: {
          "http://example.com/xapi/correctMoves": correctMoves,
          "http://example.com/xapi/wrongMoves": wrongMoves,
          "http://example.com/xapi/timeSpent": timeSpent,
          "http://example.com/xapi/assignmentId": assignmentId,
        },
      },
      context: {
        extensions: {
          "http://example.com/xapi/studentId": student.id,
          "http://example.com/xapi/classId": classId,
          "http://example.com/xapi/schoolId": schoolId,
          "http://example.com/xapi/chapterId": chapterId,
          "http://example.com/xapi/createdAt": new Date().toISOString(),
          "http://example.com/xapi/updatedAt": new Date().toISOString(),
          "http://example.com/xapi/isDeleted": false,
        },
        contextActivities: {
          grouping: [
            { id: `http://example.com/course/${courseId}` },
            { id: `http://example.com/class/${classId}` },
            { id: `http://example.com/school/${schoolId}` },
            { id: `http://example.com/assignment/${assignmentId}` },
            { id: `http://example.com/chapter/${chapterId}` },
          ],
        },
      },
      timestamp: new Date().toISOString(),
    };

    try {
      await tincan.sendStatement(statement);
      console.log("updateResult ~ statement Success", statement);

      const newResult: TableTypes<"result"> = {
        id: statement.id,
        assignment_id: assignmentId ?? null,
        correct_moves: correctMoves,
        lesson_id: lessonId,
        school_id: schoolId ?? null,
        score: score,
        student_id: student.id,
        time_spent: timeSpent,
        wrong_moves: wrongMoves,
        created_at: statement.context.extensions["http://example.com/xapi/createdAt"],
        updated_at: statement.context.extensions["http://example.com/xapi/updatedAt"],
        is_deleted: false,
        chapter_id: chapterId,
        course_id: courseId ?? "",
      };

      return newResult;
    } catch (error) {
      console.error("Error sending update statement:", error);
      throw new Error("Failed to update student result.");
    }
  }


  getLanguageWithId(id: string): Promise<TableTypes<"language"> | undefined> {
    // throw new Error("Method not implemented.");
    // console.log("hello");
    return undefined;
  }
  getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    let cur: TableTypes<"curriculum">[] = [{
      created_at: "", description: "", id: "chimple", name: "Chimple", image: "", sort_index: 1, is_deleted: false, updated_at: ""
    }]

    return cur
  }
  getAllGrades(): Promise<TableTypes<"grade">[]> {
    let grades: TableTypes<"grade">[] = [{
      created_at: "", description: "", id: "g1", name: "Grade 1", image: "", sort_index: 1, is_deleted: false, updated_at: ""
    }, {
      created_at: "", description: "", id: "g2", name: "Grade 2", image: "", sort_index: 1, is_deleted: false, updated_at: ""
    }, {
      created_at: "", description: "", id: "below_g1", name: "Below Grade 1", image: "", sort_index: 1, is_deleted: false, updated_at: ""
    }]
    return grades
  }
  getAllLanguages(): Promise<TableTypes<"language">[]> {
    return []
    // throw new Error("Method not implemented.");
  }
  async getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    console.log(
      "OneRosterApi ~ getParentStudentProfiles ~ Ln:442",
      currentUser
    );
    let profile: TableTypes<"user">[] = []
    profile.push(currentUser)
    console.log("return profile; ", profile);

    return profile;
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
    return undefined;
  }

  get currentStudent(): TableTypes<"user"> | undefined {
    // throw new Error("Method not implemented.");
    // return [];
    return this._currentStudent;
  }
  set currentStudent(value: TableTypes<"user"> | undefined) {
    // throw new Error("Method not implemented.");
    // return [];
    this._currentStudent = value;
  }
  get currentClass(): TableTypes<"class"> | undefined {
    // throw new Error("Method not implemented.");
    return undefined;
  }
  set currentClass(value: TableTypes<"class"> | undefined) {
    // throw new Error("Method not implemented.");
    this._currentClass = value;
  }
  get currentSchool(): TableTypes<"school"> | undefined {
    throw new Error("Method not implemented.");
  }
  set currentSchool(value: TableTypes<"school"> | undefined) {
    throw new Error("Method not implemented.");
  }

  // get currentCourse():
  //   TableTypes<"course"> {
  //   return this.currentCourse
  //   // throw new Error("Method not implemented.");
  // }
  // set currentCourse(
  //   value: TableTypes<"course">
  // ) {
  //   this.currentCourse = value
  //   // throw new Error("Method not implemented.");
  // }
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
    try {
      const courses: TableTypes<"course">[] = [];

      for (const courseId of this.allCourseIds) {
        const courseJson = await this.loadCourseJson(courseId);

        // Check if any lesson in the course matches the given lesson ID
        const foundLesson = courseJson.groups.some((group: any) =>
          group.navigation.some((lesson: any) => lesson.id === lessonId)
        );

        if (foundLesson) {
          const metaC = courseJson.metadata;
          courses.push({
            code: metaC.courseCode,
            color: metaC.color,
            created_at: null,
            curriculum_id: metaC.curriculum,
            description: null,
            grade_id: metaC.grade,
            id: courseId,
            image: metaC.thumbnail,
            is_deleted: null,
            name: metaC.title,
            sort_index: metaC.sortIndex,
            subject_id: metaC.subject,
            updated_at: null,
          });
        }
      }

      return courses;
    } catch (error) {
      console.error("Error fetching courses from lesson:", error);
      return [];
    }
  }

  async searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {

    try {
      // Get all courses first
      const courses = await this.getAllCourses();
      const allLessons: TableTypes<"lesson">[] = [];

      // Process each course
      for (const course of courses) {
        try {
          // Load course JSON using existing method
          const courseJson = await this.loadCourseJson(course.id);
          if (!courseJson || !courseJson.groups) continue;

          // Extract lessons from each group
          const lessons = courseJson.groups.flatMap((group: any) => group.navigation);

          // Case-insensitive search
          const lowerQuery = searchString.toLowerCase();
          const matchingLessons = lessons.filter(lesson =>
            lesson.title.toLowerCase().includes(lowerQuery)
          );

          // Transform and add matching lessons to results
          const lessonObjects = matchingLessons.map(lesson => ({
            id: lesson.id,
            name: lesson.title,
            cocos_chapter_code: lesson.cocosChapterCode || null,
            cocos_lesson_id: lesson.id,
            cocos_subject_code: lesson.cocosSubjectCode || null,
            color: null,
            created_at: new Date().toISOString(),
            created_by: null,
            outcome: lesson.outcome,
            status: lesson.status,
            subject_id: lesson.subject,
            plugin_type: lesson.pluginType,
            updated_at: null,
            is_deleted: null,
            image: lesson.thumbnail || null,
            language_id: lesson.language || null,
            target_age_from: lesson.targetAgeFrom || null,
            target_age_to: lesson.targetAgeTo || null
          }));

          allLessons.push(...lessonObjects);
        } catch (error) {
          console.error(`Error processing course ${course.id}:`, error);
          // Continue with next course even if one fails
          continue;
        }
      }

      return allLessons;
    } catch (error) {
      console.error("Error in searchLessons:", error);
      return [];
    }
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
  public async getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string
  ): Promise<string | undefined> {
    try {

      for (const courseId of this.allCourseIds) {
        const courseJson = await this.loadCourseJson(courseId);

        for (const group of courseJson.groups) {
          for (const lesson of group.navigation) {
            if (lesson.id === lessonId) {
              return lesson.id;
            }
          }
        }
      }

      return undefined;
    } catch (error) {
      console.error("Error fetching chapter by lesson:", error);
      return undefined;
    }
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
  async getLessonsBylessonIds(
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"lesson">[] | undefined> {
    try {

      const courseJson = await this.loadCourseJson(this.currentCourse?.course_id || this.allCourseIds[0]);

      console.log("getLessonsBylessonIds data:", courseJson.groups);

      if (!courseJson.groups) return [];

      const lessons: TableTypes<"lesson">[] = courseJson.groups.flatMap(group =>
        group.navigation.filter(lesson => lessonIds.includes(lesson.id)).map((lesson: any) => ({
          id: lesson.id,
          name: lesson.title,
          chapter_id: group.metadata.id,
          subject_id: group.subject,
          outcome: lesson.outcome,
          status: lesson.status,
          type: lesson.type,
          thumbnail: lesson.thumbnail || null,
          plugin_type: lesson.pluginType,
          created_at: "null",
          updated_at: "null",
          is_deleted: null
        }))
      );

      return lessons;
    } catch (error) {
      console.error("Error fetching lessons by IDs:", error);
      return undefined;
    }
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
    lesson: string,
    data: {
      studentId?: string;
      courseId?: string;
      score?: number;
      timeSpent?: string;
      createdAt?: string;
      updatedAt?: string;
      assignmentId?: string;
      lessonId?: string;
      chapterId?: string;
      schoolId?: string;
      correctMoves?: number;
      wrongMoves?: number;
      isDeleted?: boolean;
      success?: boolean;
      completion?: boolean;
      response?: string;
    }
  ): ICreateStudentResultStatement => {
    return {
      actor: {
        name: name,
        mbox: `mailto:${name?.toLowerCase().replace(/\s+/g, "")}@example.com`,
      },
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: { "en-US": "completed" },
      },
      object: {
        id: `marathi`,
        objectType: "Activity",
        definition: {
          name: { "en-US": lesson },
          extensions: {
            "http://example.com/xapi/lessonId": data.lessonId || "En1",
            "http://example.com/xapi/courseId": data.courseId || "En2",
          },
        },
      },
      result: {
        success: data.success ?? true,
        completion: data.completion ?? true,
        response: data.response ?? "User Response",
        score: {
          raw: data.score ?? 0,
        },
        duration: data.timeSpent ? `PT${data.timeSpent}S` : undefined,
        extensions: {
          "http://example.com/xapi/correctMoves": data.correctMoves ?? 0,
          "http://example.com/xapi/wrongMoves": data.wrongMoves ?? 0,
          "http://example.com/xapi/assignmentId": data.assignmentId ?? "",
        },
      },
      context: {
        extensions: {
          "http://example.com/xapi/studentId": data.studentId ?? "",
          "http://example.com/xapi/schoolId": data.schoolId ?? "",
          "http://example.com/xapi/chapterId": data.chapterId ?? "",
          "http://example.com/xapi/isDeleted": data.isDeleted ?? false,
          "http://example.com/xapi/createdAt": data.createdAt ?? "",
          "http://example.com/xapi/updatedAt": data.updatedAt ?? "",
        },
      },
    };
  };

  getStatements = async (
    agentEmail: string,
    queryStatement?: IGetStudentResultStatement
  ): Promise<
    {
      id: string | null;
      studentId: any;
      courseId: any;
      lessonId: any;
      assignmentId: any;
      chapterId: any;
      schoolId: any;
      isDeleted: any;
      createdAt: any;
      updatedAt: any;
      score: number | null;
      correctMoves: any;
      wrongMoves: any;
      timeSpent: any;
      success?: any;
      compileFunction?: any;
      response: string | null;
    }[]
  > => {
    try {
      const query = {
        ...queryStatement,
        agent: { mbox: `mailto:${agentEmail}` },
      };

      const result = await tincan.getStatements(query);
      const statements = result?.statements ?? [];

      console.log(`Retrieved Statements for agent: ${agentEmail}`, statements);

      // Extract lesson IDs and fetch them in parallel
      const lessonIds = statements.map(
        (statement) =>
          statement.object?.definition?.extensions?.["http://example.com/xapi/lessonId"]
      );

      const lessonPromises = lessonIds.map((id) => (id ? this.getLesson(id) : Promise.resolve(null)));
      const lessonResults = await Promise.all(lessonPromises);

      // Process statements
      const parsedStatements = statements.map((statement, index) => {
        const lesson = lessonResults[index];

        return {
          id: statement.id ?? null,
          studentId:
            statement.context?.extensions?.["http://example.com/xapi/studentId"] ?? null,
          courseId:
            statement.object?.definition?.extensions?.["http://example.com/xapi/courseId"] ?? "",
          lessonId:
            statement.object?.definition?.extensions?.["http://example.com/xapi/lessonId"] ?? null,
          lessonName: lesson?.title ?? null,
          assignmentId:
            statement.result?.extensions?.["http://example.com/xapi/assignmentId"] ?? null,
          chapterId:
            statement.context?.extensions?.["http://example.com/xapi/chapterId"] ?? null,
          chapterName: lesson?.chapterTitle ?? null,
          schoolId:
            statement.context?.extensions?.["http://example.com/xapi/schoolId"] ?? null,
          createdAt:
            statement.context?.extensions?.["http://example.com/xapi/createdAt"] ?? null,
          updatedAt:
            statement.context?.extensions?.["http://example.com/xapi/updatedAt"] ?? null,
          score: statement.result?.score?.raw ?? null,
          correctMoves:
            statement.result?.extensions?.["http://example.com/xapi/correctMoves"] ?? null,
          wrongMoves:
            statement.result?.extensions?.["http://example.com/xapi/wrongMoves"] ?? null,
          timeSpent: this.parseFormattedDuration(statement.result?.duration) ?? null,
          success:
            statement.result?.extensions?.["http://example.com/xapi/success"] ?? null,
          compileFunction:
            statement.result?.extensions?.["http://example.com/xapi/compileFunction"] ?? null,
          response: statement.result?.response ?? null,
        };
      });

      console.log("Parsed Statements:", parsedStatements);
      return parsedStatements;
    } catch (error) {
      console.error("Error fetching statements:", error);
      return []; // Ensure function always returns an array
    }
  };
  async getFavouriteLessons(userId: string): Promise<TableTypes<"lesson">[]> {
    // Load favorites from localStorage if not already loaded
    if (!this.favoriteLessons[userId]) {
      const stored = localStorage.getItem(this.FAVORITE_LESSONS_STORAGE_KEY);
      this.favoriteLessons = stored ? JSON.parse(stored) : {};
    }

    const favoriteIds = this.favoriteLessons[userId] || [];
    if (favoriteIds.length === 0) {
      return [];
    }

    // Use existing getLessonsBylessonIds to get the full lesson objects
    const lessons = await this.getLessonsBylessonIds(favoriteIds);
    return lessons || [];
  }
  getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<"lesson">[]> {
    return [];
  }
  async getGradeById(id: string): Promise<TableTypes<"grade"> | undefined> {
    return undefined;
  }
  async getCurriculumById(
    id: string
  ): Promise<TableTypes<"curriculum"> | undefined> {
    return undefined;
  }
}
