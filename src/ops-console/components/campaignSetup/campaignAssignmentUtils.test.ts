import {
  buildAssignmentDrafts,
  buildRows,
  GradeAssignmentConfig,
  isAlternateWeekEnabled,
} from './campaignAssignmentUtils';
import { CampaignAssignmentSubjectOption } from '../../../services/api/ServiceApi';
import { CampaignSetupFormState } from './types';

const createLessons = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `lesson-${index + 1}`,
    name: `Lesson ${index + 1}`,
  }));

const createSubjects = (lessonCount: number) =>
  [
    {
      id: 'math-course',
      name: 'Math',
      gradeId: 'grade-1',
      chapters: [
        {
          id: 'numbers-chapter',
          name: 'Numbers',
          lessons: createLessons(lessonCount),
        },
      ],
    },
  ] as CampaignAssignmentSubjectOption[];

const createConfig = (
  frequency: GradeAssignmentConfig['frequency'],
  removedRowIds: string[] = [],
): GradeAssignmentConfig => ({
  subjectIds: ['math-course'],
  frequency,
  chapterIds: ['numbers-chapter'],
  expandedChapterIds: [],
  removedRowIds,
});

const createForm = (
  startDate = '2026-06-01',
  endDate = '2026-06-07',
): CampaignSetupFormState =>
  ({
    startDate,
    endDate,
  }) as CampaignSetupFormState;

describe('campaignAssignmentUtils buildRows', () => {
  it('enables alternate week when the selected date range is 14 days or more', () => {
    expect(isAlternateWeekEnabled('2026-06-01', '2026-06-14')).toBe(true);
    expect(isAlternateWeekEnabled('2026-06-01', '2026-06-15')).toBe(true);
  });

  it('distributes daily assignments evenly across non-Sunday campaign days', () => {
    const rows = buildRows(
      'grade-1',
      createSubjects(28),
      createConfig('daily'),
      createForm(),
    );

    expect(rows.map((row) => row.lessonName)).toEqual(
      Array.from({ length: 28 }, (_, index) => `Lesson ${index + 1}`),
    );
    expect(rows.map((row) => row.date)).toEqual([
      ...Array(5).fill('2026-06-01'),
      ...Array(5).fill('2026-06-02'),
      ...Array(5).fill('2026-06-03'),
      ...Array(5).fill('2026-06-04'),
      ...Array(4).fill('2026-06-05'),
      ...Array(4).fill('2026-06-06'),
    ]);
  });

  it('distributes alternate-day assignments evenly across eligible non-Sunday dates', () => {
    const rows = buildRows(
      'grade-1',
      createSubjects(28),
      createConfig('alternate_days'),
      createForm(),
    );

    expect(rows.map((row) => row.date)).toEqual([
      ...Array(10).fill('2026-06-01'),
      ...Array(9).fill('2026-06-03'),
      ...Array(9).fill('2026-06-05'),
    ]);
  });

  it('distributes alternate-week assignments using a 14-day interval', () => {
    const rows = buildRows(
      'grade-1',
      createSubjects(28),
      createConfig('alternate_week'),
      createForm('2026-06-01', '2026-06-30'),
    );

    expect(rows.map((row) => row.date)).toEqual([
      ...Array(10).fill('2026-06-01'),
      ...Array(9).fill('2026-06-15'),
      ...Array(9).fill('2026-06-29'),
    ]);
  });

  it('redistributes dates after removed lessons are filtered out', () => {
    const rows = buildRows(
      'grade-1',
      createSubjects(28),
      createConfig('daily', ['numbers-chapter:lesson-1']),
      createForm(),
    );

    expect(rows).toHaveLength(27);
    expect(rows[0].lessonName).toBe('Lesson 2');
    expect(rows.map((row) => row.date)).toEqual([
      ...Array(5).fill('2026-06-01'),
      ...Array(5).fill('2026-06-02'),
      ...Array(5).fill('2026-06-03'),
      ...Array(4).fill('2026-06-04'),
      ...Array(4).fill('2026-06-05'),
      ...Array(4).fill('2026-06-06'),
    ]);
  });

  it('does not create assignment drafts for rows without schedule dates', () => {
    const rows = buildRows(
      'grade-1',
      createSubjects(2),
      createConfig('daily'),
      createForm('2026-06-07', '2026-06-07'),
    );

    expect(rows.map((row) => row.date)).toEqual(['', '']);
    expect(
      buildAssignmentDrafts(new Map([['grade-1', rows]]), ['school-1'], 'c-1'),
    ).toEqual([]);
  });
});
