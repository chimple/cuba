import { SupabaseApiProgramRequests } from './SupabaseApi.program.requests';

jest.mock('../../../utility/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('./SupabaseApi.program.activityStats', () => ({
  __esModule: true,
  SupabaseApiProgramActivityStats: class {},
}));

describe('SupabaseApiProgramRequests.getRequestFilterOptions', () => {
  it('returns unique schools with pending requests in alphabetical order', async () => {
    type SchoolRow = {
      school: { id: string; name: string } | null;
    };
    type Chain = {
      data: SchoolRow[];
      error: null;
      select: jest.Mock<Chain, []>;
      eq: jest.Mock<Chain, [string, unknown]>;
      not: jest.Mock<Chain, [string, string, unknown]>;
    };

    const rows = [
      { school: { id: 'school-2', name: 'Beta School' } },
      { school: { id: 'school-1', name: 'Alpha School' } },
      { school: { id: 'school-2', name: 'Beta School' } },
      { school: null },
    ];

    const chain = {} as Chain;
    chain.data = rows;
    chain.error = null;
    chain.select = jest.fn(() => chain);
    chain.eq = jest.fn(() => chain);
    chain.not = jest.fn(() => chain);

    const supabase = {
      from: jest.fn(() => chain),
    };

    const api =
      new SupabaseApiProgramRequests() as SupabaseApiProgramRequests & {
        supabase: typeof supabase;
      };
    api.supabase = supabase;

    await expect(api.getRequestFilterOptions('requested')).resolves.toEqual({
      requestType: ['student', 'teacher', 'principal', 'school'],
      school: [
        { id: 'school-1', name: 'Alpha School' },
        { id: 'school-2', name: 'Beta School' },
      ],
    });

    expect(supabase.from).toHaveBeenCalledWith('ops_requests');
    expect(chain.eq).toHaveBeenCalledWith('request_status', 'requested');
    expect(chain.not).toHaveBeenCalledWith('school_id', 'is', null);
  });

  it('excludes schools that only have expired student requested rows', async () => {
    const rows = [
      {
        request_type: 'student',
        request_ends_at: '2020-01-01T00:00:00.000Z',
        school: { id: 'school-1', name: 'Expired School' },
      },
      {
        request_type: 'student',
        request_ends_at: '2030-01-01T00:00:00.000Z',
        school: { id: 'school-2', name: 'Active School' },
      },
      {
        request_type: 'teacher',
        request_ends_at: null,
        school: { id: 'school-3', name: 'Teacher School' },
      },
    ];

    type SchoolRow = {
      request_type: string;
      request_ends_at: string | null;
      school: { id: string; name: string } | null;
    };
    type Chain = {
      data: SchoolRow[];
      error: null;
      select: jest.Mock<Chain, []>;
      eq: jest.Mock<Chain, [string, unknown]>;
      not: jest.Mock<Chain, [string, string, unknown]>;
    };

    const chain = {} as Chain;
    chain.data = rows;
    chain.error = null;
    chain.select = jest.fn(() => chain);
    chain.eq = jest.fn(() => chain);
    chain.not = jest.fn(() => chain);

    const supabase = {
      from: jest.fn(() => chain),
    };

    const api =
      new SupabaseApiProgramRequests() as SupabaseApiProgramRequests & {
        supabase: typeof supabase;
      };
    api.supabase = supabase;

    await expect(api.getRequestFilterOptions('requested')).resolves.toEqual({
      requestType: ['student', 'teacher', 'principal', 'school'],
      school: [
        { id: 'school-2', name: 'Active School' },
        { id: 'school-3', name: 'Teacher School' },
      ],
    });
  });
});
