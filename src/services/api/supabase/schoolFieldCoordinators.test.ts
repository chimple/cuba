import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../database';
import { RoleType } from '../../../interface/modelInterfaces';
import {
  getSchoolFieldCoordinators,
  updateSchoolFieldCoordinators,
} from './schoolFieldCoordinators';

function query(data: unknown = [], error: unknown = null) {
  const result = Promise.resolve({ data, error });
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    then: result.then.bind(result),
  };
}
function setup(...queries: ReturnType<typeof query>[]) {
  const from = jest.fn();
  queries.forEach((item) => from.mockReturnValueOnce(item));
  return { from, client: { from } as unknown as SupabaseClient<Database> };
}

it('loads only this school’s active FCs and deduplicates active users', async () => {
  const read = query([
    { user: { id: 'a', name: 'A' } },
    { user: { id: 'a', name: 'A' } },
    { user: { id: 'deleted', is_deleted: true } },
    { user: null },
  ]);
  const { client } = setup(read);
  expect(await getSchoolFieldCoordinators(client, 'school-1')).toEqual([
    { id: 'a', name: 'A' },
  ]);
  expect(read.eq).toHaveBeenCalledWith('school_id', 'school-1');
  expect(read.eq).toHaveBeenCalledWith('role', RoleType.FIELD_COORDINATOR);
  expect(read.eq).toHaveBeenCalledWith('is_deleted', false);
});

it('propagates assignment read errors instead of treating them as an empty school', async () => {
  const error = new Error('offline');
  const { client } = setup(query(null, error));
  await expect(getSchoolFieldCoordinators(client, 'school-1')).rejects.toThrow(
    'offline',
  );
});

it('adds and removes only this school’s FC mappings without writing program membership', async () => {
  const existing = query([
    { id: 'keep', user_id: 'a' },
    { id: 'duplicate', user_id: 'a' },
    { id: 'remove', user_id: 'b' },
  ]);
  const insert = query([{ id: 'new' }]);
  const remove = query([{ id: 'duplicate' }, { id: 'remove' }]);
  const queries = [existing, insert, remove];
  const { client, from } = setup(...queries);
  await updateSchoolFieldCoordinators(client, 'school-1', ['a', 'c', 'c']);
  expect(insert.insert).toHaveBeenCalledWith([
    expect.objectContaining({
      school_id: 'school-1',
      user_id: 'c',
      role: RoleType.FIELD_COORDINATOR,
      is_deleted: false,
    }),
  ]);
  expect(remove.in).toHaveBeenCalledWith('id', ['duplicate', 'remove']);
  expect(remove.eq).toHaveBeenCalledWith('school_id', 'school-1');
  expect(remove.eq).toHaveBeenCalledWith('role', RoleType.FIELD_COORDINATOR);
  expect(remove.eq).toHaveBeenCalledWith('is_deleted', false);
  const writtenTables = from.mock.calls
    .filter(
      (_, index) =>
        queries[index].insert.mock.calls.length ||
        queries[index].update.mock.calls.length,
    )
    .map(([table]) => table);
  expect(writtenTables).toEqual(['school_user', 'school_user']);
});

it('clears school FC assignments without repeating caller role lookups', async () => {
  const remove = query([{ id: 'assignment' }]);
  const { client, from } = setup(
    query([{ id: 'assignment', user_id: 'a' }]),
    remove,
  );
  await updateSchoolFieldCoordinators(client, 'school-1', []);
  expect(from.mock.calls.map(([table]) => table)).toEqual([
    'school_user',
    'school_user',
  ]);
  expect(remove.update).toHaveBeenCalledWith(
    expect.objectContaining({ is_deleted: true }),
  );
});

it('propagates database access errors before changing assignments', async () => {
  const { client, from } = setup(query(null, new Error('permission denied')));
  await expect(
    updateSchoolFieldCoordinators(client, 'school-1', []),
  ).rejects.toThrow('permission denied');
  expect(from).toHaveBeenCalledTimes(1);
});

it('keeps existing assignments if a new assignment cannot be inserted', async () => {
  const insert = query(null, new Error('insert failed'));
  const { client, from } = setup(query([{ id: 'old', user_id: 'a' }]), insert);
  await expect(
    updateSchoolFieldCoordinators(client, 'school-1', ['c']),
  ).rejects.toThrow('insert failed');
  expect(from).toHaveBeenCalledTimes(2);
});

it('reports partial failures instead of claiming a successful save', async () => {
  const { client } = setup(query([{ id: 'old', user_id: 'a' }]), query([]));
  await expect(
    updateSchoolFieldCoordinators(client, 'school-1', []),
  ).rejects.toThrow('Not all assignments were removed');
});
