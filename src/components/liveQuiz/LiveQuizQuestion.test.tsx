import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import LiveQuizQuestion from './LiveQuizQuestion';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { schoolUtil } from '../../utility/schoolUtil';
import { LIVE_QUIZ_QUESTION_TIME } from '../../models/liveQuiz';
import { PAGES } from '../../common/constants';
import logger from '../../utility/logger';

const mockReplace = jest.fn();
const mockAudioPlay = jest.fn().mockResolvedValue(undefined);
const mockAudioPause = jest.fn();
const mockAudioLoad = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({ replace: mockReplace }),
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}));

jest.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: jest.fn(),
  },
  Directory: { External: 'External' },
  Encoding: { UTF8: 'utf8' },
}));

jest.mock('@capacitor-community/text-to-speech', () => ({
  TextToSpeech: {
    speak: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./LiveQuizNavigationDots', () => (props: any) => (
  <div data-testid="navigation-dots">
    {String(props.totalDots)}-{String(props.currentDot)}
  </div>
));

jest.mock('../../utility/util');
jest.mock('../../utility/schoolUtil');

const mockApi = {
  updateLiveQuiz: jest.fn(),
  updateResult: jest.fn(),
  getAssignmentById: jest.fn(),
};
const mockAuth = {
  getCurrentUser: jest.fn(),
};

describe('LiveQuizQuestion component', () => {
  let originalConsoleError: typeof logger.error;
  beforeAll(() => {
    // @ts-ignore
    global.Audio = jest.fn(() => ({
      play: mockAudioPlay,
      pause: mockAudioPause,
      load: mockAudioLoad,
      currentTime: 0,
      preload: 'auto',
    }));
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
      authHandler: mockAuth,
    } as any);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'stu-1' });
    (Util.updateLearningPath as jest.Mock).mockResolvedValue(undefined);
    (schoolUtil.getCurrentClass as jest.Mock).mockReturnValue({
      id: 'class-1',
      school_id: 'school-1',
    });
    mockApi.updateLiveQuiz.mockResolvedValue(undefined);
    mockApi.updateResult.mockResolvedValue(undefined);
    mockApi.getAssignmentById.mockResolvedValue({ chapter_id: 'ch-1' });
    mockAuth.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    originalConsoleError = logger.error;
    jest.spyOn(logger, 'error').mockImplementation((...args: any[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('AggregateError')) return;
      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const renderQuestion = (
    props?: Partial<React.ComponentProps<typeof LiveQuizQuestion>>,
  ) =>
    render(
      <LiveQuizQuestion
        lessonId="lesson-1"
        quizData={{ lessonid: 'lesson-1', chapterId: 'ch-1', courseId: 'c-1' }}
        showQuiz={true}
        isTimeOut={true}
        onNewQuestionChange={jest.fn()}
        onConfigLoaded={jest.fn()}
        onRemainingTimeChange={jest.fn()}
        onShowAnswer={jest.fn()}
        onQuizEnd={jest.fn()}
        onTotalScoreChange={jest.fn()}
        {...props}
      />,
    );

  test('redirects to home when student is missing', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    renderQuestion();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.HOME);
    });
  });

  test('does not initialize when both roomDoc and lessonId are missing', async () => {
    render(
      <LiveQuizQuestion
        showQuiz={true}
        isTimeOut={true}
        onQuizEnd={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(
        screen.queryByText('Which animal is known as the king of the jungle?'),
      ).not.toBeInTheDocument();
    });
  });

  test('renders first question text in web mode', async () => {
    renderQuestion();
    expect(
      await screen.findByText(
        'Which animal is known as the king of the jungle?',
      ),
    ).toBeInTheDocument();
  });

  test('renders options for current question', async () => {
    renderQuestion();
    expect(await screen.findByText('Lion')).toBeInTheDocument();
    expect(screen.getByText('Tiger')).toBeInTheDocument();
    expect(screen.getByText('Elephant')).toBeInTheDocument();
    expect(screen.getByText('Giraffe')).toBeInTheDocument();
  });

  test('calls onConfigLoaded with loaded config', async () => {
    const onConfigLoaded = jest.fn();
    renderQuestion({ onConfigLoaded });
    await waitFor(() => {
      expect(onConfigLoaded).toHaveBeenCalled();
    });
  });

  test('calls onNewQuestionChange when first question is shown', async () => {
    const onNewQuestionChange = jest.fn();
    renderQuestion({ onNewQuestionChange });
    await waitFor(() => {
      expect(onNewQuestionChange).toHaveBeenCalledWith(0);
    });
  });

  test('reports initial remaining time for each question', async () => {
    const onRemainingTimeChange = jest.fn();
    renderQuestion({ onRemainingTimeChange });
    await waitFor(() => {
      expect(onRemainingTimeChange).toHaveBeenCalledWith(
        LIVE_QUIZ_QUESTION_TIME,
      );
    });
  });

  test('reports countdown ticks', async () => {
    const onRemainingTimeChange = jest.fn();
    renderQuestion({ onRemainingTimeChange });
    await screen.findByText('Lion');
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(onRemainingTimeChange).toHaveBeenCalledWith(
        LIVE_QUIZ_QUESTION_TIME - 1,
      );
    });
  });

  test('calls updateLiveQuiz when an option is clicked', async () => {
    renderQuestion();
    fireEvent.click(await screen.findByText('Lion'));
    await waitFor(() => {
      expect(mockApi.updateLiveQuiz).toHaveBeenCalledWith(
        'lesson-1',
        'stu-1',
        'question_1',
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  test('prevents answering twice for the same question', async () => {
    renderQuestion();
    const lion = await screen.findByText('Lion');
    fireEvent.click(lion);
    fireEvent.click(lion);
    await waitFor(() => {
      expect(mockApi.updateLiveQuiz).toHaveBeenCalledTimes(1);
    });
  });

  test('applies selected-option class after selection', async () => {
    const { container } = renderQuestion();
    fireEvent.click(await screen.findByText('Lion'));
    await waitFor(() => {
      expect(container.querySelector('.selected-option')).toBeInTheDocument();
    });
  });

  test('renders navigation dots only when timed mode is enabled', async () => {
    renderQuestion({ isTimeOut: true });
    expect(await screen.findByTestId('navigation-dots')).toBeInTheDocument();
  });

  test('hides navigation dots when timed mode is disabled', async () => {
    renderQuestion({ isTimeOut: false });
    await screen.findByText('Lion');
    expect(screen.queryByTestId('navigation-dots')).not.toBeInTheDocument();
  });

  test('calls onShowAnswer false on question change', async () => {
    const onShowAnswer = jest.fn();
    renderQuestion({ onShowAnswer });
    await waitFor(() => {
      expect(onShowAnswer).toHaveBeenCalledWith(false);
    });
  });

  test('plays TTS for question audio button when only text exists', async () => {
    const { container } = renderQuestion();
    await screen.findByText('Which animal is known as the king of the jungle?');
    const icons = container.querySelectorAll(
      '.live-quiz-audio-button-question svg',
    );
    fireEvent.click(icons[0]);
    const { TextToSpeech } = require('@capacitor-community/text-to-speech');
    await waitFor(() => {
      expect(TextToSpeech.speak).toHaveBeenCalled();
    });
  });

  test('plays TTS for option audio button when text option is clicked', async () => {
    const { container } = renderQuestion();
    await screen.findByText('Lion');
    const optionIcon = container.querySelector(
      '.live-quiz-audio-button-option svg',
    );
    fireEvent.click(optionIcon as Element);
    const { TextToSpeech } = require('@capacitor-community/text-to-speech');
    await waitFor(() => {
      expect(TextToSpeech.speak).toHaveBeenCalled();
    });
  });

  test('locks options after first selection', async () => {
    const { container } = renderQuestion();
    fireEvent.click(await screen.findByText('Lion'));
    await waitFor(() => {
      const options = container.querySelectorAll('.live-quiz-option-box');
      options.forEach((option) => {
        expect(option).toHaveAttribute('aria-disabled', 'true');
      });
    });
  });

  test('uses room id for updateLiveQuiz when lessonId is absent', async () => {
    render(
      <LiveQuizQuestion
        roomDoc={
          {
            id: 'room-1',
            assignment_id: 'a-1',
            results: {},
            participants: ['stu-1'],
          } as any
        }
        showQuiz={true}
        isTimeOut={true}
      />,
    );
    fireEvent.click(await screen.findByText('Lion'));
    await waitFor(() => {
      expect(mockApi.updateLiveQuiz).toHaveBeenCalledWith(
        'room-1',
        'stu-1',
        'question_1',
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  test('hides question UI when showQuiz is false', async () => {
    const { container } = renderQuestion({ showQuiz: false });
    await waitFor(() => {
      expect(
        container.querySelector('.live-quiz-question'),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector('.live-quiz-options'),
      ).not.toBeInTheDocument();
    });
  });

  test('shows lesson mode top/bottom padding wrapper for dots', async () => {
    const { container } = renderQuestion();
    await screen.findByText('Lion');
    const wrapper = container.querySelector(
      '.live-quiz-navigation-dots',
    ) as HTMLElement;
    expect(wrapper.style.paddingTop).toBe('5vh');
    expect(wrapper.style.paddingBottom).toBe('5vh');
  });
});
