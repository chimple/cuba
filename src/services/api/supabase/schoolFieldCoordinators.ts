import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../../database';
import type { TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';

type Client = SupabaseClient<Database>;

export async function getSchoolFieldCoordinators(
  client: Client,
  schoolId: string,
): Promise<TableTypes<'user'>[]> {
  const { data, error } = await client
    .from('school_user')
    .select('user:user!school_user_user_id_fkey(*)')
    .eq('school_id', schoolId)
    .eq('role', RoleType.FIELD_COORDINATOR)
    .eq('is_deleted', false);
  if (error) throw error;
  const users = new Map<string, TableTypes<'user'>>();
  for (const row of data ?? []) {
    if (row.user && !row.user.is_deleted) users.set(row.user.id, row.user);
  }
  return [...users.values()].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? ''),
  );
}

export async function updateSchoolFieldCoordinators(
  client: Client,
  schoolId: string,
  userIds: string[],
  callerId: string,
): Promise<void> {
  const { data: school, error: schoolError } = await client
    .from('school')
    .select('program_id')
    .eq('id', schoolId)
    .eq('is_deleted', false)
    .single();
  if (schoolError) throw schoolError;
  if (!school?.program_id) throw new Error('School has no program');

  const [elevated, manager] = await Promise.all([
    client
      .from('special_users')
      .select('id')
      .eq('user_id', callerId)
      .in('role', [RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR])
      .eq('is_deleted', false)
      .limit(1),
    client
      .from('program_user')
      .select('id')
      .eq('program_id', school.program_id)
      .eq('user', callerId)
      .eq('role', RoleType.PROGRAM_MANAGER)
      .eq('is_deleted', false)
      .limit(1),
  ]);
  if (elevated.error) throw elevated.error;
  if (manager.error) throw manager.error;
  if (!elevated.data?.length && !manager.data?.length) {
    throw new Error('You cannot manage this school’s Field Coordinators');
  }

  const selected = [...new Set(userIds.filter(Boolean))];
  if (selected.length) {
    const [membership, users] = await Promise.all([
      client
        .from('program_user')
        .select('user')
        .eq('program_id', school.program_id)
        .eq('role', RoleType.FIELD_COORDINATOR)
        .eq('is_deleted', false)
        .in('user', selected),
      client
        .from('user')
        .select('id')
        .in('id', selected)
        .eq('is_deleted', false),
    ]);
    if (membership.error) throw membership.error;
    if (users.error) throw users.error;
    const eligible = new Set((membership.data ?? []).map((row) => row.user));
    const activeUsers = new Set((users.data ?? []).map((row) => row.id));
    if (selected.some((id) => !eligible.has(id) || !activeUsers.has(id))) {
      throw new Error(
        'Selected Field Coordinators must belong to the school’s program',
      );
    }
  }

  // Finish validation before making any changes. Never write program_user.
  const { data: existing, error: readError } = await client
    .from('school_user')
    .select('id, user_id')
    .eq('school_id', schoolId)
    .eq('role', RoleType.FIELD_COORDINATOR)
    .eq('is_deleted', false);
  if (readError) throw readError;
  const selectedIds = new Set(selected);
  const retainedUsers = new Set<string>();
  const removeIds: string[] = [];
  for (const row of existing ?? []) {
    if (
      row.user_id &&
      selectedIds.has(row.user_id) &&
      !retainedUsers.has(row.user_id)
    ) {
      retainedUsers.add(row.user_id);
    } else {
      removeIds.push(row.id);
    }
  }
  const now = new Date().toISOString();
  const additions = selected
    .filter((id) => !retainedUsers.has(id))
    .map((id) => ({
      id: uuidv4(),
      school_id: schoolId,
      user_id: id,
      role: RoleType.FIELD_COORDINATOR,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    }));
  // Insert first: a failed addition must not remove existing assignments.
  // Insert fresh rows because current RLS does not permit updating deleted rows.
  if (additions.length) {
    const { data, error } = await client
      .from('school_user')
      .insert(additions)
      .select('id');
    if (error) throw error;
    if (data?.length !== additions.length)
      throw new Error('Not all assignments were saved');
  }
  if (removeIds.length) {
    const { data, error } = await client
      .from('school_user')
      .update({ is_deleted: true, updated_at: now })
      .eq('school_id', schoolId)
      .eq('role', RoleType.FIELD_COORDINATOR)
      .eq('is_deleted', false)
      .in('id', removeIds)
      .select('id');
    if (error) throw error;
    if (data?.length !== removeIds.length)
      throw new Error('Not all assignments were removed');
  }
}
