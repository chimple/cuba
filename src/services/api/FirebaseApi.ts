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
  query,
  where,
  setDoc,
  DocumentSnapshot,
  DocumentData,
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
import {
  Chapter,
  CollectionIds,
  StudentLessonResult,
} from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import StudentProfile from "../../models/studentProfile";

export class FirebaseApi implements ServiceApi {
  public static i: FirebaseApi;
  private _db = getFirestore();
  private _currentStudent: User;

  private constructor() {}

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
      doc(this._db, `${CollectionIds.COURSE}/${id}`)
    );
    if (!!languageDocId && !!LANGUAGE_COURSE_MAP[languageDocId]) {
      courseIds.splice(
        1,
        0,
        doc(
          this._db,
          `${CollectionIds.COURSE}/${LANGUAGE_COURSE_MAP[languageDocId]}`
        )
      );
    }
    const boardRef = doc(this._db, `${CollectionIds.CURRICULUM}/${boardDocId}`);
    const gradeRef = doc(this._db, `${CollectionIds.GRADE}/${gradeDocId}`);
    const languageRef = doc(
      this._db,
      `${CollectionIds.LANGUAGE}/${languageDocId}`
    );
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
      collection(this._db, CollectionIds.USER),
      student.toJson()
    );
    student.docId = studentDoc.id;
    await updateDoc(doc(this._db, `${CollectionIds.USER}/${student.uid}`), {
      users: arrayUnion(studentDoc),
      dateLastModified: Timestamp.now(),
    });
    return student;
  }

  public async getAllCurriculums(): Promise<Curriculum[]> {
    const querySnapshot = await getDocs(
      collection(this._db, CollectionIds.CURRICULUM)
    );
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
    const querySnapshot = await getDocs(
      collection(this._db, CollectionIds.GRADE)
    );
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
    const querySnapshot = await getDocs(
      collection(this._db, CollectionIds.LANGUAGE)
    );
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

  public updateSoundFlag = async (user: User, value: boolean) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        soundFlag: value,
        dateLastModified: Timestamp.now(),
      });
      user.soundFlag = value;
      ServiceConfig.getI().authHandler.currentUser = user;
      console.log(
        "Updated User ",
        await ServiceConfig.getI().authHandler.getCurrentUser()
      );
    }
  };

  public updateMusicFlag = async (user: User, value: boolean) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        musicFlag: value,
        dateLastModified: Timestamp.now(),
      });
      currentUser.musicFlag = value;
      ServiceConfig.getI().authHandler.currentUser = currentUser;
      console.log(
        "Updated User ",
        await ServiceConfig.getI().authHandler.getCurrentUser()
      );
    }
  };

  public updateLanguage = async (user: User, value: string) => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      currentUser.language = doc(this._db, `Language/${value}`);
      ServiceConfig.getI().authHandler.currentUser = currentUser;
      await updateDoc(doc(this._db, `User/${user.uid}`), {
        language: currentUser.language,
        dateLastModified: Timestamp.now(),
      });
    }
  };

  async getLanguageWithId(id: string): Promise<Language | undefined> {
    const result = await getDoc(
      doc(this._db, `${CollectionIds.LANGUAGE}/${id}`)
    );
    if (!result.data()) return;
    return result.data() as Language;
  }

  async getCoursesForParentsStudent(student: User): Promise<Course[]> {
    const subjects: Course[] = [];
    if (!student?.courses || student.courses.length < 1) return subjects;
    const courseDocs = await Promise.all(
      student.courses.map((course) => getDoc(course))
    );
    courseDocs.forEach((courseDoc) => {
      if (courseDoc && courseDoc.data()) {
        const course = courseDoc.data() as Course;
        course.docId = courseDoc.id;
        subjects.push(course);
      }
    });
    return subjects;
  }

  async getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    // const currentStudent = await ServiceConfig.getI().apiHandler.currentStudent;
    const studentLessons = await getDoc(
      doc(this._db, `${CollectionIds.STUDENTPROFILE}/${studentId}`)
    );

    // if (studentLessons.data()) {
    const lessonsData: DocumentData = studentLessons.data()!;
    console.log("lessonsData.lessons ", lessonsData.lessons);
    const lessonsMap: Map<string, StudentLessonResult> = new Map(
      Object.entries(lessonsData.lessons)
    );

    console.log("lessonsMap ", lessonsMap);
    // let studentResults: StudentLessonResult[] = [];
    // for (const [key, value] of Object.entries(lessonsMap)) {
    //   console.log(key, value);
    //   value.docId = key;
    //   studentResults.push(value);
    // }
    // console.log("studentResults ", studentResults);
    return lessonsMap;
    // }
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const lessonDoc = await getDoc(
      doc(this._db, `${CollectionIds.LESSON}/${id}`)
    );
    if (!lessonDoc.exists) return;
    const lesson = lessonDoc.data() as Lesson;
    lesson.docId = lesson.id;
    return lesson;
  }

  async getLessonsForChapter(chapter: Chapter): Promise<Lesson[]> {
    const lessons: Lesson[] = [];
    if (chapter.lessons && chapter.lessons.length > 0) {
      for (let lesson of chapter.lessons) {
        if (lesson instanceof DocumentReference) {
          const lessonObj = await this.getLesson(lesson.id);
          if (lessonObj) {
            lessons.push(lessonObj);
          }
        } else {
          lessons.push(lesson);
        }
      }
    }
    return lessons;
  }

  async getDifferentGradesForCourse(
    course: Course
  ): Promise<{ grades: Grade[]; courses: Course[] }> {
    const q = query(
      collection(this._db, CollectionIds.COURSE),
      where("subject", "==", course.subject),
      where("curriculum", "==", course.curriculum)
    );
    const queryResult = await getDocs(q);
    const gradeMap: {
      grades: Grade[];
      courses: Course[];
    } = { grades: [], courses: [] };
    await Promise.all(
      queryResult.docs.map(
        async (
          courseDoc
        ): Promise<{ grade: Grade; course: Course } | undefined> => {
          const course = courseDoc.data() as Course;
          course.docId = courseDoc.id;
          const gradeDoc = await getDoc(course.grade);
          const grade = gradeDoc.data() as Grade;
          const gradeAlreadyExists = gradeMap.grades.find(
            (_grade) => _grade.docId === gradeDoc.id
          );
          if (!!gradeAlreadyExists) return;
          grade.docId = gradeDoc.id;
          gradeMap.courses.push(course);
          gradeMap.grades.push(grade);
          return { grade: grade, course: course };
        }
      )
    );
    return gradeMap;
  }
}
