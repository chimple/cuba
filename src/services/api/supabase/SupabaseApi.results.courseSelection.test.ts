import { SupabaseApiResultsCourseSelection } from './SupabaseApi.results.courseSelection';
import { SchoolCourseRemovalError } from '../../../utility/schoolCourseRemoval';

jest.mock('./SupabaseApi.results.studentProfiles', () => ({
  SupabaseApiResultsStudentProfiles: class {},
}));

function query(data: unknown, error: unknown = null) {
  const response = Promise.resolve({ data, error });
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    then: response.then.bind(response),
  };
}

function setup(
  links: { class_id: string; course_id: string; is_deleted?: boolean }[],
  readError: unknown = null,
) {
  const school = query(
    ['remove', 'remove-2', 'keep'].map((course_id) => ({
      id: `school-${course_id}`,
      course_id,
      is_deleted: false,
    })),
  );
  const classes = query([
    { id: 'class-1', name: '1A' },
    { id: 'class-2', name: '2B' },
  ]);
  const classCourses = query(
    links.map((link, index) => ({
      id: `link-${index}`,
      is_deleted: false,
      ...link,
    })),
    readError,
  );
  const queries: Record<string, ReturnType<typeof query>> = {
    school_course: school,
    class: classes,
    class_course: classCourses,
  };
  const api = new SupabaseApiResultsCourseSelection();
  api.supabase = { from: jest.fn((table: string) => queries[table]) };
  api.getCourses = jest.fn().mockResolvedValue([]);
  return { api, school, classCourses };
}

it.each([
  {
    name: 'the only course assigned to a class',
    links: [{ class_id: 'class-1', course_id: 'remove' }],
    selected: ['keep', 'remove-2'],
  },
  {
    name: 'duplicate links and a deleted alternative course',
    links: [
      { class_id: 'class-1', course_id: 'remove' },
      { class_id: 'class-1', course_id: 'remove' },
      { class_id: 'class-1', course_id: 'keep', is_deleted: true },
    ],
    selected: ['keep', 'remove-2'],
  },
  {
    name: 'all courses from a class removed together',
    links: [
      { class_id: 'class-1', course_id: 'remove' },
      { class_id: 'class-1', course_id: 'remove-2' },
    ],
    selected: ['keep'],
  },
])('blocks $name before any writes', async ({ links, selected }) => {
  const { api, school, classCourses } = setup(links);
  await expect(
    api.updateSchoolCourseSelection('school-1', selected),
  ).rejects.toMatchObject({
    name: 'SchoolCourseRemovalError',
    classNames: ['1A'],
  });
  expect(school.update).not.toHaveBeenCalled();
  expect(school.insert).not.toHaveBeenCalled();
  expect(classCourses.update).not.toHaveBeenCalled();
  expect(classCourses.insert).not.toHaveBeenCalled();
});

it('allows removal when affected classes retain another course', async () => {
  const { api, school, classCourses } = setup([
    { class_id: 'class-1', course_id: 'remove' },
    { class_id: 'class-1', course_id: 'keep' },
    { class_id: 'class-2', course_id: 'keep' },
  ]);
  await api.updateSchoolCourseSelection('school-1', ['keep']);
  expect(school.in).toHaveBeenCalledWith('id', [
    'school-remove',
    'school-remove-2',
  ]);
  expect(classCourses.in).toHaveBeenCalledWith('id', ['link-0']);
});

it('allows removal of a course that is not assigned to a class', async () => {
  const { api, school, classCourses } = setup([
    { class_id: 'class-1', course_id: 'keep' },
  ]);
  await api.updateSchoolCourseSelection('school-1', ['keep']);
  expect(school.update).toHaveBeenCalled();
  expect(classCourses.update).not.toHaveBeenCalled();
});

it('identifies every class that would lose its last course', async () => {
  const { api } = setup([
    { class_id: 'class-1', course_id: 'remove' },
    { class_id: 'class-2', course_id: 'remove' },
  ]);
  await expect(
    api.updateSchoolCourseSelection('school-1', ['keep']),
  ).rejects.toEqual(new SchoolCourseRemovalError(['1A', '2B']));
});

it('does not remove courses when class assignments cannot be read', async () => {
  const error = new Error('Unable to load assignments');
  const { api, school, classCourses } = setup([], error);
  await expect(
    api.updateSchoolCourseSelection('school-1', ['keep']),
  ).rejects.toBe(error);
  expect(school.update).not.toHaveBeenCalled();
  expect(classCourses.update).not.toHaveBeenCalled();
});
