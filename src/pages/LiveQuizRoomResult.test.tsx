import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import LiveQuizRoomResult from './LiveQuizRoomResult';
import { ServiceConfig } from '../services/ServiceConfig';
import { PAGES } from '../common/constants';
import logger from '../utility/logger';

const mockReplace = jest.fn();
const mockNextButtonSpy = jest.fn();
const mockAvatarSpy = jest.fn();

jest.mock('../utility/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('@ionic/react', () => ({
  IonPage: (props: any) => <div>{props.children}</div>,
}));

jest.mock('react-router', () => ({
  useHistory: () => ({ replace: mockReplace }),
}));

jest.mock('react-confetti', () => () => <div data-testid="confetti" />);

jest.mock('../components/common/NextButton', () => (props: any) => {
  mockNextButtonSpy(props);
  return <button onClick={() => props.onClicked?.()}>next</button>;
});

jest.mock('../components/common/StudentAvatar', () => (props: any) => {
  mockAvatarSpy(props);
  return (
    <div data-testid={`avatar-${props.student.id}`}>
      {props.student.name}
      {props.nameLabel ? `-${props.nameLabel}` : ''}
    </div>
  );
});

jest.mock('i18next', () => ({
  t: (s: string) => s,
}));

const mockApi = {
  getLiveQuizRoomDoc: jest.fn(),
  getStudentResultsByAssignmentId: jest.fn(),
};

describe('LiveQuizRoomResult page', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockAvatarSpy.mockReset();
    mockNextButtonSpy.mockReset();

    window.history.replaceState({}, '', '/?liveRoomId=room-1');

    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);

    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: 'a-1',
      class_id: 'class-1',
      results: {
        s1: [
          { score: 10, timeSpent: 8 },
          { score: 6, timeSpent: 3 },
        ],
        s2: [{ score: 12, timeSpent: 7 }],
        s3: [{ score: 7, timeSpent: 2 }],
        s4: [{ score: 2, timeSpent: 1 }],
      },
    });

    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      {
        user_data: [
          { id: 's1', name: 'One' },
          { id: 's2', name: 'Two' },
          { id: 's3', name: 'Three' },
          { id: 's4', name: 'Four' },
        ],
      },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fetches room doc with URL liveRoomId', async () => {
    render(<LiveQuizRoomResult />);

    await waitFor(() => {
      expect(mockApi.getLiveQuizRoomDoc).toHaveBeenCalledWith('room-1');
    });
  });

  test('loads assignment participants by assignment id', async () => {
    render(<LiveQuizRoomResult />);

    await waitFor(() => {
      expect(mockApi.getStudentResultsByAssignmentId).toHaveBeenCalledWith(
        'a-1',
      );
    });
  });

  test('renders next button and navigates leaderboard on click', async () => {
    render(<LiveQuizRoomResult />);

    fireEvent.click(await screen.findByText('next'));

    expect(mockReplace).toHaveBeenCalledWith(
      PAGES.LIVE_QUIZ_LEADERBOARD + '?liveRoomId=room-1',
    );
  });

  test('shows confetti and congratulations initially', async () => {
    render(<LiveQuizRoomResult />);

    expect(await screen.findByTestId('confetti')).toBeInTheDocument();
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
  });

  test('hides confetti after 5 seconds', async () => {
    render(<LiveQuizRoomResult />);

    await screen.findByTestId('confetti');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });
  });

  test('logs errors and keeps page stable when init fails', async () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    mockApi.getLiveQuizRoomDoc.mockRejectedValue(new Error('failed'));

    render(<LiveQuizRoomResult />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByText('next')).toBeInTheDocument();
    });

    spy.mockRestore();
  });

  test('passes disabled false to next button', async () => {
    render(<LiveQuizRoomResult />);

    await waitFor(() => {
      const props =
        mockNextButtonSpy.mock.calls[
          mockNextButtonSpy.mock.calls.length - 1
        ][0];

      expect(props.disabled).toBe(false);
    });
  });

  test('supports URL without liveRoomId', async () => {
    window.history.replaceState({}, '', '/');

    render(<LiveQuizRoomResult />);

    await waitFor(() => {
      expect(mockApi.getLiveQuizRoomDoc).toHaveBeenCalledWith('');
    });
  });
});
