import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LiveQuizHeader from './LiveQuizHeader';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { LIVE_QUIZ_QUESTION_TIME } from '../../models/liveQuiz';
import { PAGES } from '../../common/constants';

const mockReplace = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('./LiveQuizStudentAvatar', () => (props: any) => (
  <div
    data-testid={`avatar-${props.student.id}`}
    data-score={props.score == null ? 'undefined' : String(props.score)}
    data-correct={
      props.isCorrect == null ? 'undefined' : String(props.isCorrect)
    }
    data-percentage={
      props.percentage == null ? 'undefined' : String(props.percentage)
    }
  >
    {props.student.name}
  </div>
));

jest.mock('../../utility/util');

const mockApi = {
  getStudentResultsByAssignmentId: jest.fn(),
};

const baseRoomDoc: any = {
  assignment_id: 'a-1',
  participants: ['s1', 's2', 's3'],
  results: {
    s1: [
      { question_id: 'q1', score: 10, timeSpent: 5 },
      { question_id: 'q2', score: 5, timeSpent: 7 },
    ],
    s2: [
      { question_id: 'q1', score: 0, timeSpent: 10 },
      { question_id: 'q2', score: 10, timeSpent: 4 },
    ],
    s3: [{ question_id: 'q1', score: 3, timeSpent: 9 }],
  },
};

const usersPayload = [
  {
    user_data: [
      { id: 's1', name: 'One', avatar: 'a1' },
      { id: 's2', name: 'Two', avatar: 'a2' },
      { id: 's3', name: 'Three', avatar: 'a3' },
      { id: 's4', name: 'Four', avatar: 'a4' },
    ],
  },
];

describe('LiveQuizHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 's2',
      name: 'Me',
    });
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue(usersPayload);
  });

  const renderHeader = (overrides?: any) =>
    render(
      <LiveQuizHeader
        roomDoc={{ ...baseRoomDoc, ...(overrides?.roomDoc || {}) }}
        remainingTime={overrides?.remainingTime ?? 15}
        showAnswer={overrides?.showAnswer ?? true}
        currentQuestion={
          overrides?.currentQuestion ?? { id: 'q2', text: 'Q2?' }
        }
        currentQuestionIndex={overrides?.currentQuestionIndex ?? 2}
      />,
    );

  test('calls participant user lookup on mount', async () => {
    renderHeader();
    await waitFor(() => {
      expect(mockApi.getStudentResultsByAssignmentId).toHaveBeenCalledWith(
        'a-1',
      );
    });
  });

  test('redirects home when current student is missing', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    renderHeader();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.HOME);
    });
  });

  test('renders avatars for participants only', async () => {
    renderHeader();
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-s2')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-s3')).toBeInTheDocument();
      expect(screen.queryByTestId('avatar-s4')).not.toBeInTheDocument();
    });
  });

  test('moves current student to first position', async () => {
    const { container } = renderHeader();
    await waitFor(() => {
      const ids = Array.from(
        container.querySelectorAll("[data-testid^='avatar-']"),
      ).map((n) => n.getAttribute('data-testid'));
      expect(ids[0]).toBe('avatar-s2');
    });
  });

  test('uses live score when showAnswer is true', async () => {
    renderHeader({ showAnswer: true });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toHaveAttribute(
        'data-score',
        '15',
      );
      expect(screen.getByTestId('avatar-s2')).toHaveAttribute(
        'data-score',
        '10',
      );
    });
  });

  test('freezes score when showAnswer is false', async () => {
    const { rerender } = renderHeader({ showAnswer: true });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toHaveAttribute(
        'data-score',
        '15',
      );
    });
    rerender(
      <LiveQuizHeader
        roomDoc={{
          ...baseRoomDoc,
          results: {
            ...baseRoomDoc.results,
            s1: [
              ...baseRoomDoc.results.s1,
              { question_id: 'q3', score: 10, timeSpent: 3 },
            ],
          },
        }}
        remainingTime={15}
        showAnswer={false}
        currentQuestion={{ id: 'q3', text: 'Q3?' }}
        currentQuestionIndex={3}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toHaveAttribute(
        'data-score',
        '15',
      );
    });
  });

  test('computes isCorrect true for correctly answered current question', async () => {
    renderHeader({
      currentQuestion: { id: 'q2', text: 'Q2?' },
      showAnswer: true,
    });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s2')).toHaveAttribute(
        'data-correct',
        'true',
      );
    });
  });

  test('computes isCorrect false for wrong answer on current question', async () => {
    renderHeader({
      currentQuestion: { id: 'q2', text: 'Q2?' },
      showAnswer: true,
    });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toHaveAttribute(
        'data-correct',
        'true',
      );
      expect(screen.getByTestId('avatar-s3')).toHaveAttribute(
        'data-correct',
        'false',
      );
    });
  });

  test('passes undefined isCorrect while answer is hidden', async () => {
    renderHeader({ showAnswer: false });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toHaveAttribute(
        'data-correct',
        'undefined',
      );
      expect(screen.getByTestId('avatar-s2')).toHaveAttribute(
        'data-correct',
        'undefined',
      );
    });
  });

  test('computes percentage based on remaining time when current question not answered yet', async () => {
    renderHeader({
      currentQuestion: { id: 'q99', text: 'new' },
      remainingTime: 10,
    });
    await waitFor(() => {
      const expected =
        ((LIVE_QUIZ_QUESTION_TIME - 10) / LIVE_QUIZ_QUESTION_TIME) * 100;
      expect(screen.getByTestId('avatar-s1')).toHaveAttribute(
        'data-percentage',
        String(expected),
      );
    });
  });

  test('omits percentage when current question matches last answered question', async () => {
    renderHeader({
      currentQuestion: { id: 'q2', text: 'Q2?' },
      remainingTime: 10,
    });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toHaveAttribute(
        'data-percentage',
        'undefined',
      );
    });
  });

  test('omits percentage when remaining time is undefined', async () => {
    renderHeader({
      currentQuestion: { id: 'q99', text: 'Q99?' },
      remainingTime: 0,
    });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s2')).toHaveAttribute(
        'data-percentage',
        'undefined',
      );
    });
  });

  test('omits percentage when current question is missing', async () => {
    renderHeader({ currentQuestion: undefined });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s2')).toHaveAttribute(
        'data-percentage',
        'undefined',
      );
    });
  });

  test('renders rank circles when question index is greater than zero', async () => {
    const { container } = renderHeader({ currentQuestionIndex: 1 });
    await waitFor(() => {
      expect(
        container.querySelectorAll('.top-performer-circle').length,
      ).toBeGreaterThan(0);
    });
  });

  test('does not render rank circles when question index is zero', async () => {
    const { container } = renderHeader({ currentQuestionIndex: 0 });
    await waitFor(() => {
      expect(container.querySelectorAll('.top-performer-circle')).toHaveLength(
        0,
      );
    });
  });

  test('does not render rank circles when question index is undefined', async () => {
    const { container } = renderHeader({ currentQuestionIndex: undefined });
    await waitFor(() => {
      expect(container.querySelectorAll('.top-performer-circle')).toHaveLength(
        0,
      );
    });
  });

  test('supports participants with empty result arrays', async () => {
    renderHeader({
      roomDoc: {
        ...baseRoomDoc,
        results: { ...baseRoomDoc.results, s3: [] },
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s3')).toHaveAttribute(
        'data-score',
        'undefined',
      );
    });
  });

  test('ignores participants not present in user map payload', async () => {
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      { user_data: [{ id: 's1', name: 'One' }] },
    ]);
    renderHeader();
    await waitFor(() => {
      expect(screen.getByTestId('avatar-s1')).toBeInTheDocument();
      expect(screen.queryByTestId('avatar-s2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('avatar-s3')).not.toBeInTheDocument();
    });
  });

  test('handles empty participants list', async () => {
    const { container } = renderHeader({
      roomDoc: { ...baseRoomDoc, participants: [] },
    });
    await waitFor(() => {
      expect(
        container.querySelectorAll("[data-testid^='avatar-']"),
      ).toHaveLength(0);
    });
  });

  test('recomputes sort order when room results change', async () => {
    const { rerender, container } = renderHeader();
    await waitFor(() => {
      const ids = Array.from(
        container.querySelectorAll("[data-testid^='avatar-']"),
      ).map((n) => n.getAttribute('data-testid'));
      expect(ids[1]).toBe('avatar-s1');
    });
    rerender(
      <LiveQuizHeader
        roomDoc={{
          ...baseRoomDoc,
          results: {
            ...baseRoomDoc.results,
            s3: [
              { question_id: 'q1', score: 50, timeSpent: 3 },
              { question_id: 'q2', score: 50, timeSpent: 3 },
            ],
          },
        }}
        remainingTime={15}
        showAnswer={true}
        currentQuestion={{ id: 'q2', text: 'Q2?' }}
        currentQuestionIndex={2}
      />,
    );
    await waitFor(() => {
      const ids = Array.from(
        container.querySelectorAll("[data-testid^='avatar-']"),
      ).map((n) => n.getAttribute('data-testid'));
      expect(ids[1]).toBe('avatar-s3');
    });
  });
});
