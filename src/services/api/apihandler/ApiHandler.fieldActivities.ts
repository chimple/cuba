import { ApiHandlerOpsUsers } from './ApiHandler.opsUsers';
import { TableTypes, EnumType } from '../../../common/constants';
import {
  PaginatedResponse,
  SchoolNote,
} from '../../../interface/modelInterfaces';
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from '../../../ops-console/pages/NewUserPageOps';
import { FCSchoolStats } from '../../../ops-console/pages/SchoolDetailsPage';

export class ApiHandlerFieldActivities extends ApiHandlerOpsUsers {
  async getActiveStudentsCountByClass(classId: string): Promise<string> {
    return this.s.getActiveStudentsCountByClass(classId);
  }

  async getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[],
  ): Promise<{ subject_id: string; completed_count: number }[]> {
    return this.s.getCompletedAssignmentsCountForSubjects(
      studentId,
      subjectIds,
    );
  }

  async getOrcreateschooluser(
    params: UserSchoolClassParams,
  ): Promise<UserSchoolClassResult> {
    return await this.s.getOrcreateschooluser(params);
  }

  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any,
  ): Promise<void> {
    return this.s.insertSchoolDetails(
      schoolId,
      schoolModel,
      locationLink,
      keyContacts,
    );
  }

  async addStudentWithParentValidation(params: {
    phone?: string;
    name: string;
    gender: string;
    age: string;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?: string;
    studentID?: string;
    atSchool?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return this.s.addStudentWithParentValidation(params);
  }

  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    return this.s.updateClassCourses(classId, selectedCourseIds);
  }

  async getFilteredFcQuestions(
    type: EnumType<'fc_support_level'> | null,
    targetType: EnumType<'fc_engagement_target'>,
  ): Promise<TableTypes<'fc_question'>[] | []> {
    return this.s.getFilteredFcQuestions(type, targetType);
  }

  async saveFcUserForm(payload: {
    visitId?: string | null;
    userId: string;
    schoolId: string;
    classId?: string | null;
    contactUserId?: string | null;
    contactTarget: EnumType<'fc_engagement_target'>;
    contactMethod: EnumType<'fc_contact_method'>;
    callStatus?: EnumType<'fc_call_result'> | null;
    supportLevel?: EnumType<'fc_support_level'> | null;
    questionResponse: Record<string, string>;
    techIssuesReported: boolean;
    comment?: string | null;
    techIssueComment?: string | null;
    mediaLinks?: string[] | null;
  }) {
    return this.s.saveFcUserForm(payload);
  }

  async getTodayVisitId(
    userId: string,
    schoolId: string,
  ): Promise<string | null> {
    return this.s.getTodayVisitId(userId, schoolId);
  }

  async getActivitiesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'fc_user_forms'>[]> {
    return await this.s.getActivitiesBySchoolId(schoolId);
  }

  async getSchoolVisitById(
    visitIds: string[],
  ): Promise<TableTypes<'fc_school_visit'>[]> {
    return await this.s.getSchoolVisitById(visitIds);
  }

  async getActivitiesFilterOptions() {
    return this.s.getActivitiesFilterOptions();
  }

  async getRecentAssignmentCountByTeacher(
    teacherId: string,
    classId: string,
  ): Promise<number | null> {
    return await this.s.getRecentAssignmentCountByTeacher(teacherId, classId);
  }

  async createNoteForSchool(params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  }): Promise<any> {
    return this.s.createNoteForSchool(params);
  }

  async uploadSchoolVisitMediaFile(params: {
    schoolId: string;
    file: File;
  }): Promise<string> {
    return await this.s.uploadSchoolVisitMediaFile(params);
  }

  async getNotesBySchoolId(
    schoolId: string,
    limit?: number,
    offset?: number,
    sortBy?: 'createdAt' | 'createdBy',
  ): Promise<PaginatedResponse<SchoolNote>> {
    return this.s.getNotesBySchoolId(schoolId, limit, offset, sortBy);
  }

  async getSchoolStatsForSchool(
    schoolId: string,
    currentUser: TableTypes<'user'> | null = null,
  ): Promise<FCSchoolStats> {
    return await this.s.getSchoolStatsForSchool(schoolId);
  }
}
