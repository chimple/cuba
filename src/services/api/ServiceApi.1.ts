import User from "../../models/user";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { StudentLessonResult } from "../../common/courseConstants";
import {
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODES,
  TableTypes
} from "../../common/constants";
import { AvatarObj } from "../../components/animation/Avatar";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import { RoleType } from "../../interface/modelInterfaces";
import { LeaderboardInfo } from "./ServiceApi";


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
  ): Promise<TableTypes<"user">>;

  /**
   * To delete `Profile` for given student Id
   * @param {string } studentId - Student Id
   */
  deleteProfile(studentId: string);

  /**
   * Gives all `Curriculums` available on database
   * @returns {Curriculum[]} Array of `Curriculum` objects
   */
  getAllCurriculums(): Promise<TableTypes<"curriculum">[]>;

  /**
   * Gives all `Grades` available on database
   * @returns {Grade[]} Array of `Grade` objects
   */
  getAllGrades(): Promise<TableTypes<"grade">[]>;

  /**
   * Gives all `Languages` available on database
   * @returns {Language[]} Array of `Language` objects
   */
  getAllLanguages(): Promise<TableTypes<"language">[]>;

  /**
   * Gives all `student` profiles available for a parent
   * @returns {User[]} Array of `User` objects
   */
  getParentStudentProfiles(): Promise<TableTypes<"user">[]>;

  get currentStudent(): TableTypes<"user"> | undefined;

  set currentStudent(value: TableTypes<"user"> | undefined);
  get currentClass(): TableTypes<"class"> | undefined;
  set currentClass(value: TableTypes<"class"> | undefined);
  get currentSchool(): TableTypes<"school"> | undefined;
  set currentSchool(value: TableTypes<"school"> | undefined);
  updateSoundFlag(userId: string, value: boolean);
  updateMusicFlag(userId: string, value: boolean);
  updateLanguage(userId: string, value: string);
  updateTcAccept(userId: string);

  /**
   * Gives Language for given a language firebase doc Id
   * @param {string} id - Language firebase doc id
   * @returns {Language | undefined}`Language` or `undefined` if it could not find the Language with given `id`
   */
  getLanguageWithId(id: string): Promise<TableTypes<"language"> | undefined>;

  /**
   * Gives Lesson for a given CocosLesson Id
   * @param lessonId - Cocos Lesson Id
   * Here lessonId is - In Firebase we have Lesson collection in that collection each doc is one lesson in that lesson we have ID
   */
  getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null>;

  /**
   * Gives List of subjects for given a student for Home user
   * @param {User} student - Student User object
   * @returns {Course[]} Array of `Course` objects
   */
  getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]>;

  /**
   * Gives List of optional subjects for given a student for Home user
   * @param {User} student - Student User object
   * @returns {Course[]} Array of `Course` objects
   */
  getAdditionalCourses(studentId: string): Promise<TableTypes<"course">[]>;

  /**
   * Add subject for given a student for Home user
   * @param {User} student - Student User object
   * @returns {Course} `Course` object
   */
  addCourseForParentsStudent(courses: Course[], student: User);

  /**
   * Gives List of subjects for given a student for Home user
   * @param {Class} currClass - Class User object
   * @returns {Course[]} Array of `Course` objects
   */
  getCoursesForClassStudent(classId: string): Promise<TableTypes<"course">[]>;
  /**
   * Gives Lesson for given a lesson firebase doc Id
   * @param {string} id - Lesson firebase doc id
   * @returns {Lesson | undefined}`Lesson` or `undefined` if it could not find the lesson with given `id`
   */
  getLesson(id: string): Promise<TableTypes<"lesson"> | undefined>;

  /**
   * Gives Array of `Lesson` objects for a given `chapter`
   * @param {Chapter} chapter - Chapter to which we need `Lesson` objects
   * @returns {Lesson[]} Array of lessons, all the lessons in the chapter
   */
  getLessonsForChapter(chapterId: string): Promise<TableTypes<"lesson">[]>;

  /**
   * Gives all Different grades available fora given chapter
   * @param {Course} course - course to which we need `Grades`
   * @returns {{ grades: Grade[]; courses: Course[] }} Object with `grades` and `courses` arrays
   */
  getDifferentGradesForCourse(course: TableTypes<"course">): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }>;

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
  getLiveQuizLessons(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]>;
  /**
   * This function gets the document of the live quiz room
   * @param liveQuizRoomDocId firebase doc id
   * @return {DocumentData} A promise that returns the document of live quiz room
   */
  getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<DocumentData | undefined>;
    /**
   * Create a Row in FavoriteLesson with given params
   * @param studentId 
   * @param lessonId 
   */
    updateFavoriteLesson(
      studentId: string,
      lessonId: string
    ): Promise<TableTypes<"favorite_lesson">>; 
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
   * @returns {Result}} Updated result Object
   */
  updateResult(
    studentId: string,
    courseId: string | undefined,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    assignmentId: string | undefined,
    classId: string | undefined,
    schoolId: string | undefined
  ): Promise<TableTypes<"result">>;

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
    student: TableTypes<"user">,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string
  ): Promise<TableTypes<"user">>;

  /**
   * Gives Subject for given a Subject firebase doc Id
   * @param {string} id - Subject firebase doc id
   * @returns {Subject | undefined}`Subject` or `undefined` if it could not find the Subject with given `id`
   */
  getSubject(id: string): Promise<TableTypes<"subject"> | undefined>;

  /**
   * Gives Course for given a Course firebase doc Id
   * @param {string} id - Course firebase doc id
   * @returns {Course | undefined}`Course` or `undefined` if it could not find the Course with given `id`
   */
  getCourse(id: string): Promise<TableTypes<"course"> | undefined>;

  /**
   * Gives StudentProfile for given a Student firebase doc Id
   * @param {string} id - Student firebase doc id
   * @param {boolean} fromCache - If true, it will try to fetch the data from the cache. If the data is not found in the cache, it will look in the database.
   * @returns {StudentProfile | undefined}`StudentProfile` or `undefined` if it could not find the StudentProfile with given `id`
   */
  getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]>;

  /**
   * Gives StudentProfile for given a Student firebase doc Id
   * @param {string} id - Student firebase doc id
   * @returns {{ Map<string, StudentLessonResult> }} Map of `StudentLessonResult` Objects
   */
  getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result">; }>;

  /**
   * Gives Class for given a Class firebase doc Id
   * @param {string} id - Class firebase doc id
   * @returns {Class | undefined}`Class` or `undefined` if it could not find the Class with given `id`
   */
  getClassById(id: string): Promise<TableTypes<"class"> | undefined>;

  /**
   * Gives School for given a School firebase doc Id
   * @param {string} id - School firebase doc id
   * @returns {School | undefined}`School` or `undefined` if it could not find the School with given `id`
   */
  getSchoolById(id: string): Promise<TableTypes<"school"> | undefined>;

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
  ): Promise<TableTypes<"assignment">[]>;
  /**
   * This function gets all the schools for the teacher or principal
   * @param {User} user user firebase documentId;
   * @return A promise to an array of schools
   */
  getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType; }[]>;

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
  isUserTeacher(userId: string): Promise<boolean>;

  /**
   * This function gets all the Classes for the school.
   * @param {School} school school firebase documentId;
   * @return A promise to an array of classes.
   */
  getClassesForSchool(
    schoolId: string,
    userId: string
  ): Promise<TableTypes<"class">[]>;

  /**
   * This function gets all the students for the class.
   * @param {string} classId class firebase documentId;
   * @return A promise to an array of students.
   */
  getStudentsForClass(classId: string): Promise<TableTypes<"user">[]>;

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
   * @param leaderboardDropdownType If true, it will gives the weekly data from the Collection. False for it will gives the All Time data from the Collection
   * @returns A promise that resolves to the student.
   */
  getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined>;

  /**
   * This function gives b2c Leaderboard results of given studentId
   *
   * @param studentId The unique identifier of the student for whom the results are being updated.
   * @returns A promise that resolves to the student.
   */
  getLeaderboardStudentResultFromB2CCollection(
    studentId: string
  ): Promise<LeaderboardInfo | undefined>;

  /**
   * This function gives all chapter and lesson objects
   *
   * @param course Course object of the student
   * @returns A promise that resolves to the course.
   */
  getAllLessonsForCourse(courseId: string): Promise<TableTypes<"lesson">[]>;

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
  getCoursesByGrade(gradeDocId: any): Promise<TableTypes<"course">[]>;
  getAllCourses(): Promise<TableTypes<"course">[]>;

  /**
   * Deletes all the data related to user from database.
   */
  deleteAllUserData(): Promise<void>;

  /**
   *
   * It will get Course Object using lesson cocosSubjectcode from all courses
   */
  getCoursesFromLesson(lessonId: string): Promise<TableTypes<"course">[]>;

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
    onDataChange: (user: LiveQuizRoomObject | undefined) => void
  ): Unsubscribe;

  /**
   * Updates the live quiz results for a specific student in a live quiz room.
   *
   * @param roomDocId - The unique identifier of the live quiz room document.
   * @param studentId - The unique identifier of the student for whom the results are being updated.
   * @param questionId - The ID of the question.
   * @param score - The new score achieved by the student in the quiz.
   * @param timeSpent - The new amount of time spent by the student on the quiz.
   * @returns A promise that resolves when the update is successful and rejects if an error occurs.
   */
  updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
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
  getAssignmentById(id: string): Promise<TableTypes<"assignment"> | undefined>;

  /**
   * Gives Badge for given a Badge firebase doc Id
   * @param {string} id - Badge firebase doc id
   * @returns {Badge | undefined}`Badge` or `undefined` if it could not find the Badge with given `id`
   */
  getBadgeById(id: string): Promise<TableTypes<"badge"> | undefined>;

  /**
   * Gives Sticker for given a Sticker firebase doc Id
   * @param {string} id - Sticker firebase doc id
   * @returns {Badge | undefined}`Sticker` or `undefined` if it could not find the Sticker with given `id`
   */
  getStickerById(id: string): Promise<TableTypes<"sticker"> | undefined>;

  /**
   * Gives Rewards for given a Rewards firebase doc Id
   * @param {string} id - Rewards firebase doc id
   * @returns {Rewards | undefined}`Rewards` or `undefined` if it could not find the Rewards with given `id`
   */
  getRewardsById(id: string): Promise<TableTypes<"reward"> | undefined>;

  /**
   * Updates the rewards of a student, marking all rewards as seen.
   * @param studentId - The ID of the student whose rewards need to be updated.
   * @returns A Promise that resolves with void when the update is complete.
   */
  updateRewardAsSeen(studentId: string): Promise<void>;

  /**
   * gets student info from firestore
   * @param studentId - The ID of the current student.
   * @returns A Promise that resolves with void when the update is complete.
   */
  getUserByDocId(studentId: string): Promise<TableTypes<"user"> | undefined>;

  /**
   * update student reward in server
   * @param studentId - The ID of the current student.
   * @param unlockReward - The ID of the current student.
   * @returns A Promise that resolves with void when the update is complete.
   */
  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards);

  /**
   * Retrieves chapters belonging to the specified course.
   * @param courseId The unique identifier of the course.
   * @returns An array of chapters associated with the given course.
   * Note: Ensure courseId is valid and corresponds to an existing course.
   */
  getChaptersForCourse(courseId: string): Promise<TableTypes<"chapter">[]>;

  /**
   * Retrieves pending assignments for the specified lesson, class, and student.
   * @param lessonId The unique identifier of the lesson.
   * @param classId The unique identifier of the class associated with the lesson.
   * @param studentId The unique identifier of the student.
   * @returns A Promise resolving to an array of pending assignments for the given lesson, class, and student.
   * Note: Ensure lessonId, classId, and studentId are valid and correspond to existing entities.
   * Note: The returned Promise resolves to an "assignment" type object or undefined if no assignments are pending.
   */
  getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment"> | undefined>;

  /**
   *
   */
  getFavouriteLessons(user_id: string): Promise<TableTypes<"lesson">[]>;
}
