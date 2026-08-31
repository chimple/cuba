import { EnumType, TableTypes } from '../../../common/constants';
import {
  PaginatedResponse,
  SchoolNote,
} from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SqliteApiProgramClassManagement } from './SqliteApi.program.classManagement';
import { FCSchoolStats } from '../../../ops-console/pages/SchoolDetailsPage';
import type {
  TeacherAssignmentCountMap,
  TeacherAssignmentCountPair,
} from '../serviceapi/ServiceApi.fieldActivities';

export class SqliteApiProgramFieldCoordinator extends SqliteApiProgramClassManagement {
  [key: string]: any;
  public async getFilteredFcQuestions(
    type: EnumType<'fc_support_level'> | null,
    targetType: EnumType<'fc_engagement_target'>,
  ): Promise<TableTypes<'fc_question'>[] | []> {
    throw new Error('Method not implemented.');
  }

  public async saveFcUserForm(payload: {
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
  }): Promise<{
    data: TableTypes<'fc_user_forms'> | null;
    error: object | null;
  }> {
    throw new Error('Method not implemented.');
  }

  public async getTodayVisitId(
    userId: string,
    schoolId: string,
  ): Promise<string | null> {
    throw new Error('Method not implemented.');
  }

  public async getActivitiesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'fc_user_forms'>[]> {
    return this._serverApi.getActivitiesBySchoolId(schoolId);
  }

  public async getSchoolVisitById(
    visitIds: string[],
  ): Promise<TableTypes<'fc_school_visit'>[]> {
    return this._serverApi.getSchoolVisitById(visitIds);
  }

  async getActivitiesFilterOptions(): Promise<{
    contactType: Array<string | null>;
    performance: Array<string | null>;
    visitType?: Array<string | null>;
  } | null> {
    throw new Error('Method not implemented.');
  }

  async createNoteForSchool(params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  }): Promise<any> {
    logger.warn('createNoteForSchool is not supported in SQLite mode');
    return this._serverApi.createNoteForSchool(params);
  }

  async getNotesBySchoolId(
    schoolId: string,
    limit?: number,
    offset?: number,
    sortBy?: 'createdAt' | 'createdBy',
  ): Promise<PaginatedResponse<SchoolNote>> {
    logger.warn('getNotesBySchoolId is not supported in SQLite mode');

    return this._serverApi.getNotesBySchoolId(schoolId, limit, offset, sortBy);
  }

  async getRecentAssignmentCountsByTeachers(
    pairs: TeacherAssignmentCountPair[],
  ): Promise<TeacherAssignmentCountMap> {
    logger.warn(
      'getRecentAssignmentCountsByTeachers is not supported in SQLite mode',
    );
    return this._serverApi.getRecentAssignmentCountsByTeachers(pairs);
  }

  async getActiveTeachersCountForProgram7d(
    programId: string,
    schoolIds?: string[],
    gradeIds?: string[],
  ): Promise<number | null> {
    logger.warn(
      'getActiveTeachersCountForProgram7d is not supported in SQLite mode',
    );
    return this._serverApi.getActiveTeachersCountForProgram7d(
      programId,
      schoolIds,
      gradeIds,
    );
  }

  public async getSchoolStatsForSchool(
    schoolId: string,
  ): Promise<FCSchoolStats> {
    return this._serverApi.getSchoolStatsForSchool(schoolId);
  }

  async getParentsReachedBySchoolIds(
    schoolIds: string[],
  ): Promise<Record<string, number>> {
    return await this._serverApi.getParentsReachedBySchoolIds(schoolIds);
  }
}
