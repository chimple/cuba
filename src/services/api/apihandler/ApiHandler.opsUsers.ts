import { ApiHandlerCampaigns } from './ApiHandler.campaigns';
import {
  TableTypes,
  EnumType,
  RequestTypes,
  STATUS,
  StudentAPIResponse,
  TeacherAPIResponse,
  GeoDataParams,
  SearchSchoolsParams,
  SearchSchoolsResult,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';

export class ApiHandlerOpsUsers extends ApiHandlerCampaigns {
  async createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }> {
    return await this.s.createOrAddUserOps(payload);
  }

  async getTeacherInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number,
    // Optional class scope lets program tabs fetch only visible teacher rows.
    classIds?: string[],
  ): Promise<TeacherAPIResponse> {
    return await this.s.getTeacherInfoBySchoolId(
      schoolId,
      page,
      limit,
      classIds,
    );
  }

  async getStudentInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number,
    classId?: string,
    // Optional class scope lets program tabs fetch only visible student rows.
    classIds?: string[],
  ): Promise<StudentAPIResponse> {
    return await this.s.getStudentInfoBySchoolId(
      schoolId,
      page,
      limit,
      classId,
      classIds,
    );
  }

  async getStudentsAndParentsByClassId(
    classId: string,
    page: number,
    limit: number,
  ): Promise<StudentAPIResponse> {
    return await this.s.getStudentsAndParentsByClassId(classId, page, limit);
  }

  async getStudentAndParentByStudentId(
    studentId: string,
  ): Promise<{ user: any; parents: any[] }> {
    return await this.s.getStudentAndParentByStudentId(studentId);
  }

  async getParentsByStudentId(
    studentId: string,
    options?: {
      studentIds?: string[];
      activeOnly?: boolean;
    },
  ): Promise<TableTypes<'user'>[]> {
    return await this.s.getParentsByStudentId(studentId, options);
  }

  async mergeStudentRequest(
    existingStudentId: string,
    newStudentId: string,
    requestId?: string | undefined,
    respondedBy?: string | undefined,
  ): Promise<{ success: boolean; message: string }> {
    return await this.s.mergeStudentRequest(
      existingStudentId,
      newStudentId,
      requestId,
      respondedBy,
    );
  }

  async updateFcUserFormsContactUserId(
    oldStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return await this.s.updateFcUserFormsContactUserId(
      oldStudentId,
      newStudentId,
    );
  }

  async mergeUserPathway(
    existingStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return await this.s.mergeUserPathway(existingStudentId, newStudentId);
  }

  async getParentWhatsappClassesBySchoolId(schoolIds: string[]): Promise<
    {
      id: string;
      name: string;
      group_id?: string | null;
      whatsapp_invite_link?: string | null;
    }[]
  > {
    if (!this.s.getParentWhatsappClassesBySchoolId) {
      throw new Error(
        'Parent WhatsApp class lookup is not implemented in current API service.',
      );
    }
    return await this.s.getParentWhatsappClassesBySchoolId(schoolIds);
  }

  async getParentWhatsappParentPhonesByClassId(
    classId: string,
  ): Promise<string[]> {
    if (!this.s.getParentWhatsappParentPhonesByClassId) {
      throw new Error(
        'Parent WhatsApp parent phone lookup is not implemented in current API service.',
      );
    }
    return await this.s.getParentWhatsappParentPhonesByClassId(classId);
  }

  async isProgramUser(): Promise<boolean> {
    return await this.s.isProgramUser();
  }

  async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this.s.program_activity_stats(programId);
  }

  async getManagersAndCoordinators(
    page: number = 1,
    search: string = '',
    limit: number = 10,
    sortBy: keyof TableTypes<'user'> = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    data: { user: TableTypes<'user'>; role: string }[];
    totalCount: number;
  }> {
    return await this.s.getManagersAndCoordinators(
      page,
      search,
      limit,
      sortBy,
      sortOrder,
    );
  }

  async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this.s.school_activity_stats(schoolId);
  }

  async isProgramManager(): Promise<boolean> {
    return await this.s.isProgramManager();
  }

  async getUserSpecialRoles(userId: string): Promise<string[]> {
    return await this.s.getUserSpecialRoles(userId);
  }

  async updateSpecialUserRole(userId: string, role: string): Promise<void> {
    return await this.s.updateSpecialUserRole(userId, role);
  }

  async deleteSpecialUser(userId: string): Promise<void> {
    return await this.s.deleteSpecialUser(userId);
  }

  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    return await this.s.updateProgramUserRole(userId, role);
  }

  async deleteProgramUser(userId: string): Promise<void> {
    return await this.s.deleteProgramUser(userId);
  }

  async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType,
  ): Promise<void> {
    return await this.s.deleteUserFromSchoolsWithRole(userId, role);
  }

  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    schoolId?: string;
    studentLoginType: string;
    schoolModel: string;
    whatsappBotNumber?: string;
  } | null> {
    return this.s.getSchoolDetailsByUdise(udiseCode);
  }

  async getSchoolDataByUdise(
    udiseCode: string,
  ): Promise<TableTypes<'school_data'> | null> {
    return this.s.getSchoolDataByUdise(udiseCode);
  }

  async getChaptersByIds(chapterIds: string[]) {
    return await this.s.getChaptersByIds(chapterIds);
  }

  async getOpsRequests(
    requestStatus: EnumType<'ops_request_status'>,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at',
    orderDir: 'asc' | 'desc' = 'asc',
    filters?: { request_type?: string[]; school?: string[] },
    searchTerm?: string,
  ) {
    return this.s.getOpsRequests(
      requestStatus,
      page,
      limit,
      orderBy,
      orderDir,
      filters,
      searchTerm,
    );
  }

  async getRequestFilterOptions() {
    return this.s.getRequestFilterOptions();
  }

  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
    // Optional class scope keeps teacher search constrained to program classes.
    classIds?: string[],
  ): Promise<TeacherAPIResponse> {
    return await this.s.searchTeachersInSchool(
      schoolId,
      searchTerm,
      page,
      limit,
      classIds,
    );
  }

  async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
    classId?: string,
    // Optional class scope keeps student search constrained to program classes.
    classIds?: string[],
  ): Promise<StudentAPIResponse> {
    return await this.s.searchStudentsInSchool(
      schoolId,
      searchTerm,
      page,
      limit,
      classId,
      classIds,
    );
  }

  async approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    return await this.s.approveOpsRequest(
      requestId,
      respondedBy,
      role,
      schoolId,
      classId,
    );
  }

  async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    return await this.s.respondToSchoolRequest(
      requestId,
      respondedBy,
      status,
      rejectedReasonType,
      rejectedReasonDescription,
    );
  }

  async getFieldCoordinatorsByProgram(
    programId: string,
  ): Promise<{ data: TableTypes<'user'>[] }> {
    return this.s.getFieldCoordinatorsByProgram(programId);
  }

  async getProgramsByRole(): Promise<{ data: TableTypes<'program'>[] }> {
    return this.s.getProgramsByRole();
  }

  async updateSchoolStatus(
    schoolId: string,
    schoolStatus: (typeof STATUS)[keyof typeof STATUS],
    address?: {
      state?: string;
      district?: string;
      block?: string;
      address?: string;
    },
    keyContacts?: any,
  ): Promise<void> {
    return await this.s.updateSchoolStatus(
      schoolId,
      schoolStatus,
      address,
      keyContacts,
    );
  }

  async getGeoData(params: GeoDataParams): Promise<string[]> {
    return await this.s.getGeoData(params);
  }

  async getClientCountryCode(): Promise<any> {
    return await this.s.getClientCountryCode();
  }

  async getLocaleByIdOrCode(
    locale_id?: string,
    locale_code?: string,
  ): Promise<TableTypes<'locale'> | null> {
    return await this.s.getLocaleByIdOrCode(locale_id, locale_code);
  }

  async searchSchools(
    params: SearchSchoolsParams,
  ): Promise<SearchSchoolsResult> {
    return await this.s.searchSchools(params);
  }

  async sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string,
  ): Promise<void> {
    return this.s.sendJoinSchoolRequest(schoolId, requestType, classId);
  }

  async getAllClassesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'class'>[]> {
    return this.s.getAllClassesBySchoolId(schoolId);
  }
}
