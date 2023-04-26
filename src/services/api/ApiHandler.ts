import User from "../../models/user";
import { ServiceApi } from "./ServiceApi";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import { Chapter } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { GENDER } from "../../common/constants";

export class ApiHandler implements ServiceApi {
  public static i: ApiHandler;

  private s: ServiceApi;

  private constructor() {}

  public async getCoursesForParentsStudent(student: User): Promise<Course[]> {
    return await this.s.getCoursesForParentsStudent(student);
  }

  public async getLesson(id: string): Promise<Lesson | undefined> {
    return await this.s.getLesson(id);
  }

  public async getLessonsForChapter(chapter: Chapter): Promise<Lesson[]> {
    return await this.s.getLessonsForChapter(chapter);
  }

  public async getDifferentGradesForCourse(
    course: Course
  ): Promise<{ grades: Grade[]; courses: Course[] }> {
    return await this.s.getDifferentGradesForCourse(course);
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

  public get currentStudent(): User {
    return this.s.currentStudent;
  }

  public set currentStudent(value: User) {
    this.s.currentStudent = value;
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
}
