// import { User } from "firebase/auth";
import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { Chapter, StudentLessonResult } from "../../common/courseConstants";
import Result from "../../models/result";

export interface ServiceApi {
  /**
   * Creates a student profile for a parent and returns the student object
   * @param {string} name - name of the student
   * @param {number} age - age of the student
   * @param {GENDER} gender - gender of the student
   * @param {string} image - image of the student
   * @param {string} boardDocId - boardDocId is `Curriculum` doc id
   * @param {string} gradeDocId -  gradeDocId is `Grade` doc id
   * @param {string} languageDocId -  languageDocId is `Language` doc id
   * @returns {User} Student User Object
   */
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

  /**
   * Gives all `Curriculums` available on database
   * @returns {Curriculum[]} Array of `Curriculum` objects
   */
  getAllCurriculums(): Promise<Curriculum[]>;

  /**
   * Gives all `Grades` available on database
   * @returns {Grade[]} Array of `Grade` objects
   */
  getAllGrades(): Promise<Grade[]>;

  /**
   * Gives all `Languages` available on database
   * @returns {Language[]} Array of `Language` objects
   */
  getAllLanguages(): Promise<Language[]>;

  /**
   * Gives all `student` profiles available for a parent
   * @returns {User[]} Array of `User` objects
   */
  getParentStudentProfiles(): Promise<User[]>;

  get currentStudent(): User;

  set currentStudent(value: User);

  updateSoundFlag(user: User, value: boolean);
  updateMusicFlag(user: User, value: boolean);
  updateLanguage(user: User, value: string);

  /**
   * Gives Language for given a language firebase doc Id
   * @param {string} id - Language firebase doc id
   * @returns {Language | undefined}`Language` or `undefined` if it could not find the Language with given `id`
   */
  getLanguageWithId(id: string): Promise<Language | undefined>;

  /**
   * Gives List of subjects for given a student for Home user
   * @param {User} student - Student User object
   * @returns {Course[]} Array of `Course` objects
   */
  getCoursesForParentsStudent(student: User): Promise<Course[]>;

  /**
   * Gives Lesson for given a lesson firebase doc Id
   * @param {string} id - Lesson firebase doc id
   * @returns {Lesson | undefined}`Lesson` or `undefined` if it could not find the lesson with given `id`
   */
  getLesson(id: string): Promise<Lesson | undefined>;

  /**
   * Gives Array of `Lesson` objects for a given `chapter`
   * @param {Chapter} chapter - Chapter to which we need `Lesson` objects
   * @returns {Lesson[]} Array of lessons, all the lessons in the chapter
   */
  getLessonsForChapter(chapter: Chapter): Promise<Lesson[]>;

  /**
   * Gives all Different grades available fora given chapter
   * @param {Course} course - course to which we need `Grades`
   * @returns {{ grades: Grade[]; courses: Course[] }} Object with `grades` and `courses` arrays
   */
  getDifferentGradesForCourse(
    course: Course
  ): Promise<{ grades: Grade[]; courses: Course[] }>;

  /**
   * Gives all lesson results for given student id
   * @param {string } studentId - Student Id
   * @returns {{ StudentLessonResult[] }} Array of `StudentLessonResult` Objects
   */
  getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined>;
  /**
   * Creates a Document in Result collection with the given params
   * student: User
   * @param {string} courseId -  Course Firebase Document ID
   * @param {string} lessonId -  Lesson Firebase Document ID
   * @param {number} score -  Total Score for a lesson
   * @param {number} correctMoves -  Number of correct moves in a lesson
   * @param {number} wrongMoves -  Number of wrong moves in a lesson
   * @param {number} timeSpent -  Total TimeSpent in a lesson
   * @returns {Result}} Updated result Object
   */
  updateResult(
    student: User,
    courseId: string,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number
  ): Promise<Result>;
}
