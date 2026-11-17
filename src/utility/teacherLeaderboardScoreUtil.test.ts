import { calculateTeacherLeaderboardScoreHistory } from './teacherLeaderboardScoreUtil';

describe('calculateTeacherLeaderboardScoreHistory', () => {
  it('matches the edge function by averaging class scores for the latest visible day', () => {
    const history = calculateTeacherLeaderboardScoreHistory({
      assignments: [{ created_at: '2026-11-13T10:56:45.000Z' }],
      classIds: ['class-with-activity', 'class-without-activity'],
      students: [
        { class_id: 'class-with-activity', user_id: 'active-student' },
        { class_id: 'class-without-activity', user_id: 'inactive-student' },
      ],
      results: [
        {
          class_id: 'class-with-activity',
          student_id: 'active-student',
          time_spent: 3600,
          created_at: '2026-11-13T11:00:00.000Z',
        },
      ],
      today: new Date('2026-11-17T06:00:00.000Z'),
    });

    // The edge function's 16 Nov score window is 10–17 Nov IST. One class
    // scores 60, one scores 0, so the teacher score is their average: 30.
    expect(history[history.length - 1]).toEqual({
      date: '2026-11-17',
      score: 30,
    });
  });
});
