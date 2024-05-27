import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
import { StudentLessonResult } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import {
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODES,
  TableTypes,
} from "../../common/constants";
import { AvatarObj } from "../../components/animation/Avatar";
import {
  DocumentData,
  Unsubscribe,
} from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import { RoleType } from "../../interface/modelInterfaces";

export class ApiHandler implements ServiceApi {
  public static i: ApiHandler;

  private s: ServiceApi;

  public getAssignmentById(
    id: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    return this.s.getAssignmentById(id);
  }

  public liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (user: LiveQuizRoomObject | undefined) => void
  ): Unsubscribe {
    return this.s.liveQuizListener(liveQuizRoomDocId, onDataChange);
  }

  public async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
  ): Promise<void> {
    return this.s.updateLiveQuiz(
      roomDocId,
      studentId,
      questionId,
      timeSpent,
      score
    );
  }

  public async joinLiveQuiz(
    studentId: string,
    assignmentId: string
  ): Promise<string | undefined> {
    return this.s.joinLiveQuiz(studentId, assignmentId);
  }
  private constructor() {}
  public async updateRewardsForStudent(
    studentId: string,
    unlockedReward: LeaderboardRewards
  ) {
    return await this.s.updateRewardsForStudent(studentId, unlockedReward);
  }

  public async getUserByDocId(
    studentId: string
  ): Promise<TableTypes<"user"> | undefined> {
    return await this.s.getUserByDocId(studentId);
  }

  public async updateRewardAsSeen(studentId: string): Promise<void> {
    return await this.s.updateRewardAsSeen(studentId);
  }

  public async getLeaderboardStudentResultFromB2CCollection(
    studentId: string
  ): Promise<LeaderboardInfo | undefined> {
    return await this.s.getLeaderboardStudentResultFromB2CCollection(studentId);
  }
  public async getRewardsById(
    id: number, periodType: string
  ): Promise<TableTypes<"reward"> | undefined> {
    return this.s.getRewardsById(id, periodType);
  }
  public async getBadgeById(
    id: string
  ): Promise<TableTypes<"badge"> | undefined> {
    return this.s.getBadgeById(id);
  }
  public async getStickerById(
    id: string
  ): Promise<TableTypes<"sticker"> | undefined> {
    return this.s.getStickerById(id);
  }
  public async getAvatarInfo(): Promise<AvatarObj | undefined> {
    return await this.s.getAvatarInfo();
  }
  public async getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    return await this.s.getSchoolsForUser(userId);
  }
  public async isUserTeacher(userId: string): Promise<boolean> {
    return await this.s.isUserTeacher(userId);
  }
  public async getClassesForSchool(
    schoolId: string,
    userId: string
  ): Promise<TableTypes<"class">[]> {
    return await this.s.getClassesForSchool(schoolId, userId);
  }
  public async getStudentsForClass(
    classId: string
  ): Promise<TableTypes<"user">[]> {
    return await this.s.getStudentsForClass(classId);
  }
  set currentMode(value: MODES) {
    this.s.currentMode = value;
  }
  get currentMode(): MODES {
    return this.s.currentMode;
  }
  public async deleteAllUserData(): Promise<void> {
    return await this.s.deleteAllUserData();
  }

  public async getCoursesByGrade(
    gradeDocId: any
  ): Promise<TableTypes<"course">[]> {
    return await this.s.getCoursesByGrade(gradeDocId);
  }

  public async getAllCourses(): Promise<TableTypes<"course">[]> {
    return await this.s.getAllCourses();
  }

  public async getSchoolById(
    id: string
  ): Promise<TableTypes<"school"> | undefined> {
    return await this.s.getSchoolById(id);
  }

  public async getDataByInviteCode(inviteCode: number): Promise<any> {
    return await this.s.getDataByInviteCode(inviteCode);
  }
  public async linkStudent(inviteCode: number): Promise<any> {
    return await this.s.linkStudent(inviteCode);
  }
  public async getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]> {
    return await this.s.getStudentResult(studentId, fromCache);
  }
  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result"> }> {
    return await this.s.getStudentResultInMap(studentId);
  }
  public async getClassById(
    id: string
  ): Promise<TableTypes<"class"> | undefined> {
    return await this.s.getClassById(id);
  }
  public async isStudentLinked(
    studentId: string,
    fromCache: boolean = true
  ): Promise<boolean> {
    return await this.s.isStudentLinked(studentId, fromCache);
  }
  public async getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    return await this.s.getPendingAssignments(classId, studentId);
  }

  public async updateStudent(
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
    return await this.s.updateStudent(
      student,
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId
    );
  }
  public async getLiveQuizLessons(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    return this.s.getLiveQuizLessons(classId, studentId);
  }
  public async getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    return await this.s.getLessonResultsForStudent(studentId);
  }

  public async updateResult(
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
    return await this.s.updateResult(
      studentId,
      courseId,
      lessonId,
      score,
      correctMoves,
      wrongMoves,
      timeSpent,
      isLoved,
      assignmentId,
      classId,
      schoolId
    );
  }

  public async getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    return await this.s.getCoursesForParentsStudent(studentId);
  }

  public async getAdditionalCourses(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    return await this.s.getAdditionalCourses(studentId);
  }

  public async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null> {
    return await this.s.getLessonWithCocosLessonId(lessonId);
  }

  public async getCoursesForClassStudent(
    classId: string
  ): Promise<TableTypes<"course">[]> {
    return await this.s.getCoursesForClassStudent(classId);
  }
  public async getLesson(
    id: string
  ): Promise<TableTypes<"lesson"> | undefined> {
    return await this.s.getLesson(id);
  }

  public async getLessonsForChapter(
    chapterId: string
  ): Promise<TableTypes<"lesson">[]> {
    return await this.s.getLessonsForChapter(chapterId);
  }

  public async getDifferentGradesForCourse(
    course: TableTypes<"course">
  ): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }> {
    return await this.s.getDifferentGradesForCourse(course);
  }
  public async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<DocumentData | undefined> {
    return await this.s.getLiveQuizRoomDoc(liveQuizRoomDocId);
  }
  public async getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    return await this.s.getAllCurriculums();
  }

  public async getAllGrades(): Promise<TableTypes<"grade">[]> {
    return await this.s.getAllGrades();
  }

  public async getAllLanguages(): Promise<TableTypes<"language">[]> {
    return await this.s.getAllLanguages();
  }

  public async getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    return await this.s.getParentStudentProfiles();
  }

  updateSoundFlag(userId: string, value: boolean) {
    return this.s.updateSoundFlag(userId, value);
  }

  updateMusicFlag(userId: string, value: boolean) {
    return this.s.updateMusicFlag(userId, value);
  }
  updateTcAccept(userId: string) {
    console.log("🚀 ~ ApiHandler ~ updateTcAccept ~ this.s:", this.s, this);
    return this.s.updateTcAccept(userId);
  }
  public get currentStudent(): TableTypes<"user"> | undefined {
    return this.s.currentStudent;
  }

  public set currentStudent(value: TableTypes<"user"> | undefined) {
    this.s.currentStudent = value;
  }
  public get currentClass(): TableTypes<"class"> | undefined {
    return this.s.currentClass;
  }
  public set currentClass(value: TableTypes<"class"> | undefined) {
    this.s.currentClass = value;
  }
  public get currentSchool(): TableTypes<"school"> | undefined {
    return this.s.currentSchool;
  }
  public set currentSchool(value: TableTypes<"school"> | undefined) {
    this.s.currentSchool = value;
  }
  updateLanguage(userId: string, value: string) {
    return this.s.updateLanguage(userId, value);
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
  ): Promise<TableTypes<"user">> {
    return await this.s.createProfile(
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId
    );
  }

  public async addCourseForParentsStudent(
    courses: Course[],
    student: User
  ): Promise<TableTypes<"course">[]> {
    return this.s.addCourseForParentsStudent(courses, student);
  }

  public async deleteProfile(studentId: string) {
    return await this.s.deleteProfile(studentId);
  }

  public static getInstance(s: ServiceApi): ApiHandler {
    if (!ApiHandler.i) {
      ApiHandler.i = new ApiHandler();
      ApiHandler.i.s = s;
    }
    return ApiHandler.i;
  }

  public async getLanguageWithId(
    id: string
  ): Promise<TableTypes<"language"> | undefined> {
    return await this.s.getLanguageWithId(id);
  }

  public async getSubject(
    id: string
  ): Promise<TableTypes<"subject"> | undefined> {
    return await this.s.getSubject(id);
  }

  public async getCourse(
    id: string
  ): Promise<TableTypes<"course"> | undefined> {
    return await this.s.getCourse(id);
  }

  public async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined> {
    return await this.s.getLeaderboardResults(
      sectionId,
      leaderboardDropdownType
    );
  }

  getAllLessonsForCourse(courseId: string): Promise<TableTypes<"lesson">[]> {
    return this.s.getAllLessonsForCourse(courseId);
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string
  ): Promise<Lesson | undefined> {
    return this.s.getLessonFromCourse(course, lessonId);
  }

  public async getCoursesFromLesson(
    lessonId: string
  ): Promise<TableTypes<"course">[]> {
    return this.s.getCoursesFromLesson(lessonId);
  }

  async getChaptersForCourse(
    courseId: string
  ): Promise<TableTypes<"chapter">[]> {
    return this.s.getChaptersForCourse(courseId);
  }
  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    return this.s.getPendingAssignmentForLesson(lessonId, classId, studentId);
  }

  getFavouriteLessons(userId: string): Promise<TableTypes<"lesson">[]> {
    return this.s.getFavouriteLessons(userId);
  }
  getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<"class">[];
    schools: TableTypes<"school">[];
  }> {
    return this.s.getStudentClassesAndSchools(userId);
  }
  createUserDoc(
    user: TableTypes<"user">
  ): Promise<TableTypes<"user"> | undefined> {
    return this.s.createUserDoc(user);
  }

  syncDB(): Promise<boolean> {
    return this.s.syncDB();
  }
}
