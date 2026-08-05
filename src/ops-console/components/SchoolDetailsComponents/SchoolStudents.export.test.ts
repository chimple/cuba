import type { DisplayStudent } from './SchoolStudents.types';
import {
  buildStudentListExportRows,
  compareStudentClasses,
  STUDENT_EXPORT_COLUMNS,
} from './SchoolStudents.export';

const createStudent = (values: Partial<DisplayStudent>): DisplayStudent => ({
  id: values.id ?? values.name ?? 'student-id',
  original: {} as DisplayStudent['original'],
  studentIdDisplay: 'student-id',
  name: values.name ?? 'Student',
  gender: 'N/A',
  grade: values.grade ?? 1,
  classSection: values.classSection ?? 'A',
  phoneNumber: 'N/A',
  class: values.class ?? '1A',
  schstudents_performance: values.schstudents_performance,
  whatsappGroupStatus: values.whatsappGroupStatus,
});

describe('student list export', () => {
  it('exports the required columns in the required order', () => {
    const rows = buildStudentListExportRows([
      createStudent({
        class: '1A',
        name: 'Alice',
        schstudents_performance: 'High Engagement',
        whatsappGroupStatus: 'ON_WHATSAPP',
      }),
    ]);

    expect(Array.from(STUDENT_EXPORT_COLUMNS)).toEqual([
      'Class',
      'Student Name',
      'Performance',
      'WhatsApp',
    ]);
    expect(rows).toEqual([['1A', 'Alice', 'High Engagement', 'On WhatsApp']]);
  });

  it('sorts naturally by class and alphabetically by name within each class', () => {
    const rows = buildStudentListExportRows([
      createStudent({ class: '10A', name: 'Zoe' }),
      createStudent({ class: '1B', name: 'Charlie' }),
      createStudent({ class: '1A', name: 'Bob' }),
      createStudent({ class: '1A', name: 'alice' }),
      createStudent({ class: '2A', name: 'David' }),
    ]);

    expect(rows.map(([className, name]) => [className, name])).toEqual([
      ['1A', 'alice'],
      ['1A', 'Bob'],
      ['1B', 'Charlie'],
      ['2A', 'David'],
      ['10A', 'Zoe'],
    ]);
  });

  it('places classes without a numeric grade after numbered classes', () => {
    expect(compareStudentClasses('2A', '10A')).toBeLessThan(0);
    expect(compareStudentClasses('2A', 'Unknown')).toBeLessThan(0);
  });
});
