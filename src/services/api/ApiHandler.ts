import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import { Chapter, StudentLessonResult } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import Result from "../../models/result";
import Subject from "../../models/subject";
import Assignment from "../../models/assignment";
import Class from "../../models/class";
import StudentProfile from "../../models/studentProfile";
import school from "../../models/school";
import { MODES } from "../../common/constants";
import School from "../../models/school";
import { AvatarObj } from "../../components/animation/Avatar";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";

export class ApiHandler implements ServiceApi {
  public static i: ApiHandler;

  private s: ServiceApi;

  public getAssignmentById(id: string): Promise<Assignment | undefined> {
    return this.s.getAssignmentById(id);
  }

  public liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (user: LiveQuizRoomObject) => void
  ): Unsubscribe {
    return this.s.liveQuizListener(liveQuizRoomDocId, onDataChange);
  }

  public async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    score: number,
    timeSpent: number
  ): Promise<void> {
    return this.s.updateLiveQuiz(roomDocId, studentId, score, timeSpent);
  }

  public async joinLiveQuiz(
    studentId: string,
    assignmentId: string
  ): Promise<string | undefined> {
    return this.s.joinLiveQuiz(studentId, assignmentId);
  }
  private constructor() {}
  public async getAvatarInfo(): Promise<AvatarObj | undefined> {
    return await this.s.getAvatarInfo();
  }
  public async getSchoolsForUser(user: User): Promise<school[]> {
    return await this.s.getSchoolsForUser(user);
  }
  public async isUserTeacher(user: User): Promise<boolean> {
    return await this.s.isUserTeacher(user);
  }
  public async getClassesForSchool(
    school: school,
    user: User
  ): Promise<Class[]> {
    return await this.s.getClassesForSchool(school, user);
  }
  public async getStudentsForClass(classId: string): Promise<User[]> {
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

  public async getCoursesByGrade(gradeDocId: any): Promise<Course[]> {
    return await this.s.getCoursesByGrade(gradeDocId);
  }

  public async getAllCourses(): Promise<Course[]> {
    return await this.s.getAllCourses();
  }

  public async getSchoolById(id: string): Promise<school | undefined> {
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
    fromCache: boolean = true
  ): Promise<StudentProfile | undefined> {
    return await this.s.getStudentResult(studentId, fromCache);
  }
  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: StudentLessonResult } | undefined> {
    return await this.s.getStudentResultInMap(studentId);
  }
  public async getClassById(id: string): Promise<Class | undefined> {
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
  ): Promise<Assignment[]> {
    return await this.s.getPendingAssignments(classId, studentId);
  }

  public async updateStudent(
    student: User,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string
  ): Promise<User> {
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
  ): Promise<Assignment[] | []> {
    return this.s.getLiveQuizLessons(classId, studentId);
  }
  public async getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    return await this.s.getLessonResultsForStudent(studentId);
  }

  public async updateResult(
    student: User,
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
  ): Promise<Result> {
    return await this.s.updateResult(
      student,
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

  public async getCoursesForParentsStudent(student: User): Promise<Course[]> {
    return await this.s.getCoursesForParentsStudent(student);
  }

  public async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<Lesson | null> {
    return await this.s.getLessonWithCocosLessonId(lessonId);
  }

  public async getCoursesForClassStudent(currClass: Class): Promise<Course[]> {
    return await this.s.getCoursesForClassStudent(currClass);
  }
  public async getLesson(
    id: string,
    chapter: Chapter | undefined = undefined,
    loadChapterTitle: boolean = false
  ): Promise<Lesson | undefined> {
    return await this.s.getLesson(id, chapter, loadChapterTitle);
  }

  public async getLessonsForChapter(chapter: Chapter): Promise<Lesson[]> {
    return await this.s.getLessonsForChapter(chapter);
  }

  public async getDifferentGradesForCourse(
    course: Course
  ): Promise<{ grades: Grade[]; courses: Course[] }> {
    return await this.s.getDifferentGradesForCourse(course);
  }
  public async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<DocumentData | undefined> {
    return await this.s.getLiveQuizRoomDoc(liveQuizRoomDocId);
  }
  public async getAllCurriculums(): Promise<Curriculum[]> {
    return await this.s.getAllCurriculums();
  }

  public async getAllGrades(): Promise<Grade[]> {
    return await this.s.getAllGrades();
  }

  public async getAllLanguages(): Promise<Language[]> {
    return await this.s.getAllLanguages();
  }

  public async getParentStudentProfiles(): Promise<User[]> {
    return await this.s.getParentStudentProfiles();
  }

  updateSoundFlag(user: User, value: boolean) {
    return this.s.updateSoundFlag(user, value);
  }

  updateMusicFlag(user: User, value: boolean) {
    return this.s.updateMusicFlag(user, value);
  }
  updateTcAccept(user: User, value: boolean) {
    return this.s.updateTcAccept(user, value);
  }
  public get currentStudent(): User | undefined {
    return this.s.currentStudent;
  }

  public set currentStudent(value: User | undefined) {
    this.s.currentStudent = value;
  }
  public get currentClass(): Class | undefined {
    return this.s.currentClass;
  }
  public set currentClass(value: Class | undefined) {
    this.s.currentClass = value;
  }
  public get currentSchool(): School | undefined {
    return this.s.currentSchool;
  }
  public set currentSchool(value: School | undefined) {
    this.s.currentSchool = value;
  }
  updateLanguage(user: User, value: string) {
    return this.s.updateLanguage(user, value);
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

  public async getLanguageWithId(id: string): Promise<Language | undefined> {
    return await this.s.getLanguageWithId(id);
  }

  public async getSubject(id: string): Promise<Subject | undefined> {
    return await this.s.getSubject(id);
  }

  public async getCourse(id: string): Promise<Course | undefined> {
    return await this.s.getCourse(id);
  }

  public async getLeaderboardResults(
    sectionId: string,
    isWeeklyData: boolean
  ): Promise<LeaderboardInfo | undefined> {
    return await this.s.getLeaderboardResults(sectionId, isWeeklyData);
  }

  getAllLessonsForCourse(course: Course): Promise<{
    [key: string]: {
      [key: string]: Lesson;
    };
  }> {
    return this.s.getAllLessonsForCourse(course);
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string
  ): Promise<Lesson | undefined> {
    return this.s.getLessonFromCourse(course, lessonId);
  }

  public async getCourseFromLesson(
    lesson: Lesson
  ): Promise<Course | undefined> {
    return this.s.getCourseFromLesson(lesson);
  }
}
