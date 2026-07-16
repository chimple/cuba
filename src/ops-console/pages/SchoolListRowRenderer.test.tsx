import React from 'react';
import { mapSchoolRowsToRenderRows } from './SchoolListRowRenderer';
import type { SchoolListSourceRow } from './SchoolList.fetcher';

jest.mock('i18next', () => ({
  t: (value: string) => value,
}));

describe('mapSchoolRowsToRenderRows', () => {
  it('maps parents reached into a renderable metric cell', () => {
    const rows: SchoolListSourceRow[] = [
      {
        school_id: 'school-1',
        school_name: 'Alpha School',
        district: 'Pune',
        udise: '1234567890',
        school_performance: 'green',
        num_students: 100,
        num_teachers: 5,
        onboarded_students: 100,
        activated_students: 80,
        active_students: 60,
        avg_time_spent: 45,
        active_teachers: 5,
        activities_assigned: 9,
        parents_reached: 27,
        avg_assignments_completed: 7,
        avg_activities_completed: 6,
        program_managers: [],
        field_coordinators: [],
      },
    ];

    const [mappedRow] = mapSchoolRowsToRenderRows(rows);

    expect(mappedRow.parentsReached.text).toBe('27');
    expect(mappedRow.parentsReached.exportValueText).toBe('27');
  });
});
