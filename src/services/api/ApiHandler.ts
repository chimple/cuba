import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
import { StudentLessonResult } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import {
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODES,
  PROFILETYPE,
  TABLES,
  TableTypes,
} from "../../common/constants";
import { AvatarObj } from "../../components/animation/Avatar";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import { RoleType } from "../../interface/modelInterfaces";
import { image, school } from "ionicons/icons";

export class ApiHandler implements ServiceApi {
  public static i: ApiHandler;

  private s: ServiceApi;

  public getAssignmentById(
    id: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    return this.s.getAssignmentById(id);
  }
  public getStudentResultsByAssignmentId(assignmentId: string) {
    return this.s.getStudentResultsByAssignmentId(assignmentId);
  }

  public assignmentListner(
    class_id: string,
    onDataChange: (roomDoc: TableTypes<"assignment"> | undefined) => void
  ): void {
    return this.s.assignmentListner(class_id, onDataChange);
  }
  public removeAssignmentChannel() {
    return this.s.removeAssignmentChannel();
  }
  public assignmentUserListner(
    student_id: string,
    onDataChange: (roomDoc: TableTypes<"assignment_user"> | undefined) => void
  ): void {
    return this.s.assignmentUserListner(student_id, onDataChange);
  }

  public liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<"live_quiz_room"> | undefined) => void
  ): void {
    return this.s.liveQuizListener(liveQuizRoomDocId, onDataChange);
  }
  public async removeLiveQuizChannel() {
    return await this.s.removeLiveQuizChannel();
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
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined> {
    return this.s.joinLiveQuiz(assignmentId, studentId);
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
    id: number,
    periodType: string
  ): Promise<TableTypes<"reward"> | undefined> {
    return this.s.getRewardsById(id, periodType);
  }
  public async getUserSticker(
    userId: string
  ): Promise<TableTypes<"user_sticker">[]> {
    return this.s.getUserSticker(userId);
  }
  public async getUserBonus(
    userId: string
  ): Promise<TableTypes<"user_bonus">[]> {
    return this.s.getUserBonus(userId);
  }
  public async getUserBadge(
    userId: string
  ): Promise<TableTypes<"user_badge">[]> {
    return this.s.getUserBadge(userId);
  }
  public async getBadgesByIds(ids: string[]): Promise<TableTypes<"badge">[]> {
    return this.s.getBadgesByIds(ids);
  }
  public async getStickersByIds(
    ids: string[]
  ): Promise<TableTypes<"sticker">[]> {
    return this.s.getStickersByIds(ids);
  }
  public async getAvatarInfo(): Promise<AvatarObj | undefined> {
    return await this.s.getAvatarInfo();
  }
  public async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE
  ): Promise<string | null> {
    return await this.s.addProfileImages(id, file, profileType);
  }
  public async createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null
  ): Promise<TableTypes<"school">> {
    return await this.s.createSchool(name, group1, group2, group3, image);
  }
  public async updateSchoolProfile(
    school: TableTypes<"school">,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null
  ): Promise<TableTypes<"school">> {
    return await this.s.updateSchoolProfile(
      school,
      name,
      group1,
      group2,
      group3,
      image
    );
  }
  public async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string
  ): Promise<TableTypes<"req_new_school"> | null> {
    return await this.s.requestNewSchool(
      name,
      state,
      district,
      city,
      image,
      udise_id
    );
  }
  public async getExistingSchoolRequest(
    userId: string
  ): Promise<TableTypes<"req_new_school"> | null> {
    return await this.s.getExistingSchoolRequest(userId);
  }

  public async getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    return await this.s.getSchoolsForUser(userId);
  }
  public async getCoursesByClassId(
    classid: string
  ): Promise<TableTypes<"class_course">[]> {
    return await this.s.getCoursesByClassId(classid);
  }
  public async getCoursesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"school_course">[]> {
    return await this.s.getCoursesBySchoolId(schoolId);
  }
  public async removeCoursesFromClass(ids: string[]): Promise<void> {
    return await this.s.removeCoursesFromClass(ids);
  }
  public async removeCoursesFromSchool(ids: string[]): Promise<void> {
    return await this.s.removeCoursesFromSchool(ids);
  }
  public async checkCourseInClasses(
    classIds: string[],
    courseId: string
  ): Promise<boolean> {
    return await this.s.checkCourseInClasses(classIds, courseId);
  }
  public async deleteUserFromClass(userId: string): Promise<void> {
    return await this.s.deleteUserFromClass(userId);
  }
  public async isUserTeacher(userId: string): Promise<boolean> {
    return await this.s.isUserTeacher(userId);
  }
  public async deleteClass(classId: string) {
    return await this.s.deleteClass(classId);
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
  public async linkStudent(
    inviteCode: number,
    studentId: string
  ): Promise<any> {
    return await this.s.linkStudent(inviteCode, studentId);
  }
  public async getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]> {
    return await this.s.getStudentResult(studentId, fromCache);
  }
  async getStudentProgress(studentId: string): Promise<Map<string, string>> {
    return await this.s.getStudentProgress(studentId);
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

  public async updateStudentFromSchoolMode(
    student: TableTypes<"user">,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
    student_id: string,
    newClassId: string
  ): Promise<TableTypes<"user">> {
    return await this.s.updateStudentFromSchoolMode(
      student,
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId,
      student_id,
      newClassId
    );
  }

  public async updateUserProfile(
    user: TableTypes<"user">,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined
  ): Promise<TableTypes<"user">> {
    return await this.s.updateUserProfile(
      user,
      fullName,
      email,
      phoneNum,
      languageDocId,
      profilePic
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

  public async updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<"favorite_lesson">> {
    return await this.s.updateFavoriteLesson(studentId, lessonId);
  }

  public async updateResult(
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
    return await this.s.updateResult(
      studentId,
      courseId,
      lessonId,
      score,
      correctMoves,
      wrongMoves,
      timeSpent,
      assignmentId,
      chapterId,
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
  public async getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]> {
    return await this.s.getBonusesByIds(ids);
  }
  public async getChapterById(
    id: string
  ): Promise<TableTypes<"chapter"> | undefined> {
    return await this.s.getChapterById(id);
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
  ): Promise<TableTypes<"live_quiz_room"> | undefined> {
    return await this.s.getLiveQuizRoomDoc(liveQuizRoomDocId);
  }
  public async getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    return await this.s.getAllCurriculums();
  }

  public async getAllGrades(): Promise<TableTypes<"grade">[]> {
    return await this.s.getAllGrades();
  }
  async getGradeById(id: string): Promise<TableTypes<"grade"> | undefined> {
    return await this.s.getGradeById(id);
  }
  async getGradesByIds(ids: string[]): Promise<TableTypes<"grade">[]> {
    return await this.s.getGradesByIds(ids);
  }
  async getCurriculumById(
    id: string
  ): Promise<TableTypes<"curriculum"> | undefined> {
    return await this.s.getCurriculumById(id);
  }
  async getCurriculumsByIds(
    ids: string[]
  ): Promise<TableTypes<"curriculum">[]> {
    return await this.s.getCurriculumsByIds(ids);
  }
  public async getAllLanguages(): Promise<TableTypes<"language">[]> {
    return await this.s.getAllLanguages();
  }

  public async getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    return await this.s.getParentStudentProfiles();
  }

  public async getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined
  ): Promise<TableTypes<"course">[]> {
    return await this.s.getCourseByUserGradeId(gradeDocId, boardDocId);
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

  public get currentCourse():
    | Map<string, TableTypes<"course"> | undefined>
    | undefined {
    return this.s.currentCourse;
  }
  public set currentCourse(
    value: Map<string, TableTypes<"course"> | undefined> | undefined
  ) {
    this.s.currentCourse = value;
  }
  updateLanguage(userId: string, value: string) {
    return this.s.updateLanguage(userId, value);
  }

  updateFcmToken(userId: string) {
    return this.s.updateFcmToken(userId);
  }
  subscribeToClassTopic() {
    return this.s.subscribeToClassTopic();
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

  public async createStudentProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | null,
    image: string | null,
    boardDocId: string | null,
    gradeDocId: string | null,
    languageDocId: string | null,
    classId: string,
    role: string,
    studentId: string
  ): Promise<TableTypes<"user">> {
    return await this.s.createStudentProfile(
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId,
      classId,
      role,
      studentId
    );
  }
  public async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    return this.s.updateClassCourseSelection(classId, selectedCourseIds);
  }

  public async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    return this.s.updateSchoolCourseSelection(schoolId, selectedCourseIds);
  }

  public async addCourseForParentsStudent(
    courses: TableTypes<"course">[],
    student: TableTypes<"user">
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

  public async getLessonFromChapter(
    chapterId: string,
    lessonId: string
  ): Promise<{
    lesson: TableTypes<"lesson">[];
    course: TableTypes<"course">[];
  }> {
    return this.s.getLessonFromChapter(chapterId, lessonId);
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

  syncDB(tableNames: TABLES[] = Object.values(TABLES),
  refreshTables: TABLES[] = []): Promise<boolean> {
    return this.s.syncDB(tableNames,refreshTables);
  }

  async getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<"lesson">[]> {
    return this.s.getRecommendedLessons(studentId, classId);
  }

  searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {
    return this.s.searchLessons(searchString);
  }
  createOrUpdateAssignmentCart(
    userId: string,
    lessons: string
  ): Promise<boolean | undefined> {
    return this.s.createOrUpdateAssignmentCart(userId, lessons);
  }

  getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<"assignment_cart"> | undefined> {
    return this.s.getUserAssignmentCart(userId);
  }

  getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string
  ): Promise<String | undefined> {
    return this.s.getChapterByLesson(lessonId, classId, userId);
  }
  createClass(
    schoolId: string,
    className: string
  ): Promise<TableTypes<"class">> {
    return this.s.createClass(schoolId, className);
  }
  updateClass(classId: string, className: string) {
    return this.s.updateClass(classId, className);
  }
  getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseId: string,
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean
  ): Promise<TableTypes<"assignment">[] | undefined> {
    return this.s.getAssignmentOrLiveQuizByClassByDate(
      classId,
      courseId,
      startDate,
      endDate,
      isClassWise,
      isLiveQuiz
    );
  }
  getAssignmentUserByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"assignment_user">[]> {
    return this.s.getAssignmentUserByAssignmentIds(assignmentIds);
  }
  getStudentLastTenResults(
    studentId: string,
    courseId: string,
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[]> {
    return this.s.getStudentLastTenResults(studentId, courseId, assignmentIds);
  }
  getResultByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[] | undefined> {
    return this.s.getResultByAssignmentIds(assignmentIds);
  }
  async getLastAssignmentsForRecommendations(
    classId: string
  ): Promise<TableTypes<"assignment">[] | undefined> {
    return this.s.getLastAssignmentsForRecommendations(classId);
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
    return this.s.createAssignment(
      student_list,
      userId,
      starts_at,
      ends_at,
      is_class_wise,
      class_id,
      school_id,
      lesson_id,
      chapter_id,
      course_id,
      type
    );
  }
  getTeachersForClass(
    classId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    return this.s.getTeachersForClass(classId);
  }
  getUserByEmail(email: string): Promise<TableTypes<"user"> | undefined> {
    return this.s.getUserByEmail(email);
  }
  getUserByPhoneNumber(phone: string): Promise<TableTypes<"user"> | undefined> {
    return this.s.getUserByPhoneNumber(phone);
  }
  addTeacherToClass(classId: string, userId: string): Promise<void> {
    return this.s.addTeacherToClass(classId, userId);
  }
  checkUserExistInSchool(schoolId: string, userId: string): Promise<boolean> {
    return this.s.checkUserExistInSchool(schoolId, userId);
  }
  checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string
  ): Promise<boolean> {
    return this.s.checkUserIsManagerOrDirector(schoolId, userId);
  }
  async getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    classWiseAssignments: TableTypes<"assignment">[];
    individualAssignments: TableTypes<"assignment">[];
  }> {
    return this.s.getAssignmentsByAssignerAndClass(
      userId,
      classId,
      startDate,
      endDate
    );
  }
  getTeacherJoinedDate(
    userId: string,
    classId: string
  ): Promise<TableTypes<"class_user"> | undefined> {
    return this.s.getTeacherJoinedDate(userId, classId);
  }
  getAssignedStudents(assignmentId: string): Promise<string[]> {
    return this.s.getAssignedStudents(assignmentId);
  }
  getStudentResultByDate(
    studentId: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    return this.s.getStudentResultByDate(
      studentId,
      course_id,
      startDate,
      endDate
    );
  }
  getLessonsBylessonIds(
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"lesson">[] | undefined> {
    return this.s.getLessonsBylessonIds(lessonIds);
  }
  deleteTeacher(classId: string, teacherId: string) {
    return this.s.deleteTeacher(classId, teacherId);
  }
  getClassCodeById(class_id: string): Promise<number | undefined> {
    return this.s.getClassCodeById(class_id);
  }

  getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    return this.s.getResultByChapterByDate(
      chapter_id,
      course_id,
      startDate,
      endDate
    );
  }
  createClassCode(classId: string): Promise<number> {
    return this.s.createClassCode(classId);
  }
  getSchoolsWithRoleAutouser(
    schoolIds: string[]
  ): Promise<TableTypes<"school">[] | undefined> {
    return this.s.getSchoolsWithRoleAutouser(schoolIds);
  }
  getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    return this.s.getPrincipalsForSchool(schoolId);
  }
  getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    return this.s.getCoordinatorsForSchool(schoolId);
  }
  getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    return this.s.getSponsorsForSchool(schoolId);
  }
  async addUserToSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    return this.s.addUserToSchool(schoolId, userId, role);
  }
  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    return this.s.deleteUserFromSchool(schoolId, userId, role);
  }
  async updateSchoolLastModified(schoolId: string): Promise<void> {
    return await this.s.updateSchoolLastModified(schoolId);
  }
  async updateClassLastModified(classId: string): Promise<void> {
    return await this.s.updateClassLastModified(classId);
  }
  async updateUserLastModified(userId: string): Promise<void> {
    return await this.s.updateUserLastModified(userId);
  }
  async validateSchoolData(
    schoolId: string,
    schoolName: string,
    instructionMedium: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateSchoolData(schoolId, schoolName, instructionMedium);
  }
  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateClassCurriculumAndSubject(
      curriculumName,
      subjectName
    );
  }
  async validateClassExistence(
    schoolId: string,
    className: string,
    studentName?: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateClassExistence(schoolId, className, studentName);
  }
  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateUserContacts(
      programManagerPhone,
      fieldCoordinatorPhone
    );
  }
  public async setStarsForStudents(
    studentId: string,
    starsCount: number
  ): Promise<void> {
    return this.s.setStarsForStudents(studentId, starsCount);
  }
}
