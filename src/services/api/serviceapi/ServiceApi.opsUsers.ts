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
import type {
  OpsRequestsResponse,
  RequestFilterOptions,
} from './ServiceApi.types';

export interface ServiceApiOpsUsers {
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

  getTeacherInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number,
    classIds?: string[],
  ): Promise<TeacherAPIResponse>;

  getStudentInfoBySchoolId(
    schoolId: string,
    page: number,
    limit: number,
    classId?: string,
    classIds?: string[],
  ): Promise<StudentAPIResponse>;

  getStudentsAndParentsByClassId(
    classId: string,
    page: number,
    limit: number,
  ): Promise<StudentAPIResponse>;

  getStudentAndParentByStudentId(
    studentId: string,
  ): Promise<{ user: any; parents: any[] }>;

  getParentsByStudentId(
    studentId: string,
    options?: {
      studentIds?: string[];
      activeOnly?: boolean;
    },
  ): Promise<TableTypes<'user'>[]>;

  mergeStudentRequest(
    existingStudentId: string,
    newStudentId: string,
    requestId?: string | undefined,
    respondedBy?: string | undefined,
  ): Promise<{ success: boolean; message: string }>;

  updateFcUserFormsContactUserId(
    oldStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }>;

  mergeUserPathway(
    existingStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }>;

  getParentWhatsappClassesBySchoolId?: (schoolIds: string[]) => Promise<
    {
      id: string;
      name: string;
      group_id?: string | null;
      whatsapp_invite_link?: string | null;
    }[]
  >;

  getParentWhatsappParentPhonesByClassId?: (
    classId: string,
  ) => Promise<string[]>;

  isProgramUser(): Promise<boolean>;

  program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }>;

  getManagersAndCoordinators(
    page?: number,
    search?: string,
    limit?: number,
    sortBy?: keyof TableTypes<'user'>,
    sortOrder?: 'asc' | 'desc',
  ): Promise<{
    data: { user: TableTypes<'user'>; role: string }[];
    totalCount: number;
  }>;

  school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }>;

  isProgramManager(): Promise<boolean>;

  getUserSpecialRoles(userId: string): Promise<string[]>;

  updateSpecialUserRole(userId: string, role: string): Promise<void>;

  deleteSpecialUser(userId: string): Promise<void>;

  updateProgramUserRole(userId: string, role: string): Promise<void>;

  deleteProgramUser(userId: string): Promise<void>;

  deleteUserFromSchoolsWithRole(userId: string, role: RoleType): Promise<void>;

  getSchoolDetailsByUdise(udiseCode: string): Promise<{
    schoolId?: string;
    studentLoginType: string;
    schoolModel: string;
    whatsappBotNumber?: string;
  } | null>;

  getSchoolDataByUdise(
    udiseCode: string,
  ): Promise<TableTypes<'school_data'> | null>;

  getChaptersByIds(chapterIds: string[]): Promise<TableTypes<'chapter'>[]>;

  getOpsRequests(
    requestStatus: EnumType<'ops_request_status'>,
    page: number,
    limit: number,
    orderBy: string,
    orderDir: 'asc' | 'desc',
    filters?: { request_type?: string[]; school?: string[] },
    searchTerm?: string,
  ): Promise<OpsRequestsResponse>;

  getRequestFilterOptions(): Promise<RequestFilterOptions | null>;

  searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page?: number,
    limit?: number,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }>;

  searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page?: number,
    limit?: number,
    classId?: string,
    classIds?: string[],
  ): Promise<StudentAPIResponse>;

  approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined>;

  respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined>;

  getFieldCoordinatorsByProgram(
    programId: string,
  ): Promise<{ data: TableTypes<'user'>[] }>;

  getProgramsByRole(): Promise<{ data: TableTypes<'program'>[] }>;

  updateSchoolStatus(
    schoolId: string,
    schoolStatus: (typeof STATUS)[keyof typeof STATUS],
    address?: {
      state?: string;
      district?: string;
      block?: string;
      address?: string;
    },
    keyContacts?: any,
  ): Promise<void>;

  getGeoData(params: GeoDataParams): Promise<string[]>;

  getClientCountryCode(): Promise<string | null>;

  getLocaleByIdOrCode(
    locale_id?: string,
    locale_code?: string,
  ): Promise<TableTypes<'locale'> | null>;

  searchSchools(params: SearchSchoolsParams): Promise<SearchSchoolsResult>;

  sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string,
  ): Promise<void>;

  getAllClassesBySchoolId(schoolId: string): Promise<TableTypes<'class'>[]>;
}
