import { buildSchoolStudentsExportSheetRows } from './useSchoolStudentsExport';
import type { DisplayStudent } from './SchoolStudents.types';

describe('buildSchoolStudentsExportSheetRows', () => {
  it('exports only the requested student listing columns', () => {
    const students: DisplayStudent[] = [
      {
        id: 'user-1',
        original: {} as DisplayStudent['original'],
        studentIdDisplay: 'STU-001',
        name: 'Asha Rao',
        schstudents_interact: 'Interact',
        gender: 'female',
        grade: 4,
        classSection: 'A',
        phoneNumber: '9876543210',
        class: 'Grade 4 - A',
        schstudents_performance: 'High Engagement',
        whatsappGroupStatus: 'IN_GROUP',
        schstudents_actions: 'More',
      },
    ];

    expect(buildSchoolStudentsExportSheetRows(students)).toEqual([
      [
        'Student ID',
        'Student Name',
        'Gender',
        'Performance',
        'Class',
        'WhatsApp',
      ],
      [
        'STU-001',
        'Asha Rao',
        'Female',
        'High Engagement',
        'Grade 4 - A',
        'In Group',
      ],
    ]);
  });
});
