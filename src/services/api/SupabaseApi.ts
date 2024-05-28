import { DocumentData, Unsubscribe } from "firebase/firestore";
import {
  MODES,
  LeaderboardDropdownList,
  LeaderboardRewards,
  TABLES,
  TableTypes,
  MUTATE_TYPES,
} from "../../common/constants";
import { StudentLessonResult } from "../../common/courseConstants";
import { AvatarObj } from "../../components/animation/Avatar";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
import { Database } from "../database";
import {
  PostgrestSingleResponse,
  SupabaseClient,
  createClient,
} from "@supabase/supabase-js";
import { RoleType } from "../../interface/modelInterfaces";

export class SupabaseApi implements ServiceApi {
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
  getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string
  ): Promise<
    | {
      class_id: string;
      created_at: string;
      created_by: string | null;
      ends_at: string | null;
      id: string;
      is_class_wise: boolean;
      is_deleted: boolean | null;
      lesson_id: string;
      school_id: string;
      starts_at: string;
      type: string | null;
      updated_at: string | null;
    }
    | undefined
  > {
    throw new Error("Method not implemented.");
  }
  getFavouriteLessons(userId: string): Promise<
    {
      cocos_chapter_code: string | null;
      cocos_lesson_id: string | null;
      cocos_subject_code: string | null;
      color: string | null;
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
  getStudentClassesAndSchools(userId: string): Promise<{
    classes: {
      created_at: string;
      id: string;
      image: string | null;
      is_deleted: boolean | null;
      name: string;
      school_id: string;
      updated_at: string | null;
    }[];
    schools: {
      created_at: string;
      group1: string | null;
      group2: string | null;
      group3: string | null;
      id: string;
      image: string | null;
      is_deleted: boolean | null;
      name: string;
      updated_at: string | null;
    }[];
  }> {
    throw new Error("Method not implemented.");
  }
  createUserDoc(
    user: TableTypes<"user">
  ): Promise<TableTypes<"user"> | undefined> {
    throw new Error("Method not implemented.");
  }
  syncDB(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public static i: SupabaseApi;
  public supabase: SupabaseClient<Database> | undefined;
  private supabaseUrl: string;
  private supabaseKey: string;
  private _currentStudent: TableTypes<"user"> | undefined;

  public static getInstance(): SupabaseApi {
    if (!SupabaseApi.i) {
      SupabaseApi.i = new SupabaseApi();
      SupabaseApi.i.init();
    }
    return SupabaseApi.i;
  }

  private init() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL ?? "";
    this.supabaseKey = process.env.REACT_APP_SUPABASE_KEY ?? "";
    this.supabase = createClient<Database>(this.supabaseUrl, this.supabaseKey);
    console.log("🚀 ~ supabase:", this.supabase);
  }

  async getTablesData(
    tableNames: TABLES[] = Object.values(TABLES),
    tablesLastModifiedTime: Map<string, string> = new Map()
  ) {
    const data = new Map();
    for (const tableName of tableNames) {
      const lastModifiedDate =
        tablesLastModifiedTime.get(tableName) ?? "2024-01-01T00:00:00.000Z";
      const res = await this.supabase
        ?.from(tableName)
        .select("*")
        .gte("updated_at", lastModifiedDate);
      data.set(tableName, res?.data);
      console.log("🚀 ~ SupabaseApi ~ res tableName:", tableName, res);

      // switch (tableName) {
      //   case TABLES.User:
      //     data.set(
      //       tableName,
      //       // await this.getUsers(tablesLastModifiedTime.get(tableName))
      //       this.supabase?.from(tableName).select("*")
      //     );
      //     break;
      //   // case TABLES.Assignment:
      //   //   data.set(
      //   //     tableName,
      //   //     await this.getAssignments(tablesLastModifiedTime.get(tableName))
      //   //   );
      //   //   break;
      //   case TABLES.Result:
      //     data.set(
      //       tableName,
      //       await this.getResults(tablesLastModifiedTime.get(tableName))
      //     );
      //     break;
      //   case TABLES.School:
      //     data.set(
      //       tableName,
      //       await this.getSchools(tablesLastModifiedTime.get(tableName))
      //     );
      //     break;
      //   case TABLES.SchoolUser:
      //     data.set(
      //       tableName,
      //       await this.getSchoolUsers(tablesLastModifiedTime.get(tableName))
      //     );
      //     break;
      //   default:
      //     break;
      // }
    }
    return data;
  }

  async mutate(
    mutateType: MUTATE_TYPES,
    tableName: TABLES,
    data: { [key: string]: any },
    id: string
  ) {
    if (!this.supabase) return;
    let res: PostgrestSingleResponse<any> | undefined = undefined;
    switch (mutateType) {
      case MUTATE_TYPES.INSERT:
        res = await this.supabase.from(tableName).insert(data);
        break;

      case MUTATE_TYPES.UPDATE:
        delete data.id;
        console.log("🚀 ~ SupabaseApi ~ data:", data);
        res = await this.supabase.from(tableName).update(data).eq("id", id);
        break;

      case MUTATE_TYPES.DELETE:
        res = await this.supabase.from(tableName).delete().eq("id", id);
        break;

      default:
        break;
    }
    console.log("🚀 ~ SupabaseApi ~ res:", res);

    return !!res && !res.error;
  }

  createProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined
  ): Promise<TableTypes<"user">> {
    throw new Error("Method not implemented.");
  }
  deleteProfile(studentId: string) {
    throw new Error("Method not implemented.");
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
  getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    throw new Error("Method not implemented.");
  }
  get currentStudent(): TableTypes<"user"> | undefined {
    return this._currentStudent;
  }
  set currentStudent(value: TableTypes<"user"> | undefined) {
    this._currentStudent = value;
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
  updateSoundFlag(userId: string, value: boolean) {
    throw new Error("Method not implemented.");
  }
  updateMusicFlag(userId: string, value: boolean) {
    throw new Error("Method not implemented.");
  }
  updateLanguage(userId: string, value: string) {
    throw new Error("Method not implemented.");
  }
  updateTcAccept(userId: string) {
    throw new Error("Method not implemented.");
  }
  getLanguageWithId(id: string): Promise<TableTypes<"language"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null> {
    throw new Error("Method not implemented.");
  }
  getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  getAdditionalCourses(studentId: string): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  addCourseForParentsStudent(courses: Course[], student: User) {
    throw new Error("Method not implemented.");
  }
  getCoursesForClassStudent(classId: string): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  getLesson(id: string): Promise<TableTypes<"lesson"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getLessonsForChapter(chapterId: string): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }
  getDifferentGradesForCourse(course: TableTypes<"course">): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }> {
    throw new Error("Method not implemented.");
  }
  getAvatarInfo(): Promise<AvatarObj | undefined> {
    throw new Error("Method not implemented.");
  }
  getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
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
  updateResult(
    studentId: string,
    courseId: string | undefined,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    isLoved: boolean | undefined,
    assignmentId: string | undefined,
    classId: string | undefined,
    schoolId: string | undefined
  ): Promise<TableTypes<"result">> {
    throw new Error("Method not implemented.");
  }
  updateStudent(
    student: TableTypes<"user">,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string
  ): Promise<TableTypes<"user">> {
    throw new Error("Method not implemented.");
  }
  getSubject(id: string): Promise<TableTypes<"subject"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getCourse(id: string): Promise<TableTypes<"course"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]> {
    throw new Error("Method not implemented.");
  }
  getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result"> }> {
    throw new Error("Method not implemented.");
  }
  getClassById(id: string): Promise<TableTypes<"class"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getSchoolById(id: string): Promise<TableTypes<"school"> | undefined> {
    throw new Error("Method not implemented.");
  }
  isStudentLinked(studentId: string, fromCache: boolean): Promise<boolean> {
    throw new Error("Method not implemented.");
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
    throw new Error("Method not implemented.");
  }
  set currentMode(value: MODES) {
    throw new Error("Method not implemented.");
  }
  get currentMode(): MODES {
    throw new Error("Method not implemented.");
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
  getDataByInviteCode(inviteCode: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  linkStudent(inviteCode: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined> {
    try {
      if (!this.supabase) return;
      console.log("getClassLeaderboard ", leaderboardDropdownType);

      const rpcRes = await this.supabase.rpc("getClassLeaderboard", {
        current_class_id: sectionId
      });
      console.log("const rpcRes ", rpcRes);

      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? "";
      }
      const data = rpcRes.data;
      console.log("getClassLeaderboard ", data);

      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };
      // for (let i = 0; i < data.length; i++) {
      //   const result = currentUserResult.values[i];
      //   console.log("const result = res.values[i]; ", result);
      //   switch (result.type) {
      //     case "allTime":
      //       leaderBoardList.allTime.push({
      //         name: result.name,
      //         score: result.total_score,
      //         timeSpent: result.total_time_spent,
      //         lessonsPlayed: result.lessons_played,
      //         userId: studentId,
      //       });
      //       break;
      //     case "monthly":
      //       leaderBoardList.monthly.push({
      //         name: result.name,
      //         score: result.total_score,
      //         timeSpent: result.total_time_spent,
      //         lessonsPlayed: result.lessons_played,
      //         userId: studentId,
      //       });
      //       break;

      //     case "weekly":
      //       leaderBoardList.weekly.push({
      //         name: result.name,
      //         score: result.total_score,
      //         timeSpent: result.total_time_spent,
      //         lessonsPlayed: result.lessons_played,
      //         userId: studentId,
      //       });
      //       break;

      //     default:
      //       break;
      //   }
      // }

      // return data;

    } catch (e) {
      // throw new Error("Invalid inviteCode");
      console.log("getClassLeaderboard ", e);
    }
  }
  async getLeaderboardStudentResultFromB2CCollection(): Promise<
    LeaderboardInfo | undefined
  > {
    try {
      console.log("🚀 ~ SupabaseApi ~ res getLeaderboardResults called ");
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      const genericQuery = `
      SELECT *
      FROM get_leaderboard_generic_data
      `;
      console.log(
        "getLeaderboardStudentResults supabase genericQuery ",
        genericQuery
      );
      // const genericQueryResult = await this._db.query(genericQuery);
      if (!this.supabase) return;
      const genericQueryResult = await this.supabase
        .from("get_leaderboard_generic_data")
        .select();
      if (!genericQueryResult || !genericQueryResult.data) {
        return;
      }
      console.log(
        "getLeaderboardStudentResults genericQueryResult ",
        genericQueryResult
      );
      for (let i = 0; i < genericQueryResult.data.length; i++) {
        const result = genericQueryResult.data[i];
        // console.log("const result = res.values[i]; ", result);
        if (!result) {
          continue;
        }
        switch (result.type) {
          case "allTime":
            leaderBoardList.allTime.push({
              name: result.name || "",
              score: result.total_score || 0,
              timeSpent: result.total_time_spent || 0,
              lessonsPlayed: result.lessons_played || 0,
              userId: result.student_id || "",
            });
            break;
          case "monthly":
            leaderBoardList.monthly.push({
              name: result.name || "",
              score: result.total_score || 0,
              timeSpent: result.total_time_spent || 0,
              lessonsPlayed: result.lessons_played || 0,
              userId: result.student_id || "",
            });
            break;

          case "weekly":
            leaderBoardList.weekly.push({
              name: result.name || "",
              score: result.total_score || 0,
              timeSpent: result.total_time_spent || 0,
              lessonsPlayed: result.lessons_played || 0,
              userId: result.student_id || "",
            });
            break;

          default:
            break;
        }
        // if (i === length - 1 && leaderBoardList.weekly.length === 0) {
        //   leaderBoardList.weekly.push({
        //     name: "null",
        //     score: 0,
        //     timeSpent: 0,
        //     lessonsPlayed: 0,
        //     userId: "",
        //   });
        // }
      }
      return leaderBoardList;
    } catch (error) {
      console.log("getLeaderboardResults in Supabase Error ", error);
    }
  }
  getAllLessonsForCourse(courseId: string): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }
  getLessonFromCourse(
    course: Course,
    lessonId: string
  ): Promise<Lesson | undefined> {
    throw new Error("Method not implemented.");
  }
  getCoursesByGrade(gradeDocId: any): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  getAllCourses(): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  deleteAllUserData(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getCoursesFromLesson(lessonId: string): Promise<TableTypes<"course">[]> {
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
  getAssignmentById(id: string): Promise<TableTypes<"assignment"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getBadgeById(id: string): Promise<TableTypes<"badge"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getStickerById(id: string): Promise<TableTypes<"sticker"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getRewardsById(id: string): Promise<TableTypes<"reward"> | undefined> {
    throw new Error("Method not implemented.");
  }
  updateRewardAsSeen(studentId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getUserByDocId(
    studentId: string
  ): Promise<TableTypes<"user"> | undefined> {
    const res = await this.supabase
      ?.from("user")
      .select("*")
      .eq("id", studentId);
    return res?.data?.[0];
  }
  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error("Method not implemented.");
  }
}
