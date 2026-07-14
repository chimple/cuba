import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  AVATARS,
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  EnumType,
  FilteredSchoolsForSchoolListingOps,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  GeoDataParams,
  OPS_ROLES,
  PERCENTAGE_BAND,
  PERCENTAGE_BAND_VALUES,
  PROGRAM_TAB,
  ProgramType,
  RequestTypes,
  SCHOOL_PERFORMANCE_STATUS,
  SCHOOL_PERFORMANCE_STATUS_VALUES,
  STATUS,
  School,
  SchoolRoleMap,
  SchoolVisitType,
  SearchSchoolsParams,
  SearchSchoolsResult,
  TABLES,
  TabType,
  TableTypes,
  type PercentageBandValue,
  type SchoolPerformanceStatusValue,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from '../../../ops-console/pages/NewUserPageOps';
import { FCSchoolStats } from '../../../ops-console/pages/SchoolDetailsPage';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { Database, Json } from '../../database';
import {
  ClassMetricsForClassListingRow,
  GetSchoolsWithProgramAccessParams,
  ProgramListingProgramRow,
  SchoolProgramAccessResponse,
  SchoolProgramAccessRow,
} from '../ServiceApi';
import { SupabaseApiCampaign } from './SupabaseApi.campaign';

type SchoolListPercentBand = PercentageBandValue;

const SCHOOL_LIST_PERCENTAGE_FILTER_KEYS = new Set([
  'activatedStudents',
  'activeStudents',
  'activeTeachers',
]);
const SCHOOL_LIST_PERFORMANCE_FILTER_VALUES =
  new Set<SchoolPerformanceStatusValue>(SCHOOL_PERFORMANCE_STATUS_VALUES);

const isSchoolPerformanceStatusValue = (
  value: string,
): value is SchoolPerformanceStatusValue =>
  SCHOOL_LIST_PERFORMANCE_FILTER_VALUES.has(
    value as SchoolPerformanceStatusValue,
  );

const getNumericMetric = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }
  return null;
};

const isPercentWithinBand = (
  percent: number | null,
  band: SchoolListPercentBand,
) => {
  if (percent === null) return false;
  const roundedPercent = Math.round(percent);
  if (band === PERCENTAGE_BAND.LOW) return roundedPercent <= 30;
  if (band === PERCENTAGE_BAND.MID)
    return roundedPercent >= 31 && roundedPercent <= 69;
  return roundedPercent >= 70;
};

const getActivatedStudentsPercent = (row: Record<string, unknown>) => {
  const onboardedStudents = getNumericMetric(row.onboarded_students);
  const activatedStudents = getNumericMetric(row.activated_students);
  if (
    onboardedStudents === null ||
    activatedStudents === null ||
    onboardedStudents <= 0
  ) {
    return null;
  }
  return (activatedStudents / onboardedStudents) * 100;
};

const getActiveStudentsPercent = (row: Record<string, unknown>) => {
  const activatedStudents = getNumericMetric(row.activated_students);
  const activeStudents = getNumericMetric(row.active_students);
  if (
    activatedStudents === null ||
    activeStudents === null ||
    activatedStudents <= 0
  ) {
    return null;
  }
  return (activeStudents / activatedStudents) * 100;
};

const getActiveTeachersPercent = (row: Record<string, unknown>) => {
  const activeTeachers = getNumericMetric(row.active_teachers);
  const totalTeachers = getNumericMetric(row.total_teachers);
  if (activeTeachers !== null && totalTeachers !== null && totalTeachers > 0) {
    return (activeTeachers / totalTeachers) * 100;
  }
  return null;
};

const getSchoolMetricsSortValue = (
  row: Record<string, unknown>,
  sortBy: string,
): string | number | null => {
  if (sortBy === 'school_performance') {
    return typeof row.school_performance === 'string'
      ? row.school_performance.toLowerCase()
      : '';
  }
  if (sortBy === 'school_name') {
    return typeof row.school_name === 'string'
      ? row.school_name.toLowerCase()
      : '';
  }
  return getNumericMetric(row[sortBy]);
};

const normalizeSchoolPerformanceStatus = (value: unknown) => {
  const text =
    typeof value === 'string'
      ? value.trim().toLowerCase().replace(/[_-]+/g, ' ')
      : '';
  if (!text) return '';
  if (text.includes('green')) return SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL;
  if (text.includes('red')) return SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT;
  if (text.includes('yellow')) return SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION;
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const resolveSchoolMetricsPerformanceStatus = (
  row: Record<string, unknown>,
) => {
  const explicitStatus = normalizeSchoolPerformanceStatus(
    row.school_performance,
  );
  if (explicitStatus) return explicitStatus;

  const onboardedStudents = getNumericMetric(row.onboarded_students);
  const activeStudents =
    getNumericMetric(row.active_students) ??
    getNumericMetric(row.activated_students);
  if (
    onboardedStudents === null ||
    activeStudents === null ||
    onboardedStudents <= 0
  ) {
    return '';
  }
  const activeRate = activeStudents / onboardedStudents;
  if (activeRate >= 0.8) return SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL;
  if (activeRate >= 0.5) return SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION;
  return SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT;
};

type ProgramMetricsTableRow = Omit<
  ProgramListingProgramRow,
  'target_student_count' | 'target_teachers_count'
> & {
  program_managers?: string[] | string | null;
  field_coordinators?: string[] | string | null;
  partners?: string[] | string | null;
  district?: string | null;
  block?: string | null;
  cluster?: string | null;
  target_student_count?: number | string | null;
  target_teachers_count?: number | string | null;
  target_teacher_count?: number | string | null;
  program_type?: ProgramType | null;
  program_model?: PROGRAM_TAB | PROGRAM_TAB[] | string | null;
  updated_at?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
};

type ProgramMetricsDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      program_metrics: {
        Row: ProgramMetricsTableRow;
        Insert: ProgramMetricsTableRow;
        Update: Partial<ProgramMetricsTableRow>;
        Relationships: [];
      };
    };
  };
};

export interface SupabaseApiProgram {
  [key: string]: any;
}
export class SupabaseApiProgram extends SupabaseApiCampaign {
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
      const { error } = await this.supabase
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

  async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: {
      name: string;
      role: string;
      phone: string;
      email: string;
    }[];
  } | null> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return null;
    }

    try {
      const { data: program, error: programError } = await this.supabase
        .from('program')
        .select('*')
        .eq('id', programId)
        .single();

      if (programError || !program) {
        logger.error('Error fetching program:', programError);
        return null;
      }

      const { data: mappings, error: mappingsError } = await this.supabase
        .from('program_user')
        .select('user')
        .eq('program_id', programId)
        .eq('role', 'program_manager')
        .eq('is_deleted', false);

      if (mappingsError) {
        logger.error('Error fetching program managers:', mappingsError);
        return null;
      }

      const userIds = mappings
        .map((m) => m.user)
        .filter((id): id is string => !!id);

      const { data: users, error: usersError } = await this.supabase
        .from('user')
        .select('*')
        .in('id', userIds);
      if (usersError) {
        logger.error('Error fetching user details:', usersError);
        return null;
      }

      const programDetails = [
        {
          id: 'program_name',
          label: 'Program Name',
          value: program.name ?? '',
        },
        {
          id: 'program_type',
          label: 'Program Type',
          value: program.program_type ?? '',
        },
        {
          id: 'program_model',
          label: 'Program Model',
          value: Array.isArray(program.model)
            ? program.model.join(', ')
            : (program.model ?? ''),
        },
        {
          id: 'program_date',
          label: 'Program Date',
          value: `${program.start_date ?? ''}  ${program.end_date ?? ''}`,
        },
      ];

      const locationDetails = [
        { id: 'country', label: 'Country', value: program.country ?? '' },
        { id: 'state', label: 'State', value: program.state ?? '' },
        { id: 'district', label: 'District', value: program.district ?? '' },
        // { id: "cluster", label: "Cluster", value: program.cluster ?? "" },
        // { id: "block", label: "Block", value: program.block ?? "" },
        // { id: "village", label: "Village", value: program.village ?? "" },
      ];

      const partnerDetails = [
        {
          id: 'implementation_partner',
          label: 'Implementation Partner',
          value: program.implementation_partner ?? '',
        },
        {
          id: 'funding_partner',
          label: 'Funding Partner',
          value: program.funding_partner ?? '',
        },
        {
          id: 'institute_owner',
          label: 'Institute Owner',
          value: program.institute_partner ?? '',
        },
      ];
      const programManagers = (users ?? []).map((user) => ({
        name: user.name ?? '',
        role: 'Program Manager',
        phone: user.phone ?? '',
        email: user.email ?? '',
      }));

      return {
        programDetails,
        locationDetails,
        partnerDetails,
        programManagers,
      };
    } catch (err) {
      logger.error('Unexpected error in getProgramData:', err);
      return null;
    }
  }
  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return {};
    }

    const emptyOptions: Record<string, string[]> = {
      state: [],
      district: [],
      block: [],
      programType: [],
      partner: [],
      programManager: [],
      fieldCoordinator: [],
      cluster: [],
    };

    try {
      const { data, error } = await this.supabase.rpc(
        'get_school_filter_options',
      );

      if (error) {
        logger.error(
          'RPC error in getSchoolFilterOptionsForSchoolListing:',
          error,
        );
        return emptyOptions;
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return emptyOptions;
      }

      const rpcData = data as Record<string, Json>;

      return {
        state: Array.isArray(rpcData.state) ? (rpcData.state as string[]) : [],
        district: Array.isArray(rpcData.district)
          ? (rpcData.district as string[])
          : [],
        block: Array.isArray(rpcData.block) ? (rpcData.block as string[]) : [],
        programType: Array.isArray(rpcData.programType)
          ? (rpcData.programType as string[])
          : [],
        partner: Array.isArray(rpcData.partner)
          ? (rpcData.partner as string[])
          : [],
        programManager: Array.isArray(rpcData.programManager)
          ? (rpcData.programManager as string[])
          : [],
        fieldCoordinator: Array.isArray(rpcData.fieldCoordinator)
          ? (rpcData.fieldCoordinator as string[])
          : [],
        cluster: Array.isArray(rpcData.cluster)
          ? (rpcData.cluster as string[])
          : [],
      };
    } catch (err) {
      logger.error('Unexpected error in getSchoolFilterOptions:', err);
      return emptyOptions;
    }
  }

  async getSchoolFilterOptionsForProgram(
    programId: string,
  ): Promise<Record<string, string[]>> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return {};
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'get_school_filter_options_for_program',
        { input_program_id: programId },
      );

      if (error) {
        logger.error('RPC error in getSchoolFilterOptionsForProgram:', error);
        return {};
      }

      const parsed: Record<string, string[]> = {
        state: [],
        district: [],
        block: [],
        cluster: [],
        programType: [],
        partner: [],
        programManager: [],
        fieldCoordinator: [],
        model: [],
      };

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        for (const key in parsed) {
          const val = (data as Record<string, Json>)[key];
          parsed[key] = Array.isArray(val)
            ? val.filter(
                (v): v is string =>
                  typeof v === 'string' && v.trim() !== '' && v !== 'null',
              )
            : [];
        }
      }

      return parsed;
    } catch (err) {
      logger.error(
        'Unexpected error in getSchoolFilterOptionsForProgram:',
        err,
      );
      return {};
    }
  }

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
    if (!this.supabase) {
      return { success: false, error: 'Supabase not initialized' };
    }
    try {
      const { data, error: functionError } =
        await this.supabase.functions.invoke('get_or_create_user', {
          body: {
            name: payload.name,
            email: payload.email || undefined,
            phone: payload.phone || undefined,
          },
        });
      if (functionError) {
        const body = data as any;
        const errorCode = body?.message || 'unknown-error';
        const errorDetail = body?.error || functionError.message;
        return {
          success: false,
          message: errorCode,
          error: errorDetail || 'Unexpected error occurred',
        };
      }
      const body = data as any;
      const user = body?.user;
      const isNew = body?.is_new === true;
      if (!user || !user.id) {
        return {
          success: false,
          message: 'unexpected-error',
          error: 'Invalid response from ops_adding_and_creating_user',
        };
      }
      const userId: string = user.id as string;
      const { data: existingSpecial, error: specialError } = await this.supabase
        .from('special_users')
        .select('id, role')
        .eq('user_id', userId)
        .eq('is_deleted', false);
      if (specialError) {
        return {
          success: false,
          message: 'db-role-check-failed',
          error: specialError.message,
        };
      }
      const rolesToBlock: RoleType[] = [
        RoleType.PROGRAM_MANAGER,
        RoleType.FIELD_COORDINATOR,
      ];
      const hasBlockedRole =
        existingSpecial?.some((entry) =>
          rolesToBlock.includes(entry.role as RoleType),
        ) ?? false;
      if (hasBlockedRole) {
        return {
          success: true,
          user_id: userId,
          message: 'success-user-already-exists',
        };
      }
      const roleForInsert = OPS_ROLES.find((r) => r === payload.role) as
        | RoleType
        | any;
      const { error: insertSpecialError } = await this.supabase
        .from('special_users')
        .insert({
          user_id: userId,
          role: roleForInsert,
          is_deleted: false,
        });
      if (insertSpecialError) {
        return {
          success: false,
          message: 'insert-role-failed',
          error: insertSpecialError.message,
        };
      }
      const successMessage = isNew
        ? 'success-created'
        : 'success-added-to-special_users';
      return {
        success: true,
        user_id: userId,
        message: successMessage,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'unexpected-error',
        error: err?.message || 'Unexpected error occurred',
      };
    }
  }

  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    percentage_filters?: Record<string, SchoolListPercentBand>;
    school_performance_filter?: string | null;
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return { data: [], total: 0 };
    }

    const { filters, programId, page, page_size, order_by, order_dir, search } =
      params;
    const payload: Database['public']['Functions']['get_filtered_schools_with_optional_program']['Args'] =
      {};

    if (filters && Object.keys(filters).length > 0) payload.filters = filters;
    if (programId) payload._program_id = programId;
    if (page) payload.page = page;
    if (page_size) payload.page_size = page_size;
    if (order_by) payload.order_by = order_by;
    if (order_dir) payload.order_dir = order_dir;
    if (search) payload.search = search;

    try {
      const { data, error } = await this.supabase.rpc(
        'get_filtered_schools_with_optional_program',
        payload,
      );
      if (error) {
        logger.error(
          'RPC error in get_filtered_schools_with_optional_program:',
          error,
        );
        return { data: [], total: 0 };
      }

      if (
        !data ||
        typeof data !== 'object' ||
        !('data' in data) ||
        !('total' in data)
      ) {
        throw new Error(
          'Supabase RPC did not return expected { data, total } shape',
        );
      }

      return {
        data: (data.data ??
          []) as unknown as FilteredSchoolsForSchoolListingOps[],
        total: typeof data.total === 'number' ? data.total : 0,
      };
    } catch (err) {
      logger.error(
        'Unexpected error in get_filtered_schools_with_optional_program:',
        err,
      );
      return { data: [], total: 0 };
    }
  }

  async getSchoolMetricsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, SchoolListPercentBand>;
    school_performance_filter?: string | null;
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return { data: [], total: 0 };
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await this.supabase.auth.getUser();
    if (authError || !authUser) {
      logger.error('Current user is not available for school metrics query');
      return { data: [], total: 0 };
    }

    const {
      filters,
      programId,
      page = 1,
      page_size = 10,
      order_by,
      order_dir,
      search,
      date_range,
      percentage_filters,
      school_performance_filter,
    } = params;

    const specialRoles = await this.getUserSpecialRoles(authUser.id);
    const isAdminOrDirector = specialRoles.some((role) =>
      [RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR].includes(
        role as RoleType,
      ),
    );
    const isExternalUser = specialRoles.includes(RoleType.EXTERNAL_USER);
    const isFieldCoordinator = specialRoles.includes(
      RoleType.FIELD_COORDINATOR,
    );
    const shouldRestrictToSchoolLinks =
      !isAdminOrDirector && (isExternalUser || isFieldCoordinator);

    try {
      const [schoolUserResult, programUserResult] = await Promise.all([
        shouldRestrictToSchoolLinks || !isAdminOrDirector
          ? this.supabase
              .from(TABLES.SchoolUser)
              .select('school_id')
              .eq('user_id', authUser.id)
              .eq('is_deleted', false)
          : Promise.resolve({
              data: [] as Array<{ school_id?: string | null }>,
              error: null,
            }),
        !isAdminOrDirector && specialRoles.includes(RoleType.PROGRAM_MANAGER)
          ? this.supabase
              .from(TABLES.ProgramUser)
              .select('program_id')
              .eq('user', authUser.id)
              .eq('role', RoleType.PROGRAM_MANAGER)
              .eq('is_deleted', false)
          : Promise.resolve({
              data: [] as Array<{ program_id?: string | null }>,
              error: null,
            }),
      ]);

      if (schoolUserResult?.error) {
        logger.error(
          'Error fetching school_user access list:',
          schoolUserResult.error,
        );
        return { data: [], total: 0 };
      }
      if (programUserResult?.error) {
        logger.error(
          'Error fetching program_user access list:',
          programUserResult.error,
        );
        return { data: [], total: 0 };
      }

      const schoolIds = (schoolUserResult.data ?? [])
        .map((row) => row.school_id)
        .filter((id): id is string => !!id);
      const programIds = (programUserResult.data ?? [])
        .map((row) => row.program_id)
        .filter((id): id is string => !!id);

      const metricWindow =
        date_range && date_range !== 'all_time'
          ? date_range.trim().toLowerCase()
          : null;

      let query = this.supabase
        .from(TABLES.SchoolMetrics)
        .select('*', { count: 'exact' })
        .eq('is_deleted', false);

      if (metricWindow) {
        query = query.eq('metric_window', metricWindow);
      }

      if (programId) {
        query = query.eq('program_id', programId);
      }

      if (!isAdminOrDirector) {
        if (schoolIds.length > 0 && programIds.length > 0) {
          query = query.or(
            `school_id.in.(${schoolIds.join(',')}),program_id.in.(${programIds.join(',')})`,
          );
        } else if (schoolIds.length > 0) {
          query = query.in('school_id', schoolIds);
        } else if (programIds.length > 0) {
          query = query.in('program_id', programIds);
        } else {
          return { data: [], total: 0 };
        }
      }

      if (
        !isAdminOrDirector &&
        schoolIds.length === 0 &&
        programIds.length === 0
      ) {
        return { data: [], total: 0 };
      }

      const cleanedFilters = Object.fromEntries(
        Object.entries(filters ?? {}).filter(
          ([, values]) => Array.isArray(values) && values.length > 0,
        ),
      );

      if (cleanedFilters.state?.length) {
        query = query.in('state', cleanedFilters.state);
      }
      if (cleanedFilters.district?.length) {
        query = query.in('district', cleanedFilters.district);
      }
      if (cleanedFilters.block?.length) {
        query = query.in('block', cleanedFilters.block);
      }
      if (cleanedFilters.cluster?.length) {
        query = query.in('cluster', cleanedFilters.cluster);
      }
      if (cleanedFilters.model?.length) {
        const schoolModelValues = cleanedFilters.model.filter(
          (value): value is 'hybrid' | 'at_home' | 'at_school' =>
            Object.values(PROGRAM_TAB).includes(value as PROGRAM_TAB),
        );
        if (schoolModelValues.length) {
          query = query.in('school_model', schoolModelValues);
        }
      }
      if (cleanedFilters.partner?.length) {
        query = query.overlaps('partners', cleanedFilters.partner);
      }
      if (cleanedFilters.programManager?.length) {
        query = query.overlaps(
          'program_managers',
          cleanedFilters.programManager,
        );
      }
      if (cleanedFilters.fieldCoordinator?.length) {
        query = query.overlaps(
          'field_coordinators',
          cleanedFilters.fieldCoordinator,
        );
      }
      if (cleanedFilters.programType?.length) {
        const programTypeValues = cleanedFilters.programType.filter(
          (value): value is 'government' | 'private' | 'learning_centers' =>
            Object.values(ProgramType).includes(value as ProgramType),
        );
        if (programTypeValues.length) {
          query = query.in('program_type', programTypeValues);
        }
      }

      if (search) {
        query = query.or(
          [
            `school_name.ilike.%${search}%`,
            `udise.ilike.%${search}%`,
            `district.ilike.%${search}%`,
            `block.ilike.%${search}%`,
            `cluster.ilike.%${search}%`,
            `state.ilike.%${search}%`,
          ].join(','),
        );
      }

      const allowedSortColumns = new Set([
        'school_name',
        'school_performance',
        'onboarded_students',
        'activated_students',
        'active_students',
        'avg_time_spent',
        'active_teachers',
        'activities_assigned',
        'avg_assignments_completed',
        'avg_activities_completed',
        'student_parent_calls',
        'student_parent_inperson',
        'teacher_hm_calls',
        'community_visits',
        'community_parents_reached',
        'school_visits',
        'parents_on_whatsapp',
        'parents_in_group',
      ]);
      const sortBy = allowedSortColumns.has(order_by ?? '')
        ? (order_by as string)
        : 'school_name';
      const sortAscending = order_dir !== 'desc';

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching school_metrics listing:', error);
        return { data: [], total: 0 };
      }

      let rows = (data ?? []) as Array<Record<string, unknown>>;

      const percentageFilters = Object.fromEntries(
        Object.entries(percentage_filters ?? {}).filter(
          ([key, value]) =>
            SCHOOL_LIST_PERCENTAGE_FILTER_KEYS.has(key) &&
            PERCENTAGE_BAND_VALUES.includes(value as SchoolListPercentBand),
        ),
      ) as Record<string, SchoolListPercentBand>;

      if (Object.keys(percentageFilters).length > 0) {
        rows = rows.filter((row) =>
          Object.entries(percentageFilters).every(([key, band]) => {
            if (key === 'activatedStudents') {
              return isPercentWithinBand(
                getActivatedStudentsPercent(row),
                band,
              );
            }
            if (key === 'activeStudents') {
              return isPercentWithinBand(getActiveStudentsPercent(row), band);
            }
            if (key === 'activeTeachers') {
              return isPercentWithinBand(getActiveTeachersPercent(row), band);
            }
            return true;
          }),
        );
      }

      const schoolPerformanceFilter =
        typeof school_performance_filter === 'string' &&
        isSchoolPerformanceStatusValue(school_performance_filter)
          ? school_performance_filter
          : null;

      if (schoolPerformanceFilter) {
        rows = rows.filter(
          (row) =>
            resolveSchoolMetricsPerformanceStatus(row) ===
            schoolPerformanceFilter,
        );
      }

      rows.sort((leftRow, rightRow) => {
        const leftValue = getSchoolMetricsSortValue(leftRow, sortBy);
        const rightValue = getSchoolMetricsSortValue(rightRow, sortBy);

        if (leftValue == null && rightValue == null) return 0;
        if (leftValue == null) return 1;
        if (rightValue == null) return -1;

        if (typeof leftValue === 'string' || typeof rightValue === 'string') {
          const result = String(leftValue).localeCompare(
            String(rightValue),
            undefined,
            {
              sensitivity: 'base',
              numeric: true,
            },
          );
          return sortAscending ? result : -result;
        }

        const result =
          leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
        return sortAscending ? result : -result;
      });

      const from = Math.max(page - 1, 0) * page_size;
      const pagedRows = rows.slice(from, from + page_size);

      const mappedRows = pagedRows.map((row: Record<string, unknown>) => ({
        ...row,
        school_name: typeof row.school_name === 'string' ? row.school_name : '',
        udise: row.udise ?? null,
        num_students:
          typeof row.onboarded_students === 'number'
            ? row.onboarded_students
            : 0,
        num_teachers: getNumericMetric(row.num_teachers) ?? 0,
        total_teachers: getNumericMetric(row.total_teachers),
        onboarded_students: row.onboarded_students ?? null,
        activated_students: row.activated_students ?? null,
        active_students: row.active_students ?? null,
        avg_time_spent: row.avg_time_spent ?? null,
        active_teachers: row.active_teachers ?? null,
        active_teacher_percentage: getNumericMetric(
          row.active_teacher_percentage,
        ),
        activities_assigned: row.activities_assigned ?? null,
        avg_assignments_completed: row.avg_assignments_completed ?? null,
        avg_activities_completed: row.avg_activities_completed ?? null,
        phone_calls_students_parents: row.student_parent_calls ?? null,
        inperson_students_parents: row.student_parent_inperson ?? null,
        phone_calls_teachers_hms: row.teacher_hm_calls ?? null,
        community_visits: row.community_visits ?? null,
        school_visits: row.school_visits ?? null,
        parents_on_whatsapp: row.parents_on_whatsapp ?? null,
        parents_in_whatsapp_group: row.parents_in_group ?? null,
        parents_reached:
          typeof row.community_parents_reached === 'number'
            ? row.community_parents_reached
            : 0,
        program_managers: row.program_managers ?? [],
        field_coordinators: row.field_coordinators ?? [],
      })) as FilteredSchoolsForSchoolListingOps[];

      return {
        data: mappedRows,
        total: rows.length,
      };
    } catch (error) {
      logger.error(
        'Unexpected error in getSchoolMetricsForSchoolListing:',
        error,
      );
      return { data: [], total: 0 };
    }
  }

  async getClassMetricsForClassListing(params: {
    schoolId: string;
    date_range?: string;
  }): Promise<ClassMetricsForClassListingRow[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return [];
    }

    const schoolId = params.schoolId?.trim();
    if (!schoolId) {
      logger.error('getClassMetricsForClassListing called without schoolId');
      return [];
    }

    const days = (() => {
      const value = params.date_range?.trim().toLowerCase() ?? '7d';
      if (value === '15d') return 15;
      if (value === '30d') return 30;
      return 7;
    })();

    try {
      const { data, error } = await (
        this.supabase as unknown as {
          rpc: (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: unknown }>;
        }
      ).rpc('get_class_metrics_for_listing', {
        p_school_id: schoolId,
        p_days: days,
      });

      if (error) {
        logger.error('RPC error in get_class_metrics_for_listing:', error);
        return [];
      }

      return (data ?? []) as ClassMetricsForClassListingRow[];
    } catch (error) {
      logger.error(
        'Unexpected error in getClassMetricsForClassListing:',
        error,
      );
      return [];
    }
  }

  public async getProgramsFromProgramMetrics(params: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    tab?: TabType;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
  }): Promise<{
    data: ProgramListingProgramRow[];
    total: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return { data: [], total: 0 };
    }

    const {
      currentUserId,
      filters,
      tab = PROGRAM_TAB.ALL,
      page = 1,
      page_size = 10,
      order_by = 'program_name',
      order_dir = 'asc',
      search = '',
      date_range,
    } = params;

    // Needed because program_metrics numeric columns can arrive as strings from Supabase.
    const getProgramMetricNumber = (
      value: number | string | null | undefined,
    ): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : 0;
      }
      return 0;
    };

    // Needed so missing target counts show NA instead of an incorrect 0%.
    const getProgramConfiguredTargetCount = (
      value: number | string | null | undefined,
    ): number | null => {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) && parsedValue > 0
          ? parsedValue
          : null;
      }
      return null;
    };

    // Needed because school division is stored as counts but the UI consumes percentages.
    const getProgramSchoolDivisionPercent = (
      value: number | null | undefined,
      totalSchools: number,
    ): number => {
      if (totalSchools <= 0) return 0;
      return Math.round((getProgramMetricNumber(value) / totalSchools) * 100);
    };

    // Needed because partner, manager, coordinator, and model fields can be JSON strings.
    const normalizeProgramMetricsStringList = (
      value: string[] | string | null | undefined,
    ): string[] => {
      const normalizeString = (item: string): string[] => {
        const trimmedItem = item.trim();
        if (!trimmedItem || trimmedItem === 'null') return [];
        if (!trimmedItem.startsWith('[')) return [trimmedItem];
        try {
          const parsed = JSON.parse(trimmedItem) as Json;
          if (!Array.isArray(parsed)) return [trimmedItem];
          return parsed.filter(
            (entry): entry is string =>
              typeof entry === 'string' &&
              entry.trim() !== '' &&
              entry !== 'null',
          );
        } catch {
          return [trimmedItem];
        }
      };

      if (Array.isArray(value)) {
        return value.flatMap((item) =>
          typeof item === 'string' ? normalizeString(item) : [],
        );
      }
      return typeof value === 'string' ? normalizeString(value) : [];
    };

    // Needed so multi-select filters work for both array and JSON-string fields.
    const programMetricsListHasSelection = (
      value: string[] | string | null | undefined,
      selectedValues: string[] | undefined,
    ): boolean => {
      if (!selectedValues?.length) return true;
      const normalizedValues = normalizeProgramMetricsStringList(value);
      return selectedValues.some((selectedValue) =>
        normalizedValues.includes(selectedValue),
      );
    };

    // Needed because these list-like filters cannot be safely handled by DB operators alone.
    const matchesProgramMetricsDimensionFilters = (
      row: ProgramMetricsTableRow,
      rowFilters: Record<string, string[]>,
      selectedTab: PROGRAM_TAB,
    ): boolean => {
      const selectedModels = rowFilters.model?.filter((value) =>
        Object.values(PROGRAM_TAB).includes(value as PROGRAM_TAB),
      );
      const modelFilter = selectedModels?.length
        ? selectedModels
        : selectedTab !== PROGRAM_TAB.ALL
          ? [selectedTab]
          : [];

      return (
        programMetricsListHasSelection(row.program_model, modelFilter) &&
        programMetricsListHasSelection(row.partners, rowFilters.partner) &&
        programMetricsListHasSelection(
          row.program_managers,
          rowFilters.programManager,
        ) &&
        programMetricsListHasSelection(
          row.field_coordinators,
          rowFilters.fieldCoordinator,
        )
      );
    };

    // Needed to keep the Program Listing response stable while reading from program_metrics.
    const mapProgramMetricsRow = (
      row: ProgramMetricsTableRow,
    ): ProgramListingProgramRow => {
      const onboardedStudents = getProgramMetricNumber(row.onboarded_students);
      const targetStudentCount = getProgramConfiguredTargetCount(
        row.target_student_count,
      );
      const activatedStudents = getProgramMetricNumber(row.activated_students);
      const activeStudents = getProgramMetricNumber(row.active_students);
      const onboardedTeachers = getProgramMetricNumber(row.onboarded_teachers);
      const targetTeachersCount = getProgramConfiguredTargetCount(
        row.target_teacher_count ?? row.target_teachers_count,
      );
      const activatedTeachers = getProgramMetricNumber(row.activated_teachers);
      const activeTeachers = getProgramMetricNumber(row.active_teachers);
      const totalSchools = getProgramMetricNumber(row.total_schools);

      return {
        ...row,
        total_schools: totalSchools,
        performing_well: getProgramSchoolDivisionPercent(
          row.performing_well,
          totalSchools,
        ),
        needs_attention: getProgramSchoolDivisionPercent(
          row.needs_attention,
          totalSchools,
        ),
        needs_support: getProgramSchoolDivisionPercent(
          row.needs_support,
          totalSchools,
        ),
        onboarded_students: onboardedStudents,
        target_student_count: targetStudentCount,
        onboarded_students_pct:
          targetStudentCount !== null
            ? (onboardedStudents / targetStudentCount) * 100
            : null,
        activated_students: activatedStudents,
        activated_students_pct:
          onboardedStudents > 0
            ? (activatedStudents / onboardedStudents) * 100
            : 0,
        active_students: activeStudents,
        active_students_pct:
          activatedStudents > 0
            ? (activeStudents / activatedStudents) * 100
            : 0,
        avg_time_spent: getProgramMetricNumber(row.avg_time_spent),
        onboarded_teachers: onboardedTeachers,
        target_teachers_count: targetTeachersCount,
        onboarded_teachers_pct:
          targetTeachersCount !== null
            ? (onboardedTeachers / targetTeachersCount) * 100
            : null,
        activated_teachers: activatedTeachers,
        activated_teachers_pct:
          onboardedTeachers > 0
            ? (activatedTeachers / onboardedTeachers) * 100
            : 0,
        active_teachers: activeTeachers,
        active_teachers_pct:
          activatedTeachers > 0
            ? (activeTeachers / activatedTeachers) * 100
            : 0,
      };
    };

    // Needed because Low/Mid/High filters depend on calculated percentages.
    const matchesProgramPercentFilters = (
      row: ProgramListingProgramRow,
      rowFilters: Record<string, string[]>,
    ): boolean => {
      const filterEntries: Array<[keyof ProgramListingProgramRow, string]> = [
        ['onboarded_students_pct', 'onboardedStudentsPct'],
        ['activated_students_pct', 'activatedStudentsPct'],
        ['active_students_pct', 'activeStudentsPct'],
        ['onboarded_teachers_pct', 'onboardedTeachersPct'],
        ['activated_teachers_pct', 'activatedTeachersPct'],
        ['active_teachers_pct', 'activeTeachersPct'],
      ];

      return filterEntries.every(([metricKey, filterKey]) => {
        const selectedBands = rowFilters[filterKey] ?? [];
        if (selectedBands.length === 0) return true;
        const value = row[metricKey];
        if (typeof value !== 'number') return false;
        const band = value >= 70 ? 'High' : value >= 31 ? 'Mid' : 'Low';
        return selectedBands.includes(band);
      });
    };

    // Needed so all sortable Program columns use one consistent ordering path.
    const sortProgramMetricsRows = (
      first: ProgramListingProgramRow,
      second: ProgramListingProgramRow,
      orderBy: string,
      orderDir: 'asc' | 'desc',
    ): number => {
      const dir = orderDir === 'desc' ? -1 : 1;
      const firstValue = first[orderBy as keyof ProgramListingProgramRow];
      const secondValue = second[orderBy as keyof ProgramListingProgramRow];
      if (typeof firstValue === 'number' || typeof secondValue === 'number') {
        return (
          (((firstValue as number | null) ?? 0) -
            ((secondValue as number | null) ?? 0)) *
          dir
        );
      }
      return (
        String(firstValue ?? '').localeCompare(String(secondValue ?? '')) * dir
      );
    };

    // Needed to decide whether the current user can see all programs or only linked programs.
    const specialRoles = await this.getUserSpecialRoles(currentUserId);
    const isAdminOrDirector = specialRoles.some((role) =>
      [RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR].includes(
        role as RoleType,
      ),
    );

    try {
      // Needed to collect direct program access for program managers only.
      const programUserResult =
        !isAdminOrDirector && specialRoles.includes(RoleType.PROGRAM_MANAGER)
          ? await this.supabase
              .from(TABLES.ProgramUser)
              .select('program_id')
              .eq('user', currentUserId)
              .eq('role', RoleType.PROGRAM_MANAGER)
              .eq('is_deleted', false)
          : {
              data: [] as Array<{ program_id?: string | null }>,
              error: null,
            };

      if (programUserResult.error) {
        logger.error(
          'Error fetching program_user access list:',
          programUserResult.error,
        );
        return { data: [], total: 0 };
      }

      // Needed to convert program_user rows into clean IDs for program metrics filtering.
      const programIds = (programUserResult.data ?? [])
        .map((row) => row.program_id)
        .filter((id): id is string => !!id);

      // Needed to de-duplicate direct program access before applying row-level filtering.
      const accessProgramIds = Array.from(new Set(programIds));

      // Needed to query the program_metrics table even though generated DB types do not include it.
      const programMetricsClient = this
        .supabase as SupabaseClient<ProgramMetricsDatabase>;
      let query = programMetricsClient
        .from('program_metrics')
        .select('*')
        .eq('is_deleted', false);

      // Needed so the listing and export reflect the selected metric window.
      if (date_range && date_range !== 'all_time') {
        query = query.eq('metric_window', date_range.trim().toLowerCase());
      }

      // Needed to enforce access rules for non-admin and non-director users.
      if (!isAdminOrDirector) {
        if (accessProgramIds.length === 0) {
          return { data: [], total: 0 };
        }
        query = query.in('program_id', accessProgramIds);
      }

      // Needed to avoid sending empty filter arrays into DB and in-memory filters.
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters ?? {}).filter(
          ([, values]) => Array.isArray(values) && values.length > 0,
        ),
      );

      // Needed to apply simple scalar filters at the database layer.
      if (cleanedFilters.state?.length)
        query = query.in('state', cleanedFilters.state);
      if (cleanedFilters.district?.length)
        query = query.in('district', cleanedFilters.district);
      if (cleanedFilters.block?.length)
        query = query.in('block', cleanedFilters.block);
      if (cleanedFilters.cluster?.length)
        query = query.in('cluster', cleanedFilters.cluster);
      if (cleanedFilters.programType?.length) {
        const programTypeValues = cleanedFilters.programType.filter(
          (value): value is ProgramType =>
            Object.values(ProgramType).includes(value as ProgramType),
        );
        if (programTypeValues.length) {
          query = query.in('program_type', programTypeValues);
        }
      }
      // Needed to keep search behavior consistent across program and location fields.
      if (search) {
        query = query.or(
          [
            `program_name.ilike.%${search}%`,
            `state.ilike.%${search}%`,
            `district.ilike.%${search}%`,
            `block.ilike.%${search}%`,
            `cluster.ilike.%${search}%`,
          ].join(','),
        );
      }

      // Needed to fetch the filtered program_metrics rows before calculated filters run.
      const { data, error } = await query;
      if (error) {
        logger.error('Error fetching program_metrics listing:', error);
        return { data: [], total: 0 };
      }

      // Needed to apply normalized list filters, calculated percentages, sorting, and paging.
      const rows = ((data ?? []) as ProgramMetricsTableRow[])
        .filter((row) =>
          matchesProgramMetricsDimensionFilters(row, cleanedFilters, tab),
        )
        .map((row) => mapProgramMetricsRow(row))
        .filter((row) => matchesProgramPercentFilters(row, cleanedFilters))
        .sort((a, b) => sortProgramMetricsRows(a, b, order_by, order_dir));
      // Needed to return only the requested page while preserving the total filtered count.
      const from = Math.max(page - 1, 0) * page_size;

      return {
        data: rows.slice(from, from + page_size),
        total: rows.length,
      };
    } catch (error) {
      logger.error('Unexpected error in getProgramsFromProgramMetrics:', error);
      return { data: [], total: 0 };
    }
  }

  async getSchoolsWithProgramAccess(
    params: GetSchoolsWithProgramAccessParams,
  ): Promise<SchoolProgramAccessResponse> {
    const safeParams = params ?? ({} as GetSchoolsWithProgramAccessParams);
    const normalizedPage = safeParams.page ?? 1;
    const normalizedPageSize = safeParams.pageSize ?? 20;
    const fallbackResponse: SchoolProgramAccessResponse = {
      data: [],
      total: 0,
      page: normalizedPage,
      page_size: normalizedPageSize,
      total_pages: 0,
    };

    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return fallbackResponse;
    }

    const academicYears = Array.isArray(safeParams.academicYears)
      ? safeParams.academicYears
      : [];
    const allowedFilterKeys: Array<
      'program' | 'programType' | 'state' | 'district' | 'block' | 'cluster'
    > = ['program', 'programType', 'state', 'district', 'block', 'cluster'];
    const normalizedFilters = allowedFilterKeys.reduce<
      Record<string, string[]>
    >((acc, key) => {
      const value = safeParams.filters?.[key];
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {});

    try {
      const { data, error } = await this.supabase.rpc(
        'get_schools_with_program_access',
        {
          _academic_years: academicYears,
          _filters: normalizedFilters,
          _page: normalizedPage,
          _page_size: normalizedPageSize,
          _order_by: safeParams.orderBy ?? 'school_name',
          _order_dir: safeParams.orderDir ?? 'asc',
          _search: safeParams.search?.trim() || undefined,
          _include_migrated_counts: safeParams.includeMigratedCounts ?? false,
        },
      );

      if (error) {
        logger.error('RPC error in get_schools_with_program_access:', error);
        return fallbackResponse;
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return fallbackResponse;
      }

      const rawResponse = data as Record<string, any>;
      const rawRows = Array.isArray(rawResponse.data) ? rawResponse.data : [];
      const normalizedRows: SchoolProgramAccessRow[] = rawRows.map(
        (item: any) => ({
          ...(item && typeof item === 'object' && !Array.isArray(item)
            ? item
            : {}),
          school:
            item?.school &&
            typeof item.school === 'object' &&
            !Array.isArray(item.school)
              ? item.school
              : {},
          program:
            item?.program &&
            typeof item.program === 'object' &&
            !Array.isArray(item.program)
              ? item.program
              : {},
          program_users: Array.isArray(item?.program_users)
            ? item.program_users.filter(
                (user: any) =>
                  user && typeof user === 'object' && !Array.isArray(user),
              )
            : [],
        }),
      );

      return {
        data: normalizedRows,
        total: typeof rawResponse.total === 'number' ? rawResponse.total : 0,
        page:
          typeof rawResponse.page === 'number'
            ? rawResponse.page
            : normalizedPage,
        page_size:
          typeof rawResponse.page_size === 'number'
            ? rawResponse.page_size
            : normalizedPageSize,
        total_pages:
          typeof rawResponse.total_pages === 'number'
            ? rawResponse.total_pages
            : 0,
      };
    } catch (err) {
      logger.error('Unexpected error in get_schools_with_program_access:', err);
      return fallbackResponse;
    }
  }

  async createAutoProfile(
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) throw new Error('Supabase instance is not initialized');

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const studentProfile = await this.getParentStudentProfiles();
    if (studentProfile.length > 0) return studentProfile[0];

    const studentId = uuidv4();
    const now = new Date().toISOString();

    const newStudent: TableTypes<'user'> = {
      id: studentId,
      name: null,
      age: null,
      gender: null,
      avatar: randomAvatar,
      image: null,
      curriculum_id: null,
      grade_id: null,
      language_id: languageDocId ?? null,
      locale_id: null,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_tc_accepted: true,
      tc_agreed_version: tcVersion ?? 0,
      email: null,
      phone: null,
      fcm_token: null,
      music_off: false,
      sfx_off: false,
      student_id: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      learning_path: null,
      ops_created_by: null,
      reward: null,
      stars: null,
      is_wa_contact: null,
    };

    // Insert user
    const { error: userInsertError } = await this.supabase
      .from(TABLES.User)
      .insert([newStudent]);
    if (userInsertError) {
      logger.error('Error inserting auto profile user:', userInsertError);
      throw userInsertError;
    }

    // Insert parent_user
    const parentUserId = uuidv4();
    const parentUserData: TableTypes<'parent_user'> = {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
    };
    const { error: parentInsertError } = await this.supabase
      .from(TABLES.ParentUser)
      .insert([parentUserData]);
    if (parentInsertError) {
      logger.error(
        'Error inserting parent_user for auto profile:',
        parentInsertError,
      );
      throw parentInsertError;
    }

    // Find English, Maths, and language-dependent subject
    const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
    const mathsCourse = await this.resolveMathCourseByLanguage(languageDocId);
    const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);
    const language = languageDocId
      ? await this.getLanguageWithId(languageDocId)
      : undefined;
    let langCourse: TableTypes<'course'> | undefined;
    if (language && language.code !== COURSES.ENGLISH) {
      // Map language code to courseId
      const thirdLanguageCourseMap: Record<string, string> = {
        hi: CHIMPLE_HINDI,
        kn: GRADE1_KANNADA,
        mr: GRADE1_MARATHI,
      };
      const courseId = thirdLanguageCourseMap[language.code ?? ''];
      if (courseId) {
        langCourse = await this.getCourse(courseId);
      }
    }
    // Add only these three courses to the student
    const coursesToAdd = [
      englishCourse,
      mathsCourse,
      langCourse,
      digitalSkillsCourse,
    ].filter(Boolean) as TableTypes<'course'>[];

    // Insert user_course entries
    for (const course of coursesToAdd) {
      const newUserCourse: TableTypes<'user_course'> = {
        id: uuidv4(),
        user_id: studentId,
        course_id: course.id,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        is_firebase: null,
      };
      const { error: userCourseInsertError } = await this.supabase
        .from(TABLES.UserCourse)
        .insert([newUserCourse]);
      if (userCourseInsertError) {
        logger.error(
          'Error inserting user_course for auto profile:',
          userCourseInsertError,
        );
      }
    }

    return newStudent;
  }

  async isProgramUser(): Promise<boolean> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return false;
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');

    const userId = _currentUser.id;

    const { data, error } = await this.supabase
      .from('program_user')
      .select('id')
      .eq('user', userId)
      .in('role', [RoleType.PROGRAM_MANAGER, RoleType.FIELD_COORDINATOR])
      .eq('is_deleted', false)
      .limit(1);

    if (error) {
      logger.error('Error checking program_user table', error);
      return false;
    }

    return !!(data && data.length > 0);
  }
  async isSplUser(): Promise<boolean> {
    if (!this.supabase) return false;
    try {
      const { data, error } = await this.supabase.rpc(
        'is_special_or_program_user',
      );
      if (error) {
        logger.error('Error checking special user status:', error);
        return false;
      }
      return !!data;
    } catch (e) {
      logger.error('Exception in isSplUser:', e);
      return false;
    }
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
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return { data: [], totalCount: 0 };
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User not logged in');
    const userId = _currentUser.id;
    const roles: string[] = store.getState().auth.roles || [];
    const isSuperAdmin = roles.includes(RoleType.SUPER_ADMIN);
    const isOpsDirector = roles.includes(RoleType.OPERATIONAL_DIRECTOR);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    if (isSuperAdmin || isOpsDirector) {
      let specialUsersQuery = this.supabase
        .from('special_users')
        .select('user_id, role')
        .eq('is_deleted', false)
        .not('user_id', 'is', null);
      if (isOpsDirector && !isSuperAdmin) {
        specialUsersQuery = specialUsersQuery.neq('role', RoleType.SUPER_ADMIN);
      }
      const { data: specialUsers, error: specialUsersError } =
        await specialUsersQuery;
      if (specialUsersError) {
        logger.error('Error fetching special users:', specialUsersError);
        return { data: [], totalCount: 0 };
      }
      if (!specialUsers || specialUsers.length === 0) {
        return { data: [], totalCount: 0 };
      }
      const roleByUserId = new Map<string, string>();
      specialUsers.forEach((specialUser) => {
        if (specialUser.user_id && specialUser.role) {
          roleByUserId.set(specialUser.user_id, specialUser.role);
        }
      });
      const userIds = Array.from(roleByUserId.keys());
      let query = this.supabase
        .from('user')
        .select('*', search ? { count: 'exact' } : undefined)
        .in('id', userIds)
        .eq('is_deleted', false);
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);
      if (error) {
        logger.error('Supabase fetch error:', error);
        return { data: [], totalCount: 0 };
      }
      if (!data) return { data: [], totalCount: 0 };
      const result = data.map((userObject) => {
        const role = roleByUserId.get(userObject.id) || '';
        return {
          user: userObject as TableTypes<'user'>,
          role,
        };
      });
      return { data: result, totalCount: search ? count || 0 : userIds.length };
    }
    if (roles.includes(RoleType.PROGRAM_MANAGER)) {
      const { data: programs, error: programsError } = await this.supabase
        .from('program_user')
        .select('program_id')
        .eq('user', userId)
        .eq('role', RoleType.PROGRAM_MANAGER)
        .eq('is_deleted', false);
      if (programsError) {
        logger.error(
          "Error fetching program manager's programs:",
          programsError,
        );
        return { data: [], totalCount: 0 };
      }
      if (!programs || programs.length === 0) {
        return { data: [], totalCount: 0 };
      }
      const programIds = programs.map((p) => p.program_id);
      const { data: coordinatorLinks, error: coordinatorLinksError } =
        await this.supabase
          .from('program_user')
          .select('user')
          .in('program_id', programIds)
          .eq('role', RoleType.FIELD_COORDINATOR)
          .eq('is_deleted', false)
          .not('user', 'is', null);

      if (coordinatorLinksError) {
        logger.error(
          'Error fetching field coordinator program links:',
          coordinatorLinksError,
        );
        return { data: [], totalCount: 0 };
      }

      const coordinatorUserIds = Array.from(
        new Set(
          (coordinatorLinks ?? [])
            .map((link) => link.user)
            .filter((id): id is string => !!id),
        ),
      );

      if (coordinatorUserIds.length === 0) {
        return { data: [], totalCount: 0 };
      }

      let query = this.supabase
        .from('user')
        .select('*', { count: 'exact' })
        .in('id', coordinatorUserIds)
        .eq('is_deleted', false);
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const {
        data: users,
        count,
        error,
      } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);
      if (error) {
        logger.error('Error fetching field coordinators:', error);
        return { data: [], totalCount: 0 };
      }
      if (!users) {
        return { data: [], totalCount: 0 };
      }
      const result = users.map((userObject) => ({
        user: userObject as TableTypes<'user'>,
        role: RoleType.FIELD_COORDINATOR,
      }));
      return { data: result, totalCount: count || 0 };
    }
    return { data: [], totalCount: 0 };
  }

  async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return {
        total_students: 0,
        total_teachers: 0,
        total_schools: 0,
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
    try {
      const { data, error } = await this.supabase.rpc(
        'get_program_activity_stats',
        {
          p_program_id: programId,
        },
      );

      if (error || !data) {
        logger.error('RPC error:', error);
        return {
          total_students: 0,
          total_teachers: 0,
          total_schools: 0,
          active_student_percentage: 0,
          active_teacher_percentage: 0,
          avg_weekly_time_minutes: 0,
        };
      }
      const stats = data as unknown as {
        total_students: number;
        total_teachers: number;
        total_schools: number;
        active_student_percentage: number;
        active_teacher_percentage: number;
        avg_weekly_time_minutes: number;
      };

      return {
        total_students: stats.total_students ?? 0,
        total_teachers: stats.total_teachers ?? 0,
        total_schools: stats.total_schools ?? 0,
        active_student_percentage: stats.active_student_percentage ?? 0,
        active_teacher_percentage: stats.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: stats.avg_weekly_time_minutes ?? 0,
      };
    } catch (err) {
      logger.error('Unexpected error:', err);
      return {
        total_students: 0,
        total_teachers: 0,
        total_schools: 0,
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
  }

  async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return {
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'get_school_activity_stats',
        {
          p_school_id: schoolId,
        },
      );

      if (error) {
        logger.error('RPC error:', error);
        return {
          active_student_percentage: 0,
          active_teacher_percentage: 0,
          avg_weekly_time_minutes: 0,
        };
      }
      const stats = data as unknown as {
        active_student_percentage: number;
        active_teacher_percentage: number;
        avg_weekly_time_minutes: number;
      };
      return {
        active_student_percentage: stats?.active_student_percentage ?? 0,
        active_teacher_percentage: stats?.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: stats?.avg_weekly_time_minutes ?? 0,
      };
    } catch (err) {
      logger.error('Unexpected error:', err);
      return {
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
  }

  async isProgramManager(): Promise<boolean> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return false;
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not Logged in');
    const userId = _currentUser.id;
    const { data, error } = await this.supabase
      .from('program_user')
      .select('id')
      .eq('user', userId)
      .in('role', ['program_manager'])
      .eq('is_deleted', false)
      .limit(1);
    if (error) {
      logger.error('Error checking program_user table', error);
      return false;
    }
    return !!(data && data.length > 0);
  }

  async getUserSpecialRoles(userId: string): Promise<string[]> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return [];
    }

    if (!userId) {
      logger.warn('userId is missing. Cannot fetch roles.');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('special_users')
        .select('role')
        .eq('user_id', userId)
        .in('role', [
          RoleType.SUPER_ADMIN,
          RoleType.PROGRAM_MANAGER,
          RoleType.FIELD_COORDINATOR,
          RoleType.OPERATIONAL_DIRECTOR,
          RoleType.EXTERNAL_USER,
        ])
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching roles from special_users:', error.message);
        return [];
      }

      const roles = (data ?? [])
        .map((item) => item.role)
        .filter((role): role is NonNullable<typeof role> => role !== null);

      return roles;
    } catch (e) {
      logger.error('Unexpected error while fetching user special roles:', e);
      return [];
    }
  }

  async updateSpecialUserRole(userId: string, role: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await this.supabase
        .from('special_users')
        .update({
          role: role as RoleType.PROGRAM_MANAGER | RoleType.FIELD_COORDINATOR,
          updated_at: updatedAt,
        })
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error updating role in special_users:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while updating user role:', e);
    }
  }
  async deleteSpecialUser(userId: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await this.supabase
        .from('special_users')
        .update({ is_deleted: true })
        .eq('user_id', userId)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error deleting user in special_users:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while deleting user:', e);
    }
  }

  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await this.supabase
        .from('program_user')
        .update({
          role: role as RoleType.PROGRAM_MANAGER | RoleType.FIELD_COORDINATOR,
          updated_at: updatedAt,
        })
        .eq('user', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error updating role in program_user:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while updating user role:', e);
    }
  }

  async deleteProgramUser(userId: string): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await this.supabase
        .from('program_user')
        .update({ is_deleted: true })
        .eq('user', userId)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error deleting user in program_user:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while deleting user:', e);
    }
  }

  async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType,
  ): Promise<void> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await this.supabase
        .from('school_user')
        .update({ is_deleted: true })
        .eq('user_id', userId)
        .eq('role', role)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error deleting user in program_user:', error.message);
      }
    } catch (e) {
      logger.error('Unexpected error while deleting user:', e);
    }
  }
  async getChaptersByIds(
    chapterIds: string[],
  ): Promise<TableTypes<'chapter'>[]> {
    if (!this.supabase) {
      logger.error('getChaptersByIds failed: Supabase client not initialized.');
      return [];
    }

    if (!chapterIds || chapterIds.length === 0) {
      logger.warn('getChaptersByIds was called with no chapter IDs.');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from(TABLES.Chapter)
        .select('*')
        .in('id', chapterIds)
        .eq('is_deleted', false);

      if (error) {
        logger.warn('Error fetching chapters by IDs:', chapterIds);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching chapters', error);
      return [];
    }
  }
  async getChapterIdbyQrLink(
    link: string,
  ): Promise<TableTypes<'chapter_links'> | undefined> {
    throw new Error('Method not implemented.');
  }
  async addParentToNewClass(classID: string, studentId: string) {
    try {
      if (!this.supabase) return;
      const { error } = await this.supabase.rpc('add_parent_to_newclass', {
        _class_id: classID,
        _student_id: studentId,
      });

      if (error) {
        logger.error('Failed to add parent to class:', error.message);
      }
    } catch (error) {
      logger.error('Error in addParentToNewClass:', error);
    }
  }

  async getOpsRequests(
    requestStatus: EnumType<'ops_request_status'>,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at',
    orderDir: 'asc' | 'desc' = 'asc',
    filters?: {
      request_type?: EnumType<'ops_request_type'>[];
      school?: string[];
    },
    searchTerm?: string,
  ): Promise<{
    data: any[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      if (!this.supabase)
        return { data: [], total: 0, totalPages: 0, page, limit };

      const { data, error } = await this.supabase.rpc('get_ops_requests', {
        p_request_status: requestStatus,
        p_page: page,
        p_limit: limit,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_request_types: filters?.request_type?.length
          ? filters.request_type
          : undefined,
        p_school_ids: filters?.school?.length ? filters.school : undefined,
        p_search_term: searchTerm ?? undefined,
      });

      if (error) throw error;

      const response =
        data && typeof data === 'object' && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : {};

      return {
        data: Array.isArray(response.data) ? response.data : [],
        total: typeof response.total === 'number' ? response.total : 0,
        totalPages:
          typeof response.totalPages === 'number' ? response.totalPages : 0,
        page: typeof response.page === 'number' ? response.page : page,
        limit: typeof response.limit === 'number' ? response.limit : limit,
      };
    } catch (err) {
      logger.error('Error in getOpsRequests:', err);
      return { data: [], total: 0, totalPages: 0, page, limit };
    }
  }

  async getRequestFilterOptions() {
    try {
      if (!this.supabase) return null;

      const [requestTypeResponse, schoolResponse] = await Promise.all([
        this.supabase
          .from(TABLES.OpsRequests)
          .select('request_type')
          .eq('is_deleted', false),

        this.supabase
          .from(TABLES.OpsRequests)
          .select('school_id, school:school(id, name)')
          .eq('is_deleted', false)
          .not('school_id', 'is', null),
      ]);

      if (requestTypeResponse.error) {
        logger.error(
          'Failed to fetch request types:',
          requestTypeResponse.error.message,
        );
        throw requestTypeResponse.error;
      }

      if (schoolResponse.error) {
        logger.error('Failed to fetch schools:', schoolResponse.error.message);
        throw schoolResponse.error;
      }
      // 1. Get unique request types
      const allRequestTypes = (requestTypeResponse.data || []).map(
        (item) => item.request_type,
      );
      const uniqueRequestTypes = [...new Set(allRequestTypes)];

      // 2. Get unique schools with id and name
      const schoolMap = new Map<string, { id: string; name: string }>();

      ((schoolResponse.data as any[]) || []).forEach((item) => {
        if (item.school && item.school.id && item.school.name) {
          schoolMap.set(item.school.id, {
            id: item.school.id,
            name: item.school.name,
          });
        }
      });

      const uniqueSchools = Array.from(schoolMap.values());

      return {
        requestType: uniqueRequestTypes,
        school: uniqueSchools,
      };
    } catch (error) {
      logger.error('Error in getRequestFilterOptions:', error);
      throw error;
    }
  }
  async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number,
    classId?: string,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    if (!this.supabase) {
      return { data: [], total: 0 };
    }
    // Empty program class scopes should return an empty search result.
    if (!classId && classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }

    const supabase = this.supabase;

    return new Promise((resolve) => {
      if (this.searchStudentsTimer) {
        clearTimeout(this.searchStudentsTimer);
      }

      this.searchStudentsTimer = setTimeout(async () => {
        try {
          let classQuery = supabase
            .from('class')
            .select('id, name')
            .eq('school_id', schoolId)
            .eq('is_deleted', false);

          if (classId) {
            classQuery = classQuery.eq('id', classId);
          } else if (classIds && classIds.length > 0) {
            // Applies program class scope while preserving the class-detail override.
            classQuery = classQuery.in('id', classIds);
          }

          const { data: classData } = await classQuery;

          const schoolClassIds = (classData ?? []).map(
            (classRow) => classRow.id,
          );

          if (schoolClassIds.length === 0) {
            resolve({ data: [], total: 0 });
            return;
          }

          const studentFilter = `name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`;

          // ? ADDED phone IN SELECT
          const { data: studentRows } = await supabase
            .from('class_user')
            .select(
              `
              class_id,
              user:user_id!inner (
                id,
                name,
                email,
                phone,
                gender,
                student_id
              )
            `,
            )
            .in('class_id', schoolClassIds)
            .eq('role', 'student')
            .eq('is_deleted', false)
            .or(studentFilter, {
              foreignTable: 'user',
            });

          const parentFilter = `phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`;

          const { data: parentRowsRaw } = await (supabase
            .from('class_user')
            .select(
              `
                user:user_id!inner (
                  id,
                  phone,
                  email,
                  is_wa_contact
                )
            `,
            )
            .in('class_id', schoolClassIds)
            .eq('role', 'parent')
            .eq('is_deleted', false)
            .or(parentFilter, {
              foreignTable: 'user',
            }) as any);
          const parentRows = (parentRowsRaw ?? []) as Array<{
            user?: { id?: string | null } | null;
          }>;
          const parentIds = parentRows
            .map((row) => String(row?.user?.id ?? '').trim())
            .filter((id) => id.length > 0);

          type StudentSearchRow = {
            class_id: string;
            user: {
              id: string;
              name?: string | null;
              email?: string | null;
              phone?: string | null;
              gender?: string | null;
              student_id?: string | null;
            };
          };
          let parentLinkedStudents: StudentSearchRow[] = [];
          type ParentSearchContact = {
            phone?: string | null;
            email?: string | null;
            is_wa_contact?: string | boolean | null;
          };
          const parentContactsByStudentId = new Map<
            string,
            ParentSearchContact[]
          >();
          const addParentContact = (
            studentId: string | null | undefined,
            parent: ParentSearchContact | null | undefined,
          ) => {
            const normalizedStudentId = String(studentId ?? '').trim();
            if (!normalizedStudentId || !parent) return;

            const currentParents =
              parentContactsByStudentId.get(normalizedStudentId) ?? [];
            // For search results we only need unique phone/email contact entries.
            const alreadyAdded = currentParents.some(
              (existingParent) =>
                (existingParent.phone &&
                  parent.phone &&
                  existingParent.phone === parent.phone) ||
                (existingParent.email &&
                  parent.email &&
                  existingParent.email === parent.email),
            );
            if (alreadyAdded) return;

            parentContactsByStudentId.set(normalizedStudentId, [
              ...currentParents,
              parent,
            ]);
          };

          if (parentIds.length > 0) {
            const { data: parentLinksRaw } = await supabase
              .from('parent_user')
              .select(
                `
                student_id,
                parent:parent_id (
                  phone,
                  email,
                  is_wa_contact
                )
              `,
              )
              .in('parent_id', parentIds)
              .eq('is_deleted', false);
            const parentLinks = (parentLinksRaw ?? []) as Array<{
              student_id?: string | null;
              parent?: {
                phone?: string | null;
                email?: string | null;
                is_wa_contact?: string | boolean | null;
              } | null;
            }>;

            const studentIds = parentLinks
              .map((link) => String(link?.student_id ?? '').trim())
              .filter((id) => id.length > 0);

            parentLinks.forEach((link) => {
              addParentContact(link.student_id, {
                phone: link.parent?.phone ?? null,
                email: link.parent?.email ?? null,
                is_wa_contact: link.parent?.is_wa_contact ?? null,
              });
            });

            if (studentIds.length > 0) {
              const { data } = await supabase
                .from('class_user')
                .select(
                  `
                  class_id,
                  user:user_id!inner (
                    id,
                    name,
                    email,
                    phone,
                    gender,
                    student_id
                  )
                `,
                )
                .in('class_id', schoolClassIds)
                .eq('role', 'student')
                .in('user_id', studentIds)
                .eq('is_deleted', false);

              parentLinkedStudents = (data ??
                []) as object[] as StudentSearchRow[];
            }
          }

          const allRows = [
            ...((studentRows ?? []) as object[] as StudentSearchRow[]),
            ...parentLinkedStudents,
          ];

          const uniqueMap = new Map<string, StudentSearchRow>();

          allRows.forEach((row) => {
            uniqueMap.set(row.user.id, row);
          });

          const mergedRows = Array.from(uniqueMap.values());
          // ? GET ALL STUDENT IDS
          const allStudentIds = mergedRows.map((r) => r.user.id);

          // Fetch every linked parent contact for matched students.
          if (allStudentIds.length > 0) {
            const { data: allParentLinksRaw } = await supabase
              .from('parent_user')
              .select(
                `
        student_id,
        parent:parent_id (
          phone,
          email,
          is_wa_contact
        )
      `,
              )
              .in('student_id', allStudentIds)
              .eq('is_deleted', false);
            const allParentLinks = (allParentLinksRaw ?? []) as Array<{
              student_id?: string | null;
              parent?: {
                phone?: string | null;
                email?: string | null;
                is_wa_contact?: string | boolean | null;
              } | null;
            }>;

            allParentLinks.forEach((link) => {
              addParentContact(link.student_id, {
                phone: link.parent?.phone ?? null,
                email: link.parent?.email ?? null,
                is_wa_contact: link.parent?.is_wa_contact ?? null,
              });
            });
          }
          const offset = (page - 1) * limit;

          const pagedRows = mergedRows.slice(offset, offset + limit);
          const result = pagedRows.map((row) => {
            const classInfo = classData?.find((c) => c.id === row.class_id);

            const className = classInfo?.name ?? '';

            const { grade, section } = this.parseClassName(className);

            const parentContacts =
              parentContactsByStudentId.get(row.user.id) ?? [];
            const parentContact = parentContacts[0] ?? {};

            // ? FALLBACK FLATTEN LOGIC (ONLY ADDITION)
            const phone = row.user.phone || parentContact.phone || '';

            const email = row.user.email || parentContact.email || '';
            return {
              user: {
                id: row.user.id,
                name: row.user.name,
                student_id: row.user.student_id,
                gender: row.user.gender,
                phone,
                email,
              },

              parent: {
                phone: parentContact.phone ?? null,
                email: parentContact.email ?? null,
                is_wa_contact: parentContact.is_wa_contact ?? null,
              },
              parents: parentContacts,

              class_id: row.class_id,
              class_name: className,
              classWithidname: {
                id: row.class_id,
                class_name: className,
              },
              grade,
              classSection: section,
            };
          });

          resolve({
            data: result,
            total: mergedRows.length,
          });
        } catch (err) {
          logger.error(err);
          resolve({ data: [], total: 0 });
        }
      }, 400);
    });
  }
  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    if (!this.supabase) return { data: [], total: 0 };
    // Empty program class scopes should return an empty search result.
    if (classIds && classIds.length === 0) return { data: [], total: 0 };
    try {
      // Step 1: Get all class ids for the school.
      let classQuery = this.supabase
        .from(TABLES.Class)
        .select('id, name')
        .eq('school_id', schoolId)
        .eq('is_deleted', false);

      if (classIds && classIds.length > 0) {
        // Applies program class scope before searching teacher memberships.
        classQuery = classQuery.in('id', classIds);
      }

      const { data: classData, error: classError } = await classQuery;
      if (classError || !classData) {
        logger.error('Error fetching classes for school:', classError);
        return { data: [], total: 0 };
      }
      const schoolClassIds = classData.map((row) => row.id);
      if (schoolClassIds.length === 0) return { data: [], total: 0 };

      const classNameById = new Map<string, string>(
        classData.map((row) => [
          String(row?.id ?? '').trim(),
          String(row?.name ?? '').trim(),
        ]),
      );

      // Step 2: Get class_user links for teacher membership in this school.
      const { data: classUserLinks, error: classUserError } =
        await this.supabase
          .from(TABLES.ClassUser)
          .select('class_id, user_id')
          .in('class_id', schoolClassIds)
          .eq('role', 'teacher')
          .eq('is_deleted', false);
      if (classUserError || !classUserLinks) {
        logger.error('Error fetching class_user rows:', classUserError);
        return { data: [], total: 0 };
      }

      // Keep one stable class per teacher (alphabetically by class name).
      const primaryClassByTeacher = new Map<string, string>();
      for (const row of classUserLinks) {
        const teacherId = String(row?.user_id ?? '').trim();
        const nextClassId = String(row?.class_id ?? '').trim();
        if (!teacherId || !nextClassId) continue;

        const existingClassId = primaryClassByTeacher.get(teacherId);
        if (!existingClassId) {
          primaryClassByTeacher.set(teacherId, nextClassId);
          continue;
        }

        const existingClassName =
          classNameById.get(existingClassId) || existingClassId;
        const nextClassName = classNameById.get(nextClassId) || nextClassId;
        if (
          nextClassName.localeCompare(existingClassName, undefined, {
            sensitivity: 'base',
          }) < 0
        ) {
          primaryClassByTeacher.set(teacherId, nextClassId);
        }
      }

      const allTeacherIds = Array.from(primaryClassByTeacher.keys());
      if (allTeacherIds.length === 0) return { data: [], total: 0 };

      // Step 3: Load teacher users and apply name search on user table.
      const { data: matchedTeachers, error: teacherUsersError } =
        await this.supabase
          .from(TABLES.User)
          .select('id, name, gender, email, phone')
          .in('id', allTeacherIds)
          .eq('is_deleted', false)
          .ilike('name', `%${searchTerm}%`);
      if (teacherUsersError) {
        logger.error(
          'Error fetching teacher users for search:',
          teacherUsersError,
        );
        return { data: [], total: 0 };
      }

      const sortedTeachers = (matchedTeachers || [])
        .map((teacher) => ({
          id: String(teacher?.id ?? '').trim(),
          name: String(teacher?.name ?? '').trim(),
          gender: teacher?.gender ?? null,
          email: teacher?.email ?? null,
          phone: teacher?.phone ?? null,
        }))
        .filter((teacher) => teacher.id.length > 0)
        .sort(
          (a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
            a.id.localeCompare(b.id),
        );

      const total = sortedTeachers.length;
      const offset = (page - 1) * limit;
      const pagedTeachers = sortedTeachers.slice(offset, offset + limit);
      const teacherIds = pagedTeachers.map((teacher) => teacher.id);

      // Step 4: Get parent info for paged teachers.
      let parentInfoMap: Record<
        string,
        {
          parent_id: string;
          parent_name: string | null;
          parent_phone: string | null;
        }
      > = {};
      if (teacherIds.length > 0) {
        const { data: parentUserData, error: parentUserError } =
          await this.supabase
            .from(TABLES.ParentUser)
            .select('parent_id, student_id')
            .in('student_id', teacherIds)
            .eq('is_deleted', false);
        if (!parentUserError && parentUserData && parentUserData.length > 0) {
          const parentIds = parentUserData.map((row: any) => row.parent_id);
          let parentDetailsMap: Record<
            string,
            { name: string | null; phone: string | null }
          > = {};
          if (parentIds.length > 0) {
            const { data: parentDetails, error: parentDetailsError } =
              await this.supabase
                .from(TABLES.User)
                .select('id, name, phone')
                .in('id', parentIds)
                .eq('is_deleted', false);
            if (
              !parentDetailsError &&
              parentDetails &&
              parentDetails.length > 0
            ) {
              for (const parent of parentDetails) {
                parentDetailsMap[parent.id] = {
                  name: parent.name ?? null,
                  phone: parent.phone ?? null,
                };
              }
            }
          }
          for (const row of parentUserData) {
            parentInfoMap[row.student_id] = {
              parent_id: row.parent_id,
              parent_name: parentDetailsMap[row.parent_id]?.name ?? null,
              parent_phone: parentDetailsMap[row.parent_id]?.phone ?? null,
            };
          }
        }
      }

      // Step 5: Build result objects (with parent info).
      const result = pagedTeachers.map((teacherUser) => {
        const teacherId = teacherUser.id;
        const classId = primaryClassByTeacher.get(teacherId) ?? '';
        const className = classNameById.get(classId) ?? '';
        const { grade, section } = this.parseClassName(className);
        const parentInfo = parentInfoMap[teacherId] ?? null;
        return {
          id: teacherId,
          name: teacherUser.name,
          gender: teacherUser.gender ?? null,
          email: teacherUser.email,
          phone: teacherUser.phone,
          class_id: classId,
          class_name: className,
          grade,
          classSection: section,
          parent: parentInfo,
        };
      });
      return { data: result, total };
    } catch (err) {
      logger.error('Error searching teachers in school:', err);
      return { data: [], total: 0 };
    }
  }
  async approveOpsRequest(
    requestId: string, //request row Id
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    if (!this.supabase) return undefined;

    const normalizedRole = (role ?? '').toString().toLowerCase();
    const resolvedRole =
      normalizedRole === RequestTypes.PRINCIPAL && classId
        ? RequestTypes.TEACHER
        : normalizedRole;

    // Build update payload dynamically
    const updatePayload: any = {
      request_status: 'approved',
      responded_by: respondedBy,
      request_type: resolvedRole,
      updated_at: new Date().toISOString(),
    };

    if (schoolId) {
      updatePayload.school_id = schoolId;
    }

    if (classId) {
      updatePayload.class_id = classId;
    } else if (resolvedRole === RequestTypes.PRINCIPAL) {
      updatePayload.class_id = null;
    }
    const { data, error } = await this.supabase
      .from('ops_requests')
      .update(updatePayload)
      .or(`id.eq.${requestId},request_id.eq.${requestId}`)
      .eq('is_deleted', false)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('Error approving ops_request:', error);
      return undefined;
    }

    return data as TableTypes<'ops_requests'>;
  }
  async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    if (!this.supabase) return undefined;

    const updatePayload: any = {
      request_status: status,
      responded_by: respondedBy,
      updated_at: new Date().toISOString(),
    };
    if (rejectedReasonType) {
      updatePayload.rejected_reason_type = rejectedReasonType;
    }
    if (rejectedReasonDescription) {
      updatePayload.rejected_reason_description = rejectedReasonDescription;
    }

    const { data, error } = await this.supabase
      .from('ops_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .eq('is_deleted', false)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('Error responding to school_request:', error);
      return undefined;
    }

    return data as TableTypes<'ops_requests'>;
  }

  async getProgramsByRole(): Promise<{ data: TableTypes<'program'>[] }> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return { data: [] };
    }

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User not logged in');

    const userId = _currentUser.id;
    const roles: string[] = store.getState().auth.roles ?? [];
    const isSuperAdmin = roles.includes(RoleType.SUPER_ADMIN);
    const isOpsDirector = roles.includes(RoleType.OPERATIONAL_DIRECTOR);

    // Case 1: Super Admin or Ops Director ? fetch ALL programs
    if (isSuperAdmin || isOpsDirector) {
      const { data, error } = await this.supabase
        .from('program')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching programs:', error);
        return { data: [] };
      }
      return { data: data || [] };
    }

    // Case 2: Program Manager ? fetch only programs assigned to them
    if (roles.includes(RoleType.PROGRAM_MANAGER)) {
      const { data: programUsers, error: programUsersError } =
        await this.supabase
          .from('program_user')
          .select('program_id')
          .eq('user', userId)
          .eq('role', RoleType.PROGRAM_MANAGER)
          .eq('is_deleted', false);

      if (programUsersError) {
        logger.error('Error fetching program_user entries:', programUsersError);
        return { data: [] };
      }
      if (!programUsers || programUsers.length === 0) {
        return { data: [] };
      }
      const programIds = programUsers.map((p) => p.program_id);
      const { data: programs, error } = await this.supabase
        .from('program')
        .select('*')
        .in('id', programIds)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching programs for program manager:', error);
        return { data: [] };
      }
      return { data: programs || [] };
    }

    return { data: [] };
  }

  async getFieldCoordinatorsByProgram(
    programId: string,
  ): Promise<{ data: TableTypes<'user'>[] }> {
    if (!this.supabase) return { data: [] };
    if (!programId) return { data: [] };

    const { data: programUsers, error: linkError } = await this.supabase
      .from('program_user')
      .select('user')
      .eq('program_id', programId)
      .eq('role', RoleType.FIELD_COORDINATOR)
      .eq('is_deleted', false);

    if (linkError || !programUsers?.length) {
      logger.error('Error fetching program_user:', linkError);
      return { data: [] };
    }
    const userIds = programUsers
      .map((pu) => pu.user)
      .filter((id): id is string => !!id);
    const { data: users, error: userError } = await this.supabase
      .from('user')
      .select('*')
      .in('id', userIds)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (userError) {
      logger.error('Error fetching users:', userError);
      return { data: [] };
    }
    return { data: users || [] };
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
    if (!this.supabase) return;

    const updatePayload: any = {
      status: schoolStatus,
      updated_at: new Date().toISOString(),
    };

    if (address?.state !== undefined) updatePayload.group1 = address.state;
    if (address?.district !== undefined)
      updatePayload.group2 = address.district;
    if (address?.block !== undefined) updatePayload.group3 = address.block;
    if (address?.address !== undefined) updatePayload.group4 = address.address;

    if (keyContacts) {
      updatePayload.key_contacts = JSON.stringify(keyContacts);
    }
    const { error } = await this.supabase
      .from('school')
      .update(updatePayload)
      .eq('id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error updating school status:', error);
    }
  }
  async getGeoData(params: GeoDataParams): Promise<string[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase.rpc('get_geo_data', params);

    if (error || !data) {
      logger.error("RPC 'get_geo_data' failed with params:", params, error);
      return [];
    }
    return data || [];
  }
  async getClientCountryCode(): Promise<any> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase.rpc('get_client_country_code');
    if (error) {
      logger.error('Error fetching geo data:', error);
      return null;
    }
    return data;
  }
  async getLocaleByIdOrCode(
    locale_id?: string,
    locale_code?: string,
  ): Promise<TableTypes<'locale'> | null> {
    if (!this.supabase) {
      return null;
    }
    let query = this.supabase
      .from('locale')
      .select('*')
      .eq('is_deleted', false);

    if (locale_id) {
      query = query.eq('id', locale_id);
    } else if (locale_code) {
      query = query.eq('code', locale_code);
    } else {
      return null;
    }
    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      logger.error('getLocaleByIdOrCode error:', error);
      throw error;
    }

    return data;
  }

  async searchSchools(
    params: SearchSchoolsParams,
  ): Promise<SearchSchoolsResult> {
    if (!this.supabase) {
      logger.error('Supabase client is not available.');
      return { total_count: 0, schools: [] };
    }

    const { data, error } = await this.supabase.rpc('search_schools', params);

    if (error) {
      logger.error("RPC 'search_schools' failed:", params, error);
      return { total_count: 0, schools: [] };
    }
    const resultRow = Array.isArray(data) ? data[0] : data;
    logger.info('searchSchools result:', data);
    return {
      total_count: resultRow.total_count,
      schools: (resultRow.schools as School[]) ?? [],
    };
  }

  async sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string,
  ): Promise<void> {
    if (!this.supabase) throw new Error('Supabase instance is not initialized');

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error('User is not Logged in');
    const now = new Date().toISOString();
    const { error } = await this.supabase.from('ops_requests').insert([
      {
        school_id: schoolId,
        class_id: classId,
        request_type: requestType,
        requested_by: currentUser.id,
        request_status: STATUS.REQUESTED,
        rejected_reason_description: '',
        rejected_reason_type: '',
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
    ]);

    if (error) {
      logger.error('? Error inserting join school request:', error);
      throw error;
    }
  }
  async getAllClassesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'class'>[]> {
    if (!this.supabase) return [];

    const { data: classes, error } = await this.supabase.rpc(
      'get_classes_by_school_id',
      {
        school_id_input: schoolId,
      },
    );
    if (error) {
      logger.error('Error fetching classes by school ID:', error);
      return [];
    }
    return classes || [];
  }
  async getRewardById(
    rewardId: string,
  ): Promise<TableTypes<'rive_reward'> | undefined> {
    if (!this.supabase) return undefined;
    try {
      const { data, error } = await this.supabase
        .from('rive_reward')
        .select('*')
        .eq('id', rewardId)
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error fetching reward by ID:', error);
      }
      return data && data.length > 0
        ? (data[0] as TableTypes<'rive_reward'>)
        : undefined;
    } catch (error) {
      logger.error('Unexpected error fetching reward by ID:', error);
      return undefined;
    }
  }
  async getAllRewards(): Promise<TableTypes<'rive_reward'>[] | []> {
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase
        .from(TABLES.RiveReward)
        .select('*')
        .eq('type', 'normal')
        .eq('is_deleted', false)
        .order('state_number_input');

      if (error) {
        logger.error('Error fetching all rewards', error);
        return [];
      }
      return data as TableTypes<'rive_reward'>[];
    } catch (error) {
      logger.error('Error fetching all rewards', error);
      return [];
    }
  }
  async updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string,
  ): Promise<void> {
    if (!this.supabase) return;
    try {
      const currentUser = (await this.getUserByDocId(
        userId,
      )) as TableTypes<'user'> | null;
      if (!currentUser) {
        logger.warn(`No user found`);
        return;
      }

      const timestamp = created_at ?? new Date().toISOString();

      const newReward = {
        reward_id: rewardId,
        timestamp: timestamp,
      };
      const rewardString = JSON.stringify(newReward);

      // Update the same currentUser object
      currentUser.reward = rewardString;
      const { error } = await this.supabase
        .from('user')
        .update({ reward: currentUser.reward, updated_at: timestamp })
        .eq('id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error updating user reward:', error);
        return;
      }
      Util.setCurrentStudent(currentUser);
    } catch (error) {
      logger.error('? Error updating user reward:', error);
    }
  }
  async getActiveStudentsCountByClass(
    classId: string,
    days: number = 7,
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    const { data, error } = await this.supabase.rpc(
      'get_active_students_count_by_class',
      {
        p_class_id: classId,
        p_days: days,
      },
    );
    if (error) {
      logger.error('Error fetching active students count:', error);
      throw error;
    }
    return (data ?? 0).toString();
  }
  async getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[],
  ): Promise<{ subject_id: string; completed_count: number }[]> {
    if (!this.supabase) return [];

    try {
      // Query to get count of completed lessons per subject for the student for given subjects
      const { data, error } = await this.supabase
        .from('result')
        .select('lesson:lesson_id(subject_id)')
        .eq('student_id', studentId)
        .in('lesson.subject_id', subjectIds)
        .is('is_deleted', false);

      if (error) {
        logger.error('Error fetching completed homework counts:', error);
        return [];
      }

      // Aggregate counts by subject_id
      const completedCountMap: { [key: string]: number } = {};
      data.forEach((row: any) => {
        const subjId = row.lesson.subject_id;
        completedCountMap[subjId] = (completedCountMap[subjId] || 0) + 1;
      });

      return Object.entries(completedCountMap).map(
        ([subject_id, completed_count]) => ({
          subject_id,
          completed_count,
        }),
      );
    } catch (err) {
      logger.error('Exception in getCompletedHomeworkCountForSubjects:', err);
      return [];
    }
  }
  async deleteApprovedOpsRequestsForUser(
    userId: string,
    schoolId?: string,
    classId?: string,
  ): Promise<void> {
    if (!this.supabase) return;

    let query = this.supabase
      .from('ops_requests')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('requested_by', userId)
      .eq('request_status', 'approved')
      .eq('is_deleted', false);

    if (schoolId) query = query.eq('school_id', schoolId);
    if (classId) query = query.eq('class_id', classId);

    const { error } = await query;

    if (error) {
      logger.error('Error deleting approved ops_requests:', error);
    }
  }

  async getOrcreateschooluser(
    params: UserSchoolClassParams,
  ): Promise<UserSchoolClassResult> {
    if (!this.supabase) throw new Error('Supabase client is not initialized.');
    const { name, phoneNumber, email, schoolId, role, classId } = params;
    if (!role)
      throw new Error('A role is required to link a user to a school.');
    const classIds: string[] = classId
      ? Array.isArray(classId)
        ? classId
        : [classId]
      : [];
    const timestamp = new Date().toISOString();
    const norm = (v: any) =>
      String(v ?? '')
        .trim()
        .toLowerCase();
    const roleNorm = norm(role);
    const isPrincipalRole =
      roleNorm === norm(RoleType.PRINCIPAL) || roleNorm === 'principal';
    const isTeacherRole =
      roleNorm === norm(RoleType.TEACHER) || roleNorm === 'teacher';
    logger.info('Invoking get_or_create_user with:', {
      name,
      phone: phoneNumber,
      email,
    });
    const { data, error } = await this.supabase.functions.invoke(
      'get_or_create_user',
      {
        body: { name, phone: phoneNumber, email: email },
      },
    );
    if (error) {
      logger.error('user-upsert failed:', error);
      throw error;
    }
    if (!data || !data.user) {
      logger.error('Invalid response from user-upsert:', data);
      throw new Error('Invalid response from user-upsert');
    }
    const { message, user } = data as {
      message: string;
      user: { id: string; [key: string]: any };
    };
    const isNewUser = message === 'success-created';
    const dedupeAndPickLatest = async (
      table: 'school_user' | 'class_user',
      rows: any[],
    ) => {
      if (!rows || rows.length === 0) return null;
      if (rows.length === 1) return rows[0];
      const keep = rows[0];
      const toDelete = rows
        .slice(1)
        .map((r) => r.id)
        .filter(Boolean);
      if (toDelete.length) {
        const { error: dedupeErr } = await this.supabase!.from(table)
          .update({ is_deleted: true, updated_at: timestamp })
          .in('id', toDelete);
        if (dedupeErr) {
          logger.error(`Failed to dedupe ${table}:`, dedupeErr);
          throw dedupeErr;
        }
      }
      return keep;
    };
    let effectiveSchoolId: string | undefined = schoolId;
    if (!effectiveSchoolId && classIds.length > 0) {
      const { data: clsRows, error: clsErr } = await this.supabase
        .from('class')
        .select('id, school_id')
        .in('id', classIds)
        .order('id', { ascending: true });

      if (clsErr) {
        logger.error('Failed to resolve school_id from classIds:', clsErr);
        throw clsErr;
      }

      const schoolIds = Array.from(
        new Set((clsRows ?? []).map((r: any) => r.school_id).filter(Boolean)),
      );

      if (schoolIds.length === 0) {
        throw new Error('Unable to resolve school for the given classId(s).');
      }
      if (schoolIds.length > 1) {
        throw new Error(
          'Given classId(s) belong to multiple schools. Not allowed.',
        );
      }

      effectiveSchoolId = schoolIds[0];
    }

    if (!effectiveSchoolId && (isPrincipalRole || isTeacherRole)) {
      throw new Error(
        'schoolId is required (or classId must be provided) to enforce role rules.',
      );
    }

    if (isPrincipalRole && effectiveSchoolId) {
      const { data: teacherCU, error: teacherCUErr } = await this.supabase
        .from('class_user')
        .select('id, class_id, role, updated_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .in('role', [RoleType.TEACHER, 'teacher'])
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false });

      if (teacherCUErr) {
        logger.error('Failed to fetch teacher class_user rows:', teacherCUErr);
        throw teacherCUErr;
      }

      const teacherClassIds = (teacherCU ?? [])
        .map((r: any) => r.class_id)
        .filter(Boolean);

      if (teacherClassIds.length > 0) {
        const { data: match, error: matchErr } = await this.supabase
          .from('class')
          .select('id')
          .eq('school_id', effectiveSchoolId)
          .in('id', teacherClassIds)
          .order('id', { ascending: true })
          .limit(1);

        if (matchErr) {
          logger.error(
            'Failed to check teacher classes against school:',
            matchErr,
          );
          throw matchErr;
        }

        if (match && match.length > 0) {
          throw new Error(
            'This user is already a Teacher in this school and cannot be made Principal for the same school.',
          );
        }
      }
    }

    if (isTeacherRole && effectiveSchoolId) {
      const { data: principalRows, error: principalErr } = await this.supabase
        .from('school_user')
        .select('id, role, updated_at, created_at')
        .eq('school_id', effectiveSchoolId)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .in('role', [RoleType.PRINCIPAL, 'principal'])
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(10);

      if (principalErr) {
        logger.error(
          'Failed to check principal role in school_user:',
          principalErr,
        );
        throw principalErr;
      }

      const principalSchoolUser = await dedupeAndPickLatest(
        'school_user',
        principalRows ?? [],
      );
      if (principalSchoolUser) {
        throw new Error(
          'This user is already Principal in this school and cannot be added as Teacher for the same school.',
        );
      }
    }
    let schoolUser: any | null = null;

    if (effectiveSchoolId && isPrincipalRole) {
      const { data: existingRows, error: fetchSchoolUserErr } =
        await this.supabase
          .from('school_user')
          .select('*')
          .eq('school_id', effectiveSchoolId)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(10);

      if (fetchSchoolUserErr) {
        logger.error('Failed to fetch school_user:', fetchSchoolUserErr);
        throw fetchSchoolUserErr;
      }

      const existingSchoolUser = await dedupeAndPickLatest(
        'school_user',
        existingRows ?? [],
      );

      if (existingSchoolUser) {
        const { data: updatedRows, error: updateErr } = await this.supabase
          .from('school_user')
          .update({ role, is_deleted: false, updated_at: timestamp })
          .eq('id', existingSchoolUser.id)
          .select('*');

        if (updateErr) {
          logger.error('Failed to update school_user:', updateErr);
          throw updateErr;
        }

        schoolUser = updatedRows?.[0] ?? existingSchoolUser;
      } else {
        const payload = {
          id: uuidv4(),
          school_id: effectiveSchoolId,
          user_id: user.id,
          role,
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        };

        const { data: insertedRows, error: insertErr } = await this.supabase
          .from('school_user')
          .insert([payload])
          .select('*');

        if (insertErr) {
          logger.error('Failed to insert school_user:', insertErr);
          throw insertErr;
        }

        schoolUser = insertedRows?.[0] ?? null;
      }
    }
    const classUsers: any[] = [];
    for (const classIdItem of classIds) {
      const { data: existingRows, error: fetchClassUserErr } =
        await this.supabase
          .from('class_user')
          .select('*')
          .eq('class_id', classIdItem)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(10);
      if (fetchClassUserErr) {
        logger.error('Failed to fetch class_user:', fetchClassUserErr);
        throw fetchClassUserErr;
      }
      const existingClassUser = await dedupeAndPickLatest(
        'class_user',
        existingRows ?? [],
      );
      if (existingClassUser) {
        const { data: updatedRows, error: updateErr } = await this.supabase
          .from('class_user')
          .update({ role, is_deleted: false, updated_at: timestamp })
          .eq('id', existingClassUser.id)
          .select('*');
        if (updateErr) {
          logger.error('Failed to update class_user:', updateErr);
          throw updateErr;
        }
        classUsers.push(updatedRows?.[0] ?? existingClassUser);
      } else {
        const payload = {
          id: uuidv4(),
          class_id: classIdItem,
          user_id: user.id,
          role,
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        };

        const { data: insertedRows, error: insertErr } = await this.supabase
          .from('class_user')
          .insert([payload])
          .select('*');

        if (insertErr) {
          logger.error('Failed to insert class_user:', insertErr);
          throw insertErr;
        }

        classUsers.push(insertedRows?.[0]);
      }
    }

    if (classIds.length > 0) {
      await this.updateClassAndSchoolLastModified(classIds, effectiveSchoolId);
    }

    return { user, schoolUser, classUsers, isNewUser };
  }

  async createAtSchoolUser(
    schoolId: string,
    schoolName: string,
    udise: string,
    roleType: RoleType,
    isEmailVerified: boolean,
  ): Promise<void> {
    if (!this.supabase) return;

    schoolName = schoolName?.trim().split(/\s+/)[0].toLowerCase() || '';

    const schoolUdise = udise ? `${udise}${schoolName}@chimple.net` : '';

    const { data: apiData, error: apiError } =
      await this.supabase.functions.invoke('get_or_create_user', {
        body: {
          name: schoolName,
          phone: '',
          email: schoolUdise,
          is_email_verified: isEmailVerified,
        },
      });

    if (apiError) {
      logger.error('user-upsert failed:', apiError);
      throw apiError;
    }

    if (!apiData?.user) {
      throw new Error('Invalid response from user-upsert');
    }

    const userId = apiData.user.id;

    const insertPayload = {
      school_id: schoolId,
      user_id: userId,
      role: roleType,
      is_deleted: false,
      updated_at: new Date().toISOString(),
    };

    const updatePayload = {
      user_id: userId,
      role: roleType,
      is_deleted: false,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await this.supabase
      .from('school_user')
      .select('id')
      .eq('school_id', schoolId)
      .eq('role', roleType)
      .maybeSingle();

    if (!existing) {
      const { error } = await this.supabase
        .from('school_user')
        .insert(insertPayload);

      if (error) {
        logger.error('Error inserting at_school/hybrid user:', error);
      }
    } else {
      const { error } = await this.supabase
        .from('school_user')
        .update(updatePayload)
        .eq('id', existing.id);

      if (error) {
        logger.error('Error updating at_school/hybrid user:', error);
      }
    }
  }

  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any,
  ): Promise<void> {
    if (!this.supabase) return;
    const insertPayload: any = {
      model: schoolModel,
      updated_at: new Date().toISOString(),
    };

    if (locationLink !== undefined && locationLink !== null) {
      insertPayload.location_link = locationLink;
    }

    if (keyContacts) {
      insertPayload.key_contacts = JSON.stringify(keyContacts);
    }

    const { error } = await this.supabase
      .from('school')
      .update(insertPayload)
      .eq('id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error inserting school details:', error);
    }
  }
  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    // Delete all existing course for this class
    const { error: deleteError } = await this.supabase
      .from('class_course')
      .update({ is_deleted: true, updated_at: now })
      .eq('class_id', classId)
      .eq('is_deleted', false);

    if (deleteError) {
      logger.error('Error removing old class_course entries:', deleteError);
      throw deleteError;
    }

    // Insert the new course
    if (selectedCourseIds.length > 0) {
      const newEntries = selectedCourseIds.map((courseId) => ({
        id: uuidv4(),
        class_id: classId,
        course_id: courseId,
        created_at: now,
        updated_at: now,
        is_deleted: false,
      }));

      const { error: insertError } = await this.supabase
        .from('class_course')
        .insert(newEntries);

      if (insertError) {
        logger.error('Error inserting new class_course entries:', insertError);
        throw insertError;
      }
    }
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
    if (!this.supabase) {
      return { success: false, message: 'Supabase client is not initialized' };
    }

    const {
      phone,
      name,
      gender,
      age,
      classId,
      schoolId,
      parentName,
      email,
      studentID,
      atSchool,
    } = params;
    const timestamp = new Date().toISOString();
    const finalAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    try {
      let languageId;
      if (schoolId) {
        const { data: schoolData } = await this.supabase
          .from(TABLES.School)
          .select('language')
          .eq('id', schoolId)
          .maybeSingle();

        if (schoolData?.language) {
          languageId = schoolData?.language;
        }
      }
      if (!languageId) {
        languageId = '7eaf3509-e44e-460f-80a1-7f6a13a8a883';
      }

      if (atSchool) {
        const childId = uuidv4();
        const { error: childCreateError } = await this.supabase
          .from(TABLES.User)
          .insert({
            id: childId,
            name: name,
            gender: gender,
            age: parseInt(age) || 0,
            language_id: languageId,
            avatar: finalAvatar,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
            student_id: studentID || null,
          });
        if (childCreateError) {
          logger.error(
            'Error creating at-school student user:',
            childCreateError,
          );
          return { success: false, message: 'Error creating student profile' };
        }
        const { error: studentClassError } = await this.supabase
          .from(TABLES.ClassUser)
          .insert({
            id: uuidv4(),
            class_id: classId,
            user_id: childId,
            role: RoleType.STUDENT,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
          });
        if (studentClassError) {
          logger.error(
            'Error adding at-school student to class:',
            studentClassError,
          );
          return { success: false, message: 'Error adding student to class' };
        }
        return {
          success: true,
          message: 'Student added successfully',
          data: { studentId: childId },
        };
      }

      const { data: userData, error: userError } =
        await this.supabase.functions.invoke('get_or_create_user', {
          body: {
            name: parentName || 'Parent',
            phone: phone,
            email: email,
          },
        });

      if (userError) {
        logger.error('Error creating/getting parent user:', userError);
        return {
          success: false,
          message: 'Error creating parent account',
        };
      }

      if (!userData || !userData.user) {
        logger.error('Invalid response from user-upsert:', userData);
        return { success: false, message: 'Invalid response from server' };
      }

      const parentId = userData.user.id;

      const { count, error: countError } = await this.supabase
        .from(TABLES.ParentUser)
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parentId)
        .eq('is_deleted', false);

      if (countError) {
        logger.error('Error counting children:', countError);
        return {
          success: false,
          message: 'Error checking existing profiles',
        };
      }

      if (count !== null && count >= 3) {
        return {
          success: false,
          message: 'This number already has 3 profiles.',
        };
      }

      const childId = uuidv4();
      const { error: childCreateError } = await this.supabase
        .from(TABLES.User)
        .insert({
          id: childId,
          name: name,
          gender: gender,
          age: parseInt(age) || 0,
          language_id: languageId,
          avatar: finalAvatar,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
          student_id: studentID || null,
        });

      if (childCreateError) {
        logger.error('Error creating child user:', childCreateError);
        return { success: false, message: 'Error creating student profile' };
      }

      const { error: parentUserError } = await this.supabase
        .from(TABLES.ParentUser)
        .insert({
          id: uuidv4(),
          parent_id: parentId,
          student_id: childId,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
        });

      if (parentUserError) {
        logger.error('Error linking child to parent:', parentUserError);
        return { success: false, message: 'Error linking student to parent' };
      }

      const { error: studentClassError } = await this.supabase
        .from(TABLES.ClassUser)
        .insert({
          id: uuidv4(),
          class_id: classId,
          user_id: childId,
          role: RoleType.STUDENT,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
        });

      if (studentClassError) {
        logger.error('Error adding student to class:', studentClassError);
        return { success: false, message: 'Error adding student to class' };
      }

      const { data: parentInClass, error: parentCheckError } =
        await this.supabase
          .from(TABLES.ClassUser)
          .select('id')
          .eq('class_id', classId)
          .eq('user_id', parentId)
          .eq('role', RoleType.PARENT)
          .eq('is_deleted', false)
          .maybeSingle();

      if (parentCheckError) {
        logger.error('Error checking parent in class:', parentCheckError);
      }

      if (!parentInClass) {
        const { error: parentClassError } = await this.supabase
          .from(TABLES.ClassUser)
          .insert({
            id: uuidv4(),
            class_id: classId,
            user_id: parentId,
            role: RoleType.PARENT,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
          });

        if (parentClassError) {
          logger.error('Error adding parent to class:', parentClassError);
        }
      }

      return {
        success: true,
        message: 'Student added successfully',
        data: {
          studentId: childId,
          parentId: parentId,
        },
      };
    } catch (error) {
      logger.error(
        'Unexpected error in addStudentWithParentValidation:',
        error,
      );
      return {
        success: false,
        message: 'An unexpected error occurred while adding the student',
      };
    }
  }

  async getFilteredFcQuestions(
    type: EnumType<'fc_support_level'> | null,
    targetType: EnumType<'fc_engagement_target'>,
  ): Promise<TableTypes<'fc_question'>[] | []> {
    if (!this.supabase) {
      return [];
    }

    let query = this.supabase
      .from(TABLES.FcQuestion)
      .select('*')
      .eq('target_type', targetType)
      .eq('is_deleted', false)
      .eq('status', 'active');

    if (type !== null) {
      query = query.eq('type', type);
    } else {
      query = query.is('type', null);
    }

    const { data, error } = await query.order('sort_order', {
      ascending: true,
    });

    if (error) {
      logger.error('Error fetching FC Questions:', error);
      return [];
    }

    return data;
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
    if (!this.supabase) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from(TABLES.FcUserForms)
      .insert({
        visit_id: payload.visitId ?? null,
        user_id: payload.userId,
        school_id: payload.schoolId,
        class_id: payload.classId ?? null,
        contact_user_id: payload.contactUserId ?? null,
        contact_target: payload.contactTarget,
        contact_method: payload.contactMethod,
        call_status: payload.callStatus ?? null,
        support_level: payload.supportLevel ?? null,
        question_response: JSON.stringify(payload.questionResponse),
        tech_issues_reported: payload.techIssuesReported,
        comment: payload.comment ?? null,
        tech_issue_comment: payload.techIssueComment ?? null,
        media_links:
          payload.mediaLinks && payload.mediaLinks.length > 0
            ? JSON.stringify(payload.mediaLinks)
            : null,
      })
      .select()
      .single();

    return { data, error };
  }
  async getTodayVisitId(
    userId: string,
    schoolId: string,
  ): Promise<string | null> {
    if (!this.supabase) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from(TABLES.FcSchoolVisit)
      .select('id')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .filter('is_deleted', 'eq', false)
      .filter('check_out_at', 'is', null)
      .gte('check_in_at', `${todayISO}T00:00:00.000Z`)
      .maybeSingle();

    if (error) return null;

    // No valid visit found
    if (!data) return null;

    return data.id;
  }
  async getActivitiesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'fc_user_forms'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('fc_user_forms')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_deleted', false)
      .not('contact_user_id', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching user forms:', error);
      return [];
    }

    return data ?? [];
  }
  async getSchoolVisitById(
    visitIds: string[],
  ): Promise<TableTypes<'fc_school_visit'>[]> {
    if (!this.supabase || visitIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('fc_school_visit')
      .select('*')
      .in('id', visitIds) // ? pass array directly
      .eq('is_deleted', false)
      .order('check_in_at', { ascending: true });

    if (error) {
      logger.error('Error fetching visit:', error);
      return [];
    }

    return data ?? [];
  }

  async getActivitiesFilterOptions() {
    try {
      if (!this.supabase) return null;

      const { data, error } = await this.supabase
        .from('fc_user_forms')
        .select('contact_target, support_level')
        .eq('is_deleted', false);

      if (error) throw error;

      const forms = data || [];

      const contactTypes = [
        ...new Set(forms.map((f) => f.contact_target).filter(Boolean)),
      ];
      const performance = [
        ...new Set(forms.map((f) => f.support_level).filter(Boolean)),
      ];

      return {
        contactType: contactTypes,
        performance: performance,
      };
    } catch (error) {
      logger.error('Error in getActivitiesFilterOptions:', error);
      throw error;
    }
  }

  async getRecentAssignmentCountByTeacher(
    teacherId: string,
    classId: string,
  ): Promise<number | null> {
    if (!this.supabase) return null;

    const SEVEN_DAYS_AGO = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('batch_id')
      .eq('created_by', teacherId)
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .gte('created_at', SEVEN_DAYS_AGO);

    if (error) {
      logger.error('Error fetching assignments:', error);
      return null;
    }

    if (!data || data.length === 0) return 0;

    return new Set(data.map((row) => row.batch_id)).size;
  }

  async createNoteForSchool(params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  }): Promise<any> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return null;
    }

    const { schoolId, classId = null, content, mediaLinks = null } = params;

    // ---- GET CURRENT USER ----
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    const currentUserId = currentUser?.id;

    if (!currentUserId) {
      throw new Error('No authenticated user found for createNoteForSchool');
    }

    // ---- TODAY TIME WINDOW ----
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    ).toISOString();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
    ).toISOString();

    let visitId: string | null = null;

    // ---- 1) FIND TODAY'S OPEN VISIT ----
    const visitQuery = await this.supabase
      .from('fc_school_visit')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('school_id', schoolId)
      .eq('is_deleted', false)
      .gte('check_in_at', startOfDay)
      .lt('check_in_at', endOfDay)
      .is('check_out_at', null)
      .limit(1);

    if (!visitQuery.error && visitQuery.data?.length > 0) {
      visitId = visitQuery.data[0].id;
    }

    // ---- REQUIRED FIELDS FOR INSERT ----
    const insertPayload = {
      visit_id: visitId,
      user_id: currentUserId,
      school_id: schoolId,
      class_id: classId,
      comment: content,
      is_deleted: false,
      media_links:
        mediaLinks && mediaLinks.length > 0 ? JSON.stringify(mediaLinks) : null,

      // Required NOT NULL:
      contact_target: 'school' as any,
      contact_method: 'in_person' as any,

      // Optional:
      call_status: null,
      support_level: null,
      question_response: null,
      tech_issues_reported: false,
      tech_issue_comment: null,
    };

    // ---- 2) INSERT ROW ----
    const insertRes = await this.supabase
      .from('fc_user_forms')
      .insert([insertPayload]) // MUST be an array
      .select('*')
      .single();

    if (insertRes.error) {
      logger.error('Insert error:', insertRes.error);
      throw insertRes.error;
    }

    const created = insertRes.data;

    // ---- 3) FETCH USER NAME & ROLE ----
    const userRes = await this.supabase
      .from('user')
      .select('name')
      .eq('id', currentUserId)
      .eq('is_deleted', false)
      .single();

    const roleRes = await this.supabase
      .from('special_users')
      .select('role')
      .eq('user_id', currentUserId)
      .eq('is_deleted', false)
      .limit(1);

    // ---- 4) FETCH CLASS NAME ----
    let className: string | null = null;
    if (classId) {
      const cls = await this.supabase
        .from('class')
        .select('name')
        .eq('id', classId)
        .eq('is_deleted', false)
        .single();
      className = !cls.error && cls.data ? cls.data.name : null;
    }

    // ---- 5) RETURN STRUCTURED UI OBJECT ----
    return {
      id: created.id,
      visitId: created.visit_id,
      schoolId: created.school_id,
      classId: created.class_id,
      className,
      content: created.comment,
      createdAt: created.created_at,
      createdBy: {
        userId: currentUserId,
        name: userRes.data?.name ?? 'Unknown',
        role: roleRes.data?.[0]?.role ?? null,
      },
    };
  }

  async getNotesBySchoolId(
    schoolId: string,
    limit = 10,
    offset = 0,
    sortBy: 'createdAt' | 'createdBy' = 'createdAt',
  ): Promise<{ data: any[]; totalCount: number }> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return { data: [], totalCount: 0 };
    }

    try {
      let notesQ = this.supabase
        .from('fc_user_forms')
        .select(
          `
          id,
          comment,
          class_id,
          visit_id,
          created_at,
          media_links,

          class:class_id (
            id,
            name
          ),

          user:user!fc_user_forms_user_id_fkey (
            id,
            name,
            special_users (
              role
            )
          )
        `,
          { count: 'exact' },
        )
        .eq('school_id', schoolId)
        .is('contact_user_id', null)
        .eq('is_deleted', false);

      if (sortBy === 'createdAt') {
        notesQ = notesQ
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });
      }

      if (sortBy === 'createdBy') {
        notesQ = notesQ.order('name', {
          foreignTable: 'user',
          ascending: true,
        });
      }

      const notesRes = await notesQ.range(offset, offset + limit - 1);

      if (notesRes.error) {
        logger.error('[API] Supabase error:', notesRes.error);
        return { data: [], totalCount: 0 };
      }

      const rows = notesRes.data ?? [];
      const totalCount = notesRes.count ?? 0;

      const mapped = rows.map((r: any) => ({
        id: r.id,
        content: r.comment,
        classId: r.class_id,
        className: r.class?.name ?? null,
        visitId: r.visit_id,
        createdAt: r.created_at,
        createdBy: {
          name: r.user?.name ?? 'Unknown',
          role: r.user?.special_users?.[0]?.role ?? null,
        },
        media_links: r.media_links ?? null,
      }));

      return { data: mapped, totalCount };
    } catch (e) {
      logger.error('getNotesBySchoolId error:', e);
      return { data: [], totalCount: 0 };
    }
  }

  async getSchoolStatsForSchool(schoolId: string): Promise<FCSchoolStats> {
    if (!this.supabase) {
      return {
        visits: 0,
        calls_made: 0,
        tech_issues: 0,
        parents_interacted: 0,
        parents_reached: 0,
        students_interacted: 0,
        teachers_interacted: 0,
      };
    }
    try {
      if (!schoolId) {
        logger.error('Error getting current school');
        return {
          visits: 0,
          calls_made: 0,
          tech_issues: 0,
          parents_interacted: 0,
          parents_reached: 0,
          students_interacted: 0,
          teachers_interacted: 0,
        };
      }
      const now = new Date();
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(now.getDate() - 15);
      const fromIso = fifteenDaysAgo.toISOString();
      const { count: visitsCount, error: visitsError } = await this.supabase
        .from('fc_school_visit')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('created_at', fromIso)
        .is('is_deleted', false);
      if (visitsError) {
        logger.error('Error counting visits:', visitsError);
      }
      const visits = visitsCount ?? 0;
      const { data: forms, error: formsError } = await this.supabase
        .from('fc_user_forms')
        .select(
          'contact_method, call_status, contact_target, tech_issues_reported, created_at',
        )
        .eq('school_id', schoolId)
        .gte('created_at', fromIso)
        .is('is_deleted', false);
      if (formsError) {
        logger.error('Error fetching fc_user_forms:', formsError);
        return {
          visits,
          calls_made: 0,
          tech_issues: 0,
          parents_interacted: 0,
          parents_reached: 0,
          students_interacted: 0,
          teachers_interacted: 0,
        };
      }
      const parentsReachedBySchool = await this.getParentsReachedBySchoolIds([
        schoolId,
      ]);
      let calls_made = 0;
      let tech_issues = 0;
      let parents_interacted = 0;
      let students_interacted = 0;
      let teachers_interacted = 0;
      (forms || []).forEach((row: any) => {
        const isCallInteraction = row.contact_method === 'call';
        const isInPersonInteraction = row.contact_method === 'in_person';
        if (isCallInteraction) {
          calls_made += 1;
        }
        if (isCallInteraction || isInPersonInteraction) {
          if (row.contact_target === 'parent') {
            parents_interacted += 1;
          } else if (row.contact_target === 'student') {
            students_interacted += 1;
          } else if (row.contact_target === 'teacher') {
            teachers_interacted += 1;
          }
        }
        if (row.tech_issues_reported === true) {
          tech_issues += 1;
        }
      });
      return {
        visits,
        calls_made,
        tech_issues,
        parents_interacted,
        parents_reached: parentsReachedBySchool[schoolId] ?? 0,
        students_interacted,
        teachers_interacted,
      };
    } catch (err) {
      logger.error('Exception in getFCSchoolStatsForUser:', err);
      return {
        visits: 0,
        calls_made: 0,
        tech_issues: 0,
        parents_interacted: 0,
        parents_reached: 0,
        students_interacted: 0,
        teachers_interacted: 0,
      };
    }
  }

  async getParentsReachedBySchoolIds(
    schoolIds: string[],
  ): Promise<Record<string, number>> {
    const normalizedSchoolIds = [...new Set(schoolIds.filter(Boolean))];
    if (!this.supabase || normalizedSchoolIds.length === 0) {
      return {};
    }

    const { data, error } = await this.supabase
      .from(TABLES.FcSchoolVisit)
      .select('school_id, number_of_parents')
      .in('school_id', normalizedSchoolIds)
      .eq('type', SchoolVisitType.Community)
      .eq('is_deleted', false)
      .not('number_of_parents', 'is', null)
      .gt('number_of_parents', 0);

    if (error) {
      logger.error('Error fetching community visit parent counts:', error);
      return {};
    }

    return (data ?? []).reduce<Record<string, number>>((accumulator, visit) => {
      const schoolId = visit.school_id;
      if (!schoolId) {
        return accumulator;
      }

      const parentCount =
        typeof visit.number_of_parents === 'number'
          ? visit.number_of_parents
          : 0;
      accumulator[schoolId] = (accumulator[schoolId] ?? 0) + parentCount;
      return accumulator;
    }, {});
  }
}
