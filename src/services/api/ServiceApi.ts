import User from "../../models/user";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { StudentLessonResult } from "../../common/courseConstants";
import {
  CACHETABLES,
  CoordinatorAPIResponse,
  EnumType,
  FilteredSchoolsForSchoolListingOps,
  GeoDataParams,
  LeaderboardDropdownList,
  LeaderboardRewards,
  MODEL,
  MODES,
  PrincipalAPIResponse,
  PROFILETYPE,
  RequestTypes,
  SchoolRoleMap,
  SearchSchoolsParams,
  SearchSchoolsResult,
  STATUS,
  StudentAPIResponse,
  TABLES,
  TableTypes,
  TabType,
  TeacherAPIResponse,
} from "../../common/constants";
import { AvatarObj } from "../../components/animation/Avatar";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import { RoleType } from "../../interface/modelInterfaces";
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from "../../ops-console/pages/NewUserPageOps";

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
   * Creates a new school and returns the created school object.
   * @param {string} name - Name of the school.
   * @param {string} group1 - State of the school.
   * @param {string} group2 - District of the school.
   * @param {string} group3 - Block of the school.
   * @param {string | null} group4 - Additional grouping, if any. eg: Cluster.
   * @param {File | null} image - Optional image file for the school.
   * @param {string | null} program_id - Linked program ID if any.
   * @param {string | null} udise - School's UDISE code (11 digits).
   * @param {string | null} address - Full address of the school.
   * @param {string | null} country - Country of the school.
   * @returns {Promise<TableTypes<"school">>} The created school object.
   */
  createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string,
    group4: string | null,
    image: File | null,
    program_id: string | null,
    udise: string | null,
    address: string | null,
    country: string | null,
    onlySchool?: boolean,
    onlySchoolUser?: boolean
  ): Promise<TableTypes<"school">>;
  /**
   * Updates the school details and returns the updated school object.
   * @param {TableTypes<"school">} school - The existing school object.
   * @param {string} name - Name of the school.
   * @param {string} group1 - State of the school.
   * @param {string} group2 - District of the school.
   * @param {string} group3 - City of the school.
   * @param {string | null} group4 - Additional grouping, if any.
   * @param {File | null} image - Optional image file for the school.
   * @param {string | null} program_id - Linked program ID if any.
   * @param {string | null} udise - School's UDISE code (11 digits).
   * @param {string | null} address - Full address of the school.
   * @returns {Promise<TableTypes<"school">>} The updated school object.
   */
  updateSchoolProfile(
    school: TableTypes<"school">,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4: string | null,
    program_id: string | null,
    udise: string | null,
    address: string | null
  ): Promise<TableTypes<"school">>;

  /**
   * Clears all rows from the specified tables in the local SQLite database.
   * Keeps the database structure and files intact.
   * Primarily used during logout or reset operations.
   *
   * @param {readonly TABLES[]} tableNames - List of table names to clear.
   * @returns {Promise<void>} Resolves once the tables are cleared.
   */
  clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void>;

  requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string
  ): Promise<TableTypes<"req_new_school"> | null>;

  /**
   * Soft-deletes all approved ops requests for a specific user.
   *
   * This marks matching ops_requests records as `is_deleted = true` without
   * removing them from the database. You can optionally limit the deletion
   * to a specific school or class.
   *
   * @param {string} requested_by - The ID of the user whose ops requests should be deleted.
   * @param {string} [schoolId] - (Optional) The school ID to filter requests by.
   *                              If provided, only requests belonging to this school are deleted.
   * @param {string} [classId] - (Optional) The class ID to filter requests by.
   *                             If provided, only requests belonging to this class are deleted.
   * @returns {Promise<void>} Resolves when the operation is complete.
   */
  deleteApprovedOpsRequestsForUser(
    requested_by: string,
    schoolId?: string,
    classId?: string
  ): Promise<void>;

  getExistingSchoolRequest(
    requested_by: string
  ): Promise<TableTypes<"ops_requests"> | null>;
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
   * @param {string } class_id - Student Id
   */
  deleteUserFromClass(userId: string, class_id: string): Promise<void>;

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
    student: TableTypes<"user">,
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
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
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
    profilePic: string | undefined,
    options?: {
      age?: string;
      gender?: string;
    }
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
   * Gives Courses for given a CourseIds
   * @param  {courseIds: string[]} - CourseIds
   * @returns {<TableTypes<"course">[]>}`Course` or `undefined` if it could not find the Course with given `id`
   */
  getCourses(courseIds: string[]): Promise<TableTypes<"course">[]>;

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
   * Gets schools for a user (teacher, principal, or ops user).
   * returns all schools for the user (legacy behavior).
   *
   * @param {string} userId - User's unique ID
   * @returns {Promise<{ school: TableTypes<"school">; role: RoleType }[]>}
   */
  getSchoolsForUser(
    userId: string,
    options?: { page?: number; page_size?: number; search?: string }
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]>;

  /**
   * Get a user's role for a given school.
   * @param userId - The user's id
   * @param schoolId - The school's id
   * @returns Promise of RoleType (or undefined if no role found)
   */
  getUserRoleForSchool(
    userId: string,
    schoolId: string
  ): Promise<RoleType | undefined>;

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

  syncDB(
    tableNames: TABLES[],
    refreshTables: TABLES[],
    isFirstSync?: boolean
  ): Promise<boolean>;

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
    courseIds: string[],
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean,
    allAssignments: boolean
  ): Promise<TableTypes<"assignment">[] | undefined>;

  /**
   * Get Student Result of 10 activities either assignments or self played
   * @param studentId
   * @param courseId
   */
  getStudentLastTenResults(
    studentId: string,
    courseIds: string[],
    assignmentIds: string[],
    classId
  ): Promise<TableTypes<"result">[]>;
  /**
   * Creates a class for the given school
   * @param schoolId
   * @param className
   * @param groupId - Whatsapp group id
   * @returns {TableTypes<"class">} Class Object
   */
  createClass(
    schoolId: string,
    className: string,
    groupId?: string
  ): Promise<TableTypes<"class">>;
  /**
   * Updates a class name for given classId
   * @param classId
   * @param className
   * @param groupId
   */
  updateClass(classId: string, className: string, groupId?: string);
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
   * Get results by assignment ids for students currently in the specified class
   * @param assignmentIds
   * @param classId
   */
  getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string
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
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string
  ): Promise<void>;

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
   * @param {string} user user;
   * @return void.
   */
  addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<"user">
  ): Promise<void>;

  /**
   * Checks the user present in school or not.
   * @param {string} schoolId school Id
   * @param {string} userId user Id;
   * @return returns boolean whether the user is already connected to school or not.
   */
  checkUserExistInSchool(schoolId: string, userId: string): Promise<boolean>;

  /**
   * Checks the teacher present in class or not.
   * @param {string} schoolId school Id
   * @param {string} classId class Id
   * @param {string} userId user Id;
   * @return returns boolean whether the teacher is already connected to class or not.
   */
  checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string
  ): Promise<boolean>;

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
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string
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
    endDate: string,
    classId: string
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
   * This function gets all the teachers for the school.
   * @param {string} schoolId school Id;
   * @return A promise to an array of teachers.
   */
  getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined>;
  /**
   * Fetches a paginated list of principal for a given school.
   * @param {string} schoolId - The ID of the school.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=20] - The number of items per page.
   * @returns A promise resolving to an object with principal data and a total count.
   */
  getPrincipalsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number
  ): Promise<PrincipalAPIResponse>;
  /**
   * This function gets all the coordinators for the school.
   * @param {string} schoolId school Id;
   * @return A promise to an array of coordinators.
   */
  getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined>;
  /**
   * Fetches a paginated list of coordinators for a given school.
   * @param {string} schoolId - The ID of the school.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=20] - The number of items per page.
   * @returns A promise resolving to an object with coordinator data and a total count.
   */
  getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number
  ): Promise<CoordinatorAPIResponse>;
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
   * @param {string} user user ;
   * @param {string} role role
   * @return void.
   */
  addUserToSchool(
    schoolId: string,
    user: TableTypes<"user">,
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
  ): Promise<{ status: string; errors?: string[]; message?: string }>;

  /**
   * To validate given program name exist in the program table or not
   * @param {string } programName -    program name
   */
  validateProgramName(
    programName: string
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
    className: string
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
  ): Promise<{ status: string; errors?: string[]; message?: string }>;

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
    className: string
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
    className: string
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
   * @param {string } gradeName - subject grade Name
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
    fieldCoordinatorPhone?: string
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
   * Fetches available program filter options.
   * @returns {Promise<Record<string, string[]>>} Promise resolving to a record of filter keys and their possible values.
   */
  getProgramFilterOptions(): Promise<Record<string, string[]>>;

  /**
   * Fetches programs with optional filters, search term, tab category, pagination, and sorting.
   * Retrieves program details along with the names of program managers.
   *
   * @param {Object} params - Parameters to filter, search, paginate, and sort programs.
   * @param {string} params.currentUserId - ID of the current user making the request.
   * @param {Record<string, string[]>} [params.filters] - Key-value pairs to filter programs.
   * @param {string} [params.searchTerm] - Text to search in program names.
   * @param {'ALL' | 'AT SCHOOL' | 'AT HOME' | 'HYBRID'} [params.tab='ALL'] - Program type tab filter.
   * @param {number} [params.limit] - Max number of results to return (for pagination).
   * @param {number} [params.offset] - Number of results to skip (for pagination).
   * @param {string} [params.orderBy] - Field name to sort by.
   * @param {'asc' | 'desc'} [params.order] - Sort order.
   * @returns {Promise<{ data: any[] }>} Promise resolving to an object containing an array of programs with manager names.
   */
  getPrograms(params: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: "asc" | "desc";
  }): Promise<{ data: any[] }>;

  /**
   * Inserts or updates a program record in the database via Supabase Edge Function.
   * @param {any} payload - The mapped program data in JSON format.
   * @param {string} [id] - Optional program ID; if provided, updates the existing record, otherwise inserts a new one
   */
  insertProgram(payload: any, id?: string): Promise<boolean | null>;

  /**
   * Get all program managers
   */
  getProgramManagers(): Promise<{ name: string; id: string }[]>;

  /**
   * Get unique geo data
   */
  getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }>;

  /**
   * This function gets the program for a given school.
   * @param {string} schoolId - The school ID
   * @returns {Promise<TableTypes<"program"> | undefined>} - A promise resolving to the program, or undefined if not found
   */
  getProgramForSchool(
    schoolId: string
  ): Promise<TableTypes<"program"> | undefined>;

  /**
   * This function gets all program managers (users) for the given school.
   * @param {string} schoolId - The school ID
   * @returns {Promise<TableTypes<"user">[]>} - A promise resolving to an array of users (program managers)
   */
  // In ServiceApi
  getProgramManagersForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined>;
  /**
   * Updates the total stars for a student.
   * @param {string} studentId - student Id.
   * @param {number} totalStars - total stars.
   */
  updateStudentStars(studentId: string, totalStars: number): Promise<void>;

  /**
   * gets record from chpater_links table by QRCode link
   * @param link -Qrlink
   */
  getChapterIdbyQrLink(
    link: string
  ): Promise<TableTypes<"chapter_links"> | undefined>;
  /**
   * Fetches all schools available to the admin user with pagination.
   * @param {number} limit - Number of schools to fetch.
   * @param {number} offset - Offset for pagination.
   * @returns {Promise<TableTypes<"school">[]>} - A promise that resolves to a list of schools.
   */
  getSchoolsForAdmin(
    limit: number,
    offset: number
  ): Promise<TableTypes<"school">[]>;

  /**
   * Retrieves teachers for each given school.
   * @param {string[]} schoolIds - List of school IDs to fetch teacher.
   * @returns {Promise<SchoolRoleMap[]>} - A promise resolving to role data for teachers.
   */
  getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  /**
   * Retrieves students for each given school.
   * @param {string[]} schoolIds - List of school IDs to fetch student.
   * @returns {Promise<SchoolRoleMap[]>} - A promise resolving to role data for students.
   */
  getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  /**
   * Retrieves program managers assigned to the given schools.
   * @param {string[]} schoolIds - List of school IDs to fetch program manager.
   * @returns {Promise<SchoolRoleMap[]>} - A promise resolving to role data for program managers.
   */
  getProgramManagersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  /**
   * Retrieves field coordinators assigned to the given schools.
   * @param {string[]} schoolIds - List of school IDs to fetch field coordinator data for.
   * @returns {Promise<SchoolRoleMap[]>} - A promise resolving to role data for field coordinators.
   */
  getFieldCoordinatorsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  /**
   * Fetches schools by operational model ("AT_HOME" or "AT_SCHOOL") with pagination.
   * @param {EnumType<"program_model">} model - The model type to filter schools ("AT_HOME" or "AT_SCHOOL").
   * @param {number} limit - Number of schools to fetch.
   * @param {number} offset - Offset for pagination.
   * @returns {Promise<TableTypes<"school">[]>} - A promise that resolves to a list of schools filtered by model.
   */
  getSchoolsByModel(
    model: EnumType<"program_model">,
    limit: number,
    offset: number
  ): Promise<TableTypes<"school">[]>;

  /**
   * Fetch detailed information for a given program by ID.
   * @param {string} programId - The ID of the program to fetch.
   * @returns Promise resolving to program details, location, partner, and managers or null if not found.
   */
  getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: { name: string; role: string; phone: string }[];
  } | null>;

  /**

   * Fetch available filter options for schools.
   * Each key in the returned object represents a filter category,
   * and the value is an array of possible filter values.
   * 
   * @returns Promise resolving to an object where keys are filter categories
   * and values are arrays of filter option strings.
   */
  getSchoolFilterOptionsForSchoolListing(): Promise<Record<string, string[]>>;

  /**
   * Fetch filter options for schools within a specific program.
   * Returns an object where keys are filter categories (e.g., 'state', 'district')
   * and values are arrays of filter option strings specific to that program.
   *
   * @param programId - The ID of the program to get filter options for
   * @returns Promise resolving to an object where keys are filter categories
   * and values are arrays of filter option strings.
   */
  getSchoolFilterOptionsForProgram(
    programId: string
  ): Promise<Record<string, string[]>>;

  /**
   * Fetch a list of schools filtered by given criteria, with pagination, sorting, and search.
   *
   * @param params - An object containing filters (keys as categories and values as selected options),
   *   an optional programId, pagination, sorting, and search options.
   * @returns Promise resolving to an object with the filtered list of schools and the total count.
   */
  getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: "asc" | "desc";
    search?: string;
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }>;

  /**
   * Creates or gets a user based on the provided payload.
   * @param {Object} payload - The user creation payload.
   * @param {string} payload.name - Name of the user.
   * @param {string} [payload.email] - Optional email address.
   * @param {string} [payload.phone] - Optional phone number.
   * @param {string} payload.role - Role of the user.
   * @returns {Promise<{ success: boolean; user_id?: string; message?: string; error?: string; }>}
   */
  createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }>;

  /**
   * Fetch detailed, paginated teacher information for a given school ID.
   * @param {string} schoolId - The ID of the school to fetch.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=20] - The number of items per page.
   * @returns Promise resolving to an object with teacher data and a total count.
   */
  getTeacherInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number
  ): Promise<TeacherAPIResponse>;

  /**
   * Fetch detailed, paginated student information for a given school ID.
   * @param {string} schoolId - The ID of the school to fetch.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=20] - The number of items per page.
   * @returns Promise resolving to an object with student data and a total count.
   */
  getStudentInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number
  ): Promise<StudentAPIResponse>;

  /**
   * Fetch detailed, paginated student and parent information for a given class ID.
   * @param {string} classId - The ID of the class to fetch.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=20] - The number of items per page.
   * @returns Promise resolving to an object with student and parent data and a total count.
   */
  getStudentsAndParentsByClassId(
    classId: string,
    page: number,
    limit: number
  ): Promise<StudentAPIResponse>;

  /**
   * Fetch a single student's details along with their parent information.
   * @param {string} studentId - The ID of the student to fetch.
   * @returns Promise resolving to an object containing the student's data and an array of parents.
   */
  getStudentAndParentByStudentId(
    studentId: string
  ): Promise<{ user: any; parents: any[] }>;

  /**
   * Merge a new student into an existing student record in SQLite.
   * Moves results, links parents (by phone or email), and soft-deletes the new record.
   * @param {string} requestId - The request ID associated with this merge.
   * @param {string} existingStudentId - The student ID to merge into.
   * @param {string} newStudentId - The student ID being merged and marked as deleted.
   * @returns Promise resolving when the merge is complete.
   */
  mergeStudentRequest(
    requestId: string,
    existingStudentId: string,
    newStudentId: string,
    respondedBy: string
  ): Promise<void>;

  getClassesBySchoolId(schoolId: string): Promise<TableTypes<"class">[]>;

  /**
   * Creates a auto student profile for a parent and returns the student object
   * @param {string} languageDocId -  languageDocId is `Language` doc id
   * @returns {User} Student User Object
   */
  createAutoProfile(
    languageDocId: string | undefined
  ): Promise<TableTypes<"user">>;

  /**
   * Checks if the current user is a program user.
   * @returns {Promise<boolean>} A promise that resolves to true if the user is a program user, false otherwise.
   */
  isProgramUser(): Promise<boolean>;

  /**
   * Count total and active students, total and active teachers, and total schools for a given program.
   *
   * @param {string} programId - The ID of the program.
   * @returns {Promise<{
   *   total_students: number;
   *   active_students: number;
   *   avg_time_spent: number;
   *   total_teachers: number;
   *   active_teachers: number;
   *   total_schools: number;
   * }>} Promise resolving to an object with student, teacher, and institute statistics.
   */
  program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }>;

  /**
   * Retrieve the list of managers and coordinators associated with the current user,
   * with support for pagination, search, and sorting.
   *
   * @param page - The page number for pagination (default: 1).
   * @param search - Search term to filter by user name (default: "").
   * @param limit - Number of users per page (default: 10).
   * @param sortBy - Field to sort by (default: "name").
   * @param sortOrder - Sort order: "asc" or "desc" (default: "asc").
   *
   * @returns Promise resolving to an object containing:
   *   - data: Array of user objects with their highest role and all assigned roles.
   *   - totalCount: Total number of matching users.
   */
  getManagersAndCoordinators(
    page?: number,
    search?: string,
    limit?: number,
    sortBy?: keyof TableTypes<"user">,
    sortOrder?: "asc" | "desc"
  ): Promise<{
    data: { user: TableTypes<"user">; role: string }[];
    totalCount: number;
  }>;

  /**
   * Count total and active students, total and active teachers, and average time spent for a given school.
   *
   * @param {string} schoolId - The ID of the school.
   * @returns {Promise<{
   *   active_students: number;
   *   avg_time_spent: number;
   *   active_teachers: number;
   * }>} Promise resolving to an object with student and teacher statistics.
   */
  school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }>;

  /**
   * Checks if the current user is a program manager.
   * @returns {Promise<boolean>} A promise that resolves to true if the user is a program manager, false otherwise.
   */
  isProgramManager(): Promise<boolean>;

  /**
   * Checks if the current user is a role.
   * @returns {Promise<string | undefined>} If any special role is there it will return role otherwise it will return undefined.
   */
  getUserSpecialRoles(userId: string): Promise<string[]>;

  /**
   * Updates the role of a special user in special users table.
   * @param {string} userId - user Id.
   * @param {number} role - user Role.
   */
  updateSpecialUserRole(userId: string, role: string): Promise<void>;
  /**
   * Delete the user from special_users table.
   * @param {string} userId - user Id.
   */
  deleteSpecialUser(userId: string): Promise<void>;

  /**
   * Updates the role of a special user in program users table.
   * @param {string} userId - user Id.
   * @param {number} role - user Role.
   */
  updateProgramUserRole(userId: string, role: string): Promise<void>;

  /**
   * Delete the user from program_user table.
   * @param {string} userId - user Id.
   */
  deleteProgramUser(userId: string): Promise<void>;

  /**
   * Delete the user from school_user table by role.
   * @param {string} userId - user Id.
   * @param {RoleType} role - user Role.
   */
  deleteUserFromSchoolsWithRole(userId: string, role: RoleType): Promise<void>;

  /**
   * Fetch student login type and program model by UDISE code.
   * @param {string} udiseCode - UDISE code of the school.
   * @returns {Promise<{ studentLoginType: schoolModel: string } | null>}
   */
  getSchoolDetailsByUdise(
    udiseCode: string
  ): Promise<{ studentLoginType: string; schoolModel: string } | null>;

  /**
   * Fetch SchoolData by UDISE code.
   * @param {string} udiseCode - UDISE code of the school.
   * @returns SchoolData row
   */
  getSchoolDataByUdise(
    udiseCode: string
  ): Promise<TableTypes<"school_data"> | null>;
  /**
   * Fetches chapters by chapterIDs array.
   * @param {string[]} chapterIds - Array of chapter IDs to fetch.
   * @returns {Promise<TableTypes<"chapter">[]>} - A promise that resolves to an array of chapter objects.
   */
  getChaptersByIds(chapterIds: string[]): Promise<TableTypes<"chapter">[]>;
  /**
   * Adds Parent to new class (new classUser record).
   * @param {string} classID
   * @param {string} studentID
   */
  addParentToNewClass(classID: string, studentID: string): Promise<void>;

  /**
   * Fetches operational requests with pagination, sorting, and optional filters.
   *
   * @param {EnumType<"ops_request_status">} requestStatus - Status of the requests(e.g., PENDING, APPROVED, REJECTED).
   * @param {number} page - Current page number for pagination (1-based).
   * @param {number} limit - Number of records per page.
   * @param {string} orderBy - Field to sort by. Supports "created_at", "updated_at", or "school_name" (school_name is handled in-memory).
   * @param {"asc" | "desc"} orderDir - Sorting direction (ascending or descending).
   * @param {{ request_type?: string[]; school?: string[] }} [filters] - Optional filters by request type(s) and/or school name(s).
   * @param {string} [searchTerm] - Optional search keyword to filter results by request ID.
   *
   * @returns {Promise<{ data: any[]; total: number }>} - Paginated list of requests and total count.
   */
  getOpsRequests(
    requestStatus: EnumType<"ops_request_status">,
    page: number,
    limit: number,
    orderBy: string,
    orderDir: "asc" | "desc",
    filters?: { request_type?: string[]; school?: string[] },
    searchTerm?: string
  );

  /**
   * Retrieves available filter options for operational requests.
   * Typically used for populating dropdowns or filters in UI.
   * @returns {Promise<any>} - Returns a promise resolving to the available filter options.
   */
  getRequestFilterOptions();

  /**
   * Search teachers in a school by name, email, or phone (paginated)
   */
  searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page?: number,
    limit?: number
  ): Promise<{ data: any[]; total: number }>;

  /**
   * Search students by name, student_id, or phone number in a school, paginated.
   * @param schoolId School ID
   * @param searchTerm Search string
   * @param page Page number
   * @param limit Page size
   */
  searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page?: number,
    limit?: number
  ): Promise<StudentAPIResponse>;

  approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string
  ): Promise<TableTypes<"ops_requests"> | undefined>;

  /**
   * update the ops_request to approved or rejected .
   * @param requestId unique id of ops_request table
   * @param respondedBy user who responded or reviewed
   * @param status "approved" | "rejected"
   * @param rejectedReasonType type/category of rejection (for teacher/principal requests)
   * @param rejectedReasonDescription detailed reason for rejection
   */
  respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string
  ): Promise<TableTypes<"ops_requests"> | undefined>;

  /**
   * fetch all field coordintaors connected to the program.
   * @param programId program ID
   */
  getFieldCoordinatorsByProgram(
    programId: string
  ): Promise<{ data: TableTypes<"user">[] }>;

  /**
   * fetch all the programs for the ops_director and super admin.
   * for program manager it will fetch only their programs.
   */
  getProgramsByRole(): Promise<{ data: TableTypes<"program">[] }>;

  /**
   * Update school status to rejected or active .
   * Update address and key contacts if provided.
   * @param schoolId School ID
   * @param schoolStatus status of school
   * @param address address of school
   * @param keyContacts provide contact details of key contacts
   */
  updateSchoolStatus(
    schoolId: string,
    schoolStatus: (typeof STATUS)[keyof typeof STATUS],
    address?: {
      state?: string;
      district?: string;
      city?: string;
      address?: string;
    },
    keyContacts?: any
  ): Promise<void>;

  /**
   * Fetches a list of geographic locations (countries, states, districts, etc.).
   * The returned data is dependent on the parameters provided, allowing for a cascading fetch.
   * @param params An object containing the optional filter criteria.
   * @returns A promise that resolves to an array of location names (strings).
   */
  getGeoData(params: GeoDataParams): Promise<string[]>;

  /**
   * Fetches a list of schools based on  locations (countries, states, districts, etc.).
   * The returned data is dependent on the parameters provided, allowing for a cascading fetch.
   * @param params An object containing the optional filter criteria.
   * @returns A promise that resolves to an array of schools list (strings).
   * */
  searchSchools(params: SearchSchoolsParams): Promise<SearchSchoolsResult>;
  /**
   * Creates a request to join a school as principle or teacher
   * @param {string} schoolId - school Id
   * @param {string} requestType - type of request (PRINCIPAL or TEACHER)
   * @param {string} classId - class Id
   */
  sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string
  ): Promise<void>;
  /**
   * Get all classes connected to school using rpc call
   * @param {string} schoolId - school Id
   */
  getAllClassesBySchoolId(schoolId: string): Promise<TableTypes<"class">[]>;
  /**
   * Fetch reward by rewardId
   * @param rewardId reward ID
   */
  getRewardById(
    rewardId: string
  ): Promise<TableTypes<"rive_reward"> | undefined>;
  /**
   * Fetch all rive_rewards
   */
  getAllRewards(): Promise<TableTypes<"rive_reward">[] | []>;
  /**
   * update user reward by userId and rewardId
   */
  updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string
  ): Promise<void>;
  /**
   * Fetch active students count information for a given class ID.
   * @param {string} classID - The ID of the school to fetch.
   * @returns Promise resolving to an object with student count.
   */
  getActiveStudentsCountByClass(classId: string): Promise<string>;

  /**
   * Fetch active students count information for a given class ID.
   * @param {string} studentId - The ID of the student to fetch.
   * @param {string []} subjectIds - The ID of the subjects to fetch.
   * @returns Promise resolving to an object with completed assignment count and subject id's.
   */
  getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[]
  ): Promise<{ subject_id: string; completed_count: number }[]>;
  /**
   * Get or create a user and link them to a school (and optionally a class).
   */
  getOrcreateschooluser(
    params: UserSchoolClassParams
  ): Promise<UserSchoolClassResult>;

  /**
   * Update school model to at_school or at_home.
   * Update location link and key contacts if provided.
   * @param schoolId School ID
   * @param schoolMode mode of school
   * @param locationLink url link of school location
   * @param keyContacts provide contact details of key contacts
   */
  insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any
  ): Promise<void>;

  /**
   * Add a student with parent validation and class linking
   *
   * @param params - Object containing student details
   * @param params.phone - Parent phone number (10 digits)
   * @param params.name - Student name
   * @param params.gender - Student gender
   * @param params.age - Student age
   * @param params.classId - Class ID to add the student to
   * @param params.schoolId - School ID to fetch language from
   * @param params.parentName - Parent name (optional)
   * @param params.email - Parent email (optional)
   * @returns Object with success status and message
   */
  addStudentWithParentValidation(params: {
    phone: string;
    name: string;
    gender: string;
    age: string;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?: string;
  }): Promise<{ success: boolean; message: string; data?: any }>;
  /**
   * Update class courses belongs to that curriculum and grade
   * @param {string } classId - class id
   * @param {string } selectedCourseIds - array of courseIds
   */
  updateClassCourses(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> ;
}
