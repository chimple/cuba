import { act, renderHook, waitFor } from '@testing-library/react';
import type { ServiceApi } from '../../services/api/ServiceApi';
import { useSchoolCourseSelection } from './useSchoolCourseSelection';

jest.mock('i18next', () => ({
  t: (key: string, options?: { classes?: string }) =>
    options?.classes ? key.replace('{{classes}}', options.classes) : key,
}));
jest.mock('../../utility/logger', () => ({ error: jest.fn() }));

const mockApi = {
  getAllCourses: jest.fn(),
  getAllGrades: jest.fn(),
  getCurriculumsByIds: jest.fn(),
  getCoursesBySchoolId: jest.fn(),
  getClassesBySchoolId: jest.fn(),
  getCoursesByClassId: jest.fn(),
};
const api = mockApi as unknown as ServiceApi;
const editData = { schoolData: { id: 'school-1' } };

beforeEach(() => {
  mockApi.getAllCourses.mockResolvedValue([
    { id: 'a', is_deleted: false },
    { id: 'b', is_deleted: false },
    { id: 'deleted', is_deleted: true },
  ]);
  mockApi.getAllGrades.mockResolvedValue([]);
  mockApi.getCurriculumsByIds.mockResolvedValue([]);
  mockApi.getCoursesBySchoolId.mockResolvedValue([
    { course_id: 'a' },
    { course_id: 'b' },
  ]);
  mockApi.getClassesBySchoolId.mockResolvedValue([]);
  mockApi.getCoursesByClassId.mockResolvedValue([]);
});

it('does not load class assignments or display removal warnings during creation', async () => {
  const { result } = renderHook(() => useSchoolCourseSelection({ api }));
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  act(() => result.current.toggleCourse('a'));
  act(() => result.current.toggleCourse('a'));
  expect(result.current.selectedCourseIds).toEqual([]);
  expect(result.current.courseRemovalWarning).toBe('');
  expect(mockApi.getClassesBySchoolId).not.toHaveBeenCalled();
  expect(mockApi.getCoursesByClassId).not.toHaveBeenCalled();
});

it('ignores duplicate, deleted, and unavailable school course links', async () => {
  mockApi.getCoursesBySchoolId.mockResolvedValue([
    { course_id: 'a' },
    { course_id: 'a' },
    { course_id: 'deleted' },
    { course_id: 'missing' },
    { course_id: 'b', is_deleted: true },
  ]);
  const { result } = renderHook(() =>
    useSchoolCourseSelection({ api, editData }),
  );
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  expect(result.current.selectedCourseIds).toEqual(['a']);
  expect(result.current.initialSelectedCourseIds).toEqual(['a']);
  expect(result.current.courses.map((course) => course.id)).toEqual(['a', 'b']);
});

it('waits for class assignments before allowing checkbox changes', async () => {
  let finishLoading!: (
    links: { class_id: string; course_id: string }[],
  ) => void;
  mockApi.getClassesBySchoolId.mockResolvedValue([
    { id: 'class-1', name: '1A' },
  ]);
  mockApi.getCoursesByClassId.mockReturnValue(
    new Promise((resolve) => {
      finishLoading = resolve;
    }),
  );
  const { result } = renderHook(() =>
    useSchoolCourseSelection({ api, editData }),
  );
  await waitFor(() =>
    expect(mockApi.getCoursesByClassId).toHaveBeenCalledWith('class-1'),
  );
  expect(result.current.isCoursesLoading).toBe(true);
  act(() => result.current.toggleCourse('a'));
  expect(result.current.selectedCourseIds).toEqual([]);
  await act(async () => {
    finishLoading([{ class_id: 'class-1', course_id: 'a' }]);
  });
  expect(result.current.isCoursesLoading).toBe(false);
  act(() => result.current.toggleCourse('a'));
  expect(result.current.selectedCourseIds).toEqual(['a', 'b']);
  expect(result.current.courseRemovalWarning).toContain('1A');
});

it('blocks editing when class assignments fail to load', async () => {
  mockApi.getClassesBySchoolId.mockResolvedValue([
    { id: 'class-1', name: '1A' },
  ]);
  mockApi.getCoursesByClassId.mockRejectedValue(
    new Error('Unable to load class courses'),
  );
  const { result } = renderHook(() =>
    useSchoolCourseSelection({ api, editData }),
  );
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  expect(result.current.courseLoadError).toBe(true);
  expect(result.current.initialSelectedCourseIds).toBeNull();
  act(() => result.current.toggleCourse('a'));
  expect(result.current.selectedCourseIds).toEqual([]);
});

it('preserves pending edits when the same school receives a new navigation state object', async () => {
  const { result, rerender } = renderHook(
    ({ data }) => useSchoolCourseSelection({ api, editData: data }),
    { initialProps: { data: editData } },
  );
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  act(() => result.current.toggleCourse('a'));
  rerender({ data: { schoolData: { id: 'school-1' } } });
  expect(result.current.selectedCourseIds).toEqual(['b']);
  expect(result.current.initialSelectedCourseIds).toEqual(['a', 'b']);
  expect(mockApi.getAllCourses).toHaveBeenCalledTimes(1);
});

it('resets the initial selection and class protection when switching schools', async () => {
  mockApi.getClassesBySchoolId.mockResolvedValueOnce([
    { id: 'class-1', name: '1A' },
  ]);
  mockApi.getCoursesByClassId.mockResolvedValue([
    { class_id: 'class-1', course_id: 'a' },
  ]);
  mockApi.getCoursesBySchoolId
    .mockResolvedValueOnce([{ course_id: 'a' }])
    .mockResolvedValueOnce([{ course_id: 'b' }]);
  const { result, rerender } = renderHook(
    ({ data }) => useSchoolCourseSelection({ api, editData: data }),
    { initialProps: { data: editData } },
  );
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  act(() => result.current.toggleCourse('a'));
  expect(result.current.courseRemovalWarning).toContain('1A');
  rerender({ data: { schoolData: { id: 'school-2' } } });
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  expect(result.current.selectedCourseIds).toEqual(['b']);
  expect(result.current.initialSelectedCourseIds).toEqual(['b']);
  expect(result.current.courseRemovalWarning).toBe('');
  act(() => result.current.toggleCourse('b'));
  expect(result.current.selectedCourseIds).toEqual([]);
});

it('ignores deleted classes and requires a course in every active affected class', async () => {
  mockApi.getClassesBySchoolId.mockResolvedValue([
    { id: 'class-1', name: '1A' },
    { id: 'class-2', name: '2B' },
    { id: 'deleted-class', name: 'Old class', is_deleted: true },
  ]);
  mockApi.getCoursesByClassId.mockImplementation(async (id: string) =>
    id === 'class-1'
      ? [
          { class_id: id, course_id: 'a' },
          { class_id: id, course_id: 'b' },
        ]
      : [{ class_id: id, course_id: 'a' }],
  );
  const { result } = renderHook(() =>
    useSchoolCourseSelection({ api, editData }),
  );
  await waitFor(() => expect(result.current.isCoursesLoading).toBe(false));
  act(() => result.current.toggleCourse('a'));
  expect(result.current.selectedCourseIds).toEqual(['a', 'b']);
  expect(result.current.courseRemovalWarning).toBe(
    'Cannot remove this course because it would leave these classes without any courses: 2B.',
  );
  expect(mockApi.getCoursesByClassId).not.toHaveBeenCalledWith('deleted-class');
});
