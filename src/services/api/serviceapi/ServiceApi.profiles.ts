import { TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';

export interface ServiceApiUserProfiles {
  createAtSchoolUser(
    id: string,
    schoolName: string,
    udise: string,
    role: RoleType,
    isEmailVerified: boolean,
  ): Promise<void>;

  createProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>>;

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
    studentId: string,
    tcVersion: number,
  ): Promise<TableTypes<'user'>>;

  updateStudent(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string,
  ): Promise<TableTypes<'user'>>;

  updateStudentFromSchoolMode(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
    student_id: string,
    newClassId: string,
    phoneNumber?: string,
  ): Promise<TableTypes<'user'>>;

  updateUserProfile(
    user: TableTypes<'user'>,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined,
    options?: {
      age?: string;
      gender?: string;
    },
  ): Promise<TableTypes<'user'>>;

  getUserByDocId(studentId: string): Promise<TableTypes<'user'> | undefined>;

  createUserDoc(
    user: TableTypes<'user'>,
  ): Promise<TableTypes<'user'> | undefined>;

  createAutoProfile(
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>>;

  getParentStudentProfiles(): Promise<TableTypes<'user'>[]>;

  deleteProfile(studentId: string): Promise<void>;

  deleteAllUserData(): Promise<void>;
}
