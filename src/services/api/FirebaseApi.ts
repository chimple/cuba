import {
  DocumentReference,
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  doc,
  updateDoc,
  getFirestore,
  getDocs,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ServiceApi } from "./ServiceApi";
import {
  DEFAULT_COURSE_IDS,
  LANGUAGE_COURSE_MAP,
} from "../../common/constants";
import { RoleType } from "../../interface/modelInterfaces";
import User from "../../models/user";
import { ServiceConfig } from "../ServiceConfig";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";

export class FirebaseApi implements ServiceApi {
  public static i: FirebaseApi;
  private _db = getFirestore();
  private _currentStudent: User;

  private constructor() { }

  public static getInstance(): FirebaseApi {
    if (!FirebaseApi.i) {
      FirebaseApi.i = new FirebaseApi();
    }
    return FirebaseApi.i;
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
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";
    const courseIds: DocumentReference[] = DEFAULT_COURSE_IDS.map((id) =>
      doc(this._db, `Course/${id}`)
    );
    if (!!languageDocId && !!LANGUAGE_COURSE_MAP[languageDocId]) {
      courseIds.splice(
        1,
        0,
        doc(this._db, `Course/${LANGUAGE_COURSE_MAP[languageDocId]}`)
      );
    }
    const boardRef = doc(this._db, `Curriculum/${boardDocId}`);
    const gradeRef = doc(this._db, `Grade/${gradeDocId}`);
    const languageRef = doc(this._db, `Language/${languageDocId}`);
    const student = new User(
      _currentUser?.username,
      [],
      name,
      RoleType.STUDENT,
      _currentUser.uid,
      courseIds,
      age,
      image,
      gender,
      boardRef,
      gradeRef,
      languageRef,
      avatar,
      Timestamp.now(),
      Timestamp.now(),
      null!
    );
    const studentDoc = await addDoc(
      collection(this._db, "User"),
      student.toJson()
    );
    student.docId = studentDoc.id;
    await updateDoc(doc(this._db, `User/${student.uid}`), {
      users: arrayUnion(studentDoc),
      dateLastModified: Timestamp.now(),
    });
    return student;
  }

  public async getAllCurriculums(): Promise<Curriculum[]> {
    const querySnapshot = await getDocs(collection(this._db, "Curriculum"));
    const curriculums: Curriculum[] = [];
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
      const curriculum = doc.data() as Curriculum;
      curriculum.docId = doc.id;
      curriculums.push(curriculum);
    });
    return curriculums;
  }

  public async getAllGrades(): Promise<Grade[]> {
    const querySnapshot = await getDocs(collection(this._db, "Grade"));
    const grades: Grade[] = [];
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
      const grade = doc.data() as Grade;
      grade.docId = doc.id;
      grades.push(grade);
    });
    return grades;
  }

  public async getAllLanguages(): Promise<Language[]> {
    const querySnapshot = await getDocs(collection(this._db, "Language"));
    const languages: Language[] = [];
    querySnapshot.forEach((doc) => {
      // console.log(`${doc.id} => ${doc.data()}`);
      const language = doc.data() as Language;
      language.docId = doc.id;
      languages.push(language);
    });
    return languages;
  }

  public async getParentStudentProfiles(): Promise<User[]> {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw "User is not Logged in";
    if (!currentUser.users || currentUser.users.length < 1) return [];
    const users = await Promise.all(
      currentUser.users.map(async (user) => {
        const userDoc = await getDoc(user);
        const newUser = userDoc.data() as User;
        if (newUser) newUser.docId = userDoc.id;
        return newUser;
      })
    );
    return users;
  }

  public get currentStudent(): User {
    return this._currentStudent;
  }

  public set currentStudent(value: User) {
    this._currentStudent = value;
  }

  public updateSoundFlag = async (
    user: User, value: boolean
  ) => {

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      currentUser.soundFlag = value
      ServiceConfig.getI().authHandler.currentUser = currentUser

      await updateDoc(doc(this._db, `User/${user.uid}`), {
        soundFlag: value,
        dateLastModified: Timestamp.now(),
      });
    }

  };

  public updateMusicFlag = async (
    user: User, value: boolean
  ) => {

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      currentUser.musicFlag = value
      ServiceConfig.getI().authHandler.currentUser = currentUser
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        musicFlag: value,
        dateLastModified: Timestamp.now(),
      });
    }
  };

  public updateLanguage = async (
    user: User, value: string
  ) => {

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      currentUser.language = doc(this._db, `Language/${value}`)
      ServiceConfig.getI().authHandler.currentUser = currentUser
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        language: currentUser.language,
        dateLastModified: Timestamp.now(),
      });
    }
  };

  async getLanguageWithId(id: string): Promise<Language | undefined> {
    const result = await getDoc(doc(this._db, `Language/${id}`));
    if (!result.data()) return;
    return result.data() as Language;
  }
}
