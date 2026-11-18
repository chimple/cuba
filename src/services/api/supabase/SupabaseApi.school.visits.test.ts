import { SupabaseApiSchoolVisits } from './SupabaseApi.school.visits';
import { TableTypes } from '../../../common/constants';

jest.mock('./SupabaseApi.assignment.assessments', () => ({
  SupabaseApiAssignmentAssessments: class {},
}));

const school = {
  academic_year: null,
  address: null,
  country: null,
  created_at: '2025-01-01T00:00:00.000Z',
  firebase_id: null,
  group1: null,
  group2: null,
  group3: null,
  group4: null,
  id: 'school-1',
  image: null,
  is_deleted: false,
  is_firebase: null,
  is_ops: null,
  key_contacts: null,
  language: 'retired-language',
  location_link: null,
  model: null,
  name: 'Existing School',
  ops_created_by: null,
  program_id: null,
  status: null,
  student_login_type: null,
  udise: null,
  updated_at: null,
  whatsapp_bot_number: null,
} satisfies TableTypes<'school'>;

function setup() {
  const query = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ error: null }),
  };
  const api = new SupabaseApiSchoolVisits();
  api.supabase = {
    from: jest.fn(() => query),
  } as unknown as typeof api.supabase;
  api.getLanguageWithId = jest.fn().mockResolvedValue(undefined);
  return { api, query };
}

it('allows unrelated edits when the existing language has been retired', async () => {
  const { api, query } = setup();

  await expect(
    api.updateSchoolProfile(
      school,
      'Renamed School',
      '',
      '',
      '',
      null,
      undefined,
      undefined,
      undefined,
      undefined,
      'retired-language',
    ),
  ).resolves.toMatchObject({
    name: 'Renamed School',
    language: 'retired-language',
  });

  expect(api.getLanguageWithId).not.toHaveBeenCalled();
  expect(query.update).toHaveBeenCalled();
});

it('continues to reject a newly selected retired language', async () => {
  const { api, query } = setup();

  await expect(
    api.updateSchoolProfile(
      school,
      school.name,
      '',
      '',
      '',
      null,
      undefined,
      undefined,
      undefined,
      undefined,
      'another-retired-language',
    ),
  ).rejects.toThrow('Selected language is not available');

  expect(api.getLanguageWithId).toHaveBeenCalledWith(
    'another-retired-language',
  );
  expect(query.update).not.toHaveBeenCalled();
});
