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
): Promise<void> {
  const selected = [...new Set(userIds.filter(Boolean))];
  // Read and update only this school's FC mappings.
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
