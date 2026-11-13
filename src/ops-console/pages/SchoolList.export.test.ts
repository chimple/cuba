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
        field_coordinators: ['Field Coordinator 1'],
        onboarded_students: 100,
        activated_students: 80,
        active_students: 60,
        avg_time_spent: 45,
        active_teachers: 6,
        activated_teachers: 6,
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
        'Field Coordinator',
        'Block',
        'School Performance',
        'Onboarded Students',
        'Activated Students #',
        'Activated Students %',
        'Active Students #',
        'Active Students %',
        'Avg Time Spent',
        'Active Teachers #',
        'Active Teachers %',
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
        'Total Onboarded Teachers',
        'Activated Teachers',
      ],
      [
        'Alpha School',
        '1234567890',
        'Field Coordinator 1',
        '--',
        'High Performing',
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
        '5',
        '3',
        '2',
        '42',
        '7',
        '4',
        '40',
        '32',
        '8',
        '6',
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
        activated_teachers: null,
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
      '--',
      '0',
      '0',
    ]);
  });

  it('exports NULL for missing grades and stored metrics for matching grades', () => {
    const grades = [
      { id: 'grade-1', name: 'Grade 1' },
      { id: 'grade-2', name: 'Grade 2' },
    ];
    const exportRows = buildSchoolListExportSheetRows([
      {
        school_id: 'school-1',
        school_name: 'Alpha School',
        school_grade_columns: grades.slice(0, 1),
        school_metrics_export_rows: [
          {
            grade_id: null,
            total_teachers: 8,
            activated_teachers: 6,
            onboarded_students: null,
            parents_on_whatsapp: null,
            parents_in_group: null,
          },
          {
            grade_id: 'grade-1',
            total_teachers: null,
            activated_teachers: null,
            onboarded_students: 10,
            parents_on_whatsapp: 5,
            parents_in_group: 2,
          },
          {
            grade_id: 'grade-2',
            total_teachers: null,
            activated_teachers: null,
            onboarded_students: 4,
            parents_on_whatsapp: 6,
            parents_in_group: 3,
          },
        ],
      },
      {
        school_id: 'school-2',
        school_name: 'Beta School',
        school_grade_columns: grades,
        school_metrics_export_rows: [
          {
            grade_id: null,
            total_teachers: 2,
            activated_teachers: 1,
            onboarded_students: null,
            parents_on_whatsapp: null,
            parents_in_group: null,
          },
          {
            grade_id: 'grade-1',
            total_teachers: null,
            activated_teachers: null,
            onboarded_students: 7,
            parents_on_whatsapp: 3,
            parents_in_group: 2,
          },
        ],
      },
    ] as SchoolListSourceRow[]);

    expect(exportRows[0].slice(-8)).toEqual([
      'Onboarded Students - Grade 1',
      'Onboarded Students - Grade 2',
      'Total Onboarded Teachers',
      'Activated Teachers',
      'Parents on WhatsApp - Grade 1',
      'Parents on WhatsApp - Grade 2',
      'Parents on Group - Grade 1',
      'Parents on Group - Grade 2',
    ]);
    expect(exportRows[1].slice(-8)).toEqual([
      '10',
      '4',
      '8',
      '6',
      '5',
      '6',
      '2',
      '3',
    ]);
    expect(exportRows[2].slice(-8)).toEqual([
      '7',
      'NULL',
      '2',
      '1',
      '3',
      'NULL',
      '2',
      'NULL',
    ]);
  });
});
