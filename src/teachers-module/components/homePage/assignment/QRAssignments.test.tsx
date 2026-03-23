import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import QRAssignments from './QRAssignments';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import logger from '../../../../utility/logger';
import { Util } from '../../../../utility/util';
import { PAGES } from '../../../../common/constants';

/* ======================= GLOBAL MOCKS ======================= */

jest.mock('i18next', () => {
  const i18n = {
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
    t: (key: string) => key,
    changeLanguage: jest.fn(),
  };
  return i18n;
});

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

jest.mock('../../../../utility/util');

jest.mock('../../../../components/Loading', () => () => <div>Loading...</div>);

jest.mock('../../homePage/Header', () => (props: any) => (
  <button onClick={props.onBackButtonClick}>Header</button>
));

jest.mock(
  '../../../../components/displaySubjects/SelectIconImage',
  () => () => <div>Image</div>,
);

jest.mock('../../library/AssignmentCount', () => (props: any) => (
  <button onClick={props.onClick}>Assign {props.assignments}</button>
));

/* ======================= MOCK API ======================= */

const pushMock = jest.fn();
const replaceMock = jest.fn();

const mockApi = {
  getLessonsForChapter: jest.fn(),
  getChapterById: jest.fn(),
  getAssignmentInfoForLessonsPerClass: jest.fn(), // ✅ updated API
  getCourse: jest.fn(),
};

const mockAuth = {
  getCurrentUser: jest.fn(),
};

const mockLessons = Array.from({ length: 8 }).map((_, i) => ({
  lesson_id: `lesson-${i}`,
  name: `Lesson ${i}`,
  image: '',
}));

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
    apiHandler: mockApi,
    authHandler: mockAuth,
  } as any);

  mockAuth.getCurrentUser.mockResolvedValue({ id: 'teacher-1' });

  (Util.getCurrentClass as jest.Mock).mockResolvedValue({
    id: 'class-1',
  });

  mockApi.getLessonsForChapter.mockResolvedValue(mockLessons);
  mockApi.getChapterById.mockResolvedValue({ name: 'Chapter 1' });

  // ✅ updated mock
  mockApi.getAssignmentInfoForLessonsPerClass.mockResolvedValue([
    'lesson-0',
    'lesson-1',
  ]);

  mockApi.getCourse.mockResolvedValue({ name: 'Math' });
});
afterEach(() => {
  jest.restoreAllMocks();
});

/* ======================= HELPERS ======================= */

const renderPage = (state?: any) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/',
          state: state ?? {
            chapterId: 'chapter-1',
            courseId: 'course-1',
          },
        },
      ]}
    >
      <QRAssignments />
    </MemoryRouter>,
  );

/* ======================= TESTS ======================= */

describe('QRAssignments – full coverage', () => {
  /* ---------- Redirect ---------- */
  test('redirects if no chapterId', async () => {
    renderPage({});
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  /* ---------- Loading ---------- */
  test('shows loading initially', () => {
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /* ---------- Happy Path ---------- */
  test('renders lessons and subject', async () => {
    renderPage();
    expect(await screen.findByText('Lesson 2')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getAllByText('Chapter 1').length).toBeGreaterThan(0);
  });

  test('auto selects next 5 unassigned lessons', async () => {
    renderPage();
    await screen.findByText('Lesson 2');
    expect(screen.getByText('Assign 5')).toBeInTheDocument();
  });

  /* ---------- Toggle Assigned ---------- */
  test('hides assigned lessons when toggled', async () => {
    renderPage();
    const toggle = await screen.findByText('Hide Assigned');
    await userEvent.click(toggle);

    expect(screen.getByText('Show Assigned')).toBeInTheDocument();
    expect(screen.queryByText('Lesson 0')).not.toBeInTheDocument();
  });

  /* ---------- Selection Logic ---------- */
  test('decreases count when selected lesson deselected', async () => {
    renderPage();
    await screen.findByText('Lesson 2');

    const lessonToggle = document.getElementById(
      'qrAssignments-lesson-toggle-lesson-2',
    );
    expect(lessonToggle).toBeInTheDocument();
    await userEvent.click(lessonToggle!);

    expect(screen.getByRole('button', { name: /Assign/i })).toHaveTextContent(
      '4',
    );
  });

  test('prevents navigation when selectedCount is 0', async () => {
    renderPage();
    await screen.findByText('Lesson 2');

    for (let i = 2; i <= 6; i++) {
      const lessonToggle = document.getElementById(
        `qrAssignments-lesson-toggle-lesson-${i}`,
      );
      expect(lessonToggle).toBeInTheDocument();
      await userEvent.click(lessonToggle!);
    }

    const button = screen.getByRole('button', { name: /Assign/i });
    await userEvent.click(button);

    expect(pushMock).not.toHaveBeenCalled();
  });

  /* ---------- Navigation ---------- */
  test('navigates with correct payload when Assign clicked', async () => {
    const historyPush = jest.fn();

    jest.spyOn(require('react-router'), 'useHistory').mockReturnValue({
      push: historyPush,
      replace: replaceMock,
      goBack: jest.fn(),
    });

    renderPage();
    await screen.findByText('Lesson 2');

    const button = screen.getByRole('button', { name: /Assign/i });
    await userEvent.click(button);

    expect(historyPush).toHaveBeenCalledWith(
      PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE,
      expect.objectContaining({
        fromPage: PAGES.QR_ASSIGNMENTS,
        selectedAssignments: expect.any(Object),
        manualAssignments: expect.any(Object),
        recommendedAssignments: {},
        qrAssignmentNavigationState: expect.objectContaining({
          chapterId: 'chapter-1',
          courseId: 'course-1',
        }),
      }),
    );
  });

  test('back goes to assign tab when opened from home page', async () => {
    const historyReplace = jest.fn();
    jest.spyOn(require('react-router'), 'useHistory').mockReturnValue({
      push: jest.fn(),
      replace: historyReplace,
      goBack: jest.fn(),
      location: {
        state: {
          chapterId: 'chapter-1',
          courseId: 'course-1',
          fromPage: PAGES.HOME_PAGE,
        },
      },
    });

    renderPage({
      chapterId: 'chapter-1',
      courseId: 'course-1',
      fromPage: PAGES.HOME_PAGE,
    });
    await screen.findByText('Lesson 2');
    await userEvent.click(screen.getByRole('button', { name: 'Header' }));

    expect(historyReplace).toHaveBeenCalledWith(PAGES.HOME_PAGE, {
      tabValue: 2,
    });
  });

  test('back uses history.goBack when not opened from home page', async () => {
    const historyGoBack = jest.fn();
    const historyReplace = jest.fn();

    jest.spyOn(require('react-router'), 'useHistory').mockReturnValue({
      push: jest.fn(),
      replace: historyReplace,
      goBack: historyGoBack,
      location: {
        state: { chapterId: 'chapter-1', courseId: 'course-1' },
      },
    });

    renderPage({
      chapterId: 'chapter-1',
      courseId: 'course-1',
    });
    await screen.findByText('Lesson 2');
    await userEvent.click(screen.getByRole('button', { name: 'Header' }));

    expect(historyGoBack).toHaveBeenCalled();
    expect(historyReplace).not.toHaveBeenCalledWith(PAGES.HOME_PAGE, {
      tabValue: 2,
    });
  });

  test('shows assigned badge only for assigned lessons', async () => {
    renderPage();
    await screen.findByText('Lesson 2');

    expect(
      document.getElementById('qrAssignments-assigned-badge-lesson-0'),
    ).toBeInTheDocument();
    expect(
      document.getElementById('qrAssignments-assigned-badge-lesson-1'),
    ).toBeInTheDocument();
    expect(
      document.getElementById('qrAssignments-assigned-badge-lesson-2'),
    ).not.toBeInTheDocument();
  });

  test('assign navigation payload keeps only currently selected lessons', async () => {
    const historyPush = jest.fn();
    jest.spyOn(require('react-router'), 'useHistory').mockReturnValue({
      push: historyPush,
      replace: replaceMock,
      goBack: jest.fn(),
      location: {
        state: { chapterId: 'chapter-1', courseId: 'course-1' },
      },
    });

    renderPage({
      chapterId: 'chapter-1',
      courseId: 'course-1',
    });
    await screen.findByText('Lesson 2');

    // Initial selected lessons are 2..6; deselect lesson-6 so 2..5 remain.
    const lessonToggle = document.getElementById(
      'qrAssignments-lesson-toggle-lesson-6',
    );
    await userEvent.click(lessonToggle!);

    await userEvent.click(screen.getByRole('button', { name: /Assign/i }));

    const payload = historyPush.mock.calls[0][1];
    const selectedIds = payload.selectedAssignments.manual['course-1']
      .count as string[];
    const manualLessons = payload.manualAssignments['course-1']
      .lessons as Array<{ id: string; source?: string }>;

    expect(selectedIds.sort()).toEqual(
      ['lesson-2', 'lesson-3', 'lesson-4', 'lesson-5'].sort(),
    );
    expect(manualLessons.map((l) => l.id).sort()).toEqual(
      ['lesson-2', 'lesson-3', 'lesson-4', 'lesson-5'].sort(),
    );
    expect(manualLessons.every((l) => l.source === 'qr_code')).toBe(true);
  });

  /* ---------- Null User ---------- */
  test('does nothing if currentUser is null', async () => {
    mockAuth.getCurrentUser.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(mockApi.getLessonsForChapter).not.toHaveBeenCalled();
    });
  });

  /* ---------- Null Class ---------- */
  test('does nothing if currentClass is null', async () => {
    (Util.getCurrentClass as jest.Mock).mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(mockApi.getLessonsForChapter).not.toHaveBeenCalled();
    });
  });

  /* ---------- Empty Lessons ---------- */
  test('handles empty lesson list', async () => {
    mockApi.getLessonsForChapter.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.queryByText('Lesson 1')).not.toBeInTheDocument();
    });
  });

  /* ---------- API Error ---------- */
  test('handles API failure gracefully', async () => {
    const consoleSpy = jest.spyOn(logger, 'error').mockImplementation();
    mockApi.getLessonsForChapter.mockRejectedValue(new Error('API Failure'));

    renderPage();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
