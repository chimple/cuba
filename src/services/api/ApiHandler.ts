import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
import { StudentLessonResult } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import {
  FilteredSchoolsForSchoolListingOps,
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODEL,
  MODES,
  PROFILETYPE,
  SchoolRoleMap,
  StudentAPIResponse,
  TeacherAPIResponse,
  TABLES,
  TableTypes,
  TabType,
  PrincipalAPIResponse,
  CoordinatorAPIResponse,
  EnumType,
  CACHETABLES,
  RequestTypes,
  STATUS,
  GeoDataParams,
  SearchSchoolsParams,
  SearchSchoolsResult,
} from "../../common/constants";
import { AvatarObj } from "../../components/animation/Avatar";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import { RoleType } from "../../interface/modelInterfaces";
import { image, school } from "ionicons/icons";
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from "../../ops-console/pages/NewUserPageOps";

export class ApiHandler implements ServiceApi {
  public static i: ApiHandler;

  private s: ServiceApi;

  private constructor(service: ServiceApi) {
    this.s = service;
    console.log("ApiHandler constructor called with service:", service);
  }

  public static getInstance(service: ServiceApi): ApiHandler {
    if (!service) {
      console.error(
        "ApiHandler.getInstance was called with an undefined service. This will cause errors."
      );
    }
    // Only create a new instance if the service has changed
    if (!ApiHandler.i || ApiHandler.i.s !== service) {
      ApiHandler.i = new ApiHandler(service);
    }
    return ApiHandler.i;
  }

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

  public clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void> {
    return this.s.clearCacheData(tableNames);
  }

  public async joinLiveQuiz(
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined> {
    return this.s.joinLiveQuiz(assignmentId, studentId);
  }
  // private constructor() {}
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
  public async uploadData(payload: any): Promise<boolean | null> {
    return await this.s.uploadData(payload);
  }
  public async createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string,
    group4: string | null,
    image: File | null,
    program_id: string | null,
    udise: string | null,
    address: string | null,
    country: string | null,
    onlySchool?: boolean,
    onlySchoolUser?: boolean
  ): Promise<TableTypes<"school">> {
    return await this.s.createSchool(
      name,
      group1,
      group2,
      group3,
      group4,
      image,
      program_id,
      udise,
      address,
      country,
      onlySchool,
      onlySchoolUser
    );
  }
  public async updateSchoolProfile(
    school: TableTypes<"school">,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4?: string | null,
    program_id?: string | null,
    udise?: string | null,
    address?: string | null
  ): Promise<TableTypes<"school">> {
    return await this.s.updateSchoolProfile(
      school,
      name,
      group1,
      group2,
      group3,
      image,
      group4 ?? null,
      program_id ?? null,
      udise ?? null,
      address ?? null
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
    requested_by: string
  ): Promise<TableTypes<"ops_requests"> | null> {
    return await this.s.getExistingSchoolRequest(requested_by);
  }

  public async deleteApprovedOpsRequestsForUser(
    requested_by: string,
    schoolId?: string,
    classId?: string
  ): Promise<void> {
    return await this.s.deleteApprovedOpsRequestsForUser(
      requested_by,
      schoolId,
      classId
    );
  }

  public async getSchoolsForUser(
    userId: string,
    options?: { page?: number; page_size?: number; search?: string }
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    return await this.s.getSchoolsForUser(userId, options);
  }
  public async getUserRoleForSchool(
    userId: string,
    schoolId: string
  ): Promise<RoleType | undefined> {
    return await this.s.getUserRoleForSchool(userId, schoolId);
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
  public async deleteUserFromClass(
    userId: string,
    class_id: string
  ): Promise<void> {
    return await this.s.deleteUserFromClass(userId, class_id);
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
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
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
    profilePic: string | undefined,
    options?: {
      age?: string;
      gender?: string;
    }
  ): Promise<TableTypes<"user">> {
    return await this.s.updateUserProfile(
      user,
      fullName,
      email,
      phoneNum,
      languageDocId,
      profilePic,
      options
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
    student: TableTypes<"user">,
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
      student,
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
  public async getCourses(
    courseIds: string[]
  ): Promise<TableTypes<"course">[]> {
    return await this.s.getCourses(courseIds);
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

  syncDB(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
    isFirstSync?: boolean
  ): Promise<boolean> {
    return this.s.syncDB(tableNames, refreshTables, isFirstSync);
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
    className: string,
    groupId?: string
  ): Promise<TableTypes<"class">> {
    return this.s.createClass(schoolId, className, groupId);
  }
  updateClass(classId: string, className: string, groupId?: string) {
    return this.s.updateClass(classId, className, groupId);
  }
  getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean,
    allAssignments: boolean
  ): Promise<TableTypes<"assignment">[] | undefined> {
    return this.s.getAssignmentOrLiveQuizByClassByDate(
      classId,
      courseIds,
      startDate,
      endDate,
      isClassWise,
      isLiveQuiz,
      allAssignments
    );
  }

  getAssignmentUserByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"assignment_user">[]> {
    return this.s.getAssignmentUserByAssignmentIds(assignmentIds);
  }
  getStudentLastTenResults(
    studentId: string,
    courseIds: string[],
    assignmentIds: string[],
    classId
  ): Promise<TableTypes<"result">[]> {
    return this.s.getStudentLastTenResults(
      studentId,
      courseIds,
      assignmentIds,
      classId
    );
  }
  getResultByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[] | undefined> {
    return this.s.getResultByAssignmentIds(assignmentIds);
  }

  getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    return this.s.getResultByAssignmentIdsForCurrentClassMembers(
      assignmentIds,
      classId
    );
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
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string
  ): Promise<void> {
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
      type,
      batch_id,
      source,
      created_at
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
  addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<"user">
  ): Promise<void> {
    return this.s.addTeacherToClass(schoolId, classId, user);
  }
  checkUserExistInSchool(schoolId: string, userId: string): Promise<boolean> {
    return this.s.checkUserExistInSchool(schoolId, userId);
  }
  checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string
  ): Promise<boolean> {
    return this.s.checkTeacherExistInClass(schoolId, classId, userId);
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
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    return this.s.getStudentResultByDate(
      studentId,
      courseIds,
      startDate,
      endDate,
      classId
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
    endDate: string,
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    return this.s.getResultByChapterByDate(
      chapter_id,
      course_id,
      startDate,
      endDate,
      classId
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
  getPrincipalsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number
  ): Promise<PrincipalAPIResponse> {
    return this.s.getPrincipalsForSchoolPaginated(schoolId, page, limit);
  }
  getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    return this.s.getCoordinatorsForSchool(schoolId);
  }
  getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number
  ): Promise<CoordinatorAPIResponse> {
    return this.s.getCoordinatorsForSchoolPaginated(schoolId, page, limit);
  }
  getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    return this.s.getSponsorsForSchool(schoolId);
  }
  async addUserToSchool(
    schoolId: string,
    user: TableTypes<"user">,
    role: RoleType
  ): Promise<void> {
    return this.s.addUserToSchool(schoolId, user, role);
  }
  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    studentLoginType: string;
    schoolModel: string;
  } | null> {
    return this.s.getSchoolDetailsByUdise(udiseCode);
  }
  async getSchoolDataByUdise(udiseCode: string): Promise<TableTypes<"school_data">| null> {
    return this.s.getSchoolDataByUdise(udiseCode);
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
    schoolName: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateSchoolData(schoolId, schoolName);
  }
  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    return this.s.validateParentAndStudentInClass(
      phoneNumber,
      studentName,
      className,
      schoolId
    );
  }
  async validateProgramName(
    programName: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateProgramName(programName);
  }
  async validateSchoolUdiseCode(
    schoolId: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateSchoolUdiseCode(schoolId);
  }
  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateClassNameWithSchoolID(schoolId, className);
  }

  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    return this.s.validateStudentInClassWithoutPhone(
      studentName,
      className,
      schoolId
    );
  }
  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateClassCurriculumAndSubject(
      curriculumName,
      subjectName,
      gradeName
    );
  }
  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string
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
  public async countAllPendingPushes(): Promise<number> {
    return this.s.countAllPendingPushes();
  }
  public async getDebugInfoLast30Days(parentId: string): Promise<any[]> {
    return this.s.getDebugInfoLast30Days(parentId);
  }
  public async getClassByUserId(
    userId: string
  ): Promise<TableTypes<"class"> | undefined> {
    return this.s.getClassByUserId(userId);
  }
  public async getCoursesForPathway(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    return await this.s.getCoursesForPathway(studentId);
  }
  public async updateLearningPath(
    student: TableTypes<"user">,
    learning_path: string // New parameter for learning_path
  ): Promise<TableTypes<"user">> {
    return await this.s.updateLearningPath(student, learning_path);
  }

  public async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    return await this.s.getProgramFilterOptions();
  }
  async getPrograms(params: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: "asc" | "desc";
  }): Promise<{ data: any[] }> {
    return await this.s.getPrograms(params);
  }

  public async insertProgram(payload: any): Promise<boolean | null> {
    return await this.s.insertProgram(payload);
  }
  public async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    return await this.s.getProgramManagers();
  }
  public async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    return await this.s.getUniqueGeoData();
  }
  public async getProgramForSchool(
    schoolId: string
  ): Promise<TableTypes<"program"> | undefined> {
    return await this.s.getProgramForSchool(schoolId);
  }
  public async getProgramManagersForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    return await this.s.getProgramManagersForSchool(schoolId);
  }
  public async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0
  ): Promise<TableTypes<"school">[]> {
    return await this.s.getSchoolsForAdmin(limit, offset);
  }
  public async getTeachersForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    return await this.s.getTeachersForSchools(schoolIds);
  }
  public async getStudentsForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    return await this.s.getStudentsForSchools(schoolIds);
  }
  public async getProgramManagersForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    return await this.s.getProgramManagersForSchools(schoolIds);
  }

  public async getFieldCoordinatorsForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    return await this.s.getFieldCoordinatorsForSchools(schoolIds);
  }

  public async updateStudentStars(
    studentId: string,
    totalStars: number
  ): Promise<void> {
    return await this.s.updateStudentStars(studentId, totalStars);
  }
  public async getChapterIdbyQrLink(
    link: string
  ): Promise<TableTypes<"chapter_links"> | undefined> {
    return await this.s.getChapterIdbyQrLink(link);
  }
  public async getSchoolsByModel(
    model: EnumType<"program_model">,
    limit: number = 10,
    offset: number = 0
  ): Promise<TableTypes<"school">[]> {
    return await this.s.getSchoolsByModel(model, limit, offset);
  }

  public async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: { name: string; role: string; phone: string }[];
  } | null> {
    return await this.s.getProgramData(programId);
  }

  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    return await this.s.getSchoolFilterOptionsForSchoolListing();
  }

  async getSchoolFilterOptionsForProgram(
    programId: string
  ): Promise<Record<string, string[]>> {
    return await this.s.getSchoolFilterOptionsForProgram(programId);
  }

  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: "asc" | "desc";
    search?: string;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this.s.getFilteredSchoolsForSchoolListing(params);
  }

  public async createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }> {
    return await this.s.createOrAddUserOps(payload);
  }

  public async getTeacherInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number
  ): Promise<TeacherAPIResponse> {
    return await this.s.getTeacherInfoBySchoolId(schoolId, page, limit);
  }
  public async getStudentInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number
  ): Promise<StudentAPIResponse> {
    return await this.s.getStudentInfoBySchoolId(schoolId, page, limit);
  }
  public async getStudentsAndParentsByClassId(
    classId: string,
    page: number,
    limit: number
  ): Promise<StudentAPIResponse> {
    return await this.s.getStudentsAndParentsByClassId(classId, page, limit);
  }
  public async getStudentAndParentByStudentId(
    studentId: string
  ): Promise<{ user: any; parents: any[] }> {
    return await this.s.getStudentAndParentByStudentId(studentId);
  }
  public async mergeStudentRequest(
    requestId: string,
    existingStudentId: string,
    newStudentId: string,
    respondedBy: string
  ): Promise<void> {
    return await this.s.mergeStudentRequest(
      requestId,
      existingStudentId,
      newStudentId,
      respondedBy
    );
  }

  public async getClassesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"class">[]> {
    return await this.s.getClassesBySchoolId(schoolId);
  }
  public async createAutoProfile(
    languageDocId: string | undefined
  ): Promise<TableTypes<"user">> {
    return await this.s.createAutoProfile(languageDocId);
  }

  public async isProgramUser(): Promise<boolean> {
    return await this.s.isProgramUser();
  }

  public async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this.s.program_activity_stats(programId);
  }

  public async getManagersAndCoordinators(
    page: number = 1,
    search: string = "",
    limit: number = 10,
    sortBy: keyof TableTypes<"user"> = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<{
    data: { user: TableTypes<"user">; role: string }[];
    totalCount: number;
  }> {
    return await this.s.getManagersAndCoordinators(
      page,
      search,
      limit,
      sortBy,
      sortOrder
    );
  }

  public async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this.s.school_activity_stats(schoolId);
  }

  public async isProgramManager(): Promise<boolean> {
    return await this.s.isProgramManager();
  }

  public async getUserSpecialRoles(userId: string): Promise<string[]> {
    return await this.s.getUserSpecialRoles(userId);
  }
  public async updateSpecialUserRole(
    userId: string,
    role: string
  ): Promise<void> {
    return await this.s.updateSpecialUserRole(userId, role);
  }
  public async deleteSpecialUser(userId: string): Promise<void> {
    return await this.s.deleteSpecialUser(userId);
  }
  public async updateProgramUserRole(
    userId: string,
    role: string
  ): Promise<void> {
    return await this.s.updateProgramUserRole(userId, role);
  }
  public async deleteProgramUser(userId: string): Promise<void> {
    return await this.s.deleteProgramUser(userId);
  }
  public async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType
  ): Promise<void> {
    return await this.s.deleteUserFromSchoolsWithRole(userId, role);
  }
  public async getChaptersByIds(chapterIds: string[]) {
    return await this.s.getChaptersByIds(chapterIds);
  }
  public async addParentToNewClass(
    classId: string,
    studentId: string
  ): Promise<void> {
    return await this.s.addParentToNewClass(classId, studentId);
  }
  public async getOpsRequests(
    requestStatus: EnumType<"ops_request_status">,
    page: number = 1,
    limit: number = 20,
    orderBy: string = "created_at",
    orderDir: "asc" | "desc" = "asc",
    filters?: { request_type?: string[]; school?: string[] },
    searchTerm?: string
  ) {
    return this.s.getOpsRequests(
      requestStatus,
      page,
      limit,
      orderBy,
      orderDir,
      filters,
      searchTerm
    );
  }
  public async getRequestFilterOptions() {
    return this.s.getRequestFilterOptions();
  }

  public async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<StudentAPIResponse> {
    return await this.s.searchStudentsInSchool(
      schoolId,
      searchTerm,
      page,
      limit
    );
  }

  public async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<TeacherAPIResponse> {
    return await this.s.searchTeachersInSchool(
      schoolId,
      searchTerm,
      page,
      limit
    );
  }
  public async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string
  ): Promise<TableTypes<"ops_requests"> | undefined> {
    return await this.s.respondToSchoolRequest(
      requestId,
      respondedBy,
      status,
      rejectedReasonType,
      rejectedReasonDescription
    );
  }
  public async getFieldCoordinatorsByProgram(
    programId: string
  ): Promise<{ data: TableTypes<"user">[] }> {
    return this.s.getFieldCoordinatorsByProgram(programId);
  }

  public async getProgramsByRole(): Promise<{ data: TableTypes<"program">[] }> {
    return this.s.getProgramsByRole();
  }
  public async updateSchoolStatus(
    schoolId: string,
    schoolStatus: (typeof STATUS)[keyof typeof STATUS],
    address?: {
      state?: string;
      district?: string;
      city?: string;
      address?: string;
    },
    keyContacts?: any
  ): Promise<void> {
    return await this.s.updateSchoolStatus(
      schoolId,
      schoolStatus,
      address,
      keyContacts
    );
  }
  async approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string
  ): Promise<TableTypes<"ops_requests"> | undefined> {
    return await this.s.approveOpsRequest(
      requestId,
      respondedBy,
      role,
      schoolId,
      classId
    );
  }
  async getGeoData(params: GeoDataParams): Promise<string[]> {
    return await this.s.getGeoData(params);
  }

  async searchSchools(
    params: SearchSchoolsParams
  ): Promise<SearchSchoolsResult> {
    return await this.s.searchSchools(params);
  }
  public async sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string
  ): Promise<void> {
    return this.s.sendJoinSchoolRequest(schoolId, requestType, classId);
  }
  public async getAllClassesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"class">[]> {
    return this.s.getAllClassesBySchoolId(schoolId);
  }
  getRewardById(
    rewardId: string
  ): Promise<TableTypes<"rive_reward"> | undefined> {
    return this.s.getRewardById(rewardId);
  }
  getAllRewards(): Promise<TableTypes<"rive_reward">[] | []> {
    return this.s.getAllRewards();
  }
  updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string
  ): Promise<void> {
    return this.s.updateUserReward(userId, rewardId, created_at);
  }
  public async getActiveStudentsCountByClass(classId): Promise<string> {
    return this.s.getActiveStudentsCountByClass(classId);
  }
  public async getCompletedAssignmentsCountForSubjects(
    studentId,
    subjectIds
  ): Promise<{ subject_id: string; completed_count: number }[]> {
    return this.s.getCompletedAssignmentsCountForSubjects(
      studentId,
      subjectIds
    );
  }
  public async getOrcreateschooluser(
    params: UserSchoolClassParams
  ): Promise<UserSchoolClassResult> {
    return await this.s.getOrcreateschooluser(params);
  }
  public async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any
  ): Promise<void> {
    return this.s.insertSchoolDetails(schoolId, schoolModel, locationLink, keyContacts);
  }
  public async updateClassCourses(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    return this.s.updateClassCourses(classId, selectedCourseIds)
  }
  public async addStudentWithParentValidation(params: {
    phone: string;
    name: string;
    gender: string;
    age: string;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?:string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return this.s.addStudentWithParentValidation(params);
  }
}
