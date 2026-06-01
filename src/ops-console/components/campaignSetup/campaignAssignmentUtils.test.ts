import { buildRows, GradeAssignmentConfig } from './campaignAssignmentUtils';
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
): GradeAssignmentConfig => ({
  subjectIds: ['math-course'],
  frequency,
  chapterIds: ['numbers-chapter'],
  expandedChapterIds: [],
  removedRowIds: [],
});

const createForm = (): CampaignSetupFormState =>
  ({
    startDate: '2026-06-01',
    endDate: '2026-06-07',
  }) as CampaignSetupFormState;

describe('campaignAssignmentUtils buildRows', () => {
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
});
