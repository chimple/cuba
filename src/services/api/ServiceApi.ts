import User from "../../models/user";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { Chapter, StudentLessonResult } from "../../common/courseConstants";
import Result from "../../models/result";
import Subject from "../../models/subject";
import StudentProfile from "../../models/studentProfile";
import Class from "../../models/class";
import School from "../../models/school";
import Assignment from "../../models/assignment";
import { MODES } from "../../common/constants";
import { AvatarObj } from "../../components/animation/Avatar";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";

export interface LeaderboardInfo {
  weekly: StudentLeaderboardInfo[];
  allTime: StudentLeaderboardInfo[];
}

export interface StudentLeaderboardInfo {
  name: string;
  score: number;
  timeSpent: number;
  lessonsPlayed: number;
  userId: string;
}

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
   * To delete `Profile` for given student Id
   * @param {string } studentId - Student Id
   */
  deleteProfile(studentId: string);

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

  get currentStudent(): User | undefined;

  set currentStudent(value: User | undefined);
  get currentClass(): Class | undefined;
  set currentClass(value: Class | undefined);
  get currentSchool(): School | undefined;
  set currentSchool(value: School | undefined);
  updateSoundFlag(user: User, value: boolean);
  updateMusicFlag(user: User, value: boolean);
  updateLanguage(user: User, value: string);
  updateTcAccept(user: User, value: boolean);

  /**
   * Gives Language for given a language firebase doc Id
   * @param {string} id - Language firebase doc id
   * @returns {Language | undefined}`Language` or `undefined` if it could not find the Language with given `id`
   */
  getLanguageWithId(id: string): Promise<Language | undefined>;

  /**
   * Gives Lesson for a given CocosLesson Id
   * @param lessonId - Cocos Lesson Id
   * Here lessonId is - In Firebase we have Lesson collection in that collection each doc is one lesson in that lesson we have ID
   */
  getLessonWithCocosLessonId(lessonId: string): Promise<Lesson | null>;

  /**
   * Gives List of subjects for given a student for Home user
   * @param {User} student - Student User object
   * @returns {Course[]} Array of `Course` objects
   */
  getCoursesForParentsStudent(student: User): Promise<Course[]>;

  /**
   * Gives List of subjects for given a student for Home user
   * @param {Class} currClass - Class User object
   * @returns {Course[]} Array of `Course` objects
   */
  getCoursesForClassStudent(currClass: Class): Promise<Course[]>;
  /**
   * Gives Lesson for given a lesson firebase doc Id
   * @param {string} id - Lesson firebase doc id
   * @returns {Lesson | undefined}`Lesson` or `undefined` if it could not find the lesson with given `id`
   */
  getLesson(
    id: string,
    chapter: Chapter | undefined,
    loadChapterTitle: boolean
  ): Promise<Lesson | undefined>;

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
   * Gives all Avatar info like mode, audio list
   * @returns {AvatarObj} `Avatar` Object
   */
  getAvatarInfo(): Promise<AvatarObj | undefined>;

  /**
   * Gives all lesson results for given student id
   * @param {string } studentId - Student Id
   * @returns {{ Map<string, StudentLessonResult> }} Map of `StudentLessonResult` Objects
   */
  getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined>;

  /**
   * This function gets all live quizzes from assignments for a student in a class.
   * Gives Array of `Assignments` objects for a given `classID`
   * @param {classId} classId firebase doc id
   * @param {studentId} studentId firebase doc id
   * @returns {Assignment[]} A promise that resolves to an array of assignments.
   */
  getLiveQuizLessons(classId: string, studentId: string): Promise<Assignment[]>;
  /**
   * This function gets the document of the live quiz room
   * @param liveQuizRoomDocId firebase doc id
   * @return {DocumentData} A promise that returns the document of live quiz room
   */
  getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<DocumentData | undefined>;
  /**
   * Creates a Document in Result collection with the given params
   * student: User
   * @param {string} courseId -  Course Firebase Document ID
   * @param {string} lessonId -  Lesson Firebase Document ID
   * @param {number} score -  Total Score for a lesson
   * @param {number} correctMoves -  Number of correct moves in a lesson
   * @param {number} wrongMoves -  Number of wrong moves in a lesson
   * @param {number} timeSpent -  Total TimeSpent in a lesson
   * @param {string | undefined} assignmentId
   * @param {string | undefined} classId
   * @param {string | undefined} schoolId
   * @param {boolean | undefined} isLoved
   * @returns {Result}} Updated result Object
   */
  updateResult(
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
  ): Promise<Result>;

  /**
   * Update the student profile for a parent and returns the student object
   * @param {string} name - name of the student
   * @param {number} age - age of the student
   * @param {GENDER} gender - gender of the student
   * @param {string} image - image of the student
   * @param {string} boardDocId - boardDocId is `Curriculum` doc id
   * @param {string} gradeDocId -  gradeDocId is `Grade` doc id
   * @param {string} languageDocId -  languageDocId is `Language` doc id
   * @returns {User} Updated Student User Object
   */
  updateStudent(
    student: User,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string
  ): Promise<User>;

  /**
   * Gives Subject for given a Subject firebase doc Id
   * @param {string} id - Subject firebase doc id
   * @returns {Subject | undefined}`Subject` or `undefined` if it could not find the Subject with given `id`
   */
  getSubject(id: string): Promise<Subject | undefined>;

  /**
   * Gives Course for given a Course firebase doc Id
   * @param {string} id - Course firebase doc id
   * @returns {Course | undefined}`Course` or `undefined` if it could not find the Course with given `id`
   */
  getCourse(id: string): Promise<Course | undefined>;

  /**
   * Gives StudentProfile for given a Student firebase doc Id
   * @param {string} id - Student firebase doc id
   * @param {boolean} fromCache - If true, it will try to fetch the data from the cache. If the data is not found in the cache, it will look in the database.
   * @returns {StudentProfile | undefined}`StudentProfile` or `undefined` if it could not find the StudentProfile with given `id`
   */
  getStudentResult(
    studentId: string,
    fromCache: boolean
  ): Promise<StudentProfile | undefined>;

  /**
   * Gives StudentProfile for given a Student firebase doc Id
   * @param {string} id - Student firebase doc id
   * @returns {{ Map<string, StudentLessonResult> }} Map of `StudentLessonResult` Objects
   */
  getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: StudentLessonResult } | undefined>;

  /**
   * Gives Class for given a Class firebase doc Id
   * @param {string} id - Class firebase doc id
   * @returns {Class | undefined}`Class` or `undefined` if it could not find the Class with given `id`
   */
  getClassById(id: string): Promise<Class | undefined>;

  /**
   * Gives School for given a School firebase doc Id
   * @param {string} id - School firebase doc id
   * @returns {School | undefined}`School` or `undefined` if it could not find the School with given `id`
   */
  getSchoolById(id: string): Promise<School | undefined>;

  /**
   * Gives `boolean` whether the student is connected to any class, for given a Student firebase doc Id
   * @param {string} studentId - Student firebase doc id
   * @param {boolean} fromCache - If true, it will try to fetch the data from the cache. If the data is not found in the cache, it will look in the database.
   * @returns {boolean} Gives `boolean` whether the student is connected to any class
   */
  isStudentLinked(studentId: string, fromCache: boolean): Promise<boolean>;

  /**
   * This function gets all pending assignments for a student in a class.
   *
   * @param {string} classId Class firebase doc id
   * @param {string} studentId Student firebase doc id
   * @returns A promise that resolves to an array of assignments.
   */
  getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<Assignment[]>;
  /**
   * This function gets all the schools for the teacher or principal
   * @param {User} user user firebase documentId;
   * @return A promise to an array of schools
   */

  getSchoolsForUser(user: User): Promise<School[]>;

  /**
   * This function sets the current mode for the user
   * @param {MODES} value mode firebase documentId;
   * @return A promise
   */
  set currentMode(value: MODES);
  /**
   * This function gets the current mode for the user
   * @return A promise of the mode.
   */
  get currentMode(): MODES;
  /**
   * This function gets boolean result to verifiy wheater the user is teacher or not.
   * @param {User} user user firebase documentId;
   * @return A promise of boolean.
   */

  isUserTeacher(user: User): Promise<boolean>;

  /**
   * This function gets all the Classes for the school.
   * @param {School} school school firebase documentId;
   * @return A promise to an array of classes.
   */
  getClassesForSchool(school: School, user: User): Promise<Class[]>;

  /**
   * This function gets all the students for the class.
   * @param {string} classId class firebase documentId;
   * @return A promise to an array of students.
   */
  getStudentsForClass(classId: string): Promise<User[]>;

  /**
   * This function gets data by invite code.
   *
   * @param {number} inviteCode The invite code.
   * @returns A promise that resolves to the data.
   */
  getDataByInviteCode(inviteCode: number): Promise<any>;

  /**
   * This function links a student to a class.
   *
   * @param inviteCode The invite code of the student.
   * @returns A promise that resolves to the student.
   */
  linkStudent(inviteCode: number): Promise<any>;

  /**
   * This function gives Leaderboard results of b2c or b2b Users
   *
   * @param sectionId section ID of connected class. If user didn't Connected to class this function gives b2c user
   * @param isWeeklyData If true, it will gives the weekly data from the Collection. False for it will gives the All Time data from the Collection
   * @returns A promise that resolves to the student.
   */
  getLeaderboardResults(
    sectionId: string,
    isWeeklyData: boolean
  ): Promise<LeaderboardInfo | undefined>;

  /**
   * This function gives all chapter and lesson objects
   *
   * @param course Course object of the student
   * @returns A promise that resolves to the course.
   */
  getAllLessonsForCourse(course: Course): Promise<{
    [key: string]: {
      [key: string]: Lesson;
    };
  }>;

  /**
   * This function gives lesson objects for given LessonId
   *
   * @param course Course object of the student
   * @param lessonId Lesson Id of a course
   * @returns A promise that resolves to the course.
   */
  getLessonFromCourse(
    course: Course,
    lessonId: string
  ): Promise<Lesson | undefined>;

  /**
   * Gives all `Course` available on database
   * @returns {Course[]} Array of `Course` objects
   */
  getCoursesByGrade(gradeDocId: any): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;

  /**
   * Deletes all the data related to user from database.
   */
  deleteAllUserData(): Promise<void>;

  /**
   *
   * It will get Course Object using lesson cocosSubjectcode from all courses
   */
  getCourseFromLesson(lesson: Lesson): Promise<Course | undefined>;

  /**
   * Establishes a real-time listener for changes in a live quiz room document.
   *
   * @param liveQuizRoomDocId - The unique identifier of the live quiz room document.
   * @param onDataChange - A callback function to be executed when the data in the live quiz room document changes.
   *                        It receives the updated LiveQuizRoom object as a parameter.
   * @returns A function to unsubscribe from the real-time listener.
   */
  liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (user: LiveQuizRoomObject) => void
  ): Unsubscribe;

  /**
   * Updates the live quiz results for a specific student in a live quiz room.
   *
   * @param roomDocId - The unique identifier of the live quiz room document.
   * @param studentId - The unique identifier of the student for whom the results are being updated.
   * @param score - The new score achieved by the student in the quiz.
   * @param timeSpent - The new amount of time spent by the student on the quiz.
   * @returns A promise that resolves when the update is successful and rejects if an error occurs.
   */
  updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    score: number,
    timeSpent: number
  ): Promise<void>;

  /**
   * Initiates the process for a student to join a live quiz.
   *
   * @param studentId - The unique identifier of the student joining the live quiz.
   * @param assignmentId - The unique identifier of the assignment associated with the live quiz.
   * @returns A promise that resolves with a live quiz Room doc id upon successful initiation,
   *          or undefined if an error occurs during the process.
   */
  joinLiveQuiz(
    studentId: string,
    assignmentId: string
  ): Promise<string | undefined>;

  /**
   * Gives Assignment for given a Assignment firebase doc Id
   * @param {string} id - Assignment firebase doc id
   * @returns {Assignment | undefined}`Assignment` or `undefined` if it could not find the Assignment with given `id`
   */
  getAssignmentById(id: string): Promise<Assignment | undefined>;
}
