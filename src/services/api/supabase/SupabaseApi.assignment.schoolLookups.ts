import { TableTypes } from '../../../common/constants';
import {
  readAssignmentCartFromStorage,
  writeAssignmentCartToStorage,
} from '../../../teachers-module/pages/AssignmentCartStorage';
import logger from '../../../utility/logger';
import { SupabaseApiAssignmentCourseLookups } from './SupabaseApi.assignment.courseLookups';

export interface SupabaseApiAssignmentSchoolLookups {
  [key: string]: any;
}
export class SupabaseApiAssignmentSchoolLookups extends SupabaseApiAssignmentCourseLookups {
  async createOrUpdateAssignmentCart(
    userId: string,
    lessons: string,
  ): Promise<boolean | undefined> {
    const now = new Date().toISOString();
    const existing = readAssignmentCartFromStorage(userId);
    writeAssignmentCartToStorage(userId, {
      lessons,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });

    return true;
  }
  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    schoolId?: string;
    studentLoginType: string;
    schoolModel: string;
    whatsappBotNumber?: string;
  } | null> {
    if (!this.supabase) return null;

    const normalizedUdiseCode = udiseCode.trim();
    try {
      // Fetch student_login_type and program_model directly from school table
      const { data: schoolData, error } = await this.supabase
        .from('school')
        .select('id, student_login_type, model, whatsapp_bot_number')
        .eq('udise', normalizedUdiseCode)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();
      if (error) {
        logger.error('Error fetching school data by UDISE:', error, {
          udiseCode: normalizedUdiseCode,
        });
        return null;
      }
      if (!schoolData) {
        logger.warn('No active school found for UDISE:', {
          udiseCode: normalizedUdiseCode,
        });
        return null;
      }

      const { id, student_login_type, model, whatsapp_bot_number } = schoolData;

      return {
        schoolId: id || '',
        studentLoginType: student_login_type || '',
        schoolModel: model || '',
        whatsappBotNumber: whatsapp_bot_number || '',
      };
    } catch (err) {
      logger.error('Unexpected error in getSchoolDetailsByUdise:', err);
      return null;
    }
  }
  async getSchoolDataByUdise(
    udiseCode: string,
  ): Promise<TableTypes<'school_data'> | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('school_data')
        .select('*')
        .eq('udise_code', udiseCode)
        .single();

      if (error || !data) {
        logger.error('Error fetching school_data record:', error);
        return null;
      }

      return data; // return entire row
    } catch (err) {
      logger.error('Unexpected error in getSchoolDataByUdise:', err);
      return null;
    }
  }

  async getUserByDocId(
    studentId: string,
  ): Promise<TableTypes<'user'> | undefined> {
    try {
      const res = await this.supabase
        ?.from('user')
        .select('*')
        .eq('id', studentId)
        .eq('is_deleted', false);
      return res?.data?.[0];
    } catch (error) {
      throw error;
    }
  }
  async getGradeById(id: string): Promise<TableTypes<'grade'> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('grade')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        logger.error('Error fetching grade by ID:', error);
        return;
      }

      return data;
    } catch (err) {
      logger.error('Unexpected error fetching grade by ID:', err);
      return;
    }
  }
  async getGradeByName(name: string): Promise<TableTypes<'grade'> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('grade')
        .select('*')
        .eq('name', name)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching grade by name:', error);
        return;
      }

      return data ?? undefined;
    } catch (err) {
      logger.error('Unexpected error fetching grade by name:', err);
      return;
    }
  }
  async getGradesByIds(ids: string[]): Promise<TableTypes<'grade'>[]> {
    if (!this.supabase || !ids || ids.length === 0) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('grade')
        .select('*')
        .in('id', ids)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching grades by IDs:', error);
        return [];
      }

      return data ?? [];
    } catch (err) {
      logger.error('Unexpected error fetching grades by IDs:', err);
      return [];
    }
  }

  async getCurriculumById(
    id: string,
  ): Promise<TableTypes<'curriculum'> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('curriculum')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        logger.error('Error fetching curriculum by ID:', error);
        return;
      }

      return data ?? undefined;
    } catch (err) {
      logger.error('Unexpected error fetching curriculum by ID:', err);
      return;
    }
  }
  async getCurriculumsByIds(
    ids: string[],
  ): Promise<TableTypes<'curriculum'>[]> {
    if (!this.supabase || ids.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from('curriculum')
        .select('*')
        .in('id', ids)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching curriculums by IDs:', error);
        return [];
      }

      return data ?? [];
    } catch (err) {
      logger.error('Unexpected error fetching curriculums by IDs:', err);
      return [];
    }
  }
}
