import { buildSchoolListExportSheetRows } from './SchoolList.export';
import type { SchoolListSourceRow } from './SchoolList.fetcher';

jest.mock('i18next', () => ({
  t: (value: string) => value,
}));

describe('buildSchoolListExportSheetRows', () => {
  it('builds plain-text export rows without table render metadata', () => {
    const rows = [
      {
        school_name: 'Alpha School',
        school_performance: 'green',
        district: 'Pune',
        udise: '1234567890',
        onboarded_students: 100,
        activated_students: 80,
        active_students: 60,
        avg_time_spent: 45,
        active_teachers: 6,
        activities_assigned: 14,
        avg_assignments_completed: 10,
        avg_activities_completed: 8,
      },
    ] as SchoolListSourceRow[];

    expect(buildSchoolListExportSheetRows(rows)).toEqual([
      [
        'School Name',
        'School Performance',
        'Onboarded Students',
        'Activated Students',
        'Activated Students',
        'Active Students',
        'Active Students',
        'Average Time Spent',
        'Active Teachers',
        'Active Teachers',
        'Activities Assigned',
        'Avg Assignments Completed',
        'Avg Activities Completed',
      ],
      [
        'Alpha School\n1234567890 - Pune',
        'Performing Well',
        '100',
        '80',
        '80%',
        '60',
        '75%',
        '45m',
        '6',
        '100%',
        '14',
        '10',
        '8',
      ],
    ]);
  });

  it('falls back to placeholder text when export metrics are missing', () => {
    const rows = [
      {
        school_name: 'Beta School',
        district: '',
        udise: null,
        school_performance: '',
        onboarded_students: null,
        activated_students: null,
        active_students: null,
        avg_time_spent: null,
        active_teachers: null,
        activities_assigned: null,
        avg_assignments_completed: null,
        avg_activities_completed: null,
      },
    ] as SchoolListSourceRow[];

    expect(buildSchoolListExportSheetRows(rows)[1]).toEqual([
      'Beta School',
      '--',
      '--',
      '--',
      '--',
      '--',
      '--',
      '--',
      '--',
      '--',
      '--',
      '--',
      '--',
    ]);
  });
});
