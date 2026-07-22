import { ApiHandlerUserSettings } from './ApiHandler.settings';
import {
  TableTypes,
  SchoolVisitAction,
  SchoolVisitType,
  EnumType,
} from '../../../common/constants';

export class ApiHandlerSchoolManagement extends ApiHandlerUserSettings {
  async createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string,
    group4: string | null,
    status: EnumType<'status'> | null,
    image: File | null,
    program_id: string | null,
    udise: string | null,
    address: string | null,
    country: string | null,
    onlySchool?: boolean,
    onlySchoolUser?: boolean,
  ): Promise<TableTypes<'school'>> {
    return await this.s.createSchool(
      name,
      group1,
      group2,
      group3,
      group4,
      status,
      image,
      program_id,
      udise,
      address,
      country,
      onlySchool,
      onlySchoolUser,
    );
  }

  async updateSchoolProfile(
    school: TableTypes<'school'>,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4?: string | null,
    program_id?: string | null,
    udise?: string | null,
    address?: string | null,
  ): Promise<TableTypes<'school'>> {
    return await this.s.updateSchoolProfile(
      school,
      name,
      group1,
      group2,
      group3,
      image,
      group4 ?? null,
      program_id ?? null,
      udise ?? null,
      address ?? null,
    );
  }

  async updateSchoolLocation(
    schoolId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    return await this.s.updateSchoolLocation(schoolId, lat, lng);
  }

  async recordSchoolVisit(
    schoolId: string,
    lat: number,
    lng: number,
    action: SchoolVisitAction,
    visitType?: SchoolVisitType,
    distanceFromSchool?: number,
    numberOfParents?: number,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    return this.s.recordSchoolVisit(
      schoolId,
      lat,
      lng,
      action,
      visitType,
      distanceFromSchool,
      numberOfParents,
    );
  }

  async getLastSchoolVisit(
    schoolId: string,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    return await this.s.getLastSchoolVisit(schoolId);
  }

  async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string,
  ): Promise<TableTypes<'req_new_school'> | null> {
    return await this.s.requestNewSchool(
      name,
      state,
      district,
      city,
      image,
      udise_id,
    );
  }

  async deleteApprovedOpsRequestsForUser(
    requested_by: string,
    schoolId?: string,
    classId?: string,
  ): Promise<void> {
    return await this.s.deleteApprovedOpsRequestsForUser(
      requested_by,
      schoolId,
      classId,
    );
  }

  async getExistingSchoolRequest(
    requested_by: string,
  ): Promise<TableTypes<'ops_requests'> | null> {
    return await this.s.getExistingSchoolRequest(requested_by);
  }

  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    return this.s.updateClassCourseSelection(classId, selectedCourseIds);
  }

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    return this.s.updateSchoolCourseSelection(schoolId, selectedCourseIds);
  }

  async getCoursesByClassId(
    classid: string,
  ): Promise<TableTypes<'class_course'>[]> {
    return await this.s.getCoursesByClassId(classid);
  }

  async getCoursesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'school_course'>[]> {
    return await this.s.getCoursesBySchoolId(schoolId);
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    return await this.s.removeCoursesFromClass(ids);
  }

  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    return await this.s.removeCoursesFromSchool(ids);
  }

  async checkCourseInClasses(
    classIds: string[],
    courseId: string,
  ): Promise<boolean> {
    return await this.s.checkCourseInClasses(classIds, courseId);
  }

  async deleteUserFromClass(
    userId: string,
    class_id: string,
  ): Promise<Boolean | void> {
    return await this.s.deleteUserFromClass(userId, class_id);
  }

  async getSchoolById(id: string): Promise<TableTypes<'school'> | undefined> {
    return await this.s.getSchoolById(id);
  }

  async getParentWhatsappSchoolByUdise(udiseCode: string): Promise<{
    id: string;
    name: string;
    whatsapp_bot_number?: string | null;
  } | null> {
    if (!this.s.getParentWhatsappSchoolByUdise) {
      throw new Error(
        'Parent WhatsApp school lookup is not implemented in current API service.',
      );
    }
    return await this.s.getParentWhatsappSchoolByUdise(udiseCode);
  }
}
