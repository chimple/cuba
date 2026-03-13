import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateSelectedAssignment from './CreateSelectedAssignment';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import { Util } from '../../../../utility/util';
import { ClassUtil } from '../../../../utility/classUtil';
import {
  AssignmentSource,
  BANDS,
  PAGES,
  TableTypes,
} from '../../../../common/constants';
import { Toast } from '@capacitor/toast';

const mockHistory = { replace: jest.fn(), push: jest.fn() };

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
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => mockHistory,
}));

jest.mock('@ionic/react', () => ({
  IonIcon: () => <span data-testid="ion-icon" />,
}));

jest.mock('../../../../components/Loading', () => () => <div>Loading...</div>);
jest.mock('../../../../common/CommonDialogBox', () => () => null);
jest.mock('../../../../common/CalendarPicker', () => () => null);
jest.mock('../../../../utility/util');
jest.mock('../../../../utility/classUtil');
jest.mock('@capacitor/toast', () => ({
  Toast: {
    show: jest.fn(),
  },
}));

const mockApi = {
  getCoursesForClassStudent: jest.fn(),
  getUserAssignmentCart: jest.fn(),
  createOrUpdateAssignmentCart: jest.fn(),
  getChapterByLesson: jest.fn(),
  getCourse: jest.fn(),
  getChapterById: jest.fn(),
  getLesson: jest.fn(),
  createAssignment: jest.fn(),
};

type AssignmentLesson = TableTypes<'lesson'> & { source?: AssignmentSource };

const buildLesson = (
  id: string,
  source: AssignmentSource,
  pluginType = 'assignment',
): AssignmentLesson => ({
  id,
  plugin_type: pluginType,
  source,
  cocos_chapter_code: null,
  cocos_lesson_id: null,
  cocos_subject_code: null,
  color: null,
  created_at: '',
  created_by: null,
  image: null,
  is_deleted: null,
  language_id: null,
  metadata: null,
  name: null,
  outcome: null,
  status: null,
  subject_id: null,
  target_age_from: null,
  target_age_to: null,
  updated_at: null,
});

const mockAuth = {
  getCurrentUser: jest.fn(),
};

describe('CreateSelectedAssignment (QR flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const originalConsoleError = logger.error;
    jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      const firstArg = args[0];
      const message = typeof firstArg === 'string' ? firstArg : '';

      if (message.includes('not wrapped in act')) return;
      if (
        message.includes('Each child in a list should have a unique "key" prop')
      )
        return;
      if (message.includes('Current user or class not found')) return;

      originalConsoleError(...args);
    });

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
      authHandler: mockAuth,
    } as any);

    mockHistory.replace.mockClear();
    mockHistory.push.mockClear();

    (Util.getCurrentClass as jest.Mock).mockReturnValue({
      id: 'class-1',
      school_id: 'school-1',
      name: 'Class A',
    });
    (Util.getCurrentCourse as jest.Mock).mockReturnValue(null);

    const groupedStudents = new Map([
      [
        BANDS.REDGROUP,
        [{ id: 'student-1', name: 'Student 1', selected: true }],
      ],
      [BANDS.YELLOWGROUP, []],
      [BANDS.GREENGROUP, []],
      [BANDS.GREYGROUP, []],
    ]);

    (ClassUtil as unknown as jest.Mock).mockImplementation(() => ({
      divideStudents: jest.fn().mockResolvedValue([]),
      groupStudentsByCategoryInList: jest
        .fn()
        .mockResolvedValue(groupedStudents),
    }));

    mockAuth.getCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    mockApi.getCoursesForClassStudent.mockResolvedValue([{ id: 'course-1' }]);
    mockApi.getUserAssignmentCart.mockResolvedValue({
      lessons: JSON.stringify({}),
    });
    mockApi.createOrUpdateAssignmentCart.mockResolvedValue(true);
    mockApi.getChapterByLesson.mockResolvedValue('chapter-1');
    mockApi.getCourse.mockResolvedValue({ name: 'Math' });
    mockApi.getChapterById.mockResolvedValue({ name: 'Chapter 1' });
    mockApi.getLesson.mockResolvedValue({ name: 'Lesson 1' });
    mockApi.createAssignment.mockResolvedValue(undefined);
  });

  afterEach(() => {
    (logger.error as unknown as jest.Mock).mockRestore();
  });

  test('falls back to getChapterByLesson and creates QR assignment with qr_code source', async () => {
    render(
      <CreateSelectedAssignment
        selectedAssignments={{
          manual: {
            'course-1': { count: ['lesson-1'] },
          },
        }}
        manualAssignments={{
          'course-1': {
            lessons: [
              {
                ...buildLesson('lesson-1', AssignmentSource.QR_CODE),
              },
            ],
          },
        }}
        recommendedAssignments={{}}
      />,
    );

    await screen.findByRole('button', { name: 'Assign' });

    mockApi.getChapterByLesson.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));

    await waitFor(() => expect(mockApi.createAssignment).toHaveBeenCalled());

    expect(mockApi.getChapterByLesson).toHaveBeenCalledWith(
      'lesson-1',
      'class-1',
    );
    const createAssignmentArgs = mockApi.createAssignment.mock.calls[0];
    expect(createAssignmentArgs[8]).toBe('chapter-1');
    expect(createAssignmentArgs[12]).toBe(AssignmentSource.QR_CODE);
  });

  test('shows toast and does not create assignment when no students are selected', async () => {
    (ClassUtil as unknown as jest.Mock).mockImplementation(() => ({
      divideStudents: jest.fn().mockResolvedValue([]),
      groupStudentsByCategoryInList: jest.fn().mockResolvedValue(
        new Map([
          [BANDS.REDGROUP, []],
          [BANDS.YELLOWGROUP, []],
          [BANDS.GREENGROUP, []],
          [BANDS.GREYGROUP, []],
        ]),
      ),
    }));

    render(
      <CreateSelectedAssignment
        selectedAssignments={{
          manual: { 'course-1': { count: ['lesson-1'] } },
        }}
        manualAssignments={{
          'course-1': {
            lessons: [buildLesson('lesson-1', AssignmentSource.QR_CODE)],
          },
        }}
        recommendedAssignments={{}}
      />,
    );

    await screen.findByRole('button', { name: 'Assign' });
    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Please select the Students' }),
      ),
    );
    expect(mockApi.createAssignment).not.toHaveBeenCalled();
  });

  test('initializes start and end dates from today', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-09T12:00:00.000Z'));

    render(
      <CreateSelectedAssignment
        selectedAssignments={{}}
        manualAssignments={{}}
        recommendedAssignments={{}}
      />,
    );

    await screen.findByRole('button', { name: 'Assign' });

    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('2026-03-09')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByText('2026-04-09')).toBeInTheDocument();

    jest.useRealTimers();
  });

  test('toggles Select All to deselect all students and updates counts', async () => {
    const groupedStudents = new Map([
      [
        BANDS.REDGROUP,
        [
          { id: 'student-1', name: 'Student 1', selected: true },
          { id: 'student-2', name: 'Student 2', selected: true },
        ],
      ],
      [
        BANDS.YELLOWGROUP,
        [{ id: 'student-3', name: 'Student 3', selected: true }],
      ],
      [BANDS.GREENGROUP, []],
      [BANDS.GREYGROUP, []],
    ]);

    (ClassUtil as unknown as jest.Mock).mockImplementation(() => ({
      divideStudents: jest.fn().mockResolvedValue([]),
      groupStudentsByCategoryInList: jest
        .fn()
        .mockResolvedValue(groupedStudents),
    }));

    render(
      <CreateSelectedAssignment
        selectedAssignments={{}}
        manualAssignments={{}}
        recommendedAssignments={{}}
      />,
    );

    await screen.findByText('Need Help');

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    expect(selectAllCheckbox).toBeChecked();

    await userEvent.click(selectAllCheckbox);
    expect(selectAllCheckbox).not.toBeChecked();

    expect(screen.getByText('0/2')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  test('deselecting a single student unchecks global Select All', async () => {
    const groupedStudents = new Map([
      [
        BANDS.REDGROUP,
        [
          { id: 'student-1', name: 'Student 1', selected: true },
          { id: 'student-2', name: 'Student 2', selected: true },
        ],
      ],
      [BANDS.YELLOWGROUP, []],
      [BANDS.GREENGROUP, []],
      [BANDS.GREYGROUP, []],
    ]);

    (ClassUtil as unknown as jest.Mock).mockImplementation(() => ({
      divideStudents: jest.fn().mockResolvedValue([]),
      groupStudentsByCategoryInList: jest
        .fn()
        .mockResolvedValue(groupedStudents),
    }));

    render(
      <CreateSelectedAssignment
        selectedAssignments={{}}
        manualAssignments={{}}
        recommendedAssignments={{}}
      />,
    );

    await screen.findByText('Need Help');

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    expect(selectAllCheckbox).toBeChecked();

    await userEvent.click(screen.getByText('Need Help'));

    const studentRow = await screen.findByText('Student 1');
    const studentListItem = studentRow.closest('li');
    expect(studentListItem).not.toBeNull();
    const studentCheckbox = within(studentListItem as HTMLElement).getByRole(
      'checkbox',
    );
    await userEvent.click(studentCheckbox);

    await waitFor(() => expect(selectAllCheckbox).not.toBeChecked());
  });

  test('uses chapter from assignment cart for manual lessons and sets source manual', async () => {
    mockApi.getUserAssignmentCart.mockResolvedValue({
      lessons: JSON.stringify({
        'class-1': JSON.stringify({
          'chapter-99': { [AssignmentSource.MANUAL]: ['lesson-1'] },
        }),
      }),
    });

    render(
      <CreateSelectedAssignment
        selectedAssignments={{
          manual: {
            'course-1': { count: ['lesson-1'] },
          },
        }}
        manualAssignments={{
          'course-1': {
            lessons: [
              {
                ...buildLesson('lesson-1', AssignmentSource.MANUAL),
              },
            ],
          },
        }}
        recommendedAssignments={{}}
      />,
    );

    await screen.findByRole('button', { name: 'Assign' });

    mockApi.getChapterByLesson.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));

    await waitFor(() => expect(mockApi.createAssignment).toHaveBeenCalled());

    const createAssignmentArgs = mockApi.createAssignment.mock.calls[0];
    expect(createAssignmentArgs[8]).toBe('chapter-99');
    expect(createAssignmentArgs[12]).toBe(AssignmentSource.MANUAL);
  });

  test('creates recommended assignment with recommended source', async () => {
    render(
      <CreateSelectedAssignment
        selectedAssignments={{
          recommended: {
            'course-1': { count: ['lesson-2'] },
          },
        }}
        manualAssignments={{}}
        recommendedAssignments={{
          'course-1': {
            lessons: [
              {
                ...buildLesson('lesson-2', AssignmentSource.RECOMMENDED),
              },
            ],
          },
        }}
      />,
    );

    await screen.findByRole('button', { name: 'Assign' });

    mockApi.getChapterByLesson.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));

    await waitFor(() => expect(mockApi.createAssignment).toHaveBeenCalled());

    const createAssignmentArgs = mockApi.createAssignment.mock.calls[0];
    expect(createAssignmentArgs[12]).toBe(AssignmentSource.RECOMMENDED);
  });

  test('redirects to Display Schools when current class is missing', async () => {
    (Util.getCurrentClass as jest.Mock).mockReturnValue(null);

    render(
      <CreateSelectedAssignment
        selectedAssignments={{}}
        manualAssignments={{}}
        recommendedAssignments={{}}
      />,
    );

    await waitFor(() =>
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS),
    );
  });
});
