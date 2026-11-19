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
const school = () => query({ program_id: 'program-1' });
const admin = () => query([{ id: 'admin-role' }]);
const member = () => query([]);

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
  const membership = query([{ user: 'a' }, { user: 'c' }]);
  const existing = query([
    { id: 'keep', user_id: 'a' },
    { id: 'duplicate', user_id: 'a' },
    { id: 'remove', user_id: 'b' },
  ]);
  const insert = query([{ id: 'new' }]);
  const remove = query([{ id: 'duplicate' }, { id: 'remove' }]);
  const queries = [
    school(),
    admin(),
    member(),
    membership,
    query([{ id: 'a' }, { id: 'c' }]),
    existing,
    insert,
    remove,
  ];
  const { client, from } = setup(...queries);
  await updateSchoolFieldCoordinators(
    client,
    'school-1',
    ['a', 'c', 'c'],
    'admin',
  );
  expect(membership.eq).toHaveBeenCalledWith('program_id', 'program-1');
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

it('allows a manager of this program to clear all school FC assignments', async () => {
  const manager = query([{ id: 'manager-role' }]);
  const remove = query([{ id: 'assignment' }]);
  const { client } = setup(
    school(),
    query([]),
    manager,
    query([{ id: 'assignment', user_id: 'a' }]),
    remove,
  );
  await updateSchoolFieldCoordinators(client, 'school-1', [], 'manager');
  expect(manager.eq).toHaveBeenCalledWith('program_id', 'program-1');
  expect(manager.eq).toHaveBeenCalledWith('user', 'manager');
  expect(manager.eq).toHaveBeenCalledWith('role', RoleType.PROGRAM_MANAGER);
  expect(remove.update).toHaveBeenCalledWith(
    expect.objectContaining({ is_deleted: true }),
  );
});

it('rejects unauthorized callers before reading or changing assignments', async () => {
  const { client, from } = setup(school(), query([]), query([]));
  await expect(
    updateSchoolFieldCoordinators(client, 'school-1', ['a'], 'other'),
  ).rejects.toThrow('cannot manage');
  expect(from).toHaveBeenCalledTimes(3);
});

it.each([
  [[], [{ id: 'a' }]],
  [[{ user: 'a' }], []],
])(
  'rejects unrelated-program or deleted FCs before writing',
  async (membership, users) => {
    const { client, from } = setup(
      school(),
      admin(),
      member(),
      query(membership),
      query(users),
    );
    await expect(
      updateSchoolFieldCoordinators(client, 'school-1', ['a'], 'admin'),
    ).rejects.toThrow('must belong');
    expect(from).toHaveBeenCalledTimes(5);
  },
);

it('keeps existing assignments if a new assignment cannot be inserted', async () => {
  const insert = query(null, new Error('insert failed'));
  const { client, from } = setup(
    school(),
    admin(),
    member(),
    query([{ user: 'c' }]),
    query([{ id: 'c' }]),
    query([{ id: 'old', user_id: 'a' }]),
    insert,
  );
  await expect(
    updateSchoolFieldCoordinators(client, 'school-1', ['c'], 'admin'),
  ).rejects.toThrow('insert failed');
  expect(from).toHaveBeenCalledTimes(7);
});

it('reports partial failures instead of claiming a successful save', async () => {
  const { client } = setup(
    school(),
    admin(),
    member(),
    query([{ id: 'old', user_id: 'a' }]),
    query([]),
  );
  await expect(
    updateSchoolFieldCoordinators(client, 'school-1', [], 'admin'),
  ).rejects.toThrow('Not all assignments were removed');
});
