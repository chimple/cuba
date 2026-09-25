import { act, renderHook, waitFor } from '@testing-library/react';
import { useAddSchoolPage } from './useAddSchoolPage';
import { SchoolCourseRemovalError } from '../../utility/schoolCourseRemoval';

jest.mock('i18next', () => ({
  t: (key: string, options?: { classes?: string }) =>
    options?.classes ? key.replace('{{classes}}', options.classes) : key,
}));
jest.mock('../../utility/logger', () => ({ error: jest.fn() }));

const mockHistory = { push: jest.fn() };
let mockLocation: { state: unknown };
jest.mock('react-router-dom', () => ({
  useHistory: () => mockHistory,
  useLocation: () => mockLocation,
}));

const mockApi = {
  getAllCourses: jest.fn(),
  getAllGrades: jest.fn(),
  getCurriculumsByIds: jest.fn(),
  getCoursesBySchoolId: jest.fn(),
  getClassesBySchoolId: jest.fn(),
  getCoursesByClassId: jest.fn(),
  getGeoData: jest.fn(),
  getProgramsByRole: jest.fn(),
  getFieldCoordinatorsByProgram: jest.fn(),
  getFieldCoordinatorsForSchools: jest.fn(),
  getSchoolDetailsByUdise: jest.fn(),
  getSchoolDataByUdise: jest.fn(),
  createSchool: jest.fn(),
  updateSchoolProfile: jest.fn(),
  insertSchoolDetails: jest.fn(),
  updateSchoolCourseSelection: jest.fn(),
  addUserToSchool: jest.fn(),
  computeSchoolMetricsForSchool: jest.fn(),
};
jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: { getI: () => ({ apiHandler: mockApi }) },
}));

const program = { id: 'program-1', model: ['at_home'] };
const coordinator = { id: 'coordinator-1' };

beforeEach(() => {
  mockLocation = { state: undefined };
  mockApi.getClassesBySchoolId.mockResolvedValue([]);
  mockApi.getCoursesByClassId.mockResolvedValue([]);
  mockApi.getAllCourses.mockResolvedValue([{ id: 'course-1' }]);
  mockApi.getAllGrades.mockResolvedValue([]);
  mockApi.getCurriculumsByIds.mockResolvedValue([]);
  mockApi.getCoursesBySchoolId.mockResolvedValue([
    { course_id: 'course-1' },
    { course_id: 'unavailable-course' },
  ]);
  mockApi.getGeoData.mockResolvedValue([]);
  mockApi.getProgramsByRole.mockResolvedValue({ data: [program] });
  mockApi.getFieldCoordinatorsByProgram.mockResolvedValue({
    data: [coordinator],
  });
  mockApi.getFieldCoordinatorsForSchools.mockResolvedValue([
    { users: [coordinator] },
  ]);
  mockApi.createSchool.mockResolvedValue({ id: 'school-1' });
});

it.each(['create', 'edit'])(
  '%s requires a course before saving a school',
  async (mode) => {
    if (mode === 'edit') {
      mockLocation.state = {
        schoolData: {
          id: 'school-1',
          name: 'School',
          udise: '12345678901',
          model: 'at_home',
          group1: 'State',
          group2: 'District',
          key_contacts: [{ name: 'Contact', phone: '9876543210' }],
        },
        programData: program,
      };
    }
    const { result } = renderHook(() => useAddSchoolPage());
    await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setSchoolName('Updated School');
      result.current.setSchoolModel('at_home');
      result.current.setFieldCoordinator(coordinator);
      result.current.handleAddressChange('state', 'State');
      result.current.handleAddressChange('district', 'District');
      result.current.handleContactChange(0, 'name', 'Contact');
      result.current.handleContactChange(0, 'phone', '9876543210');
      await result.current.handleUdiseChange('12345678901');
    });
    expect(result.current.isSaveDisabled()).toBe(mode === 'create');
    if (mode === 'create') {
      await act(async () => {
        await result.current.handleApprove();
      });
      act(() => result.current.toggleCourse('course-1'));
    }
    expect(result.current.isSaveDisabled()).toBe(false);

    act(() => result.current.toggleCourse('course-1'));
    expect(result.current.isSaveDisabled()).toBe(true);
    await act(async () => {
      await result.current.handleApprove();
    });
    expect(mockApi.createSchool).not.toHaveBeenCalled();
    expect(mockApi.updateSchoolProfile).not.toHaveBeenCalled();
    expect(mockApi.updateSchoolCourseSelection).not.toHaveBeenCalled();

    act(() => result.current.toggleCourse('course-1'));
    expect(result.current.isSaveDisabled()).toBe(false);
    await act(async () => {
      await result.current.handleApprove();
    });
    expect(mockApi.updateSchoolCourseSelection).toHaveBeenCalledWith(
      'school-1',
      ['course-1'],
    );
  },
);

it('shows the affected class and blocks profile changes until the selection is corrected', async () => {
  mockLocation.state = {
    schoolData: {
      id: 'school-1',
      name: 'School',
      udise: '12345678901',
      model: 'at_home',
      group1: 'State',
      group2: 'District',
      key_contacts: [{ name: 'Contact', phone: '9876543210' }],
    },
    programData: program,
  };
  mockApi.getAllCourses.mockResolvedValue([
    { id: 'course-1' },
    { id: 'course-2' },
  ]);
  mockApi.getCoursesBySchoolId.mockResolvedValue([
    { course_id: 'course-1' },
    { course_id: 'course-2' },
  ]);
  mockApi.updateSchoolCourseSelection.mockRejectedValueOnce(
    new SchoolCourseRemovalError(['1A']),
  );
  const { result } = renderHook(() => useAddSchoolPage());
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  await waitFor(() =>
    expect(result.current.fieldCoordinator).toEqual(coordinator),
  );
  act(() => {
    result.current.setSchoolName('Updated School');
    result.current.toggleCourse('course-1');
  });
  await act(async () => {
    await result.current.handleApprove();
  });
  expect(result.current.courseRemovalError).toBe(
    'Cannot remove these courses because the following classes would have no courses: 1A. Add another course to these classes first.',
  );
  expect(result.current.isSaveDisabled()).toBe(true);
  expect(mockApi.updateSchoolProfile).not.toHaveBeenCalled();
  expect(mockApi.insertSchoolDetails).not.toHaveBeenCalled();
  expect(mockHistory.push).not.toHaveBeenCalled();

  act(() => result.current.toggleCourse('course-1'));
  expect(result.current.courseRemovalError).toBe('');
  expect(result.current.isSaveDisabled()).toBe(false);
  await act(async () => {
    await result.current.handleApprove();
  });
  expect(mockApi.updateSchoolProfile).toHaveBeenCalled();
  expect(mockHistory.push).toHaveBeenCalled();
});

describe('immediate protection of courses required by classes', () => {
  beforeEach(() => {
    mockLocation.state = {
      schoolData: {
        id: 'school-1',
        name: 'School',
        udise: '12345678901',
        model: 'at_home',
        group1: 'State',
        group2: 'District',
        key_contacts: [{ name: 'Contact', phone: '9876543210' }],
      },
      programData: program,
    };
    mockApi.getAllCourses.mockResolvedValue([
      { id: 'course-1' },
      { id: 'course-2' },
    ]);
    mockApi.getCoursesBySchoolId.mockResolvedValue([
      { course_id: 'course-1' },
      { course_id: 'course-2' },
    ]);
    mockApi.getClassesBySchoolId.mockResolvedValue([
      { id: 'class-1', name: '1A' },
    ]);
  });

  it('keeps the required course checked and still saves other removals', async () => {
    mockApi.getCoursesByClassId.mockResolvedValue([
      { class_id: 'class-1', course_id: 'course-1', is_deleted: false },
    ]);
    const { result } = renderHook(() => useAddSchoolPage());
    await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
    await waitFor(() =>
      expect(result.current.fieldCoordinator).toEqual(coordinator),
    );

    act(() => result.current.toggleCourse('course-1'));
    expect(result.current.selectedCourseIds).toEqual(['course-1', 'course-2']);
    expect(result.current.courseRemovalError).toBe(
      'Cannot remove this course because it would leave these classes without any courses: 1A.',
    );
    expect(mockApi.updateSchoolCourseSelection).not.toHaveBeenCalled();

    act(() => result.current.toggleCourse('course-2'));
    expect(result.current.selectedCourseIds).toEqual(['course-1']);
    expect(result.current.courseRemovalError).toBe('');
    act(() => result.current.toggleCourse('course-1'));
    expect(result.current.selectedCourseIds).toEqual(['course-1']);
    expect(result.current.isSaveDisabled()).toBe(false);
    await act(async () => {
      await result.current.handleApprove();
    });
    expect(mockApi.updateSchoolCourseSelection).toHaveBeenCalledWith(
      'school-1',
      ['course-1'],
    );
    expect(mockHistory.push).toHaveBeenCalled();
  });

  it('retains the last remaining course during rapid removals and allows switching it', async () => {
    mockApi.getCoursesByClassId.mockResolvedValue([
      { class_id: 'class-1', course_id: 'course-1', is_deleted: false },
      { class_id: 'class-1', course_id: 'course-2', is_deleted: false },
    ]);
    const { result } = renderHook(() => useAddSchoolPage());
    await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
    act(() => {
      result.current.toggleCourse('course-1');
      result.current.toggleCourse('course-2');
    });
    expect(result.current.selectedCourseIds).toEqual(['course-2']);
    expect(result.current.courseRemovalError).toContain('1A');

    act(() => {
      result.current.toggleCourse('course-1');
      result.current.toggleCourse('course-2');
    });
    expect(result.current.selectedCourseIds).toEqual(['course-1']);
    expect(result.current.courseRemovalError).toBe('');
  });
});
