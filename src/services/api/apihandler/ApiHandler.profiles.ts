import type { ServiceApi } from '../ServiceApi';
import { TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';

export interface ApiHandlerUserProfiles {
  [key: string]: any;
}
export class ApiHandlerUserProfiles {
  protected s: ServiceApi;

  protected constructor(service: ServiceApi) {
    this.s = service;
    logger.info('ApiHandler constructor called with service:', service);
  }

  createAtSchoolUser(
    id: string,
    schoolName: string,
    udise: string,
    role: RoleType,
    isEmailVerified: boolean,
  ) {
    return this.s.createAtSchoolUser(
      id,
      schoolName,
      udise,
      role,
      isEmailVerified,
    );
  }

  async createProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    return await this.s.createProfile(
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId,
      tcVersion,
    );
  }

  async createStudentProfile(
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
  ): Promise<TableTypes<'user'>> {
    return await this.s.createStudentProfile(
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId,
      classId,
      role,
      studentId,
      tcVersion,
    );
  }

  async updateStudent(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string,
  ): Promise<TableTypes<'user'>> {
    return await this.s.updateStudent(
      student,
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId,
    );
  }

  async updateStudentFromSchoolMode(
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
  ): Promise<TableTypes<'user'>> {
    return await this.s.updateStudentFromSchoolMode(
      student,
      name,
      age,
      gender,
      avatar,
      image,
      boardDocId,
      gradeDocId,
      languageDocId,
      student_id,
      newClassId,
      phoneNumber,
    );
  }

  async updateUserProfile(
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
  ): Promise<TableTypes<'user'>> {
    return await this.s.updateUserProfile(
      user,
      fullName,
      email,
      phoneNum,
      languageDocId,
      profilePic,
      options,
    );
  }

  async getUserByDocId(
    studentId: string,
  ): Promise<TableTypes<'user'> | undefined> {
    return await this.s.getUserByDocId(studentId);
  }

  createUserDoc(
    user: TableTypes<'user'>,
  ): Promise<TableTypes<'user'> | undefined> {
    return this.s.createUserDoc(user);
  }

  async createAutoProfile(
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    return await this.s.createAutoProfile(languageDocId, tcVersion);
  }

  async getParentStudentProfiles(): Promise<TableTypes<'user'>[]> {
    return await this.s.getParentStudentProfiles();
  }

  async deleteProfile(studentId: string) {
    return await this.s.deleteProfile(studentId);
  }

  async deleteAllUserData(): Promise<void> {
    return await this.s.deleteAllUserData();
  }
}
