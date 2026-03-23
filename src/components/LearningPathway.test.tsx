import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LearningPathway from './LearningPathway';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { schoolUtil } from '../utility/schoolUtil';
import { useGrowthBook } from '@growthbook/growthbook-react';
import {
  sortCoursesByStudentLanguage,
  useLearningPath,
} from '../hooks/useLearningPath';
import {
  CURRENT_PATHWAY_MODE,
  LEARNING_PATHWAY_MODE,
  LATEST_STARS,
  STARS_COUNT,
} from '../common/constants';
import logger from '../utility/logger';

jest.mock('./Home/DropdownMenu', () => () => (
  <div data-testid="dropdown-menu" />
));
jest.mock('./learningPathway/PathwayStructure', () => () => (
  <div data-testid="pathway-structure" />
));
jest.mock('./learningPathway/chapterLessonBox', () => () => (
  <div data-testid="chapter-lesson-box" />
));
jest.mock(
  './Loading',
  () => (props: any) =>
    props.isLoading ? <div data-testid="loading">loading</div> : null,
);

jest.mock('../utility/util');
jest.mock('../utility/schoolUtil');
jest.mock('@growthbook/growthbook-react');
jest.mock('../hooks/useLearningPath', () => ({
  __esModule: true,
  useLearningPath: jest.fn(),
  sortCoursesByStudentLanguage: jest.fn(),
}));

const mockApi = {
  getUserByDocId: jest.fn(),
  isStudentLinked: jest.fn(),
  getCoursesForClassStudent: jest.fn(),
  getCoursesForPathway: jest.fn(),
  updateStudentStars: jest.fn(),
};

describe('LearningPathway', () => {
  const getPath = jest.fn();
  let originalConsoleError: typeof logger.error;

  beforeEach(() => {
    jest.resetAllMocks();
    originalConsoleError = logger.error;
    jest.spyOn(logger, 'error').mockImplementation((...args: any[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('AggregateError')) return;
      originalConsoleError(...args);
    });
    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      stars: 5,
      language_id: 'en',
    });
    (Util.setCurrentStudent as jest.Mock).mockResolvedValue(undefined);
    (schoolUtil.getCurrentClass as jest.Mock).mockReturnValue({
      id: 'class-1',
      school_id: 'school-1',
    });
    (useGrowthBook as jest.Mock).mockReturnValue({
      ready: true,
      getAttributes: () => ({}),
      setAttributes: jest.fn(),
      getFeatureValue: jest.fn(() => LEARNING_PATHWAY_MODE.DISABLED),
    });
    (useLearningPath as jest.Mock).mockReturnValue({ getPath });
    (sortCoursesByStudentLanguage as jest.Mock).mockImplementation(
      async (courses: any[]) => courses,
    );
    mockApi.getUserByDocId.mockResolvedValue({ id: 'stu-1', stars: 8 });
    mockApi.isStudentLinked.mockResolvedValue(false);
    mockApi.getCoursesForPathway.mockResolvedValue([
      { id: 'c1', name: 'Course 1' },
    ]);
    mockApi.getCoursesForClassStudent.mockResolvedValue([
      { id: 'c2', name: 'Course 2' },
    ]);
    mockApi.updateStudentStars.mockResolvedValue(undefined);
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders pathway section components after load', async () => {
    render(<LearningPathway />);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('pathway-structure')).toBeInTheDocument();
      expect(screen.getByTestId('chapter-lesson-box')).toBeInTheDocument();
    });
  });

  test('uses getCoursesForPathway when student is not linked', async () => {
    mockApi.isStudentLinked.mockResolvedValue(false);
    render(<LearningPathway />);

    await waitFor(() => {
      expect(mockApi.getCoursesForPathway).toHaveBeenCalledWith('stu-1');
      expect(mockApi.getCoursesForClassStudent).not.toHaveBeenCalled();
      expect(getPath).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: LEARNING_PATHWAY_MODE.DISABLED,
          classId: undefined,
        }),
      );
    });
  });

  test('uses getCoursesForClassStudent when student is linked', async () => {
    mockApi.isStudentLinked.mockResolvedValue(true);
    render(<LearningPathway />);

    await waitFor(() => {
      expect(mockApi.getCoursesForClassStudent).toHaveBeenCalledWith('class-1');
      expect(getPath).toHaveBeenCalledWith(
        expect.objectContaining({ classId: 'class-1' }),
      );
    });
  });

  test('refreshes current student from API on mount', async () => {
    render(<LearningPathway />);
    await waitFor(() => {
      expect(mockApi.getUserByDocId).toHaveBeenCalledWith('stu-1');
      expect(Util.setCurrentStudent).toHaveBeenCalledWith({
        id: 'stu-1',
        stars: 8,
      });
    });
  });

  test('shows loading state while async init is in progress', async () => {
    let resolver: any;
    mockApi.getCoursesForPathway.mockReturnValue(
      new Promise((res) => {
        resolver = res;
      }),
    );

    render(<LearningPathway />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    resolver([{ id: 'c1', name: 'Course 1' }]);
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  test('handles init errors and recovers UI', async () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    mockApi.getCoursesForPathway.mockRejectedValue(new Error('api-failed'));
    render(<LearningPathway />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  test('uses growthbook-resolved mode when fetching path', async () => {
    (useGrowthBook as jest.Mock).mockReturnValue({
      ready: true,
      getAttributes: () => ({}),
      setAttributes: jest.fn(),
      getFeatureValue: jest.fn(() => LEARNING_PATHWAY_MODE.FULL_ADAPTIVE),
    });
    render(<LearningPathway />);

    await waitFor(() => {
      expect(getPath).toHaveBeenCalledWith(
        expect.objectContaining({ mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE }),
      );
    });
  });

  test('does not call getPath when growthbook is not ready', async () => {
    (useGrowthBook as jest.Mock).mockReturnValue({
      ready: false,
      getAttributes: () => ({}),
      setAttributes: jest.fn(),
      getFeatureValue: jest.fn(() => LEARNING_PATHWAY_MODE.DISABLED),
    });
    render(<LearningPathway />);
    await waitFor(() => {
      expect(getPath).not.toHaveBeenCalled();
    });
  });

  test('does not call getPath when no student exists', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    render(<LearningPathway />);
    await waitFor(() => {
      expect(getPath).not.toHaveBeenCalled();
      expect(mockApi.getCoursesForPathway).not.toHaveBeenCalled();
    });
  });

  test('writes resolved mode to localStorage', async () => {
    render(<LearningPathway />);
    await waitFor(() => {
      expect(localStorage.getItem(CURRENT_PATHWAY_MODE)).toBe(
        LEARNING_PATHWAY_MODE.DISABLED,
      );
    });
  });

  test('passes fetched pathway courses into getPath payload', async () => {
    mockApi.isStudentLinked.mockResolvedValue(false);
    mockApi.getCoursesForPathway.mockResolvedValue([
      { id: 'c1', name: 'Course 1' },
      { id: 'c2', name: 'Course 2' },
    ]);
    render(<LearningPathway />);
    await waitFor(() => {
      expect(getPath).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: [
            { id: 'c1', name: 'Course 1' },
            { id: 'c2', name: 'Course 2' },
          ],
        }),
      );
    });
  });

  test('falls back to pathway courses when linked but class is undefined', async () => {
    mockApi.isStudentLinked.mockResolvedValue(true);
    (schoolUtil.getCurrentClass as jest.Mock).mockReturnValue(undefined);
    render(<LearningPathway />);
    await waitFor(() => {
      expect(mockApi.getCoursesForPathway).toHaveBeenCalledWith('stu-1');
    });
  });

  test('does not set current student when refresh API returns null', async () => {
    mockApi.getUserByDocId.mockResolvedValue(null);
    render(<LearningPathway />);
    await waitFor(() => {
      expect(Util.setCurrentStudent).not.toHaveBeenCalled();
    });
  });

  test('updates local star map when db stars are newer', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      stars: 12,
      language_id: 'en',
    });
    // Ensure the refresh API returns the newer DB value for this test
    mockApi.getUserByDocId.mockResolvedValue({ id: 'stu-1', stars: 12 });
    localStorage.setItem(STARS_COUNT, JSON.stringify({ 'stu-1': 3 }));
    localStorage.setItem(LATEST_STARS('stu-1'), '2');

    render(<LearningPathway />);
    await waitFor(() => {
      const starMap = JSON.parse(localStorage.getItem(STARS_COUNT) || '{}');
      expect(starMap['stu-1']).toBe(12);
      expect(localStorage.getItem(LATEST_STARS('stu-1'))).toBe('12');
    });
  });

  test('syncs DB when latest local stars are higher than DB stars', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      stars: 5,
      language_id: 'en',
    });
    localStorage.setItem(STARS_COUNT, JSON.stringify({ 'stu-1': 5 }));
    localStorage.setItem(LATEST_STARS('stu-1'), '19');

    render(<LearningPathway />);
    await waitFor(() => {
      expect(mockApi.updateStudentStars).toHaveBeenCalledWith('stu-1', 19);
    });
  });

  test('uses resolved growthbook mode during getPath even if localStorage was pre-set', async () => {
    localStorage.setItem(
      CURRENT_PATHWAY_MODE,
      LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
    );
    (useGrowthBook as jest.Mock).mockReturnValue({
      ready: true,
      getAttributes: () => ({}),
      setAttributes: jest.fn(),
      getFeatureValue: jest.fn(() => LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY),
    });
    render(<LearningPathway />);
    await waitFor(() => {
      expect(getPath).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
        }),
      );
    });
  });

  test('always renders structural components even when init errors', async () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    mockApi.isStudentLinked.mockRejectedValueOnce(
      new Error('link-check-failed'),
    );
    render(<LearningPathway />);
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('pathway-structure')).toBeInTheDocument();
      expect(screen.getByTestId('chapter-lesson-box')).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  test('calls schoolUtil.getCurrentClass during mode resolution even when not linked', async () => {
    mockApi.isStudentLinked.mockResolvedValue(false);
    render(<LearningPathway />);
    await waitFor(() => {
      expect(schoolUtil.getCurrentClass).toHaveBeenCalled();
    });
  });

  test('calls schoolUtil.getCurrentClass when linked', async () => {
    mockApi.isStudentLinked.mockResolvedValue(true);
    render(<LearningPathway />);
    await waitFor(() => {
      expect(schoolUtil.getCurrentClass).toHaveBeenCalled();
    });
  });

  test('passes courses to getPath when sort does not transform order', async () => {
    mockApi.getCoursesForPathway.mockResolvedValue([
      { id: 'c1', name: 'Course 1' },
    ]);
    render(<LearningPathway />);
    await waitFor(() => {
      expect(getPath).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: [{ id: 'c1', name: 'Course 1' }],
        }),
      );
    });
  });
});
