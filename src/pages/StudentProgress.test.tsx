import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentProgress from './StudentProgress';
import { PAGES } from '../common/constants';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('@ionic/react', () => ({
  IonRow: ({ children }: any) => <div data-testid="ion-row">{children}</div>,
  IonCol: ({ children }: any) => <div data-testid="ion-col">{children}</div>,
}));

const mockHistory = { push: jest.fn(), replace: jest.fn() };
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => mockHistory,
  };
});

const mockGetCurrentStudent = jest.fn();
const mockSetPathToBackButton = jest.fn();
jest.mock('../utility/util', () => ({
  Util: {
    getCurrentStudent: (...args: any[]) => mockGetCurrentStudent(...args),
    setPathToBackButton: (...args: any[]) => mockSetPathToBackButton(...args),
  },
}));

jest.mock('../components/SkeltonLoading', () => ({
  __esModule: true,
  default: ({ isLoading, header }: any) => (
    <div data-testid="student-progress-skeleton">
      {String(isLoading)}-{String(header)}
    </div>
  ),
}));

jest.mock('../components/studentProgress/CustomAppBar', () => ({
  __esModule: true,
  default: ({ tabs, onChange, handleBackButton }: any) => (
    <div data-testid="custom-app-bar">
      <button type="button" onClick={() => handleBackButton?.()}>
        back
      </button>
      <button type="button" onClick={() => onChange?.('missing-course')}>
        missing-course
      </button>
      {Object.entries(tabs ?? {}).map(([tabId, tabLabel]) => (
        <button key={tabId} type="button" onClick={() => onChange?.(tabId)}>
          {String(tabId)}
          <span data-testid={`tab-label-${String(tabId)}`}>
            {tabLabel as any}
          </span>
        </button>
      ))}
    </div>
  ),
}));

const mockApiHandler = {
  getStudentClassesAndSchools: jest.fn(),
  getClassById: jest.fn(),
  getCoursesForClassStudent: jest.fn(),
  getCoursesForParentsStudent: jest.fn(),
  getGradeById: jest.fn(),
  getCurriculumById: jest.fn(),
  getStudentProgress: jest.fn(),
};

jest.mock('../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

describe('StudentProgress', () => {
  const student = { id: 'student-1', name: 'Student One' } as any;
  const classDoc = { id: 'class-1', name: 'Class One' } as any;
  const course1 = {
    id: 'course-1',
    code: 'math-tab',
    name: 'Math',
    grade_id: 'grade-1',
    curriculum_id: 'curr-1',
    image: 'math.svg',
  } as any;
  const course2 = {
    id: 'course-2',
    code: 'eng-tab',
    name: 'English',
    grade_id: 'grade-2',
    curriculum_id: 'curr-2',
    image: 'eng.svg',
  } as any;
  const course3 = {
    id: 'course-3',
    code: 'sci-tab',
    name: 'Science',
    grade_id: 'grade-3',
    curriculum_id: 'curr-3',
    image: undefined,
  } as any;

  const classProgress = {
    'course-1': [
      {
        lesson_name: 'Addition',
        chapter_name: 'Numbers',
        score: 91.9,
        time_spent: 125,
      },
    ],
    'course-2': [],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCurrentStudent.mockResolvedValue(student);
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: classDoc.id }],
    });
    mockApiHandler.getClassById.mockResolvedValue(classDoc);
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([
      course1,
      course2,
    ]);
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([course2]);
    mockApiHandler.getGradeById.mockImplementation(async (gradeId: string) => ({
      id: gradeId,
      name: `${gradeId}-name`,
    }));
    mockApiHandler.getCurriculumById.mockImplementation(
      async (curriculumId: string) => ({
        id: curriculumId,
        name: `${curriculumId}-name`,
      }),
    );
    mockApiHandler.getStudentProgress.mockResolvedValue(classProgress);
  });

  it('loads class courses on mount and renders the first course results', async () => {
    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getCoursesForClassStudent).toHaveBeenCalledWith(
        classDoc.id,
      );
    });

    expect(await screen.findByText('Lesson Name')).toBeInTheDocument();
    expect(screen.getByText('Addition')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
    expect(screen.getByText('91')).toBeInTheDocument();
    expect(screen.getByText('2:5')).toBeInTheDocument();
    expect(mockApiHandler.getCoursesForParentsStudent).not.toHaveBeenCalled();
    expect(mockApiHandler.getStudentProgress).toHaveBeenCalledWith(student.id);
  });

  it('looks up the first linked class before loading class courses', async () => {
    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getClassById).toHaveBeenCalledWith(classDoc.id);
    });

    expect(mockApiHandler.getStudentClassesAndSchools).toHaveBeenCalledWith(
      student.id,
    );
  });

  it('uses only the first linked class when multiple classes are returned', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: classDoc.id }, { id: 'class-2' }],
    });

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getClassById).toHaveBeenCalledTimes(1);
    });

    expect(mockApiHandler.getClassById).toHaveBeenCalledWith(classDoc.id);
    expect(mockApiHandler.getCoursesForClassStudent).toHaveBeenCalledWith(
      classDoc.id,
    );
  });

  it('falls back to parent courses when the student has no class', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
    });
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([course2]);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-2': [
        {
          lesson_name: 'Grammar',
          chapter_name: 'Words',
          score: 80,
          time_spent: 61,
        },
      ],
    });

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalledWith(
        student.id,
      );
    });

    expect(mockApiHandler.getCoursesForClassStudent).not.toHaveBeenCalled();
    expect(await screen.findByText('Grammar')).toBeInTheDocument();
    expect(screen.getByText('1:1')).toBeInTheDocument();
  });

  it('falls back to parent courses when classes is undefined', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({});
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([course2]);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-2': [
        {
          lesson_name: 'Vocabulary',
          chapter_name: 'Words',
          score: 66,
          time_spent: 62,
        },
      ],
    });

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalledWith(
        student.id,
      );
    });

    expect(mockApiHandler.getClassById).not.toHaveBeenCalled();
    expect(await screen.findByText('Vocabulary')).toBeInTheDocument();
  });

  it('does not look up a class document when the linked class list is empty', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
    });

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalledWith(
        student.id,
      );
    });

    expect(mockApiHandler.getClassById).not.toHaveBeenCalled();
  });

  it('falls back to parent courses when class lookup returns undefined', async () => {
    mockApiHandler.getClassById.mockResolvedValue(undefined);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-2': [
        {
          lesson_name: 'Reading',
          chapter_name: 'Stories',
          score: 72,
          time_spent: 130,
        },
      ],
    });

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalledWith(
        student.id,
      );
    });

    expect(mockApiHandler.getCoursesForClassStudent).not.toHaveBeenCalled();
    expect(await screen.findByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('2:10')).toBeInTheDocument();
  });

  it('falls back to parent courses when class lookup returns null', async () => {
    mockApiHandler.getClassById.mockResolvedValue(null);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-2': [
        {
          lesson_name: 'Phonics',
          chapter_name: 'Sounds',
          score: 70,
          time_spent: 75,
        },
      ],
    });

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalledWith(
        student.id,
      );
    });

    expect(mockApiHandler.getCoursesForClassStudent).not.toHaveBeenCalled();
    expect(await screen.findByText('Phonics')).toBeInTheDocument();
    expect(screen.getByText('1:15')).toBeInTheDocument();
  });

  it('renders the fixed progress table headers after initialization', async () => {
    render(<StudentProgress />);

    expect(await screen.findByText('Lesson Name')).toBeInTheDocument();
    expect(screen.getByText('Chapter Name')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Time Spent')).toBeInTheDocument();
  });

  it('shows the no data message when switching to a course without lesson results', async () => {
    const user = userEvent.setup();
    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(
      (await screen.findByTestId('tab-label-course-2')).closest('button')!,
    );

    await waitFor(() => {
      expect(screen.getByText('No Data')).toBeInTheDocument();
    });

    expect(screen.queryByText('Addition')).not.toBeInTheDocument();
  });

  it('shows no data on initial load when the first course has an empty result array', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [],
      'course-2': [
        {
          lesson_name: 'Listening',
          chapter_name: 'Audio',
          score: 88,
          time_spent: 100,
        },
      ],
    });

    render(<StudentProgress />);

    expect(await screen.findByText('No Data')).toBeInTheDocument();
    expect(screen.queryByText('Listening')).not.toBeInTheDocument();
  });

  it('shows the second course results when switching to a tab with data', async () => {
    const user = userEvent.setup();
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Addition',
          chapter_name: 'Numbers',
          score: 91.9,
          time_spent: 125,
        },
      ],
      'course-2': [
        {
          lesson_name: 'Comprehension',
          chapter_name: 'Reading',
          score: 77.4,
          time_spent: 143,
        },
      ],
    });

    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(
      (await screen.findByTestId('tab-label-course-2')).closest('button')!,
    );

    await waitFor(() => {
      expect(screen.getByText('Comprehension')).toBeInTheDocument();
    });

    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('77')).toBeInTheDocument();
    expect(screen.getByText('2:23')).toBeInTheDocument();
    expect(screen.queryByText('Addition')).not.toBeInTheDocument();
  });

  it('can switch to a second course and then back to the first course', async () => {
    const user = userEvent.setup();
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Addition',
          chapter_name: 'Numbers',
          score: 91.9,
          time_spent: 125,
        },
      ],
      'course-2': [
        {
          lesson_name: 'Poetry',
          chapter_name: 'Reading',
          score: 50,
          time_spent: 90,
        },
      ],
    });

    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(
      (await screen.findByTestId('tab-label-course-2')).closest('button')!,
    );
    await screen.findByText('Poetry');

    await user.click(
      (await screen.findByTestId('tab-label-course-1')).closest('button')!,
    );

    await waitFor(() => {
      expect(screen.getByText('Addition')).toBeInTheDocument();
    });

    expect(screen.queryByText('Poetry')).not.toBeInTheDocument();
  });

  it('shows no data when the selected course is missing from the progress map', async () => {
    const user = userEvent.setup();
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Addition',
          chapter_name: 'Numbers',
          score: 91.9,
          time_spent: 125,
        },
      ],
    });

    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(
      (await screen.findByTestId('tab-label-course-2')).closest('button')!,
    );

    await waitFor(() => {
      expect(screen.getByText('No Data')).toBeInTheDocument();
    });

    expect(screen.queryByText('Addition')).not.toBeInTheDocument();
  });

  it('ignores unknown tab changes and keeps the current course content', async () => {
    const user = userEvent.setup();
    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(screen.getByRole('button', { name: 'missing-course' }));

    expect(screen.getByText('Addition')).toBeInTheDocument();
    expect(screen.queryByText('No Data')).not.toBeInTheDocument();
  });

  it('renders a tab entry for each returned course', async () => {
    render(<StudentProgress />);

    await screen.findByText('Addition');

    expect(await screen.findByTestId('tab-label-course-1')).toBeInTheDocument();
    expect(await screen.findByTestId('tab-label-course-2')).toBeInTheDocument();
  });

  it('renders an additional tab when a third course is returned', async () => {
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([
      course1,
      course2,
      course3,
    ]);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': classProgress['course-1'],
      'course-2': [],
      'course-3': [],
    });

    render(<StudentProgress />);

    expect(await screen.findByTestId('tab-label-course-1')).toBeInTheDocument();
    expect(await screen.findByTestId('tab-label-course-2')).toBeInTheDocument();
    expect(await screen.findByTestId('tab-label-course-3')).toBeInTheDocument();
  });

  it('renders course, grade, and curriculum text inside the tab labels', async () => {
    render(<StudentProgress />);

    await screen.findByTestId('tab-label-course-1');
    await screen.findByTestId('tab-label-course-2');

    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('grade-1-name')).toBeInTheDocument();
    expect(screen.getByText('grade-2-name')).toBeInTheDocument();
    expect(screen.getByText('curr-1-name')).toBeInTheDocument();
    expect(screen.getByText('curr-2-name')).toBeInTheDocument();
  });

  it('renders a third course label with its metadata when present', async () => {
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([
      course1,
      course2,
      course3,
    ]);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': classProgress['course-1'],
      'course-2': [],
      'course-3': [],
    });

    render(<StudentProgress />);

    await screen.findByTestId('tab-label-course-3');

    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('grade-3-name')).toBeInTheDocument();
    expect(screen.getByText('curr-3-name')).toBeInTheDocument();
  });

  it('fetches grade and curriculum metadata for each course', async () => {
    render(<StudentProgress />);

    await screen.findByText('Addition');

    expect(mockApiHandler.getGradeById).toHaveBeenCalledTimes(2);
    expect(mockApiHandler.getGradeById).toHaveBeenNthCalledWith(1, 'grade-1');
    expect(mockApiHandler.getGradeById).toHaveBeenNthCalledWith(2, 'grade-2');
    expect(mockApiHandler.getCurriculumById).toHaveBeenCalledTimes(2);
    expect(mockApiHandler.getCurriculumById).toHaveBeenNthCalledWith(
      1,
      'curr-1',
    );
    expect(mockApiHandler.getCurriculumById).toHaveBeenNthCalledWith(
      2,
      'curr-2',
    );
  });

  it('fetches metadata for every returned course when three courses are present', async () => {
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([
      course1,
      course2,
      course3,
    ]);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': classProgress['course-1'],
      'course-2': [],
      'course-3': [],
    });

    render(<StudentProgress />);

    await screen.findByTestId('tab-label-course-3');

    expect(mockApiHandler.getGradeById).toHaveBeenCalledTimes(3);
    expect(mockApiHandler.getCurriculumById).toHaveBeenCalledTimes(3);
    expect(mockApiHandler.getGradeById).toHaveBeenNthCalledWith(3, 'grade-3');
    expect(mockApiHandler.getCurriculumById).toHaveBeenNthCalledWith(
      3,
      'curr-3',
    );
  });

  it('keeps rendering tab labels when grade and curriculum metadata are missing', async () => {
    mockApiHandler.getGradeById.mockResolvedValue(undefined);
    mockApiHandler.getCurriculumById.mockResolvedValue(undefined);

    render(<StudentProgress />);

    await screen.findByText('Addition');

    expect(await screen.findByTestId('tab-label-course-1')).toBeInTheDocument();
    expect(await screen.findByTestId('tab-label-course-2')).toBeInTheDocument();
  });

  it('renders grade text even when curriculum metadata is missing', async () => {
    mockApiHandler.getCurriculumById.mockResolvedValue(undefined);

    render(<StudentProgress />);

    await screen.findByTestId('tab-label-course-1');
    await screen.findByTestId('tab-label-course-2');

    expect(screen.getByText('grade-1-name')).toBeInTheDocument();
    expect(screen.getByText('grade-2-name')).toBeInTheDocument();
    expect(screen.queryByText('curr-1-name')).not.toBeInTheDocument();
  });

  it('renders curriculum text even when grade metadata is missing', async () => {
    mockApiHandler.getGradeById.mockResolvedValue(undefined);

    render(<StudentProgress />);

    await screen.findByTestId('tab-label-course-1');
    await screen.findByTestId('tab-label-course-2');

    expect(screen.getByText('curr-1-name')).toBeInTheDocument();
    expect(screen.getByText('curr-2-name')).toBeInTheDocument();
    expect(screen.queryByText('grade-1-name')).not.toBeInTheDocument();
  });

  it('renders multiple lesson rows for the selected course', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Addition',
          chapter_name: 'Numbers',
          score: 91.9,
          time_spent: 125,
        },
        {
          lesson_name: 'Subtraction',
          chapter_name: 'Numbers',
          score: 44.2,
          time_spent: 59,
        },
      ],
      'course-2': [],
    });

    render(<StudentProgress />);

    expect(await screen.findByText('Subtraction')).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('0:59')).toBeInTheDocument();
  });

  it('floors decimal scores instead of rounding them', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Decimals',
          chapter_name: 'Numbers',
          score: 99.99,
          time_spent: 10,
        },
      ],
      'course-2': [],
    });

    render(<StudentProgress />);

    expect(await screen.findByText('Decimals')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  it('preserves negative scores through Math.floor when provided by the API', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Penalty',
          chapter_name: 'Review',
          score: -0.2,
          time_spent: 15,
        },
      ],
      'course-2': [],
    });

    render(<StudentProgress />);

    expect(await screen.findByText('Penalty')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('formats whole-minute durations without padding seconds', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Shapes',
          chapter_name: 'Geometry',
          score: 60,
          time_spent: 60,
        },
      ],
      'course-2': [],
    });

    render(<StudentProgress />);

    expect(await screen.findByText('Shapes')).toBeInTheDocument();
    expect(screen.getByText('1:0')).toBeInTheDocument();
  });

  it('formats zero-second durations as 0:0', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Intro',
          chapter_name: 'Basics',
          score: 10,
          time_spent: 0,
        },
      ],
      'course-2': [],
    });

    render(<StudentProgress />);

    expect(await screen.findByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('0:0')).toBeInTheDocument();
  });

  it('shows no data when progress response is null after tabs are initialized', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue(null);

    render(<StudentProgress />);

    expect(await screen.findByTestId('tab-label-course-1')).toBeInTheDocument();

    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(mockApiHandler.getStudentProgress).toHaveBeenCalledWith(student.id);
  });

  it('shows no data when progress response is false', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue(false as any);

    render(<StudentProgress />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-label-course-1')).toBeInTheDocument();
    });

    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('shows no data when progress response is an empty object', async () => {
    mockApiHandler.getStudentProgress.mockResolvedValue({});

    render(<StudentProgress />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-label-course-1')).toBeInTheDocument();
    });

    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('does not render the progress table when no courses are available and progress is null', async () => {
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([]);
    mockApiHandler.getStudentProgress.mockResolvedValue(null);

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getCoursesForClassStudent).toHaveBeenCalledWith(
        classDoc.id,
      );
    });

    expect(screen.queryByText('Lesson Name')).not.toBeInTheDocument();
    expect(screen.queryByText('No Data')).not.toBeInTheDocument();
  });

  it('still fetches progress when no courses are available', async () => {
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([]);
    mockApiHandler.getStudentProgress.mockResolvedValue(null);

    render(<StudentProgress />);

    await waitFor(() => {
      expect(mockApiHandler.getStudentProgress).toHaveBeenCalledWith(
        student.id,
      );
    });

    expect(mockApiHandler.getGradeById).not.toHaveBeenCalled();
    expect(mockApiHandler.getCurriculumById).not.toHaveBeenCalled();
  });

  it('switches across three tabs and shows the matching content each time', async () => {
    const user = userEvent.setup();
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([
      course1,
      course2,
      course3,
    ]);
    mockApiHandler.getStudentProgress.mockResolvedValue({
      'course-1': [
        {
          lesson_name: 'Addition',
          chapter_name: 'Numbers',
          score: 91.9,
          time_spent: 125,
        },
      ],
      'course-2': [
        {
          lesson_name: 'Essay',
          chapter_name: 'Writing',
          score: 40,
          time_spent: 81,
        },
      ],
      'course-3': [
        {
          lesson_name: 'Plants',
          chapter_name: 'Biology',
          score: 73,
          time_spent: 121,
        },
      ],
    });

    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(
      (await screen.findByTestId('tab-label-course-2')).closest('button')!,
    );
    await screen.findByText('Essay');

    await user.click(
      (await screen.findByTestId('tab-label-course-3')).closest('button')!,
    );
    await screen.findByText('Plants');

    expect(screen.queryByText('Addition')).not.toBeInTheDocument();
    expect(screen.queryByText('Essay')).not.toBeInTheDocument();
    expect(screen.getByText('2:1')).toBeInTheDocument();
  });

  it('can recover from a no-data tab by switching back to a tab with results', async () => {
    const user = userEvent.setup();

    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(
      (await screen.findByTestId('tab-label-course-2')).closest('button')!,
    );
    await screen.findByText('No Data');

    await user.click(
      (await screen.findByTestId('tab-label-course-1')).closest('button')!,
    );

    await waitFor(() => {
      expect(screen.getByText('Addition')).toBeInTheDocument();
    });

    expect(screen.queryByText('No Data')).not.toBeInTheDocument();
  });

  it('delegates the back button to Util.setPathToBackButton', async () => {
    const user = userEvent.setup();
    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(screen.getByRole('button', { name: 'back' }));

    expect(mockSetPathToBackButton).toHaveBeenCalledWith(
      PAGES.PARENT,
      expect.objectContaining(mockHistory),
    );
  });

  it('calls the back handler each time the back button is clicked', async () => {
    const user = userEvent.setup();
    render(<StudentProgress />);

    await screen.findByText('Addition');
    await user.click(screen.getByRole('button', { name: 'back' }));
    await user.click(screen.getByRole('button', { name: 'back' }));

    expect(mockSetPathToBackButton).toHaveBeenCalledTimes(2);
  });

  it('renders the custom app bar even before any student data is available', () => {
    render(<StudentProgress />);

    expect(screen.getByTestId('custom-app-bar')).toBeInTheDocument();
  });

  it('does not fetch progress data when no current student is available', async () => {
    mockGetCurrentStudent.mockResolvedValue(undefined);

    render(<StudentProgress />);

    await waitFor(() => {
      expect(screen.getByTestId('custom-app-bar')).toBeInTheDocument();
    });

    expect(mockApiHandler.getStudentClassesAndSchools).not.toHaveBeenCalled();
    expect(mockApiHandler.getStudentProgress).not.toHaveBeenCalled();
    expect(screen.queryByText('Lesson Name')).not.toBeInTheDocument();
  });

  it('requests the current student exactly once on the happy path', async () => {
    render(<StudentProgress />);

    await screen.findByText('Addition');

    expect(mockGetCurrentStudent).toHaveBeenCalledTimes(1);
  });
});
