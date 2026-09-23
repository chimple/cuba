import { SupabaseApiProgramDiscovery } from './SupabaseApi.program.discovery';
import { RoleType } from '../../../interface/modelInterfaces';
import { TABLES } from '../../../common/constants';

const mockGetCurrentUser = jest.fn();
const mockGetState = jest.fn();
jest.mock('../../ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({ authHandler: { getCurrentUser: mockGetCurrentUser } }),
  },
}));
jest.mock('../../../redux/store', () => ({
  __esModule: true,
  store: { getState: () => mockGetState() },
}));
jest.mock('../../../utility/util', () => ({ Util: {} }));
jest.mock('./SupabaseApi.program.requestReview', () => ({
  SupabaseApiProgramRequestReview: class {},
}));

function query(data: unknown = null, error: unknown = null) {
  const response = Promise.resolve({ data, error });
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    then: response.then.bind(response),
  };
}

function setup(roles: RoleType[]) {
  mockGetCurrentUser.mockResolvedValue({ id: 'manager' });
  mockGetState.mockReturnValue({ auth: { roles } });
  const from = jest.fn();
  const api = new SupabaseApiProgramDiscovery();
  api.supabase = { from };
  return { api, from };
}

test('removes school connections only for removed coordinators in the same program', async () => {
  const { api, from } = setup([RoleType.SUPER_ADMIN]);
  const validUsers = query([{ user_id: 'keep' }, { user_id: 'add' }]);
  const existing = query([
    { id: 'row-keep', user: 'keep', is_deleted: false },
    { id: 'row-remove', user: 'remove', is_deleted: false },
  ]);
  const schools = query([{ id: 'school-1' }, { id: 'school-2' }]);
  const schoolCleanup = query();
  const remove = query();
  const insert = query();
  from
    .mockReturnValueOnce(validUsers)
    .mockReturnValueOnce(existing)
    .mockReturnValueOnce(schools)
    .mockReturnValueOnce(schoolCleanup)
    .mockReturnValueOnce(remove)
    .mockReturnValueOnce(insert);

  await expect(
    api.updateProgramFieldCoordinators('program-1', ['keep', 'add']),
  ).resolves.toBe(true);
  expect(existing.eq).toHaveBeenCalledWith('program_id', 'program-1');
  expect(existing.eq).toHaveBeenCalledWith('role', RoleType.FIELD_COORDINATOR);
  expect(schools.eq).toHaveBeenCalledWith('program_id', 'program-1');
  expect(schoolCleanup.in).toHaveBeenCalledWith('user_id', ['remove']);
  expect(schoolCleanup.in).toHaveBeenCalledWith('school_id', [
    'school-1',
    'school-2',
  ]);
  expect(schoolCleanup.eq).toHaveBeenCalledWith(
    'role',
    RoleType.FIELD_COORDINATOR,
  );
  expect(schoolCleanup.eq).toHaveBeenCalledWith('is_deleted', false);
  expect(schoolCleanup.update).toHaveBeenCalledWith(
    expect.objectContaining({ is_deleted: true }),
  );
  expect(remove.in).toHaveBeenCalledWith('id', ['row-remove']);
  expect(remove.update).toHaveBeenCalledWith(
    expect.objectContaining({ is_deleted: true }),
  );
  expect(insert.insert).toHaveBeenCalledWith([
    expect.objectContaining({
      program_id: 'program-1',
      user: 'add',
      role: RoleType.FIELD_COORDINATOR,
      is_deleted: false,
    }),
  ]);
  expect(from.mock.calls.map(([table]) => table)).toEqual([
    TABLES.SpecialUsers,
    TABLES.ProgramUser,
    TABLES.School,
    TABLES.SchoolUser,
    TABLES.ProgramUser,
    TABLES.ProgramUser,
  ]);
});

test('rejects Program Managers who are not assigned to the program', async () => {
  const { api, from } = setup([RoleType.PROGRAM_MANAGER]);
  const membership = query(null);
  from.mockReturnValueOnce(membership);
  await expect(
    api.updateProgramFieldCoordinators('program-1', []),
  ).resolves.toBe(false);
  expect(membership.eq).toHaveBeenCalledWith('user', 'manager');
  expect(membership.eq).toHaveBeenCalledWith('program_id', 'program-1');
  expect(from).toHaveBeenCalledTimes(1);
  expect(membership.update).not.toHaveBeenCalled();
});

test('allows removal when the program has no schools', async () => {
  const { api, from } = setup([RoleType.PROGRAM_MANAGER]);
  const remove = query();
  from
    .mockReturnValueOnce(query({ id: 'manager-link' }))
    .mockReturnValueOnce(
      query([{ id: 'coordinator-link', user: 'fc', is_deleted: false }]),
    )
    .mockReturnValueOnce(query([]))
    .mockReturnValueOnce(remove);
  await expect(
    api.updateProgramFieldCoordinators('program-1', []),
  ).resolves.toBe(true);
  expect(remove.in).toHaveBeenCalledWith('id', ['coordinator-link']);
  expect(from.mock.calls.map(([table]) => table)).toEqual([
    TABLES.ProgramUser,
    TABLES.ProgramUser,
    TABLES.School,
    TABLES.ProgramUser,
  ]);
});

test('rejects users who are not Field Coordinators before any assignments change', async () => {
  const { api, from } = setup([RoleType.OPERATIONAL_DIRECTOR]);
  from.mockReturnValueOnce(query([]));
  await expect(
    api.updateProgramFieldCoordinators('program-1', ['invalid-user']),
  ).resolves.toBe(false);
  expect(from).toHaveBeenCalledTimes(1);
});

test('does not touch school connections when only adding coordinators or removing duplicate program links', async () => {
  const { api, from } = setup([RoleType.SUPER_ADMIN]);
  const removeDuplicate = query();
  from
    .mockReturnValueOnce(query([{ user_id: 'keep' }, { user_id: 'add' }]))
    .mockReturnValueOnce(
      query([
        { id: 'keep-1', user: 'keep', is_deleted: false },
        { id: 'keep-2', user: 'keep', is_deleted: false },
      ]),
    )
    .mockReturnValueOnce(removeDuplicate)
    .mockReturnValueOnce(query());
  await expect(
    api.updateProgramFieldCoordinators('program-1', ['keep', 'add']),
  ).resolves.toBe(true);
  expect(removeDuplicate.in).toHaveBeenCalledWith('id', ['keep-2']);
  expect(from).not.toHaveBeenCalledWith(TABLES.School);
  expect(from).not.toHaveBeenCalledWith(TABLES.SchoolUser);
});

test.each(['school lookup', 'school cleanup'])(
  'keeps program links active if %s fails',
  async (failure) => {
    const { api, from } = setup([RoleType.SUPER_ADMIN]);
    const existing = query([{ id: 'link', user: 'remove', is_deleted: false }]);
    const schools = query(
      [{ id: 'school-1' }],
      failure === 'school lookup' ? new Error('offline') : null,
    );
    const schoolCleanup = query(null, new Error('offline'));
    from
      .mockReturnValueOnce(existing)
      .mockReturnValueOnce(schools)
      .mockReturnValueOnce(schoolCleanup);
    await expect(
      api.updateProgramFieldCoordinators('program-1', []),
    ).resolves.toBe(false);
    expect(
      from.mock.calls.filter(([table]) => table === TABLES.ProgramUser),
    ).toHaveLength(1);
    expect(existing.update).not.toHaveBeenCalled();
  },
);

test('propagates assignment lookup errors instead of returning an empty selection', async () => {
  const { api, from } = setup([RoleType.SUPER_ADMIN]);
  const error = { message: 'Network request failed', code: 'FETCH_ERROR' };
  from.mockReturnValueOnce(query(null, error));
  await expect(api.getFieldCoordinatorsByProgram('program-1')).rejects.toEqual(
    error,
  );
});

test('propagates coordinator detail errors instead of returning an empty selection', async () => {
  const { api, from } = setup([RoleType.SUPER_ADMIN]);
  const error = { message: 'Network request failed', code: 'FETCH_ERROR' };
  from
    .mockReturnValueOnce(query([{ user: 'coordinator' }]))
    .mockReturnValueOnce(query(null, error));
  await expect(api.getFieldCoordinatorsByProgram('program-1')).rejects.toEqual(
    error,
  );
});

test('returns an empty selection when the program actually has no assignments', async () => {
  const { api, from } = setup([RoleType.SUPER_ADMIN]);
  from.mockReturnValueOnce(query([]));
  await expect(api.getFieldCoordinatorsByProgram('program-1')).resolves.toEqual(
    { data: [] },
  );
  expect(from).toHaveBeenCalledTimes(1);
});
