import User from "../../models/user";
import { ServiceApi } from "./ServiceApi";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import { DocumentReference } from "firebase/firestore";

export class ApiHandler implements ServiceApi {
  public static i: ApiHandler;

  private s: ServiceApi;

  private constructor() { }

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
  };

  updateMusicFlag(user: User, value: boolean) {
    return this.s.updateMusicFlag(user, value);
  };

  updateLanguage(user: User, value: string) {
    return this.s.updateLanguage(user, value);
  };


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

  // public async getUser(userId: string): Promise<User | undefined> {
  //   return await this.s.getUser(userId);
  // }
}
