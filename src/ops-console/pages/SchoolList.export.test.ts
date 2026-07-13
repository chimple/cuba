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
        total_teachers: 8,
        activities_assigned: 14,
        parents_reached: 42,
        avg_assignments_completed: 10,
        avg_activities_completed: 8,
        phone_calls_students_parents: 5,
        inperson_students_parents: 4,
        phone_calls_teachers_hms: 3,
        community_visits: 2,
        school_visits: 7,
        parents_on_whatsapp: 40,
        parents_in_whatsapp_group: 32,
      },
    ] as SchoolListSourceRow[];

    expect(buildSchoolListExportSheetRows(rows)).toEqual([
      [
        'School Name',
        'UDISE',
        'Block',
        'School Performance',
        'Onboarded Students',
        'Activated Students',
        'Activated Students',
        'Active Students',
        'Active Students',
        'Avg Time Spent',
        'Active Teachers',
        'Active Teachers',
        'Activities Assigned',
        'Avg Assignments Completed',
        'Avg Activities Completed',
        'Phone Calls - Students / Parents',
        'Phone Calls - Teachers & HMs',
        'Community Visits',
        'Parents Reached',
        'School Visits',
        'In-Person - Students / Parents',
        'On WhatsApp',
        'In Group',
      ],
      [
        'Alpha School',
        '1234567890',
        '--',
        'High Performing',
        '100',
        '80',
        '80%',
        '60',
        '75%',
        '45m',
        '6',
        '75%',
        '14',
        '10',
        '8',
        '5',
        '3',
        '2',
        '42',
        '7',
        '4',
        '40',
        '32',
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
        parents_reached: null,
        avg_assignments_completed: null,
        avg_activities_completed: null,
        phone_calls_students_parents: null,
        inperson_students_parents: null,
        phone_calls_teachers_hms: null,
        community_visits: null,
        school_visits: null,
        parents_on_whatsapp: null,
        parents_in_whatsapp_group: null,
      },
    ] as SchoolListSourceRow[];

    const exportRows = buildSchoolListExportSheetRows(rows);

    expect(exportRows[1]).toHaveLength(exportRows[0].length);
    expect(exportRows[1]).toEqual([
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
