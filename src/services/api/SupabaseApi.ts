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
  RealtimeChannel,
  SupabaseClient,
  createClient,
} from "@supabase/supabase-js";
import { RoleType } from "../../interface/modelInterfaces";

export class SupabaseApi implements ServiceApi {
  private _assignmetRealTime?: RealtimeChannel;
  private _assignmentUserRealTime?: RealtimeChannel;
  private _liveQuizRealTime?: RealtimeChannel;
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
  ): Promise<TableTypes<"assignment">> {
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
        console.log(typeof data);
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

  async pushAssignmentCart(data: { [key: string]: any }, id: string) {
    if (!this.supabase) return;
    await this.supabase.from(TABLES.Assignment_cart).upsert({ id, ...data });
  }

  async updateSchoolProfile(
    school: TableTypes<"school">,
    name: string,
    group1: string,
    group2: string,
    group3: string
  ): Promise<TableTypes<"school">> {
    throw new Error("Method not implemented.");
  }

  async getCoursesByClassId(
    classId: string
  ): Promise<TableTypes<"class_course">[]> {
    throw new Error("Method not implemented.");
  }

  async getCoursesBySchoolId(
    studentId: string
  ): Promise<TableTypes<"school_course">[]> {
    throw new Error("Method not implemented.");
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async checkCourseInClasses(
    classIds: string[],
    classId: string
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async deleteUserFromClass(userId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string
  ): Promise<TableTypes<"school">> {
    throw new Error("Method not implemented.");
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

  createStudentProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | null,
    image: string | null,
    boardDocId: string | null,
    gradeDocId: string | null,
    languageDocId: string | null,
    studentId: string
  ): Promise<TableTypes<"user">> {
    throw new Error("Method not implemented.");
  }

  async deleteProfile(studentId: string) {
    if (!this.supabase) return;

    const res = await this.supabase.rpc("delete_student", {
      student_id: studentId,
    });
    if (res.error) {
      throw res.error;
    }
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

  getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined
  ): Promise<TableTypes<"course">[]> {
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
  addCourseForParentsStudent(
    courses: TableTypes<"course">[],
    student: TableTypes<"user">
  ) {
    throw new Error("Method not implemented.");
  }
  getCoursesForClassStudent(classId: string): Promise<TableTypes<"course">[]> {
    throw new Error("Method not implemented.");
  }
  getLesson(id: string): Promise<TableTypes<"lesson"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }
  getChapterById(id: string): Promise<TableTypes<"chapter"> | undefined> {
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
  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<TableTypes<"live_quiz_room">> {
    const res = await this.supabase
      ?.from("live_quiz_room")
      .select("*")
      .eq("id", liveQuizRoomDocId)
      .single();
    return res?.data as TableTypes<"live_quiz_room">;
  }
  updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<"favorite_lesson">> {
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
    assignmentId: string | undefined,
    chapterId: string,
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
  updateStudentFromSchoolMode(
    student: TableTypes<"user">,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
    newClassId: string | undefined
  ): Promise<TableTypes<"user">> {
    throw new Error("Method not implemented.");
  }
  public async updateUserProfile(
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
  getStudentProgress(studentId: string): Promise<Map<string, string>> {
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
  subscribeToClassTopic(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getDataByInviteCode(inviteCode: number): Promise<any> {
    try {
      const rpcRes = await this.supabase?.rpc("getDataByInviteCode", {
        invite_code: inviteCode,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? "";
      }
      const data = rpcRes.data;
      return data;
    } catch (e) {
      throw new Error("Invalid inviteCode");
    }
  }
  async createClass(
    schoolId: string,
    className: string
  ): Promise<TableTypes<"class">> {
    throw new Error("Method not implemented.");
  }
  async deleteClass(classId: string) {
    throw new Error("Method not implemented.");
  }
  async updateClass(classId: string, className: string) {
    throw new Error("Method not implemented.");
  }
  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    try {
      if (!studentId) {
        console.log(this._currentStudent);
        throw Error("Student Not Found");
      }
      const rpcRes = await this.supabase?.rpc("linkStudent", {
        invite_code: inviteCode,
        student_id: studentId,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? "";
      }
      const data = rpcRes.data;
      return data;
    } catch (e) {
      throw new Error("Invalid inviteCode");
    }
  }
  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined> {
    try {
      if (!this.supabase)
        throw new Error("Supabase instance is not initialized");

      // Fetch leaderboard data using the Supabase RPC function
      const rpcRes = await this.supabase.rpc("get_class_leaderboard", {
        current_class_id: sectionId,
      });

      // Check if the response is valid
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? new Error("Failed to fetch leaderboard data");
      }

      // Initialize the leaderboard structure
      const data: any = rpcRes.data;
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      // Process the data and populate the leaderboard lists
      for (let i = 0; i < data.length; i++) {
        const result = data[i];
        const leaderboardEntry = {
          name: result.name || "",
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: result.student_id || "",
        };

        switch (result.type) {
          case "allTime":
            leaderBoardList.allTime.push(leaderboardEntry);
            break;
          case "monthly":
            leaderBoardList.monthly.push(leaderboardEntry);
            break;
          case "weekly":
            leaderBoardList.weekly.push(leaderboardEntry);
            break;
          default:
            console.warn("Unknown leaderboard type: ", result.type);
        }
      }

      return leaderBoardList;
    } catch (e) {
      console.error("Error in getLeaderboardResults: ", e);
      // Return an empty leaderboard structure in case of error
      return {
        weekly: [],
        allTime: [],
        monthly: [],
      };
    }
  }

  async getLeaderboardStudentResultFromB2CCollection(): Promise<
    LeaderboardInfo | undefined
  > {
    try {
      // Initialize leaderboard structure
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      // Define the query to fetch data from the view
      const genericQuery = `
      SELECT *
      FROM get_leaderboard_generic_data
    `;

      if (!this.supabase) {
        console.error("Supabase instance is not initialized");
        return;
      }

      // Execute the query
      const { data, error } = await this.supabase
        .from("get_leaderboard_generic_data")
        .select();

      // Handle errors in the query execution
      if (error) {
        console.error("Error fetching leaderboard data: ", error);
        return;
      }

      // Handle case where no data is returned
      if (!data) {
        console.warn("No data returned from get_leaderboard_generic_data");
        return;
      }

      // Process the results
      data.forEach((result) => {
        if (!result) return;

        const leaderboardEntry = {
          name: result.name || "",
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: result.student_id || "",
        };

        switch (result.type) {
          case "allTime":
            leaderBoardList.allTime.push(leaderboardEntry);
            break;
          case "monthly":
            leaderBoardList.monthly.push(leaderboardEntry);
            break;
          case "weekly":
            leaderBoardList.weekly.push(leaderboardEntry);
            break;
          default:
            console.warn("Unknown leaderboard type: ", result.type);
        }
      });

      return leaderBoardList;
    } catch (error) {
      console.error(
        "Error in getLeaderboardStudentResultFromB2CCollection: ",
        error
      );
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
  getLessonFromChapter(
    chapterId: string,
    lessonId: string
  ): Promise<{
    lesson: TableTypes<"lesson">[];
    course: TableTypes<"course">[];
  }> {
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
  async assignmentUserListner(
    studentId: string,
    onDataChange: (
      assignment_user: TableTypes<"assignment_user"> | undefined
    ) => void
  ) {
    try {
      if (this._assignmentUserRealTime) return;
      this._assignmentUserRealTime = this.supabase?.channel("assignment_user");
      if (!this._assignmentUserRealTime) {
        throw new Error("Failed to establish channel for assignment_user");
      }
      const res = this._assignmentUserRealTime
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "assignment_user",
            filter: `user_id=eq.${studentId}`,
          },
          (payload) => {
            onDataChange(payload.new as TableTypes<"assignment_user">);
          }
        )
        .subscribe();
      return;
    } catch (error) {
      throw error;
    }
  }
  async assignmentListner(
    classId: string,
    onDataChange: (assignment: TableTypes<"assignment"> | undefined) => void
  ) {
    try {
      if (this._assignmetRealTime) return;
      this._assignmetRealTime = this.supabase?.channel("assignment");
      if (!this._assignmetRealTime) {
        throw new Error("Failed to establish channel for assignment");
      }
      const res = this._assignmetRealTime!.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assignment",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          onDataChange(payload.new as TableTypes<"assignment">);
        }
      ).subscribe();
      return;
    } catch (error) {
      throw error;
    }
  }
  async removeAssignmentChannel() {
    try {
      if (this._assignmentUserRealTime)
        this.supabase?.removeChannel(this._assignmentUserRealTime);
      this._assignmentUserRealTime = undefined;
      if (this._assignmetRealTime)
        this.supabase?.removeChannel(this._assignmetRealTime);
      this._assignmetRealTime = undefined;
    } catch (error) {
      throw error;
    }
  }
  async liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<"live_quiz_room"> | undefined) => void
  ) {
    try {
      const roomDoc = await this.getLiveQuizRoomDoc(liveQuizRoomDocId);
      onDataChange(roomDoc);

      this._liveQuizRealTime = this.supabase?.channel("live_quiz_room");

      if (!this._liveQuizRealTime) {
        throw new Error("Failed to establish channel for live quiz room");
      }

      const res = this._liveQuizRealTime
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "live_quiz_room",
            filter: `id=eq.${liveQuizRoomDocId}`,
          },
          (payload) => {
            onDataChange(payload.new as TableTypes<"live_quiz_room">);
          }
        )
        .subscribe();
      return;
    } catch (error) {
      console.error("Error setting up live quiz room listener:", error);
      throw error;
    }
  }
  async removeLiveQuizChannel() {
    try {
      if (this._liveQuizRealTime)
        this.supabase?.removeChannel(this._liveQuizRealTime);
    } catch (error) {
      throw error;
    }
  }
  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
  ): Promise<void> {
    try {
      await this.supabase?.rpc("update_live_quiz", {
        room_id: roomDocId,
        student_id: studentId,
        question_id: questionId,
        time_spent: timeSpent,
        score: score,
      });
    } catch (error) {
      console.error("Error updating quiz result:", error);
      throw error;
    }
  }

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined> {
    let liveQuizId = await this?.supabase?.rpc("join_live_quiz", {
      _assignment_id: assignmentId,
      _student_id: studentId,
    });

    if (liveQuizId == null || liveQuizId.error || !liveQuizId.data) {
      throw liveQuizId?.error ?? "";
    }
    const data = liveQuizId.data;
    return data;
  }
  async getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<"result">[];
      user_data: TableTypes<"user">[];
    }[]
  > {
    try {
      const results = await this?.supabase?.rpc("get_results_by_assignment", {
        _assignment_id: assignmentId,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? "";
      }
      const data = results.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  getAssignmentById(id: string): Promise<TableTypes<"assignment"> | undefined> {
    throw new Error("Method not implemented.");
  }
  createOrUpdateAssignmentCart(
    userId: string,
    lessons: string
  ): Promise<boolean | undefined> {
    throw new Error("Method not implemented.");
  }
  getBadgesByIds(ids: string[]): Promise<TableTypes<"badge">[]> {
    throw new Error("Method not implemented.");
  }
  getStickersByIds(ids: string[]): Promise<TableTypes<"sticker">[]> {
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
  getUserBadge(userId: string): Promise<TableTypes<"user_badge">[]> {
    throw new Error("Method not implemented.");
  }
  getUserBonus(userId: string): Promise<TableTypes<"user_bonus">[]> {
    throw new Error("Method not implemented.");
  }
  updateRewardAsSeen(studentId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getUserByDocId(
    studentId: string
  ): Promise<TableTypes<"user"> | undefined> {
    try {
      const res = await this.supabase
        ?.from("user")
        .select("*")
        .eq("id", studentId);
      return res?.data?.[0];
    } catch (error) {
      throw error;
    }
  }
  async getGradeById(id: string): Promise<TableTypes<"grade"> | undefined> {
    throw new Error("Method not implemented.");
  }
  async getGradesByIds(ids: string[]): Promise<TableTypes<"grade">[]> {
    throw new Error("Method not implemented.");
  }
  async getCurriculumById(
    id: string
  ): Promise<TableTypes<"curriculum"> | undefined> {
    throw new Error("Method not implemented.");
  }
  async getCurriculumsByIds(
    ids: string[]
  ): Promise<TableTypes<"curriculum">[]> {
    throw new Error("Method not implemented.");
  }
  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error("Method not implemented.");
  }

  getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<"lesson">[]> {
    throw new Error("Method not implemented.");
  }

  async searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase.rpc("find_similar_lessons", {
      search_text: searchString,
    });
    console.log("🚀 ~ SupabaseApi ~ searchLessons ~ data, error:", data, error);
    if (error) return [];
    return data;
  }
  getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<"assignment_cart"> | undefined> {
    throw new Error("Method not implemented.");
  }

  getChapterByLesson(
    lessonId: string,
    classId: string,
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
    courseId: string,
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[]> {
    throw new Error("Method not implemented.");
  }
  getAssignmentUserByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"assignment_user">[]> {
    throw new Error("Method not implemented")
  }
  getResultByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  getLastAssignmentsForRecommendations(
    classId: string
  ): Promise<TableTypes<"assignment">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  async createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getTeachersForClass(
    classId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  async getUserByEmail(email: string): Promise<TableTypes<"user"> | undefined> {
    try {
      const results = await this?.supabase?.rpc("get_user_by_email", {
        p_email: email,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? "";
      }
      const data = results.data[0];
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getUserByPhoneNumber(
    phone: string
  ): Promise<TableTypes<"user"> | undefined> {
    try {
      const results = await this?.supabase?.rpc("get_user_by_phonenumber", {
        p_phone: phone,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? "";
      }
      const data = results.data[0];
      return data;
    } catch (error) {
      throw error;
    }
  }
  addTeacherToClass(classId: string, userId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  checkUserExistInSchool(schoolId, userId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    classWiseAssignments: TableTypes<"assignment">[];
    individualAssignments: TableTypes<"assignment">[];
  }> {
    throw new Error("Method not implemented.");
  }
  getTeacherJoinedDate(
    userId: string,
    classId: string
  ): Promise<TableTypes<"class_user"> | undefined> {
    throw new Error("Method not implemented.");
  }
  getAssignedStudents(assignmentId: string): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  getStudentResultByDate(
    studentId: string,
    startDate: string,
    course_id: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  async getLessonsBylessonIds(
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"lesson">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  async deleteTeacher(classId: string, teacherId: string) {
    throw new Error("Method not implemented.");
  }

  async getClassCodeById(class_id: string): Promise<number | undefined> {
    throw new Error("Method not implemented.");
  }

  async getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    throw new Error("Method not implemented.");
  }

  async createClassCode(classId: string): Promise<number> {
    try {
      // Validate parameters
      if (!classId)
        throw new Error("Class ID is required to create a class code.");

      // Call the RPC function
      const classCode = await this?.supabase?.rpc(
        "generate_unique_class_code",
        {
          class_id_input: classId,
        }
      );
      if (!classCode?.data) {
        throw new Error(`A class code is not created`);
      }
      return classCode?.data;
    } catch (error) {
      throw error; // Re-throw the error for external handling
    }
  }
  async getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  async getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  async getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    throw new Error("Method not implemented.");
  }
  async addUserToSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
