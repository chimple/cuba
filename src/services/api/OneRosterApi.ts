// @ts-nocheck
import { HttpHeaders } from '@capacitor-community/http';
import {
  COURSES,
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODES,
  TableTypes,
} from '../../common/constants';
import { Chapter } from '../../interface/curriculumInterfaces';
import Assignment from '../../models/assignment';
import Auth from '../../models/auth';
import Class from '../../models/class';
import CurriculumController from '../../models/curriculumController';
import Result from '../../models/result';
import User from '../../models/user';
import { LeaderboardInfo, ServiceApi } from './ServiceApi';
// import { Chapter } from "../../common/courseConstants";
import Course from '../../models/course';
import Lesson from '../../models/lesson';
import { StudentLessonResult } from '../../common/courseConstants';
import { Unsubscribe } from '@firebase/firestore';
import { AvatarObj } from '../../components/animation/Avatar';
import LiveQuizRoomObject from '../../models/liveQuizRoom';
import { DocumentData } from 'firebase/firestore';
import { RoleType } from '../../interface/modelInterfaces';
import logger from '../../utility/logger';

export class OneRosterApi implements ServiceApi {
  public static i: OneRosterApi;
  private preQuizMap: { [key: string]: { [key: string]: Result } } = {};
  private classes: { [key: string]: Class[] } = {};
  private lessonMap: { [key: string]: { [key: string]: Result } } = {};

  async updateSchoolLocation(
    schoolId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getCoursesForParentsStudent(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }
  getAdditionalCourses(studentId: string): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }

  addCourseForParentsStudent(
    courses: Course[],
    student: User,
  ): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }

  getCoursesForClassStudent(classId: string): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }

  getLessonWithCocosLessonId(
    lessonId: string,
  ): Promise<TableTypes<'lesson'> | null> {
    throw new Error('Method not implemented.');
  }
  getLesson(id: string): Promise<Lesson | undefined> {
    throw new Error('Method not implemented.');
  }
  getBonusesByIds(ids: string[]): Promise<TableTypes<'lesson'>[]> {
    throw new Error('Method not implemented.');
  }
  getChapterById(id: string): Promise<Chapter | undefined> {
    throw new Error('Method not implemented.');
  }
  getDifferentGradesForCourse(course: TableTypes<'course'>): Promise<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }> {
    throw new Error('Method not implemented.');
  }
  getAssignmentById(id: string): Promise<TableTypes<'assignment'> | undefined> {
    throw new Error('Method not implemented.');
  }
  assignmentListner(
    classId: string,
    onDataChange: (user: Assignment | undefined) => void,
  ) {
    throw new Error('Method not implemented.');
  }
  removeAssignmentChannel() {
    throw new Error('Method not implemented.');
  }
  assignmentUserListner(
    studentId: string,
    onDataChange: (user: Assignment | undefined) => void,
  ) {
    throw new Error('Method not implemented.');
  }
  liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (user: LiveQuizRoomObject | undefined) => void,
  ): Unsubscribe {
    throw new Error('Method not implemented.');
  }
  updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  joinLiveQuiz(
    studentId: string,
    assignmentId: string,
  ): Promise<string | undefined> {
    throw new Error('Method not implemented.');
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
    throw new Error('Method not implemented.');
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
    throw new Error('Method not implemented.');
  }
  updateRewardsForStudent(
    studentId: string,
    unlockedReward: LeaderboardRewards,
  ) {
    throw new Error('Method not implemented.');
  }

  getUserByDocId(studentId: string): Promise<TableTypes<'user'> | undefined> {
    throw new Error('Method not implemented.');
  }
  updateRewardAsSeen(studentId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getLeaderboardStudentResultFromB2CCollection(
    studentId: string,
  ): Promise<LeaderboardInfo | undefined> {
    throw new Error('Method not implemented.');
  }
  getRewardsById(
    id: number,
    periodType: string,
  ): Promise<TableTypes<'reward'> | undefined> {
    throw new Error('Method not implemented.');
  }
  getUserSticker(userId: string): Promise<TableTypes<'user_sticker'>[]> {
    throw new Error('Method not implemented.');
  }
  getUserBonus(userId: string): Promise<TableTypes<'user_bonus'>[]> {
    throw new Error('Method not implemented.');
  }
  getUserBadge(userId: string): Promise<TableTypes<'user_badge'>[]> {
    throw new Error('Method not implemented.');
  }
  getBadgesByIds(ids: string[]): Promise<TableTypes<'badge'>[]> {
    throw new Error('Method not implemented.');
  }
  getStickersByIds(ids: string[]): Promise<TableTypes<'sticker'>[]> {
    throw new Error('Method not implemented.');
  }
  getAvatarInfo(): Promise<AvatarObj | undefined> {
    throw new Error('Method not implemented.');
  }
  updateTcAccept(userId: string) {
    throw new Error('Method not implemented.');
  }

  deleteAllUserData(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getCoursesByGrade(gradeDocId: any): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }
  getAllCourses(): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }
  getSchoolById(id: string): Promise<TableTypes<'school'> | undefined> {
    throw new Error('Method not implemented.');
  }
  getLeaderboardResults(
    sectionId: string,
    isWeeklyData: LeaderboardDropdownList,
  ): Promise<LeaderboardInfo | undefined> {
    throw new Error('Method not implemented.');
  }

  subscribeToClassTopic(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getAllLessonsForCourse(courseId: string): Promise<TableTypes<'lesson'>[]> {
    throw new Error('Method not implemented.');
  }
  getLiveQuizLessons(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    throw new Error('Method not implemented.');
  }
  getLiveQuizRoomDoc(
    liveQuizRoomDocId: string,
  ): Promise<DocumentData | undefined> {
    throw new Error('Method not implemented.');
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string,
  ): Promise<Lesson | undefined> {
    throw new Error('Method not implemented.');
  }
  getDataByInviteCode(inviteCode: number): Promise<any> {
    throw new Error('Method not implemented.');
  }
  linkStudent(inviteCode: number, studentId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getStudentResult(
    studentId: string,
    fromCache?: boolean,
  ): Promise<TableTypes<'result'>[]> {
    throw new Error('Method not implemented.');
  }
  getStudentProgress(studentId: string): Promise<
    Record<
      string,
      (TableTypes<'result'> & {
        lesson_name?: string;
        chapter_name?: string;
      })[]
    >
  > {
    throw new Error('Method not implemented.');
  }
  getStudentResultInMap(
    studentId: string,
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'> }> {
    throw new Error('Method not implemented.');
  }
  getClassById(id: string): Promise<TableTypes<'class'> | undefined> {
    throw new Error('Method not implemented.');
  }
  isStudentLinked(studentId: string, fromCache: boolean): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getPendingAssignments(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    throw new Error('Method not implemented.');
  }
  getSchoolsForUser(
    userId: string,
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    throw new Error('Method not implemented.');
  }
  isUserTeacher(userId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getClassesForSchool(
    schoolId: string,
    userId: string,
  ): Promise<TableTypes<'class'>[]> {
    throw new Error('Method not implemented.');
  }
  getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]> {
    throw new Error('Method not implemented.');
  }
  get currentMode(): MODES {
    throw new Error('Method not implemented.');
  }

  set currentMode(value: MODES) {
    throw new Error('Method not implemented.');
  }

  getSubject(id: string): Promise<TableTypes<'subject'> | undefined> {
    throw new Error('Method not implemented.');
  }

  getCourse(id: string): Promise<TableTypes<'course'> | undefined> {
    throw new Error('Method not implemented.');
  }

  getCourses(courseIds: string[]): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }

  getDomainsBySubjectAndFramework(
    subjectId: string,
    frameworkId: string,
  ): Promise<TableTypes<'domain'>[]> {
    throw new Error('Method not implemented.');
  }
  getCompetenciesByDomainIds(
    domainIds: string[],
  ): Promise<TableTypes<'competency'>[]> {
    throw new Error('Method not implemented.');
  }
  getOutcomesByCompetencyIds(
    competencyIds: string[],
  ): Promise<TableTypes<'outcome'>[]> {
    throw new Error('Method not implemented.');
  }
  getSkillsByOutcomeIds(outcomeIds: string[]): Promise<TableTypes<'skill'>[]> {
    throw new Error('Method not implemented.');
  }
  getResultsBySkillIds(
    studentId: string,
    skillIds: string[],
  ): Promise<TableTypes<'result'>[]> {
    throw new Error('Method not implemented.');
  }
  getSkillRelationsByTargetIds(
    targetSkillIds: string[],
  ): Promise<TableTypes<'skill_relation'>[]> {
    throw new Error('Method not implemented.');
  }
  getSkillLessonsBySkillIds(
    skillIds: string[],
  ): Promise<TableTypes<'skill_lesson'>[]> {
    throw new Error('Method not implemented.');
  }

  deleteProfile(studentId: string) {
    throw new Error('Method not implemented.');
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
    languageDocId: string,
  ): Promise<User> {
    throw new Error('Method not implemented.');
  }

  updateUserProfile(
    user: TableTypes<'user'>,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined,
    options?: {
      age?: string;
      gender?: string;
    },
  ): Promise<TableTypes<'user'>> {
    throw new Error('Method not implemented.');
  }

  updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getSchoolsWithRoleAutouser(
    schoolIds: string[],
    userId: string,
  ): Promise<TableTypes<'school'>[] | undefined> {
    throw new Error('Method not implemented.');
  }

  getCoursesByClassId(classId: string): Promise<TableTypes<'class_course'>[]> {
    throw new Error('Method not implemented.');
  }
  deleteUserFromClass(userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getLessonResultsForStudent(
    studentId: string,
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    throw new Error('Method not implemented.');
  }
  updateFavoriteLesson(
    studentId: string,
    lessonId: string,
  ): Promise<TableTypes<'favorite_lesson'>> {
    throw new Error('Method not implemented.');
  }
  updateResult(
    student: User,
    courseId: string,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    assignmentId: string | undefined,
    chapterId: string,
    classId: string | undefined,
    schoolId: string | undefined,
    isImediateSync?: boolean,
    isHomework?: boolean,
    skill_id?: string | undefined,
    skill_ability?: number | undefined,
    outcome_id?: string | undefined,
    outcome_ability?: number | undefined,
    competency_id?: string | undefined,
    competency_ability?: number | undefined,
    domain_id?: string | undefined,
    domain_ability?: number | undefined,
    subject_id?: string | undefined,
    subject_ability?: number | undefined,
    user_id?: string | underfined,
  ): Promise<Result> {
    throw new Error('Method not implemented.');
  }
  getLanguageWithId(id: string): Promise<TableTypes<'language'> | undefined> {
    throw new Error('Method not implemented.');
  }
  getAllCurriculums(): Promise<TableTypes<'curriculum'>[]> {
    throw new Error('Method not implemented.');
  }
  getAllGrades(): Promise<TableTypes<'grade'>[]> {
    throw new Error('Method not implemented.');
  }
  getAllLanguages(): Promise<TableTypes<'language'>[]> {
    throw new Error('Method not implemented.');
  }
  getParentStudentProfiles(): Promise<TableTypes<'user'>[]> {
    throw new Error('Method not implemented.');
  }

  getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined,
  ): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }

  updateSoundFlag(userId: string, value: boolean) {
    throw new Error('Method not implemented.');
  }
  updateMusicFlag(userId: string, value: boolean) {
    throw new Error('Method not implemented.');
  }
  updateLanguage(userId: string, value: string) {
    throw new Error('Method not implemented.');
  }
  updateFcmToken(userId: string) {
    throw new Error('Method not implemented.');
  }

  get currentStudent(): TableTypes<'user'> | undefined {
    throw new Error('Method not implemented.');
  }
  set currentStudent(value: TableTypes<'user'> | undefined) {
    throw new Error('Method not implemented.');
  }
  get currentClass(): TableTypes<'class'> | undefined {
    throw new Error('Method not implemented.');
  }
  set currentClass(value: TableTypes<'class'> | undefined) {
    throw new Error('Method not implemented.');
  }
  get currentSchool(): TableTypes<'school'> | undefined {
    throw new Error('Method not implemented.');
  }
  set currentSchool(value: TableTypes<'school'> | undefined) {
    throw new Error('Method not implemented.');
  }

  get currentCourse():
    | Map<string, TableTypes<'course'> | undefined>
    | undefined {
    throw new Error('Method not implemented.');
  }
  set currentCourse(
    value: Map<string, TableTypes<'course'> | undefined> | undefined,
  ) {
    throw new Error('Method not implemented.');
  }
  createProfile(
    name: string,
    age: number,
    gender: string,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined,
  ): Promise<TableTypes<'user'>> {
    throw new Error('Method not implemented.');
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
    studentId: string,
  ): Promise<TableTypes<'user'>> {
    throw new Error('Method not implemented.');
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
        logger.error(
          '🚀 ~ file: OneRosterApi.ts:53 ~ OneRosterApi ~ getHeaders ~ error:',
          JSON.stringify(error),
        );
      }
    }
    return {
      'auth-token': Auth.i.authToken,
      'ipc-host': ipcHost,
    };
  }

  /**
   * Search students by name, student_id, or phone number in a school, paginated.
   * Not implemented for OneRosterApi, returns empty result.
   */
  searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
    classId?: string,
  ): Promise<StudentAPIResponse> {
    return Promise.resolve({ data: [], total: 0 });
  }

  /**
   * Search teachers by name, email, or phone in a school. Not implemented for OneRosterApi.
   */
  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
  ): Promise<any[]> {
    // Not implemented for OneRosterApi, return empty paginated result
    return { data: [], total: 0 };
  }

  async getClassesForUser(userId: string): Promise<Class[]> {
    return [];
  }

  async getResultsForStudentForClass(
    classId: string,
    studentId: string,
  ): Promise<Result[]> {
    throw new Error('Method not implemented.');
    return [];
  }

  async isPreQuizDone(
    subjectCode: string,
    classId: string,
    studentId: string,
  ): Promise<boolean> {
    if (COURSES.PUZZLE === subjectCode) return true;
    const preQuiz = await this.getPreQuiz(subjectCode, classId, studentId);
    return !!preQuiz;
  }

  async getPreQuiz(
    subjectCode: string,
    classId: string,
    studentId: string,
  ): Promise<Result | undefined> {
    return;
  }

  public async getResultsForStudentsForClassInLessonMap(
    classId: string,
    studentId: string,
  ): Promise<{ [key: string]: Result }> {
    return {};
  }

  async getLineItemForClassForLessonId(
    classId: string,
    lessonId: string,
  ): Promise<Assignment | undefined> {
    return;
  }

  async putLineItem(classId: string, lessonId: string): Promise<Assignment> {
    throw new Error('Method not implemented.');
  }

  async putResult(
    userId: string,
    classId: string,
    lessonId: string,
    score: number,
    subjectCode: string,
  ): Promise<Result | undefined> {
    throw new Error('Method not implemented.');
  }

  async getClassForUserForSubject(
    userId: string,
    subjectCode: string,
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
        value.classCode === subjectCode,
    );
    return classForSub ?? classes[0];
  }

  async getUser(userId: string): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }

  async updatePreQuiz(
    subjectCode: string,
    classId: string,
    studentId: string,
    chapterId: string,
    updateNextChapter = true,
  ): Promise<Result | undefined> {
    throw new Error('Method not implemented.');
  }

  async getChapterForPreQuizScore(
    subjectCode: string,
    score: number,
    chapters: Chapter[] | undefined = undefined,
  ): Promise<Chapter> {
    if (!chapters) {
      const curInstance = CurriculumController.getInstance();
      chapters = await curInstance.allChapterForSubject(subjectCode);
    }
    if (score > 100) score = 100;
    let index = (score * chapters.length) / 100 - 1;
    const isFloat = (x: number) => !!(x % 1);
    if (isFloat(index)) index = Math.round(index);
    return chapters[Math.min(index, chapters.length - 1)] ?? chapters[1];
  }

  public async getCoursesFromLesson(
    lessonId: string,
  ): Promise<TableTypes<'course'>[]> {
    throw new Error('Method not implemented.');
  }

  searchLessons(searchString: string): Promise<TableTypes<'lesson'>[]> {
    throw new Error('Method not implemented.');
  }
  createOrUpdateAssignmentCart(
    userId: string,
    lessons: string,
  ): Promise<boolean | undefined> {
    throw new Error('Method not implemented.');
  }
  getUserAssignmentCart(
    userId: string,
  ): Promise<TableTypes<'assignment_cart'> | undefined> {
    throw new Error('Method not implemented.');
  }
  getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string,
  ): Promise<String | undefined> {
    throw new Error('Method not implemented.');
  }
  getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean,
    allAssignments: boolean,
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    throw new Error('Method not implemented.');
  }
  getStudentLastTenResults(
    studentId: string,
    assignmentIds: string[],
    courseIds: string[],
  ): Promise<TableTypes<'result'>[]> {
    throw new Error('Method not implemented.');
  }
  getResultByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'result'>[] | undefined> {
    throw new Error('Method not implemented.');
  }
  getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    throw new Error('Method not implemented.');
  }
  getLessonsBylessonIds(
    lessonIds: string[], // Expect an array of strings
  ): Promise<TableTypes<'lesson'>[] | undefined> {
    throw new Error('Method not implemented.');
  }
  getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    throw new Error('Method not implemented.');
  }

  validateSchoolData(
    schholId: string,
    schoolName: string,
  ): Promise<TableTypes<'school_data'>[] | undefined> {
    throw new Error('Method not implemented.');
  }
  validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    throw new Error('Method not implemented.');
  }
  validateSchoolUdiseCode(
    schoolId: string,
  ): Promise<{ status: string; errors?: string[] }> {
    throw new Error('Method not implemented.');
  }
  validateClassNameWithSchoolID(
    schoolId: string,
    className: string,
  ): Promise<{ status: string; errors?: string[] }> {
    throw new Error('Method not implemented.');
  }
  validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    throw new Error('Method not implemented.');
  }
  validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    throw new Error('Method not implemented.');
  }
  validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string,
  ): Promise<{ status: string; errors?: string[] }> {
    throw new Error('Method not implemented.');
  }
  uploadData(payload: any): Promise<boolean | any> {
    throw new Error('Method not implemented.');
  }
  insertProgram(payload: any): Promise<boolean | any> {
    throw new Error('Method not implemented.');
  }
  getProgramManagers(): Promise<{ name: string; id: string }[]> {
    throw new Error('Method not implemented.');
  }
  getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    throw new Error('Method not implemented.');
  }
  getProgramForSchool(
    schoolId: string,
  ): Promise<TableTypes<'program'> | undefined> {
    throw new Error('Method not implemented.');
  }
  getProgramManagersForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    throw new Error('Method not implemented.');
  }

  getTeacherInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number,
  ): Promise<TeacherAPIResponse> {
    throw new Error('Method not implemented.');
  }
  getStudentInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number,
    classId?: string,
  ): Promise<StudentAPIResponse> {
    throw new Error('Method not implemented.');
  }
  getStudentsAndParentsByClassId(
    classId: string,
    page: number,
    limit: number,
  ): Promise<StudentAPIResponse> {
    throw new Error('Method not implemented.');
  }

  getStudentAndParentByStudentId(
    studentId: string,
  ): Promise<{ user: any; parents: any[] }> {
    throw new Error('Method not implemented.');
  }

  mergeStudentRequest(
    existingStudentId: string,
    newStudentId: string,
    requestId?: string | undefined,
    respondedBy?: string | undefined,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  mergeUserPathway(
    existingStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    throw new Error('Method not implemented.');
  }

  getClassesBySchoolId(schoolId: string): Promise<TableTypes<'class'>[]> {
    throw new Error('Method not implemented.');
  }
  getGeoData(params: GeoDataParams): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  searchSchools(params: SearchSchoolsParams): Promise<SearchSchoolsResult> {
    throw new Error('Method not implemented.');
  }
  async getActiveStudentsCountByClass(classId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  getLidoCommonAudioUrl(
    languageId: string,
    localeId?: string | null,
  ): Promise<{ lido_common_audio_url: string | null } | null> {
    throw new Error('Method not implemented.');
  }
}
