import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import LiveQuizGame from './LiveQuizGame';
import { ServiceConfig } from '../services/ServiceConfig';
import { LESSONS_PLAYED_COUNT, PAGES } from '../common/constants';
import { Util } from '../utility/util';

let mockSearch = '';
let mockState: any = {};
const mockReplace = jest.fn();
const mockToast = jest.fn();
const mockOnGameComplete = jest.fn();

jest.mock('@ionic/react', () => ({
  IonPage: (props: any) => <div>{props.children}</div>,
  IonContent: (props: any) => <div>{props.children}</div>,
}));

jest.mock('react-router', () => ({
  useHistory: () => ({
    replace: mockReplace,
    location: { state: mockState },
  }),
}));

jest.mock('../common/onlineOfflineErrorMessageHandler', () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    presentToast: mockToast,
  }),
}));

jest.mock('@growthbook/growthbook-react', () => ({
  useGrowthBook: () => ({
    getFeatureValue: jest.fn(() => ({ enabled: true })),
  }),
}));

jest.mock('../components/GenericPopUp/GenericPopUpManager', () => ({
  __esModule: true,
  default: {
    onGameComplete: (...args: any[]) => mockOnGameComplete(...args),
  },
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}));

jest.mock('../utility/util');
jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    language: 'en',
    t: (s: string) => s,
  },
}));
jest.mock('i18next', () => ({
  t: (s: string) => s,
}));

const mockQuestionSpy = jest.fn();
jest.mock('../components/liveQuiz/LiveQuizQuestion', () => (props: any) => {
  mockQuestionSpy(props);
  return (
    <div data-testid="live-quiz-question">
      <button onClick={() => props.onQuizEnd?.()}>trigger-quiz-end</button>
      <button onClick={() => props.onNewQuestionChange?.(2)}>
        question-change
      </button>
      <button onClick={() => props.onRemainingTimeChange?.(11)}>
        remaining-change
      </button>
      <button onClick={() => props.onShowAnswer?.(true)}>show-answer</button>
      <button
        onClick={() =>
          props.onConfigLoaded?.({ data: [{ question: { id: 'q-1' } }] })
        }
      >
        config-loaded
      </button>
      <button onClick={() => props.onTotalScoreChange?.(74)}>
        score-change
      </button>
    </div>
  );
});

jest.mock('../components/liveQuiz/LiveQuizHeader', () => (props: any) => (
  <div data-testid="live-quiz-header">{String(props.currentQuestionIndex)}</div>
));

jest.mock(
  '../components/liveQuiz/LiveQuizCountdownTimer',
  () => (props: any) => (
    <div data-testid="live-quiz-countdown">
      <button onClick={() => props.onTimeOut()}>timeout</button>
    </div>
  ),
);

const mockScoreCardSpy = jest.fn();
jest.mock('../components/parent/ScoreCard', () => (props: any) => {
  mockScoreCardSpy(props);
  return (
    <div data-testid="scorecard">
      <button onClick={() => props.onContinueButtonClicked?.()}>
        continue
      </button>
      <button onClick={() => props.handleClose?.()}>close-dialog</button>
    </div>
  );
});

const mockApi = {
  liveQuizListener: jest.fn(),
  removeLiveQuizChannel: jest.fn(),
  getLesson: jest.fn(),
};

describe('LiveQuizGame page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuestionSpy.mockReset();
    mockScoreCardSpy.mockReset();
    mockSearch = '';
    mockState = {};
    window.history.replaceState({}, '', '/');
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
    } as any);
    mockApi.liveQuizListener.mockImplementation((_id: string, cb: Function) => {
      (mockApi.liveQuizListener as any).cb = cb;
    });
    mockApi.getLesson.mockResolvedValue({
      id: 'lesson-from-room',
      name: 'Room Lesson',
    });
    (Util.showInAppReview as jest.Mock).mockImplementation(() => {});
  });

  const setSearch = (search: string) => {
    mockSearch = search;
    window.history.replaceState({}, '', '/' + search);
  };

  test('redirects home when neither liveRoomId nor lessonId is provided', async () => {
    render(<LiveQuizGame />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.HOME);
    });
  });

  test('registers live quiz listener when liveRoomId exists', async () => {
    setSearch('?liveRoomId=room-1');
    render(<LiveQuizGame />);
    await waitFor(() => {
      expect(mockApi.liveQuizListener).toHaveBeenCalledWith(
        'room-1',
        expect.any(Function),
      );
    });
  });

  test('removes live quiz channel on unmount', async () => {
    setSearch('?liveRoomId=room-1');
    const { unmount } = render(<LiveQuizGame />);
    await waitFor(() => {
      expect(mockApi.liveQuizListener).toHaveBeenCalled();
    });
    unmount();
    expect(mockApi.removeLiveQuizChannel).toHaveBeenCalled();
  });

  test('shows toast and redirects to live quiz list when room doc is undefined', async () => {
    setSearch('?liveRoomId=room-1');
    render(<LiveQuizGame />);
    await waitFor(() => expect(mockApi.liveQuizListener).toHaveBeenCalled());
    await act(async () => {
      await (mockApi.liveQuizListener as any).cb(undefined);
    });
    expect(mockToast).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(PAGES.LIVE_QUIZ);
  });

  test('loads lesson when room doc has lesson_id', async () => {
    setSearch('?liveRoomId=room-1');
    render(<LiveQuizGame />);
    await waitFor(() => expect(mockApi.liveQuizListener).toHaveBeenCalled());
    await act(async () => {
      await (mockApi.liveQuizListener as any).cb({
        id: 'room-1',
        starts_at: new Date().toISOString(),
        lesson_id: 'lesson-1',
      });
    });
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledWith('lesson-1');
    });
  });

  test('renders countdown before timeout in room mode', async () => {
    setSearch('?liveRoomId=room-1');
    render(<LiveQuizGame />);
    await act(async () => {
      await (mockApi.liveQuizListener as any).cb({
        id: 'room-1',
        starts_at: new Date().toISOString(),
        lesson_id: 'lesson-1',
      });
    });
    expect(
      await screen.findByTestId('live-quiz-countdown'),
    ).toBeInTheDocument();
  });

  test('hides countdown after timeout and keeps question rendered', async () => {
    setSearch('?liveRoomId=room-1');
    render(<LiveQuizGame />);
    await act(async () => {
      await (mockApi.liveQuizListener as any).cb({
        id: 'room-1',
        starts_at: new Date().toISOString(),
        lesson_id: 'lesson-1',
      });
    });
    fireEvent.click(await screen.findByText('timeout'));
    await waitFor(() => {
      expect(
        screen.queryByTestId('live-quiz-countdown'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('live-quiz-question')).toBeInTheDocument();
    });
  });

  test('routes to room result page on room quiz end', async () => {
    setSearch('?liveRoomId=room-1');
    render(<LiveQuizGame />);
    await act(async () => {
      await (mockApi.liveQuizListener as any).cb({
        id: 'room-1',
        starts_at: new Date().toISOString(),
        lesson_id: 'lesson-1',
      });
    });
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        PAGES.LIVE_QUIZ_ROOM_RESULT + '?liveRoomId=room-1',
      );
    });
  });

  test('renders lesson mode question when lessonId query exists', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    expect(await screen.findByTestId('live-quiz-question')).toBeInTheDocument();
  });

  test('passes lesson mode flags to LiveQuizQuestion', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
      learning_path: true,
      reward: true,
    };
    render(<LiveQuizGame />);
    await waitFor(() => {
      const props =
        mockQuestionSpy.mock.calls[mockQuestionSpy.mock.calls.length - 1][0];
      expect(props.lessonId).toBe('lesson-1');
      expect(props.showQuiz).toBe(true);
      expect(props.isLearningPathway).toBe(true);
      expect(props.isReward).toBe(true);
    });
  });

  test('shows score card when lesson quiz ends', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    expect(await screen.findByTestId('scorecard')).toBeInTheDocument();
  });

  test('sends popup completion event on lesson quiz end', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    await waitFor(() => {
      expect(mockOnGameComplete).toHaveBeenCalled();
    });
  });

  test('passes latest score to scorecard', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('score-change'));
    fireEvent.click(screen.getByText('trigger-quiz-end'));
    await waitFor(() => {
      const props =
        mockScoreCardSpy.mock.calls[mockScoreCardSpy.mock.calls.length - 1][0];
      expect(props.score).toBe(74);
    });
  });

  test('continue from scorecard routes to from path without reload when absent', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
      from: '/home',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    fireEvent.click(await screen.findByText('continue'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/home', mockState);
    });
  });

  test('continue adds isReload=true for web when param exists and from has query', async () => {
    setSearch('?lessonId=lesson-1&isReload=true');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
      from: '/home?tab=ASSIGNMENT',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    fireEvent.click(await screen.findByText('continue'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/home?tab=ASSIGNMENT&isReload=true',
        mockState,
      );
    });
  });

  test('continue adds isReload=true for web when from has no query', async () => {
    setSearch('?lessonId=lesson-1&isReload=true');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
      from: '/home',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    fireEvent.click(await screen.findByText('continue'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/home?isReload=true',
        mockState,
      );
    });
  });

  test('continue defaults to HOME path when from is missing', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    fireEvent.click(await screen.findByText('continue'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.HOME, mockState);
    });
  });

  test('continue triggers in-app review when played count is threshold', async () => {
    localStorage.setItem(LESSONS_PLAYED_COUNT, '5');
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    fireEvent.click(await screen.findByText('continue'));
    await waitFor(() => {
      expect(Util.showInAppReview).toHaveBeenCalled();
      expect(localStorage.getItem(LESSONS_PLAYED_COUNT)).toBe('0');
    });
  });

  test('continue does not trigger in-app review below threshold', async () => {
    localStorage.setItem(LESSONS_PLAYED_COUNT, '2');
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('trigger-quiz-end'));
    fireEvent.click(await screen.findByText('continue'));
    await waitFor(() => {
      expect(Util.showInAppReview).not.toHaveBeenCalled();
    });
  });

  test('renders header in room mode after room doc arrives', async () => {
    setSearch('?liveRoomId=room-1');
    render(<LiveQuizGame />);
    await act(async () => {
      await (mockApi.liveQuizListener as any).cb({
        id: 'room-1',
        starts_at: new Date().toISOString(),
        lesson_id: 'lesson-1',
      });
    });
    expect(await screen.findByTestId('live-quiz-header')).toBeInTheDocument();
  });

  test('updates quiz state callbacks passed to question component', async () => {
    setSearch('?lessonId=lesson-1');
    mockState = {
      lesson: JSON.stringify({
        id: 'lesson-1',
        chapter_id: 'ch-1',
        name: 'Lesson 1',
      }),
      courseId: 'course-1',
    };
    render(<LiveQuizGame />);
    fireEvent.click(await screen.findByText('question-change'));
    fireEvent.click(screen.getByText('remaining-change'));
    fireEvent.click(screen.getByText('show-answer'));
    fireEvent.click(screen.getByText('config-loaded'));
    expect(screen.getByTestId('live-quiz-question')).toBeInTheDocument();
  });
});
