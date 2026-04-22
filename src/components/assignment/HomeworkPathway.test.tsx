import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeworkPathway from './HomeworkPathway';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { MemoryRouter } from 'react-router';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { HOMEWORK_PATHWAY, LIVE_QUIZ } from '../../common/constants';

const HOMEWORK_REWARD_COMPLETED_INDEX_KEY = 'homework_reward_completed_index';
const PENDING_HOMEWORK_REWARD_TRANSITION_KEY =
  'pending_homework_reward_transition';

/* ======================= MOCKS ======================= */

jest.mock('../../services/ServiceConfig');
jest.mock('../../utility/util');

jest.mock('../../growthbook/Growthbook', () => ({
  useGbContext: () => ({ setGbUpdated: jest.fn() }),
  updateLocalAttributes: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: jest.fn(),
}));

jest.mock(
  '../Loading',
  () =>
    ({ isLoading }: any) =>
      isLoading ? <img alt="loading" /> : null,
);

jest.mock('../Home/DropdownMenu', () => (props: any) => (
  <button data-testid="dropdown" disabled={props.disabled}>
    Dropdown
  </button>
));

jest.mock('../Home/DropdownMenu', () => (props: any) => (
  <div>
    <button
      data-testid="dropdown"
      disabled={props.disabled}
      onClick={() => {
        // simulate subject change
        props.onSelect?.({ id: 'math' });
      }}
    >
      Dropdown
    </button>
  </div>
));

jest.mock('./HomeworkPathwayStructure', () => (props: any) => (
  <button
    data-testid="pathway-structure"
    onClick={() => props.onHomeworkComplete()}
  >
    Complete Homework
  </button>
));

jest.mock('../learningPathway/chapterLessonBox', () => () => (
  <div data-testid="chapter-box" />
));

jest.mock('../learningPathway/PathwayModal', () => (props: any) => (
  <div data-testid="pathway-modal">
    {props.text?.split('\n').map((line: string, i: number) => (
      <span key={i}>{line}</span>
    ))}
    <button onClick={props.onClose}>Close</button>
  </div>
));

jest.mock('./HomeworkCompleteModal', () => (props: any) => (
  <div data-testid="homework-complete-modal">
    <span>{props.text}</span>
    <button onClick={props.onPlayMore}>Play More</button>
  </div>
));

/* ======================= MOCK SETUP ======================= */

const mockApi = {
  getPendingAssignments: jest.fn(),
  getLesson: jest.fn(),
  getCourse: jest.fn(),
  getChapterById: jest.fn(),
  updateStudentStars: jest.fn(),
  getCompletedAssignmentsCountForSubjects: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
    apiHandler: mockApi,
  } as any);

  (Util.getCurrentStudent as jest.Mock).mockReturnValue({
    id: 'student-1',
    stars: 10,
  });

  (Util.getCurrentClass as jest.Mock).mockReturnValue({ id: 'class-1' });

  (Util.getLocalStarsForStudent as jest.Mock).mockReturnValue(10);
  (Util.setLocalStarsForStudent as jest.Mock).mockImplementation(() => {});
  (Util.bumpLocalStarsForStudent as jest.Mock).mockReturnValue(15);
  (Util.logEvent as jest.Mock).mockImplementation(() => {});
  (Util.pickFiveHomeworkLessons as jest.Mock).mockImplementation((a) =>
    a.slice(0, 5),
  );
  mockApi.getCourse.mockResolvedValue({ id: 'course-1', name: 'Course 1' });

  localStorage.clear();
  sessionStorage.clear();
});

/* ======================= BASIC RENDER ======================= */

describe('HomeworkPathway – basic rendering', () => {
  test('shows loading initially', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    mockApi.getPendingAssignments.mockImplementation(
      () => new Promise(() => {}),
    );

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    expect(await screen.findByAltText('loading')).toBeInTheDocument();
  });

  test('renders dropdown and chapter box after load', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('chapter-box')).toBeInTheDocument();
    });
  });
});

/* ======================= DROPDOWN LOGIC ======================= */

describe('HomeworkPathway – dropdown behavior', () => {
  test('dropdown disabled when feature flag OFF and index > 0', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);

    localStorage.setItem(
      HOMEWORK_PATHWAY,
      JSON.stringify({
        path_id: 'p1',
        lessons: [{ lesson_id: 'l1' }, { lesson_id: 'l2' }],
        currentIndex: 1,
      }),
    );

    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('dropdown')).toBeDisabled();
    });
  });

  test('dropdown enabled when feature flag ON', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('dropdown')).not.toBeDisabled();
    });
  });

  test('clicking disabled dropdown wrapper opens modal', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);

    localStorage.setItem(
      HOMEWORK_PATHWAY,
      JSON.stringify({
        path_id: 'p1',
        lessons: [{ lesson_id: 'l1' }, { lesson_id: 'l2' }],
        currentIndex: 1,
      }),
    );

    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    const dropdown = await screen.findByTestId('dropdown');
    const wrapper = dropdown.closest('.homework-dropdown-wrapper');
    await userEvent.click(wrapper!);

    expect(await screen.findByTestId('pathway-modal')).toBeInTheDocument();
  });
  test('clicking dropdown does not reset pathway or assignments', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const pathway = {
      path_id: 'p1',
      lessons: [{ lesson: { id: 'l1' } }],
      currentIndex: 0,
    };
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(pathway));

    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByTestId('dropdown'));

    const stored = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY) || '{}');

    expect(stored.path_id).toBe('p1');
    expect(screen.getByTestId('chapter-box')).toBeInTheDocument();
  });
});

/* ======================= COMPLETION FLOW ======================= */

describe('HomeworkPathway – pathway logic', () => {
  test("creates a new pathway if one doesn't exist", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: 'a1', type: 'HOMEWORK', lesson_id: 'l1', course_id: 's1' },
      { id: 'a2', type: 'HOMEWORK', lesson_id: 'l2', course_id: 's1' },
    ]);
    mockApi.getLesson.mockImplementation((id) =>
      Promise.resolve({
        id,
        subject_id: 's1',
        name: `Lesson ${id}`,
        chapter_id: 'c1',
      }),
    );
    mockApi.getChapterById.mockResolvedValue({ id: 'c1', name: 'Chapter 1' });

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(
        localStorage.getItem(HOMEWORK_PATHWAY) || '{}',
      );
      expect(pathway.path_id).toBeDefined();
      expect(pathway.lessons.length).toBe(2);
      expect(pathway.currentIndex).toBe(0);
    });
  });

  test('increments currentIndex when next lesson exists', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const initialPathway = {
      path_id: 'p1',
      lessons: [
        { lesson: { id: 'l1' }, chapter: { name: 'Ch 1' } },
        { lesson: { id: 'l2' }, chapter: { name: 'Ch 1' } },
      ],
      currentIndex: 0,
    };
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(initialPathway));

    // Mock APIs that will be called during the re-fetch
    mockApi.getPendingAssignments.mockResolvedValue([]);
    mockApi.getLesson.mockResolvedValue({ id: 'l2', name: 'Lesson 2' });
    mockApi.getChapterById.mockResolvedValue({ id: 'c1', name: 'Chapter 1' });

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    // Wait for the component to render initially
    await screen.findByTestId('pathway-structure');

    // Click to complete the lesson, which triggers handleHomeworkComplete
    await userEvent.click(screen.getByTestId('pathway-structure'));

    // The component now re-fetches and updates its state, so we wait for the result
    await waitFor(() => {
      const pathway = JSON.parse(
        localStorage.getItem(HOMEWORK_PATHWAY) || '{}',
      );
      expect(pathway.currentIndex).toBe(1);
    });
  });

  test('shows completion modal on last lesson', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const pathway = {
      path_id: 'p1',
      lessons: [{ lesson: { id: 'l1' } }],
      currentIndex: 0,
    };

    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(pathway));
    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await screen.findByTestId('pathway-structure');
    await userEvent.click(screen.getByTestId('pathway-structure'));

    expect(
      await screen.findByTestId('homework-complete-modal'),
    ).toBeInTheDocument();
  });

  test('rebuilds existing pathway when pending assignments change', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const oldPathway = {
      path_id: 'old-path',
      lessons: [{ lesson: { id: 'l1' } }],
      currentIndex: 0,
      pendingAssignmentIds: ['a-old'],
    };
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(oldPathway));

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: 'a-new', type: 'HOMEWORK', lesson_id: 'l-new', course_id: 's-new' },
    ]);
    mockApi.getLesson.mockResolvedValue({
      id: 'l-new',
      subject_id: 's-new',
      name: 'Lesson new',
      chapter_id: 'c-new',
    });

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(pathway.path_id).not.toBe('old-path');
      expect(pathway.pendingAssignmentIds).toEqual(['a-new']);
    });
  });

  test('migrates legacy cached pathways without pending ids', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const legacyPathway = {
      path_id: 'legacy-path',
      lessons: [{ lesson: { id: 'l1' } }],
      currentIndex: 0,
    };
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(legacyPathway));

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: 'a-1', type: 'HOMEWORK', lesson_id: 'l-1', course_id: 's-1' },
    ]);
    mockApi.getLesson.mockResolvedValue({
      id: 'l-1',
      subject_id: 's-1',
      name: 'Lesson 1',
      chapter_id: 'c-1',
    });

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(pathway.path_id).toBe('legacy-path');
      expect(pathway.pendingAssignmentIds).toEqual(['a-1']);
    });
  });

  test('keeps the current subject when assignments refresh', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const currentPathway = {
      path_id: 'math-path',
      lessons: [{ lesson: { id: 'math-1' }, course_id: 'math' }],
      currentIndex: 0,
      pendingAssignmentIds: ['math-1'],
    };
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(currentPathway));

    mockApi.getPendingAssignments
      .mockResolvedValueOnce([
        {
          id: 'math-1',
          type: 'HOMEWORK',
          lesson_id: 'math-1',
          course_id: 'math',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'math-2',
          type: 'HOMEWORK',
          lesson_id: 'math-2',
          course_id: 'math',
        },
        {
          id: 'science-1',
          type: 'HOMEWORK',
          lesson_id: 'science-1',
          course_id: 'science',
        },
        {
          id: 'science-2',
          type: 'HOMEWORK',
          lesson_id: 'science-2',
          course_id: 'science',
        },
      ]);
    mockApi.getLesson.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        subject_id: id.startsWith('math') ? 'math' : 'science',
        name: `Lesson ${id}`,
        chapter_id: 'c-1',
      }),
    );
    mockApi.getChapterById.mockResolvedValue({ id: 'c-1', name: 'Chapter 1' });

    const { rerender } = render(
      <MemoryRouter>
        <HomeworkPathway refreshToken={0} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(pathway.lessons[0].course_id).toBe('math');
    });

    rerender(
      <MemoryRouter>
        <HomeworkPathway refreshToken={1} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(
        pathway.lessons.every((lesson: any) => lesson.course_id === 'math'),
      ).toBe(true);
    });
  });

  test('does not jump to english or math when digital skills is the active path', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const currentPathway = {
      path_id: 'digital-path',
      lessons: [{ lesson: { id: 'digital-1' }, course_id: 'digital-skills' }],
      currentIndex: 0,
      pendingAssignmentIds: ['digital-1'],
    };
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(currentPathway));

    mockApi.getPendingAssignments
      .mockResolvedValueOnce([
        {
          id: 'digital-1',
          type: 'HOMEWORK',
          lesson_id: 'digital-1',
          course_id: 'digital-skills',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'digital-2',
          type: 'HOMEWORK',
          lesson_id: 'digital-2',
          course_id: 'digital-skills',
        },
        {
          id: 'english-1',
          type: 'HOMEWORK',
          lesson_id: 'english-1',
          course_id: 'english',
        },
        {
          id: 'math-1',
          type: 'HOMEWORK',
          lesson_id: 'math-1',
          course_id: 'math',
        },
      ]);
    mockApi.getLesson.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        subject_id: id.startsWith('digital')
          ? 'digital-skills'
          : id.startsWith('english')
            ? 'english'
            : 'math',
        name: `Lesson ${id}`,
        chapter_id: 'c-1',
      }),
    );
    mockApi.getChapterById.mockResolvedValue({ id: 'c-1', name: 'Chapter 1' });

    const { rerender } = render(
      <MemoryRouter>
        <HomeworkPathway refreshToken={0} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(pathway.lessons[0].course_id).toBe('digital-skills');
    });

    rerender(
      <MemoryRouter>
        <HomeworkPathway refreshToken={1} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(
        pathway.lessons.every(
          (lesson: any) => lesson.course_id === 'digital-skills',
        ),
      ).toBe(true);
    });
  });

  test('rebuilds path when reward index key is stale and payload is missing', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const finishedPath = {
      path_id: 'old-path',
      lessons: [
        {
          assignment_id: 'a-old',
          lesson_id: 'l-old',
          chapter_id: 'c-old',
          course_id: 's-old',
          lesson: { id: 'l-old', subject_id: 's-old', chapter_id: 'c-old' },
        },
      ],
      currentIndex: 1,
      pendingAssignmentIds: ['a-old'],
    };

    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(finishedPath));
    sessionStorage.setItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY, '0');

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: 'a-new', type: 'HOMEWORK', lesson_id: 'l-new', course_id: 's-new' },
    ]);
    mockApi.getLesson.mockResolvedValue({
      id: 'l-new',
      subject_id: 's-new',
      chapter_id: 'c-new',
      name: 'Lesson new',
    });
    mockApi.getChapterById.mockResolvedValue({ id: 'c-new', name: 'Chapter' });

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(pathway.path_id).not.toBe('old-path');
      expect(pathway.pendingAssignmentIds).toEqual(['a-new']);
    });
  });

  test('preserves cached path with a valid pending reward transition payload', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const finishedPath = {
      path_id: 'reward-transition-path',
      lessons: [
        {
          assignment_id: 'a1',
          lesson_id: 'l1',
          chapter_id: 'c1',
          course_id: 's1',
          lesson: { id: 'l1', subject_id: 's1', chapter_id: 'c1' },
        },
      ],
      currentIndex: 1,
      pendingAssignmentIds: ['a1'],
    };

    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(finishedPath));
    sessionStorage.setItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY, '0');
    sessionStorage.setItem(
      PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
      JSON.stringify({
        completedIndex: 0,
        pathSnapshot: JSON.stringify({
          lessons: finishedPath.lessons,
          currentIndex: 0,
        }),
      }),
    );

    mockApi.getPendingAssignments.mockResolvedValue([
      {
        id: 'a-different',
        type: 'HOMEWORK',
        lesson_id: 'l-different',
        course_id: 's-different',
      },
    ]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const pathway = JSON.parse(localStorage.getItem(HOMEWORK_PATHWAY)!);
      expect(pathway.path_id).toBe('reward-transition-path');
      expect(pathway.pendingAssignmentIds).toEqual(['a1']);
    });
  });

  test('handles empty pathway gracefully', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(localStorage.getItem(HOMEWORK_PATHWAY)).toBeNull();
      expect(screen.queryByTestId('pathway-structure')).not.toBeInTheDocument();
    });
  });
});

describe('HomeworkPathway – completion flow', () => {
  test('shows completion modal when last lesson is finished', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    const initialPathway = {
      path_id: 'p1',
      lessons: [{ lesson: { id: 'l1' }, chapter: { name: 'Ch 1' } }],
      currentIndex: 0,
    };
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(initialPathway));

    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByTestId('pathway-structure'));

    expect(
      await screen.findByTestId('homework-complete-modal'),
    ).toBeInTheDocument();
  });

  test('completion modal appears when homework completes', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: 'a1', type: 'HOMEWORK', lesson_id: 'l1', course_id: 's1' },
    ]);
    mockApi.getLesson.mockResolvedValue({
      id: 'l1',
      subject_id: 's1',
      name: 'Lesson 1',
      chapter_id: 'c1',
    });
    mockApi.getChapterById.mockResolvedValue({ id: 'c1', name: 'Chapter 1' });

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByTestId('pathway-structure'));

    expect(
      await screen.findByTestId('homework-complete-modal'),
    ).toBeInTheDocument();
  });

  test('onPlayMoreHomework callback fires', async () => {
    const onPlayMoreHomework = jest.fn();
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway onPlayMoreHomework={onPlayMoreHomework} />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByTestId('pathway-structure'));
    await userEvent.click(await screen.findByText('Play More'));

    expect(onPlayMoreHomework).toHaveBeenCalled();
  });
});

/* ======================= ASSIGNMENT FILTERING ======================= */

describe('HomeworkPathway – assignment filtering', () => {
  test('LIVE_QUIZ assignments are ignored', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: 'a1', type: LIVE_QUIZ },
      { id: 'a2', type: 'HOMEWORK', lesson_id: 'l1' },
    ]);

    mockApi.getLesson.mockResolvedValue({
      id: 'l1',
      subject_id: 's1',
      name: 'Lesson',
    });

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledTimes(1);
    });
  });
});

/* ======================= STAR SYNC ======================= */

describe('HomeworkPathway – star sync logic', () => {
  test('syncs stars when local stars > DB stars', async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    (Util.getLocalStarsForStudent as jest.Mock).mockReturnValue(20);
    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockApi.updateStudentStars).toHaveBeenCalledWith('student-1', 20);
    });
  });
});

/* ======================= EDGE CASES ======================= */

describe('HomeworkPathway – edge cases', () => {
  test('does not crash when current student is null', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    expect(screen.queryByAltText('loading')).not.toBeInTheDocument();
  });

  test('does not fetch assignments when class is missing', async () => {
    (Util.getCurrentClass as jest.Mock).mockReturnValue(null);
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);

    render(
      <MemoryRouter>
        <HomeworkPathway />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockApi.getPendingAssignments).not.toHaveBeenCalled();
    });
  });
});
