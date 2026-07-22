import { v4 as uuidv4 } from 'uuid';
import {
  EnumType,
  PROFILETYPE,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiSchoolCourses } from './SupabaseApi.school.courses';

const SCHOOL_METRICS_DAY_WINDOWS = [7, 15, 30] as const;
const PROGRAM_METRICS_DAY_WINDOWS = [7, 15, 30] as const;
export interface SupabaseApiSchoolCreation {
  [key: string]: any;
}
export class SupabaseApiSchoolCreation extends SupabaseApiSchoolCourses {
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
    if (!this.supabase) return {} as TableTypes<'school'>;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const schoolId = uuidv4();
    const timestamp = new Date().toISOString();
    const oSchool = onlySchool ?? true;
    const oSchoolUser = onlySchoolUser ?? true;

    let newSchool: TableTypes<'school'> | null = null;

    if (oSchool) {
      const result = image
        ? await this.addProfileImages(schoolId, image, PROFILETYPE.SCHOOL)
        : null;

      newSchool = {
        id: schoolId,
        name,
        group1: group1 ?? null,
        group2: group2 ?? null,
        group3: group3 ?? null,
        image: result ?? null,
        group4: group4 ?? null,
        program_id: program_id ?? null,
        udise: udise ?? null,
        address: address ?? null,
        created_at: timestamp,
        updated_at: timestamp,
        is_deleted: false,
        model: null,
        academic_year: null,
        firebase_id: null,
        is_firebase: null,
        is_ops: null,
        language: null,
        ops_created_by: null,
        student_login_type: null,
        status: status,
        key_contacts: null,
        country: country ?? null,
        location_link: null,
        whatsapp_bot_number: null,
      };

      const { error: schoolError } = await this.supabase
        .from(TABLES.School)
        .insert([newSchool]);

      if (schoolError) {
        logger.error('Error inserting into school:', schoolError);
        throw schoolError;
      }
      await this.computeSchoolMetricsForSchool(schoolId);
    }

    if (oSchoolUser) {
      const newSchoolUser: TableTypes<'school_user'> = {
        id: uuidv4(),
        school_id: schoolId,
        user_id: _currentUser.id,
        role: RoleType.PRINCIPAL,
        created_at: timestamp,
        updated_at: timestamp,
        is_deleted: false,
        is_firebase: null,
        is_ops: null,
        ops_created_by: null,
      };

      const { error: userError } = await this.supabase
        .from(TABLES.SchoolUser)
        .insert([newSchoolUser]);

      if (userError) {
        logger.error('Error inserting into school_user:', userError);
        throw userError;
      }
    }

    return newSchool ?? ({} as TableTypes<'school'>);
  }

  async computeSchoolMetricsForSchool(schoolId: string): Promise<boolean> {
    if (!this.supabase) return false;
    if (!schoolId) {
      logger.error(
        'computeSchoolMetricsForSchool called without a valid schoolId',
      );
      return false;
    }
    try {
      for (const dayWindow of SCHOOL_METRICS_DAY_WINDOWS) {
        const { error } = await this.supabase.rpc('compute_school_metrics', {
          p_days: dayWindow,
          p_school_id: schoolId,
        });

        if (error) {
          logger.error('Error computing school metrics:', {
            schoolId,
            dayWindow,
            error,
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error('computeSchoolMetricsForSchool failed:', {
        schoolId,
        error,
      });
      return false;
    }
  }

  async computeProgramMetricsForProgram(programId: string): Promise<boolean> {
    if (!this.supabase) return false;
    if (!programId) {
      logger.error(
        'computeProgramMetricsForProgram called without a valid programId',
      );
      return false;
    }
    try {
      for (const dayWindow of PROGRAM_METRICS_DAY_WINDOWS) {
        const { error } = await this.supabase.rpc('compute_program_metrics', {
          p_days: dayWindow,
          p_program_id: programId,
        });

        if (error) {
          logger.error('Error computing program metrics:', {
            programId,
            dayWindow,
            error,
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error('computeProgramMetricsForProgram failed:', {
        programId,
        error,
      });
      return false;
    }
  }
}
