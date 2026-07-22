import { v4 as uuidv4 } from 'uuid';
import {
  EnumType,
  SchoolRoleMap,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiCampaignReports } from './SupabaseApi.campaign.reports';

export interface SupabaseApiProgramFoundation {
  [key: string]: any;
}
export class SupabaseApiProgramFoundation extends SupabaseApiCampaignReports {
  async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return {
        Country: [],
        State: [],
        Block: [],
        Cluster: [],
        District: [],
      };
    }

    const { data, error } = await this.supabase.rpc('get_unique_geo_data');

    if (error) throw error;

    if (!data)
      return { Country: [], State: [], Block: [], Cluster: [], District: [] };
    return data as {
      Country: string[];
      State: string[];
      Block: string[];
      Cluster: string[];
      District: string[];
    };
  }

  async insertProgram(payload: any): Promise<boolean> {
    try {
      if (!this.supabase) {
        logger.error('Supabase client is not initialized.');
        return false;
      }
      const programId = uuidv4();
      const _currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();

      const record: any = {
        id: programId,
        name: payload.programName,
        model: payload.models,

        implementation_partner: payload.partners.implementation,
        funding_partner: payload.partners.funding,
        institute_partner: payload.partners.institute,

        country: payload.locations.Country,
        state: payload.locations.State,
        block: payload.locations.Block,
        cluster: payload.locations.Cluster,
        district: payload.locations.District,

        program_type: payload.programType,
        institutes_count: payload.stats.schools,
        students_count: payload.stats.students,
        devices_count: payload.stats.devices,

        start_date: payload.startDate,
        end_date: payload.endDate,

        is_deleted: false,
        is_ops: null,
      };

      // Step 1: Insert the program
      const { data, error } = await this.supabase
        .from(TABLES.Program)
        .insert(record)
        .single();

      if (error) {
        logger.error('Insert error:', error);
        return false;
      }

      // Step 2: Insert into program_user table
      const programUserRows = payload.selectedManagers.map(
        (userId: string) => ({
          program_id: programId,
          user: userId,
          is_deleted: false,
          is_ops: null,
          role: RoleType.PROGRAM_MANAGER,
        }),
      );
      const { error: programUserError } = await this.supabase
        .from(TABLES.ProgramUser)
        .insert(programUserRows);

      if (programUserError) {
        logger.error('Error inserting program users:', programUserError);
        return false;
      }

      await this.computeProgramMetricsForProgram(programId);

      return true;
    } catch (error) {
      logger.error('insertProgram failed:', error);
      return false;
    }
  }
  async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }
    const { data, error } = await this.supabase
      .from(TABLES.School)
      .select('*')
      .eq('is_deleted', false)
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching schools:', error);
      return [];
    }
    return data ?? [];
  }

  async getSchoolsByModel(
    model: EnumType<'program_model'>,
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.School)
      .select('*')
      .eq('is_deleted', false)
      .eq('model', model)
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching schools by model:', error);
      return [];
    }
    return data ?? [];
  }

  async getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data: classes, error: classError } = await this.supabase
      .from(TABLES.Class)
      .select('id, school_id')
      .in('school_id', schoolIds)
      .eq('is_deleted', false);

    if (classError || !classes) {
      logger.error('Error fetching classes:', classError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const classIds = classes.map((cls) => cls.id);
    const classIdToSchoolId: Record<string, string> = {};
    for (const cls of classes) {
      classIdToSchoolId[cls.id] = cls.school_id;
    }

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('user: user_id (*), class_id')
      .in('class_id', classIds.length ? classIds : [''])
      .eq('is_deleted', false)
      .eq('role', RoleType.TEACHER);

    if (classUserError || !classUsers) {
      logger.error('Error fetching class users:', classUserError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<'user'>[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const entry of classUsers) {
      const schoolId = classIdToSchoolId[entry.class_id];
      const user = entry.user as unknown as TableTypes<'user'>;
      if (!schoolId || !user) continue;

      const existing = schoolMap.get(schoolId) || [];
      const alreadyExists = existing.some((u) => u.id === user.id);
      if (!alreadyExists) {
        existing.push(user);
        schoolMap.set(schoolId, existing);
      }
    }

    const result: SchoolRoleMap[] = [];
    for (const schoolId of schoolIds) {
      result.push({ schoolId, users: schoolMap.get(schoolId) ?? [] });
    }
    return result;
  }
  async getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data: classes, error: classError } = await this.supabase
      .from(TABLES.Class)
      .select('id, school_id')
      .in('school_id', schoolIds)
      .eq('is_deleted', false);

    if (classError || !classes) {
      logger.error('Error fetching classes:', classError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const classIds = classes.map((cls) => cls.id);
    const classIdToSchoolId: Record<string, string> = {};
    for (const cls of classes) {
      classIdToSchoolId[cls.id] = cls.school_id;
    }

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('user: user_id (*), class_id')
      .in('class_id', classIds.length ? classIds : [''])
      .eq('is_deleted', false)
      .eq('role', RoleType.STUDENT);

    if (classUserError || !classUsers) {
      logger.error('Error fetching class users:', classUserError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<'user'>[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const entry of classUsers) {
      const schoolId = classIdToSchoolId[entry.class_id];
      const user = entry.user as unknown as TableTypes<'user'>;
      if (!schoolId || !user) continue;

      const existing = schoolMap.get(schoolId) || [];
      const alreadyExists = existing.some((u) => u.id === user.id);
      if (!alreadyExists) {
        existing.push(user);
        schoolMap.set(schoolId, existing);
      }
    }

    const result: SchoolRoleMap[] = [];
    for (const schoolId of schoolIds) {
      result.push({ schoolId, users: schoolMap.get(schoolId) ?? [] });
    }
    return result;
  }

  async getProgramManagersForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('user: user_id (*), school_id')
      .in('school_id', schoolIds.length ? schoolIds : [''])
      .eq('is_deleted', false)
      .eq('role', RoleType.PROGRAM_MANAGER);
    if (error || !data) {
      logger.error('Error fetching program managers:', error);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<'user'>[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const row of data) {
      const user = row.user as unknown as TableTypes<'user'>;
      const schoolId = row.school_id;

      if (!user || !schoolMap.has(schoolId)) continue;

      const users = schoolMap.get(schoolId)!;
      if (!users.find((u) => u.id === user.id)) {
        users.push(user);
      }
    }

    return schoolIds.map((id) => ({
      schoolId: id,
      users: schoolMap.get(id) ?? [],
    }));
  }

  async getFieldCoordinatorsForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('user: user_id (*), school_id')
      .in('school_id', schoolIds.length ? schoolIds : ['dummy'])
      .eq('is_deleted', false)
      .eq('role', RoleType.FIELD_COORDINATOR);

    if (error || !data) {
      logger.error('Error fetching field coordinators:', error);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<'user'>[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const row of data) {
      const user = row.user as unknown as TableTypes<'user'>;
      const schoolId = row.school_id;

      if (!user || !schoolMap.has(schoolId)) continue;

      const users = schoolMap.get(schoolId)!;
      if (!users.find((u) => u.id === user.id)) {
        users.push(user);
      }
    }

    return schoolIds.map((id) => ({
      schoolId: id,
      users: schoolMap.get(id) ?? [],
    }));
  }

  async getProgramForSchool(
    schoolId: string,
  ): Promise<TableTypes<'program'> | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from('school')
      .select('program:program_id(*)')
      .eq('id', schoolId)
      .maybeSingle();
    if (error) {
      logger.error('Error fetching program with join:', error);
      return;
    }
    const program = (data?.program ?? undefined) as
      | TableTypes<'program'>
      | undefined;
    return program;
  }

  async getProgramManagersForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    if (!this.supabase) return;
    const { data: schoolData } = await this.supabase
      .from('school')
      .select('program_id')
      .eq('id', schoolId)
      .maybeSingle();
    const programId = schoolData?.program_id;
    if (!programId) return [];
    const { data: managers } = await this.supabase
      .from('program_user')
      .select('role, is_deleted, user(*)')
      .eq('program_id', programId);
    const managerUsers = (managers ?? [])
      .filter(
        (pu) =>
          pu.role === RoleType.PROGRAM_MANAGER && !pu.is_deleted && pu.user,
      )
      .flatMap((pu) =>
        Array.isArray(pu.user) ? pu.user : [pu.user],
      ) as TableTypes<'user'>[];
    return managerUsers;
  }

  async updateStudentStars(
    studentId: string,
    totalStars: number,
  ): Promise<void> {
    if (!this.supabase || !studentId) return;
    try {
      const { error } = await this.supabase
        .from(TABLES.User)
        .update({ stars: totalStars })
        .eq('id', studentId);

      if (error) {
        logger.error('Error setting stars for student:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error setting stars for student:', error);
    }
  }
}
