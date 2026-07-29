import { act, renderHook, waitFor } from '@testing-library/react';
import { SchoolTabs } from '../../interface/modelInterfaces';
import { useSchoolDetailsPage } from './useSchoolDetailsPage';

jest.mock('@capacitor/toast', () => ({
  Toast: {
    show: jest.fn(),
  },
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('react-router', () => ({
  useHistory: () => ({
    goBack: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('../../redux/hooks', () => ({
  useAppSelector: () => ({ roles: [] }),
}));

jest.mock('../../utility/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

const mockApiHandler = {
  getSchoolById: jest.fn(),
  getProgramForSchool: jest.fn(),
  getProgramManagersForSchool: jest.fn(),
  getPrincipalsForSchoolPaginated: jest.fn(),
  getCoordinatorsForSchoolPaginated: jest.fn(),
  school_activity_stats: jest.fn(),
  getSchoolStatsForSchool: jest.fn(),
  getLastSchoolVisit: jest.fn(),
  getTeacherInfoBySchoolId: jest.fn(),
  getStudentInfoBySchoolId: jest.fn(),
  getClassesBySchoolId: jest.fn(),
  getStudentsForClass: jest.fn(),
  getCoursesByClassId: jest.fn(),
  getCourse: jest.fn(),
  getCurriculumsByIds: jest.fn(),
};

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

describe('useSchoolDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockApiHandler.getSchoolById.mockResolvedValue({
      id: 'school-1',
      name: 'Test School',
    });
    mockApiHandler.getProgramForSchool.mockResolvedValue({
      id: 'program-1',
      name: 'Program',
    });
    mockApiHandler.getProgramManagersForSchool.mockResolvedValue([]);
    mockApiHandler.getPrincipalsForSchoolPaginated.mockResolvedValue({
      data: [],
      total: 0,
    });
    mockApiHandler.getCoordinatorsForSchoolPaginated.mockResolvedValue({
      data: [],
      total: 0,
    });
    mockApiHandler.school_activity_stats.mockResolvedValue({
      active_student_percentage: 0,
      active_teacher_percentage: 0,
      avg_weekly_time_minutes: 0,
    });
    mockApiHandler.getSchoolStatsForSchool.mockResolvedValue({
      visits: 0,
      calls_made: 0,
      tech_issues: 0,
      parents_interacted: 0,
      parents_reached: 0,
      students_interacted: 0,
      teachers_interacted: 0,
    });
    mockApiHandler.getLastSchoolVisit.mockResolvedValue(null);
    mockApiHandler.getClassesBySchoolId.mockResolvedValue([
      { id: 'class-1', school_id: 'school-1', name: '6A' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([]);
    mockApiHandler.getCoursesByClassId.mockResolvedValue([
      { course_id: 'course-1' },
    ]);
    mockApiHandler.getCourse.mockResolvedValue({
      id: 'course-1',
      name: 'Math',
      curriculum_id: 'curriculum-1',
    });
    mockApiHandler.getCurriculumsByIds.mockResolvedValue([
      { id: 'curriculum-1', name: 'NCERT' },
    ]);
  });

  it('loads only overview data on initial render', async () => {
    renderHook(() => useSchoolDetailsPage('school-1'));

    await waitFor(() =>
      expect(mockApiHandler.getSchoolById).toHaveBeenCalledWith('school-1'),
    );

    expect(mockApiHandler.getTeacherInfoBySchoolId).not.toHaveBeenCalled();
    expect(mockApiHandler.getStudentInfoBySchoolId).not.toHaveBeenCalled();
    expect(mockApiHandler.getClassesBySchoolId).not.toHaveBeenCalled();
    expect(mockApiHandler.getStudentsForClass).not.toHaveBeenCalled();
    expect(mockApiHandler.getCoursesByClassId).not.toHaveBeenCalled();
    expect(mockApiHandler.getCourse).not.toHaveBeenCalled();
    expect(mockApiHandler.getCurriculumsByIds).not.toHaveBeenCalled();
  });

  it('loads only class rows once when a class-dependent tab is requested', async () => {
    const { result } = renderHook(() => useSchoolDetailsPage('school-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadSchoolDetailsTabData(SchoolTabs.Classes);
    });

    await act(async () => {
      await result.current.loadSchoolDetailsTabData(SchoolTabs.Teachers);
    });

    expect(mockApiHandler.getClassesBySchoolId).toHaveBeenCalledTimes(1);
    expect(mockApiHandler.getStudentsForClass).not.toHaveBeenCalled();
    expect(mockApiHandler.getCoursesByClassId).not.toHaveBeenCalled();
    expect(mockApiHandler.getCourse).not.toHaveBeenCalled();
    expect(mockApiHandler.getCurriculumsByIds).not.toHaveBeenCalled();
  });
});
