import User from "../../models/user";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { StudentLessonResult } from "../../common/courseConstants";
import {
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODES,
  PROFILETYPE,
  TABLES,
  TableTypes,
} from "../../common/constants";
import { AvatarObj } from "../../components/animation/Avatar";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import { RoleType } from "../../interface/modelInterfaces";

export interface LeaderboardInfo {
  weekly: StudentLeaderboardInfo[];
  monthly: StudentLeaderboardInfo[];
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
  ): Promise<TableTypes<"user">>;
  /**
   * Creates a new school and returns the school object
   * @param {string} name - name of the school
   * @param {string} group1 - state of school
   * @param {string} group1 - district of school
   * @param {string} group1 - city of school
   * @param {string[]} courseIds - school course ids
   * @returns {TableTypes<"school">} School Object
   */
  createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null
  ): Promise<TableTypes<"school">>;
  /**
   * updates a school details and returns the school object
   * @param {TableTypes<"school">} school - school object
   * @param {string} name - name of the school
   * @param {string} group1 - state of school
   * @param {string} group1 - district of school
   * @param {string} group1 - city of school
   * @param {string} image - image of school
   * @returns {TableTypes<"school">} Updated School Object
   */
  updateSchoolProfile(
    school: TableTypes<"school">,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null
  ): Promise<TableTypes<"school">>;

  requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string
  ): Promise<TableTypes<"req_new_school"> | null>;

  getExistingSchoolRequest(
    userId: string
  ): Promise<TableTypes<"req_new_school"> | null>;
  /**
   * Adds a school profile image and returns the school profile image URL.
   * @param {string} id - The unique identifier of the school.
   * @param {File} file - The image file to be uploaded.
   * @param {PROFILETYPE} profileType - The type of profile image (e.g., "school", "class", "user").
   * @returns {Promise<string | null>} The URL of the uploaded profile image or null if the upload fails.
   */
  addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE
  ): Promise<string | null>;

  /**
   * Adds a school profile image and returns the school profile image URL.
   * @param {payload} any - Mapped data in the json format.
   * @returns {Promise<boolean | null>} Returns if the upload is success or upload fails.
   */
  uploadData(payload: any): Promise<boolean | null>;

  createStudentProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | null,
    image: string | null,
    boardDocId: string | null,
    gradeDocId: string | null,
    languageDocId: string | null,
    classId: string,
    role: string,
    studentId: string
  ): Promise<TableTypes<"user">>;

  updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void>;

  updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[]
  ): Promise<void>;

  getCoursesByClassId(classId: string): Promise<TableTypes<"class_course">[]>;

  getCoursesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"school_course">[]>;

  /**
   * To delete 'courses' with given class IDs from the class_course table.
   * @param {string[] } class_ids - Class Ids
   */
  removeCoursesFromClass(ids: string[]): Promise<void>;

  /**
   * To delete 'courses' with given school IDs from the school_course table.
   * @param {string[] } school_ids - School Ids
   */
  removeCoursesFromSchool(ids: string[]): Promise<void>;

  /**
   *To check course is connected with any given class ids and return boolean value.
   * @param {string [] } class_ids - class Ids
   * @param {string } course_id - course Id
   */
  checkCourseInClasses(classIds: string[], courseId: string): Promise<boolean>;

  /**
   * To delete a 'user' with a given student ID from the class_user table.
   * @param {string } studentId - Student Id
   */
  deleteUserFromClass(userId: string): Promise<void>;

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
   * @param id - The ID of the grade.
   * @returns {TableTypes<"grade">} or `undefined` if it could not find the grade with given `id`
   */
  getGradeById(id: string): Promise<TableTypes<"grade"> | undefined>;
  /**
   * @param ids - IDs of the grades.
   * @returns {TableTypes<"grade">} or `[]` if it could not find the grade with given `ids`
   */
  getGradesByIds(ids: string[]): Promise<TableTypes<"grade">[]>;

  /**
   * @param id - The ID of the curriculum.
   * @returns {TableTypes<"curriculum">} or `undefined` if it could not find the curriculum with given `id`
   */
  getCurriculumById(id: string): Promise<TableTypes<"curriculum"> | undefined>;
  /**
   * @param ids - IDs of the curriculum.
   * @returns {TableTypes<"curriculum">} or [] if it could not find the curriculum with given `ids`
   */
  getCurriculumsByIds(ids: string[]): Promise<TableTypes<"curriculum">[]>;

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
  getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined
  ): Promise<TableTypes<"course">[]>;

  get currentStudent(): TableTypes<"user"> | undefined;

  set currentStudent(value: TableTypes<"user"> | undefined);
  get currentClass(): TableTypes<"class"> | undefined;
  set currentClass(value: TableTypes<"class"> | undefined);
  get currentCourse():
    | Map<string, TableTypes<"course"> | undefined>
    | undefined;
  set currentCourse(
    value: Map<string, TableTypes<"course"> | undefined> | undefined
  );
  get currentSchool(): TableTypes<"school"> | undefined;
  set currentSchool(value: TableTypes<"school"> | undefined);
  updateSoundFlag(userId: string, value: boolean);
  updateMusicFlag(userId: string, value: boolean);
  updateLanguage(userId: string, value: string);
  updateTcAccept(userId: string);
  updateFcmToken(userId: string);

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
  addCourseForParentsStudent(
    courses: TableTypes<"course">[],
    student: TableTypes<"user">
  );

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
  getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]>;

  /**
   * Gives Chapter for given a chapter doc Id
   * @param id  -chapter id
   * @returns {Chapter | undefined}`Chapter` or `undefined` if it could not find the lesson with given `id`
   */
  getChapterById(id: string): Promise<TableTypes<"chapter"> | undefined>;

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
  ): Promise<TableTypes<"live_quiz_room"> | undefined>;

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
    chapterId: string,
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

  updateStudentFromSchoolMode(
    student: TableTypes<"user">,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
    student_id: string,
    newClassId: string
  ): Promise<TableTypes<"user">>;

  updateUserProfile(
    user: TableTypes<"user">,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined
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

  getStudentProgress(studentId: string): Promise<Map<string, string>>;

  /**
   * Gives StudentProgress for given a Student
   */
  getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result"> }>;

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
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]>;

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
   * @param studentId The current student Id
   * @returns A promise that resolves to the student.
   */
  linkStudent(inviteCode: number, studentId: string): Promise<any>;

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
   * This function gives lesson objects for given chapterId and LessonId
   *
   * @param chapterId Chapter Id of the course
   * @param lessonId Lesson Id of a course
   * @returns A promise that resolves to the lesson.
   */
  getLessonFromChapter(
    chapterId: string,
    lessonId: string
  ): Promise<{
    lesson: TableTypes<"lesson">[];
    course: TableTypes<"course">[];
  }>;

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
    onDataChange: (roomDoc: TableTypes<"live_quiz_room"> | undefined) => void
  ): void;
  /**
   * Removes LiveQuizChannel after live quiz completion;
   */

  removeLiveQuizChannel();

  /**
   * Establishes a real-time listener for changes in a assignmentUser document.
   * @param studentId  - The class Id of the student
   * @param onDataChange - A callback function to be executed when the data in assignment is inserted
   */

  assignmentUserListner(
    studentId: string,
    onDataChange: (roomDoc: TableTypes<"assignment_user"> | undefined) => void
  ): void;

  /**
   * Remove AssignmentChannel;
   */
  removeAssignmentChannel();
  /**
   * Establishes a real-time listener for changes in a assignmet document.
   * @param classId  - The class Id of the student
   * @param onDataChange - A callback function to be executed when the data in assignment is inserted
   */

  assignmentListner(
    classId: string,
    onDataChange: (roomDoc: TableTypes<"assignment"> | undefined) => void
  ): void;

  /**
   * Subscribe to Class Topic
   */
  subscribeToClassTopic(): Promise<void>;

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
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined>;
  /**
   * getting the results based on assignmentId.
   *
   * @param assignmentId - The unique identifier of the assignment document.
   * @returns {Assignment}  A promise that resolves `Assignment` for the with given `id`.
   */
  getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<"result">[];
      user_data: TableTypes<"user">[];
    }[]
  >;
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
  getBadgesByIds(ids: string[]): Promise<TableTypes<"badge">[]>;

  /**
   * Gives Sticker for given a Sticker firebase doc Id
   * @param {string} id - Sticker firebase doc id
   * @returns {Badge | undefined}`Sticker` or `undefined` if it could not find the Sticker with given `id`
   */
  getStickersByIds(ids: string[]): Promise<TableTypes<"sticker">[]>;
  /**
   * Gives Rewards for given a Rewards firebase doc Id
   * @param {string} id - Rewards firebase doc id
   * @returns {Rewards | undefined}`Rewards` or `undefined` if it could not find the Rewards with given `id`
   */
  getRewardsById(
    id: number,
    periodType: string
  ): Promise<TableTypes<"reward"> | undefined>;

  /**
   * Retrieves all stickers associated with a specified user.
   * @param userId The unique identifier of the user whose stickers are to be retrieved.
   * @returns A Promise resolving to an array of user stickers. Each sticker is an object corresponding to the 'user_sticker' table type.
   * Note: The userId must be valid and correspond to an existing user.
   * Note: If the user has no stickers, the returned Promise resolves to an empty array.
   */
  getUserSticker(userId: string): Promise<TableTypes<"user_sticker">[]>;

  /**
   * Retrieves all bonuses associated with a specified user.
   * @param userId The unique identifier of the user whose bonuses are to be retrieved.
   * @returns A Promise resolving to an array of user bonuses. Each bonus is an object corresponding to the 'user_bonus' table type.
   * Note: The userId must be valid and correspond to an existing user.
   * Note: If the user has no bonuses, the returned Promise resolves to an empty users.
   */
  getUserBonus(userId: string): Promise<TableTypes<"user_bonus">[]>;

  /**
   * Retrieves all badges associated with a specified user.
   * @param userId The unique identifier of the user whose badges are to be retrieved.
   * @returns A Promise resolving to an array of user badges. Each badge is an object corresponding to the 'user_badge' table type.
   * Note: The userId must be valid and correspond to an existing user.
   * Note: If the user has no badges, the returned Promise resolves to an empty array.
   */
  getUserBadge(userId: string): Promise<TableTypes<"user_badge">[]>;

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
   * Retrieves Array of Favourite lessons for the specified user
   * @param user_id The unique identifier of the user
   */
  getFavouriteLessons(userId: string): Promise<TableTypes<"lesson">[]>;

  /**
   * Retrieves Array of classes for the specified user
   * @param user_id The unique identifier of the user
   */
  getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<"class">[];
    schools: TableTypes<"school">[];
  }>;

  /**
   * Function to create user documentation.
   *
   * @param user - The user object of type "user" table.
   * @returns A promise containing the created user object or undefined.
   */
  createUserDoc(
    user: TableTypes<"user">
  ): Promise<TableTypes<"user"> | undefined>;

  /* Synchronizes the local database with an external data source asynchronously.
   * This method ensures that the local database reflects the latest data from the external source.
   *
   * @returns A Promise that resolves to a boolean value indicating whether the synchronization was successful.
   *          - `true` if the synchronization completed successfully.
   *          - `false` if there were any errors or if no synchronization was necessary.
   */

  syncDB(tableNames: TABLES[], refreshTables: TABLES[]): Promise<boolean>;

  /**
   * Function to get Recommended Lessons.
   *
   * @param studentId - The current student id.
   * @param classId - The current class id
   * @returns A promise returns list of Recommended Lessons to home page.
   */
  getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<"lesson">[]>;

  /**
   * Searches for lessons that match the given search string in their name or outcome fields.
   *
   * @param searchString - The text to search for in the name or outcome of lessons.
   * @returns A promise that resolves to an array of lessons that match the search criteria. Each lesson is an object containing fields as defined in the "lesson" table.
   *
   * The search is performed using a PostgreSQL function called find_similar_lessons, which returns lessons with similarity scores based on the search string.
   * The function looks for matches in both the name and outcome fields of the lessons.
   * The results are ordered by their similarity scores in descending order, and limited to a certain number of rows to ensure efficiency.
   * if the user is offline search will be performed in sqlite
   *
   * Example usage:
   * searchLessons("math")
   *   .then(lessons => {})
   *   .catch(error => console.error(error));
   */

  searchLessons(searchString: string): Promise<TableTypes<"lesson">[]>;

  /**
   * Create Assignment Cart when the user added the lessons to his cart
   * @param userId
   * @param lessons
   */
  createOrUpdateAssignmentCart(
    userId: string,
    lessons: string
  ): Promise<boolean | undefined>;

  /**
   * Get user selected assignmets which they are added to their cart
   * @param userId
   */
  getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<"assignment_cart"> | undefined>;

  /**
   * Get the chapter by lessonId
   * @param lessonId
   */
  getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string
  ): Promise<String | undefined>;

  /**
   * Get Assignments by classId and datewise
   * @param classId
   * @param startDate
   * @param endData
   */
  getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseId: string,
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean
  ): Promise<TableTypes<"assignment">[] | undefined>;

  /**
   * Get Student Result of 10 activities either assignments or self played
   * @param studentId
   * @param courseId
   */
  getStudentLastTenResults(
    studentId: string,
    courseId: string,
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[]>;
  /**
   * Creates a class for the given school
   * @param schoolId
   * @param className
   * @returns {TableTypes<"class">} Class Object
   */
  createClass(
    schoolId: string,
    className: string
  ): Promise<TableTypes<"class">>;
  /**
   * Updates a class name for given classId
   * @param classId
   * @param className
   */
  updateClass(classId: string, className: string);
  /**
   * Deletes a class
   * @param classId
   */
  deleteClass(classId: string);

  /**
   *  Get the results By assignmentIds
   * @param assignmentIds
   */
  getResultByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[] | undefined>;

  /**
   *  Get the last assignments by course wise
   * @param classId
   */
  getLastAssignmentsForRecommendations(
    classId: string
  ): Promise<TableTypes<"assignment">[] | undefined>;

  getAssignmentUserByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"assignment_user">[]>;

  /**
   * Creates a assignment object
   * @param {string} student_list - list of the students id's
   * @param {number} age - age of the student
   * @param {GENDER} gender - gender of the student
   * @param {string} image - image of the student
   * @param {string} boardDocId - boardDocId is `Curriculum` doc id
   * @param {string} gradeDocId -  gradeDocId is `Grade` doc id
   * @param {string} languageDocId -  languageDocId is `Language` doc id
   * @returns {User} Student User Object
   */
  createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string
  ): Promise<boolean>;

  /**
   * This function gets all the teachers for the class.
   * @param {string} classId class Id;
   * @return A promise to an array of teachers.
   */
  getTeachersForClass(
    classId: string
  ): Promise<TableTypes<"user">[] | undefined>;

  /**
   * This function gets the user by email.
   * @param {string} email email;
   * @return user object.
   */
  getUserByEmail(email: string): Promise<TableTypes<"user"> | undefined>;

  /**
   * This function gets the user by phonenumber.
   * @param {string} phone phonenumber;
   * @return user object.
   */
  getUserByPhoneNumber(phone: string): Promise<TableTypes<"user"> | undefined>;

  /**
   * Adding a teacher to class.
   * @param {string} schoolId school Id
   * @param {string} classId class Id
   * @param {string} userId user Id;
   * @return void.
   */
  addTeacherToClass(classId: string, userId: string): Promise<void>;

  /**
   * Checks the user present in school or not.
   * @param {string} schoolId school Id
   * @param {string} userId user Id;
   * @return returns boolean whether the user is already connected to school or not.
   */
  checkUserExistInSchool(schoolId: string, userId: string): Promise<boolean>;

  /**
   * Checks the user present in school or not.
   * @param {string} schoolId school Id
   * @param {string} userId user Id;
   * @return returns boolean whether the user is Program-manager/Operational-director or not.
   */
  checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string
  ): Promise<boolean>;

  /**
   * Gets the assignments by assigner and class.
   * @param {string} classId class Id
   * @param {string} userId user Id
   * @param {string} startDate start date
   * @param {string} endDate end date
   * @return array of class wise and individual assignments.
   */
  getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    classWiseAssignments: TableTypes<"assignment">[];
    individualAssignments: TableTypes<"assignment">[];
  }>;

  /**
   * Gets teacher joined date.
   * @param {string} userId user Id
   * @param {string} classId class Id
   * @return class user object.
   */
  getTeacherJoinedDate(
    userId: string,
    classId: string
  ): Promise<TableTypes<"class_user"> | undefined>;

  /**
   * Gets student ids for individual assignments.
   * @param {string} assignmentId assignment Id
   * @return array of student ids.
   */
  getAssignedStudents(assignmentId: string): Promise<string[]>;

  /** Get the student result by Date
   * @param studentId
   * @param startDate
   * @param endDate
   */
  getStudentResultByDate(
    studentId: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined>;

  /**
   * Get the Lessons with LessonIds
   * @param lessonIds
   */
  getLessonsBylessonIds(
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"lesson">[] | undefined>;
  /**
   * To delete `teacher` from class for given class id and teacher id
   * @param {string } classId - Class Id
   * @param {string } teacherId - Teacher Id
   */
  deleteTeacher(classId: string, teacherId: string);
  /**
   * To get class code for the given class id
   * @param {string } classId - Class Id
   */
  getClassCodeById(class_id: string): Promise<number | undefined>;

  /**
   * To get the result by chapterId
   * @param chapter_id
   * @param course_id
   * @param startDate
   * @param endDate
   */
  getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined>;

  /**
   * To generate class code for the given class id
   * @param {string } classId - Class Id
   */
  createClassCode(classId: string): Promise<number>;
  /**
   * To get autousers from school user table for the given school ids
   * @param {string []} schoolIds - school Ids
   * * @return an array of autouser schools.
   */
  getSchoolsWithRoleAutouser(
    schoolIds: string[]
  ): Promise<TableTypes<"school">[] | undefined>;
  /**
   * This function gets all the principals for the school.
   * @param {string} schoolId school Id;
   * @return A promise to an array of principals.
   */
  getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined>;
  /**
   * This function gets all the coordinators for the school.
   * @param {string} schoolId school Id;
   * @return A promise to an array of coordinators.
   */
  getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined>;
  /**
   * This function gets all the sponsors for the school.
   * @param {string} schoolId school Id;
   * @return A promise to an array of sponsors.
   */
  getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined>;
  /**
   * Adding a principal or coordinator or sponsor to school.
   * @param {string} schoolId school Id
   * @param {string} userId user Id;
   * @param {string} role role
   * @return void.
   */
  addUserToSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void>;
  /**
   * To delete a user from school for given school id, user id and role
   * @param {string } schoolId - school Id
   * @param {string } userId - user Id
   * @param {string } role - role
   */
  deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void>;

  /**
   * updates a school LastModified time and Date
   * @param {string} id - The unique identifier of the school.
   */
  updateSchoolLastModified(id: string): Promise<void>;

  /**
   * updates a Class LastModified time and Date
   * @param {string} id - The unique identifier of the Class.
   */
  updateClassLastModified(id: string): Promise<void>;

  /**
   * updates a User LastModified time and Date
   * @param {string} id - The unique identifier of the User.
   */
  updateUserLastModified(id: string): Promise<void>;

  /**
   * To validate a school for given school id, school name and instruction medium
   * @param {string } schoolId - school Id
   * @param {string } schoolName - school Name
   * @param {string } instructionMedium - school instruction Medium
   */
  validateSchoolData(
    schoolId: string,
    schoolName: string
  ): Promise<{ status: string; errors?: string[] }>;


  /**
   * To validate given phone number and student already exist in the given class or not
   * @param {string } phoneNumber - phone number
   * @param {string } studentName - student Name
   * @param {string } className  -  class Name
   * @param {string } schoolId -    school id(UDISE)
   */
  validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[] }>;

   /**
   * To validate given UDISE school Id  exist in the given school table or not
   * @param {string } schoolId -    school id(UDISE)
   */
  validateSchoolUdiseCode(
    schoolId: string
  ): Promise<{ status: string; errors?: string[] }>;

  /**
   * To validate given UDISE school Id a exist in the given school table or not
   * @param {string } schoolId -    school id(UDISE)
   */
  validateClassNameWithSchoolID(
    schoolId: string,
    className: string,
  ): Promise<{ status: string; errors?: string[] }>;

  /**
   * To validate given student already exist in the given class or not
   * @param {string } studentName - student Name
   * @param {string } className  -  class Name
   * @param {string } schoolId -    school id(UDISE)
   */
  validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[] }>;

  /**
   * To validate that the given subject belongs to that curriculum or not
   * @param {string } curriculumName - curriculum Name
   * @param {string } subjectName - subject Name
   */
  validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string
  ): Promise<{ status: string; errors?: string[] }>;
  /**
   * To validate that the given user phone or mail is exist or not
   * @param {string } programManagerPhone - programManager Phone
   * @param {string } fieldCoordinatorPhone - fieldCoordinator Phone
   */
  validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone: string
  ): Promise<{ status: string; errors?: string[] }>;
  /**
   * setting a stars for the student
   * @param {string } studentId - student id
   * @param {string } starsCount - count of stars
   */
  setStarsForStudents(studentId: string, starsCount: number): Promise<void>;

  /**
   * count all pending row changes to be pushed in the sqlite
   */
  countAllPendingPushes(): Promise<number>;
  /**
   * getting the push, pull changes information for the last 30 days
   * @param {string } parentId - parent id
   */
  getDebugInfoLast30Days(parentId: string): Promise<any[]>;
  /**
   * getting class for the user, user id can be Student id or teacher id
   * @param {string } userId - user id
   */
  getClassByUserId(userId: string): Promise<TableTypes<"class"> | undefined>;

  /**
   * getting courses for the student sorted with sort_index
   * @param {string } studentId - student id
   */
  getCoursesForPathway(studentId: string): Promise<TableTypes<"course">[]>;
  /**
   * Updates the learning path for a student.
   * @param {string} learningPath - The new learning path to be set.
   * @returns {User} Updated Student User Object
   */
  updateLearningPath(
    student: TableTypes<"user">,
    learning_path: string
  ): Promise<TableTypes<"user">>;
  /**
   * Updates the total stars for a student.
   * @param {string} studentId - student Id.
   * @param {number} totalStars - total stars.
   */
  updateStudentStars(studentId: string, totalStars: number): Promise<void>;
}
