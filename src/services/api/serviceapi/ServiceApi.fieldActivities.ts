import { TableTypes, EnumType } from '../../../common/constants';
import {
  PaginatedResponse,
  CreateSchoolNoteInput,
  SchoolNote,
} from '../../../interface/modelInterfaces';
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from '../../../ops-console/pages/NewUserPageOps';
import { FCSchoolStats } from '../../../ops-console/pages/SchoolDetailsPage';
import type {
  FcUserFormSaveResult,
  ActivitiesFilterOptions,
} from './ServiceApi.types';

export interface ServiceApiFieldActivities {
  getActiveStudentsCountByClass(classId: string): Promise<string>;

  getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[],
  ): Promise<{ subject_id: string; completed_count: number }[]>;

  getOrcreateschooluser(
    params: UserSchoolClassParams,
  ): Promise<UserSchoolClassResult>;

  insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any,
  ): Promise<void>;

  addStudentWithParentValidation(params: {
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
  }): Promise<{ success: boolean; message: string; data?: any }>;

  updateClassCourses(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void>;

  getFilteredFcQuestions(
    type: EnumType<'fc_support_level'> | null,
    targetType: EnumType<'fc_engagement_target'>,
  ): Promise<TableTypes<'fc_question'>[] | []>;

  saveFcUserForm(payload: {
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
  }): Promise<FcUserFormSaveResult>;

  getTodayVisitId(userId: string, schoolId: string): Promise<string | null>;

  getActivitiesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'fc_user_forms'>[]>;

  getSchoolVisitById(
    visitIds: string[],
  ): Promise<TableTypes<'fc_school_visit'>[]>;

  getActivitiesFilterOptions(): Promise<ActivitiesFilterOptions | null>;

  getRecentAssignmentCountByTeacher(
    teacherId: string,
    classId: string,
  ): Promise<number | null>;

  createNoteForSchool(params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  }): Promise<CreateSchoolNoteInput>;

  uploadSchoolVisitMediaFile(params: {
    schoolId: string;
    file: File;
  }): Promise<string>;

  getNotesBySchoolId(
    schoolId: string,
    limit?: number,
    offset?: number,
    sortBy?: 'createdAt' | 'createdBy',
  ): Promise<PaginatedResponse<SchoolNote>>;

  getSchoolStatsForSchool(schoolId: string): Promise<FCSchoolStats>;
}
