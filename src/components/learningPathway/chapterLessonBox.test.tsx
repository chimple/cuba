import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import ChapterLessonBox from './chapterLessonBox';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { COURSE_CHANGED } from '../../common/constants';
import logger from '../../utility/logger';

const mockT = jest.fn((s: string) => `tr:${s}`);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('../../utility/util');

jest.mock('../../utility/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const mockApi = {
  getLesson: jest.fn(),
  getChapterById: jest.fn(),
};

const buildLearningPath = (opts?: {
  currentCourseIndex?: number;
  firstPath?: any;
  secondPath?: any;
}) =>
  JSON.stringify({
    courses: {
      currentCourseIndex: opts?.currentCourseIndex ?? 0,
      courseList: [
        {
          course_id: 'c1',
          path: opts?.firstPath ?? [
            { lesson_id: 'l-played', chapter_id: 'ch-played', isPlayed: true },
            { lesson_id: 'l-active', chapter_id: 'ch-active', isPlayed: false },
          ],
        },
        {
          course_id: 'c2',
          path: opts?.secondPath ?? [
            {
              lesson_id: 'l2-active',
              chapter_id: 'ch2-active',
              isPlayed: false,
            },
          ],
        },
      ],
    },
  });

describe('chapterLessonBox', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);

    mockT.mockImplementation((s: string) => `tr:${s}`);

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: buildLearningPath(),
    });

    (Util.getLatestLearningPathByUpdatedAt as jest.Mock).mockImplementation(
      (student: any) => student?.learning_path,
    );

    mockApi.getLesson.mockResolvedValue({
      id: 'l-active',
      name: 'Lesson Active',
    });

    mockApi.getChapterById.mockResolvedValue({
      id: 'ch-active',
      name: 'Chapter Active',
    });
  });

  test('renders base structure', () => {
    const { container } = render(<ChapterLessonBox />);
    expect(container.querySelector('.chapter-lesson-box')).toBeInTheDocument();
    expect(container.querySelector('.chapter-lesson-text')).toBeInTheDocument();
  });

  test('applies container style prop', () => {
    render(<ChapterLessonBox containerStyle={{ width: '321px' }} />);
    const root = document.querySelector('.chapter-lesson-box') as HTMLElement;
    expect(root.style.width).toBe('321px');
  });

  test('uses prop values when chapterName and lessonName are provided', async () => {
    render(<ChapterLessonBox chapterName="Chapter P" lessonName="Lesson P" />);
    await waitFor(() => {
      expect(
        screen.getByText('tr:Chapter P : tr:Lesson P'),
      ).toBeInTheDocument();
    });
  });

  test('fetches active lesson/chapter from learning path on mount', async () => {
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledWith('l-active');
      expect(mockApi.getChapterById).toHaveBeenCalledWith('ch-active');
      expect(
        screen.getByText('tr:Chapter Active : tr:Lesson Active'),
      ).toBeInTheDocument();
    });
  });

  test('uses lesson-only label when chapter_id is missing', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: buildLearningPath({
        firstPath: [
          { lesson_id: 'l-active', chapter_id: undefined, isPlayed: false },
        ],
      }),
    });

    render(<ChapterLessonBox />);

    await waitFor(() => {
      expect(mockApi.getChapterById).not.toHaveBeenCalled();
      expect(screen.getByText('tr:Lesson Active')).toBeInTheDocument();
    });
  });

  test('logs error when COURSE_CHANGED handler update fails', async () => {
    const errSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    render(<ChapterLessonBox />);
    await screen.findByText('tr:Chapter Active : tr:Lesson Active');

    mockApi.getLesson.mockRejectedValue(new Error('fetch-fail'));

    act(() => {
      window.dispatchEvent(new Event(COURSE_CHANGED));
    });

    await waitFor(() => {
      expect(errSpy).toHaveBeenCalledWith(
        'Error handling course change:',
        expect.any(Error),
      );
    });

    errSpy.mockRestore();
  });

  test('does not react to COURSE_CHANGED after unmount', async () => {
    const { unmount } = render(<ChapterLessonBox />);
    await screen.findByText('tr:Chapter Active : tr:Lesson Active');

    unmount();

    const lessonCalls = mockApi.getLesson.mock.calls.length;

    act(() => {
      window.dispatchEvent(new Event(COURSE_CHANGED));
    });

    expect(mockApi.getLesson.mock.calls.length).toBe(lessonCalls);
  });

  test('keeps text node rendered even when no chapter value is available', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);

    const { container } = render(<ChapterLessonBox />);

    await waitFor(() => {
      expect(
        container.querySelector('.chapter-lesson-text'),
      ).toBeInTheDocument();
      expect(container.querySelector('.chapter-lesson-text')?.textContent).toBe(
        '',
      );
    });
  });
});
