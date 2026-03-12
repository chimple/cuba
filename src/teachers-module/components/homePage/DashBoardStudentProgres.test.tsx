import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import DashBoardStudentProgres from './DashBoardStudentProgres';
import { LIDO_ASSESSMENT } from '../../../common/constants';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

const mockBuildStyles = jest.fn((styles) => styles);
jest.mock('react-circular-progressbar', () => ({
  CircularProgressbar: ({ value, text, styles, className }: any) => (
    <div
      data-testid="circular-progressbar"
      data-value={String(value)}
      data-text={String(text)}
      data-path-color={styles?.pathColor ?? ''}
      className={className}
    />
  ),
  buildStyles: (...args: any[]) => mockBuildStyles(args[0]),
}));

const mockApiHandler = {
  getLesson: jest.fn(),
  getChapterById: jest.fn(),
};

jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

describe('DashBoardStudentProgres', () => {
  const student = {
    id: 'student-1',
    name: 'Student One',
    avatar: 'avatar-1',
    image: 'profile.png',
  } as any;

  const makeStudentProgress = (results: any[]) =>
    new Map<string, any>([
      ['student', student],
      ['results', results],
    ]);

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiHandler.getLesson.mockResolvedValue({
      id: 'lesson-1',
      name: 'Addition',
      plugin_type: 'NORMAL',
    });
    mockApiHandler.getChapterById.mockResolvedValue({
      id: 'chapter-1',
      name: 'Numbers',
    });
    mockBuildStyles.mockImplementation((styles) => styles);
  });

  it('renders the student avatar and name', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 85 },
        ])}
      />,
    );

    expect(screen.getByAltText('Profile')).toHaveAttribute(
      'src',
      'profile.png',
    );
    expect(screen.getByText('Student One')).toBeInTheDocument();
    expect(await screen.findByText('Addition')).toBeInTheDocument();
  });

  it('falls back to avatar asset when student.image is missing', () => {
    const noImageStudent = { ...student, image: '', avatar: 'cat' };
    const studentProgress = new Map<string, any>([
      ['student', noImageStudent],
      ['results', []],
    ]);

    render(<DashBoardStudentProgres studentProgress={studentProgress} />);

    expect(screen.getByAltText('Profile')).toHaveAttribute(
      'src',
      'assets/avatars/cat.png',
    );
  });

  it('restores the avatar asset when the image element errors', () => {
    render(
      <DashBoardStudentProgres studentProgress={makeStudentProgress([])} />,
    );

    const image = screen.getByAltText('Profile') as HTMLImageElement;
    fireEvent.error(image);

    expect(image.src).toContain('assets/avatars/avatar-1.png');
  });

  it('renders no progressbars when results are missing', async () => {
    const studentProgress = new Map<string, any>([['student', student]]);

    render(<DashBoardStudentProgres studentProgress={studentProgress} />);

    await waitFor(() => {
      expect(
        screen.queryByTestId('circular-progressbar'),
      ).not.toBeInTheDocument();
    });

    expect(mockApiHandler.getLesson).not.toHaveBeenCalled();
  });

  it('renders no progressbars when results are empty', async () => {
    render(
      <DashBoardStudentProgres studentProgress={makeStudentProgress([])} />,
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId('circular-progressbar'),
      ).not.toBeInTheDocument();
    });

    expect(mockApiHandler.getLesson).not.toHaveBeenCalled();
  });

  it('renders a normal lesson result with rounded score and chapter name', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 84.6 },
        ])}
      />,
    );

    const progressbar = await screen.findByTestId('circular-progressbar');
    expect(progressbar).toHaveAttribute('data-value', '85');
    expect(progressbar).toHaveAttribute('data-text', '85');
    expect(progressbar).toHaveAttribute('data-path-color', 'green');
    expect(screen.getByText('Addition')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
  });

  it('uses red path color for low scores', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 49 },
        ])}
      />,
    );

    expect(await screen.findByTestId('circular-progressbar')).toHaveAttribute(
      'data-path-color',
      'red',
    );
  });

  it('uses orange path color for mid-range scores', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 50 },
        ])}
      />,
    );

    expect(await screen.findByTestId('circular-progressbar')).toHaveAttribute(
      'data-path-color',
      'orange',
    );
  });

  it('uses green path color at the 70 score boundary', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 70 },
        ])}
      />,
    );

    expect(await screen.findByTestId('circular-progressbar')).toHaveAttribute(
      'data-path-color',
      'green',
    );
  });

  it('uses score 0 when result.score is missing', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1' },
        ])}
      />,
    );

    const progressbar = await screen.findByTestId('circular-progressbar');
    expect(progressbar).toHaveAttribute('data-value', '0');
    expect(progressbar).toHaveAttribute('data-text', '0');
  });

  it('rounds fractional scores below .5 down to the nearest integer', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 84.4 },
        ])}
      />,
    );

    expect(await screen.findByTestId('circular-progressbar')).toHaveAttribute(
      'data-value',
      '84',
    );
  });

  it('skips results that do not have a lesson_id', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: '', chapter_id: 'chapter-1', score: 20 },
          { lesson_id: null, chapter_id: 'chapter-1', score: 30 },
        ])}
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId('circular-progressbar'),
      ).not.toBeInTheDocument();
    });

    expect(mockApiHandler.getLesson).not.toHaveBeenCalled();
  });

  it('leaves chapter name empty when chapter_id is missing', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', score: 60 },
        ])}
      />,
    );

    expect(await screen.findByText('Addition')).toBeInTheDocument();
    expect(mockApiHandler.getChapterById).not.toHaveBeenCalled();
  });

  it('does not fetch a chapter when chapter_id is null', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: null, score: 60 },
        ])}
      />,
    );

    expect(await screen.findByText('Addition')).toBeInTheDocument();
    expect(mockApiHandler.getChapterById).not.toHaveBeenCalled();
  });

  it('leaves chapter name empty when getChapterById returns no chapter', async () => {
    mockApiHandler.getChapterById.mockResolvedValue(undefined);

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 60 },
        ])}
      />,
    );

    expect(await screen.findByText('Addition')).toBeInTheDocument();
    expect(
      screen.getAllByText('', { selector: 'span' }).length,
    ).toBeGreaterThan(0);
  });

  it('leaves lesson name empty when getLesson returns undefined', async () => {
    mockApiHandler.getLesson.mockResolvedValue(undefined);

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 60 },
        ])}
      />,
    );

    const progressbar = await screen.findByTestId('circular-progressbar');
    expect(progressbar).toHaveAttribute('data-text', '60');
  });

  it('renders multiple normal lesson results in the same order as the input list', async () => {
    mockApiHandler.getLesson.mockImplementation(async (lessonId: string) => ({
      id: lessonId,
      name: lessonId === 'lesson-1' ? 'Addition' : 'Subtraction',
      plugin_type: 'NORMAL',
    }));

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 40 },
          { lesson_id: 'lesson-2', chapter_id: 'chapter-1', score: 80 },
        ])}
      />,
    );

    const progressbars = await screen.findAllByTestId('circular-progressbar');
    expect(progressbars).toHaveLength(2);
    expect(progressbars[0]).toHaveAttribute('data-value', '40');
    expect(progressbars[1]).toHaveAttribute('data-value', '80');

    const lessonNames = screen.getAllByText(/Addition|Subtraction/);
    expect(lessonNames[0]).toHaveTextContent('Addition');
    expect(lessonNames[1]).toHaveTextContent('Subtraction');
  });

  it('aggregates LIDO lesson scores by averaging all results for the same lesson', async () => {
    mockApiHandler.getLesson.mockImplementation(async (lessonId: string) => ({
      id: lessonId,
      name: 'Lido Quiz',
      plugin_type: LIDO_ASSESSMENT,
    }));

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 40 },
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 80 },
        ])}
      />,
    );

    const progressbars = await screen.findAllByTestId('circular-progressbar');
    expect(progressbars).toHaveLength(2);
    expect(progressbars[0]).toHaveAttribute('data-value', '60');
    expect(progressbars[1]).toHaveAttribute('data-value', '60');
  });

  it('treats missing LIDO scores as zero during averaging', async () => {
    mockApiHandler.getLesson.mockResolvedValue({
      id: 'lesson-1',
      name: 'Lido Quiz',
      plugin_type: LIDO_ASSESSMENT,
    });

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 90 },
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1' },
        ])}
      />,
    );

    const progressbars = await screen.findAllByTestId('circular-progressbar');
    expect(progressbars[0]).toHaveAttribute('data-value', '45');
    expect(progressbars[1]).toHaveAttribute('data-value', '45');
  });

  it('rounds aggregated LIDO averages before rendering', async () => {
    mockApiHandler.getLesson.mockResolvedValue({
      id: 'lesson-1',
      name: 'Lido Quiz',
      plugin_type: LIDO_ASSESSMENT,
    });

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 80 },
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 81 },
        ])}
      />,
    );

    const progressbars = await screen.findAllByTestId('circular-progressbar');
    expect(progressbars[0]).toHaveAttribute('data-value', '81');
    expect(progressbars[1]).toHaveAttribute('data-value', '81');
  });

  it('does not mix scores from different lessons when aggregating LIDO results', async () => {
    mockApiHandler.getLesson.mockImplementation(async (lessonId: string) => ({
      id: lessonId,
      name: lessonId === 'lesson-1' ? 'Lido Quiz' : 'Normal Quiz',
      plugin_type: lessonId === 'lesson-1' ? LIDO_ASSESSMENT : 'NORMAL',
    }));

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 40 },
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 80 },
          { lesson_id: 'lesson-2', chapter_id: 'chapter-1', score: 30 },
        ])}
      />,
    );

    const progressbars = await screen.findAllByTestId('circular-progressbar');
    expect(progressbars).toHaveLength(3);
    expect(progressbars[0]).toHaveAttribute('data-value', '60');
    expect(progressbars[1]).toHaveAttribute('data-value', '60');
    expect(progressbars[2]).toHaveAttribute('data-value', '30');
  });

  it('continues rendering later results when one lesson fetch throws', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockApiHandler.getLesson
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        id: 'lesson-2',
        name: 'Subtraction',
        plugin_type: 'NORMAL',
      });

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 10 },
          { lesson_id: 'lesson-2', chapter_id: 'chapter-1', score: 90 },
        ])}
      />,
    );

    expect(await screen.findByText('Subtraction')).toBeInTheDocument();
    expect(screen.getAllByTestId('circular-progressbar')).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('stops chapter lookup for a failed lesson fetch and still processes later chapter lookups', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockApiHandler.getLesson
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        id: 'lesson-2',
        name: 'Subtraction',
        plugin_type: 'NORMAL',
      });

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-ignored', score: 10 },
          { lesson_id: 'lesson-2', chapter_id: 'chapter-1', score: 90 },
        ])}
      />,
    );

    await screen.findByText('Subtraction');

    expect(mockApiHandler.getChapterById).toHaveBeenCalledTimes(1);
    expect(mockApiHandler.getChapterById).toHaveBeenCalledWith('chapter-1');

    consoleSpy.mockRestore();
  });

  it('fetches chapters for each result entry that has a chapter_id', async () => {
    mockApiHandler.getLesson.mockImplementation(async (lessonId: string) => ({
      id: lessonId,
      name: lessonId,
      plugin_type: 'NORMAL',
    }));

    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 10 },
          { lesson_id: 'lesson-2', chapter_id: 'chapter-2', score: 20 },
        ])}
      />,
    );

    await screen.findAllByTestId('circular-progressbar');

    expect(mockApiHandler.getChapterById).toHaveBeenCalledTimes(2);
    expect(mockApiHandler.getChapterById).toHaveBeenNthCalledWith(
      1,
      'chapter-1',
    );
    expect(mockApiHandler.getChapterById).toHaveBeenNthCalledWith(
      2,
      'chapter-2',
    );
  });

  it('renders an empty student name when the student document has no name', () => {
    const namelessStudent = { ...student, name: undefined };
    const studentProgress = new Map<string, any>([
      ['student', namelessStudent],
      ['results', []],
    ]);

    render(<DashBoardStudentProgres studentProgress={studentProgress} />);

    const nameNode = document.querySelector('.dashboard-avatar-name');
    expect(nameNode).toBeInTheDocument();
    expect(nameNode).toHaveTextContent('');
  });

  it('falls back to an undefined-avatar asset path when both image and avatar are missing', () => {
    const incompleteStudent = {
      ...student,
      image: undefined,
      avatar: undefined,
    };
    const studentProgress = new Map<string, any>([
      ['student', incompleteStudent],
      ['results', []],
    ]);

    render(<DashBoardStudentProgres studentProgress={studentProgress} />);

    expect(screen.getByAltText('Profile')).toHaveAttribute(
      'src',
      'assets/avatars/undefined.png',
    );
  });

  it('passes the expected default text and trail styles to buildStyles', async () => {
    render(
      <DashBoardStudentProgres
        studentProgress={makeStudentProgress([
          { lesson_id: 'lesson-1', chapter_id: 'chapter-1', score: 85 },
        ])}
      />,
    );

    await screen.findByTestId('circular-progressbar');

    expect(mockBuildStyles).toHaveBeenCalledWith(
      expect.objectContaining({
        trailColor: '#f1f1f1',
        textColor: '#333',
        textSize: '20px',
      }),
    );
  });

  it('keeps the dashboard student progress CSS layout contract', () => {
    const css = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/teachers-module/components/homePage/DashBoardStudentProgress.css',
      ),
      'utf8',
    );

    expect(css).toMatch(
      /\.dashboard-student-progress-container\s*\{[\s\S]*display:\s*flex;/,
    );
    expect(css).toMatch(
      /\.dashboard-score-content\s*\{[\s\S]*overflow-x:\s*scroll;/,
    );
  });
});
