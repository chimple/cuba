// import { User } from "firebase/auth";
import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";

export interface ServiceApi {
  createProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined
  ): Promise<User>;

  getAllCurriculums(): Promise<Curriculum[]>;
  getAllGrades(): Promise<Grade[]>;
  getAllLanguages(): Promise<Language[]>;
  getParentStudentProfiles(): Promise<User[]>;
  get currentStudent(): User;
  set currentStudent(value: User);
  updateSoundFlag(user: User, value: boolean);
  updateMusicFlag(user: User, value: boolean);
  updateLanguage(user: User, value: string);
  getLanguageWithId(id: string): Promise<Language | undefined>;
}
