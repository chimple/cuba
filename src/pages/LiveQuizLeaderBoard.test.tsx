import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LiveQuizLeaderBoard from './LiveQuizLeaderBoard';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { PAGES } from '../common/constants';
import logger from '../utility/logger';

const mockReplace = jest.fn();
const mockNextButtonSpy = jest.fn();

jest.mock('../utility/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('@ionic/react', () => ({
  IonPage: (props: any) => <div>{props.children}</div>,
  IonContent: (props: any) => <div>{props.children}</div>,
  IonRow: (props: any) => (
    <div className={props.className}>{props.children}</div>
  ),
}));

jest.mock('react-router', () => ({
  useHistory: () => ({ replace: mockReplace }),
}));

jest.mock('../components/common/StudentAvatar', () => (props: any) => (
  <div data-testid={`student-avatar-${props.student.id}`}>
    {props.student.name}
  </div>
));

jest.mock('../components/common/NextButton', () => (props: any) => {
  mockNextButtonSpy(props);
  return <button onClick={() => props.onClicked?.()}>next</button>;
});

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

const mockApi = {
  getLiveQuizRoomDoc: jest.fn(),
  getAssignmentById: jest.fn(),
  getStudentResultsByAssignmentId: jest.fn(),
};

describe('LiveQuizLeaderBoard page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNextButtonSpy.mockReset();
    window.history.replaceState({}, '', '/?liveRoomId=room-1');

    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);

    (Util.loadBackgroundImage as jest.Mock).mockImplementation(() => {});

    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: 'a-1',
      results: {
        s1: [
          { score: 10, timeSpent: 6 },
          { score: 5, timeSpent: 4 },
        ],
        s2: [{ score: 9, timeSpent: 2 }],
        s3: [{ score: 20, timeSpent: 8 }],
      },
    });

    mockApi.getAssignmentById.mockResolvedValue({ id: 'a-1' });

    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      {
        user_data: [
          { id: 's1', name: 'One' },
          { id: 's2', name: 'Two' },
          { id: 's3', name: 'Three' },
        ],
        result_data: [
          { student_id: 's1', score: 15 },
          { student_id: 's2', score: 9 },
          { student_id: 's3', score: 20 },
          { student_id: 's2', score: 1 },
        ],
      },
    ]);
  });

  test('loads background image on mount', async () => {
    render(<LiveQuizLeaderBoard />);
    await waitFor(() => {
      expect(Util.loadBackgroundImage).toHaveBeenCalled();
    });
  });

  test('fetches live room using URL param', async () => {
    render(<LiveQuizLeaderBoard />);
    await waitFor(() => {
      expect(mockApi.getLiveQuizRoomDoc).toHaveBeenCalledWith('room-1');
    });
  });

  test('fetches assignment by assignment_id from live room', async () => {
    render(<LiveQuizLeaderBoard />);
    await waitFor(() => {
      expect(mockApi.getAssignmentById).toHaveBeenCalledWith('a-1');
    });
  });

  test('fetches assignment results for the resolved assignment', async () => {
    render(<LiveQuizLeaderBoard />);
    await waitFor(() => {
      expect(mockApi.getStudentResultsByAssignmentId).toHaveBeenCalledWith(
        'a-1',
      );
    });
  });

  test('renders leaderboard header labels', async () => {
    render(<LiveQuizLeaderBoard />);
    expect(
      await screen.findByText('Live Quiz Leaderboard'),
    ).toBeInTheDocument();
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  test('renders students sorted by total score descending', async () => {
    render(<LiveQuizLeaderBoard />);
    await waitFor(() => {
      const avatars = screen.getAllByTestId(/student-avatar-/);
      expect(avatars[0]).toHaveTextContent('Three');
      expect(avatars[1]).toHaveTextContent('One');
      expect(avatars[2]).toHaveTextContent('Two');
    });
  });

  test('navigates to home when Next button is clicked', async () => {
    render(<LiveQuizLeaderBoard />);
    fireEvent.click(await screen.findByText('next'));
    expect(mockReplace).toHaveBeenCalledWith(PAGES.HOME);
  });

  test('handles API errors by logging and keeping page stable', async () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    mockApi.getLiveQuizRoomDoc.mockRejectedValue(new Error('failed'));

    render(<LiveQuizLeaderBoard />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByText('Live Quiz Leaderboard')).toBeInTheDocument();
    });

    spy.mockRestore();
  });

  test('supports single participant render', async () => {
    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: 'a-1',
      results: {
        s1: [{ score: 1, timeSpent: 3 }],
      },
    });

    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      {
        user_data: [{ id: 's1', name: 'One' }],
        result_data: [{ student_id: 's1', score: 1 }],
      },
    ]);

    render(<LiveQuizLeaderBoard />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/student-avatar-/)).toHaveLength(1);
    });
  });

  test('uses URL param fallback empty string when absent', async () => {
    window.history.replaceState({}, '', '/');

    render(<LiveQuizLeaderBoard />);

    await waitFor(() => {
      expect(mockApi.getLiveQuizRoomDoc).toHaveBeenCalledWith('');
    });
  });
});
