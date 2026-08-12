import { v4 as uuidv4 } from 'uuid';
import { RoleType } from '../../../interface/modelInterfaces';
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from '../../../ops-console/pages/NewUserPageOps';
import logger from '../../../utility/logger';
import { SupabaseApiProgramDiscovery } from './SupabaseApi.program.discovery';

export interface SupabaseApiProgramEnrollment {
  [key: string]: any;
}
export class SupabaseApiProgramEnrollment extends SupabaseApiProgramDiscovery {
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
}
