import {
  formatStudentContactList,
  formatStudentPhoneList,
  getStudentContactValues,
  getStudentEmailAddresses,
  getStudentPhoneNumbers,
  getStudentPrimaryContact,
} from './studentContactNumbers';

describe('studentContactNumbers', () => {
  it('returns all unique parent and student phone numbers in display order', () => {
    expect(
      getStudentPhoneNumbers({
        user: { phone: '09176543210' },
        parent: { phone: '9876543210' },
        parents: [
          { phone: '9876543210' },
          { phone: '+91 87654 32109' },
          { phone: '' },
        ],
      }),
    ).toEqual(['9876543210', '+91 87654 32109', '09176543210']);
  });

  it('formats phone lists and falls back to email when no phone exists', () => {
    const student = {
      user: { email: 'student@example.com' },
      parent: { email: 'parent@example.com' },
      parents: [{ email: 'guardian@example.com' }],
    };

    expect(formatStudentPhoneList(student)).toBe('N/A');
    expect(getStudentPrimaryContact(student)).toBe('guardian@example.com');
  });

  it('keeps phone and email contacts from multiple parents', () => {
    const student = {
      user: { email: 'student@example.com' },
      parents: [
        { phone: '9876543210', email: 'parent@example.com' },
        { email: 'guardian@example.com' },
      ],
    };

    expect(getStudentEmailAddresses(student)).toEqual([
      'parent@example.com',
      'guardian@example.com',
      'student@example.com',
    ]);
    expect(getStudentContactValues(student)).toEqual([
      '9876543210',
      'parent@example.com',
      'guardian@example.com',
      'student@example.com',
    ]);
    expect(formatStudentContactList(student)).toBe(
      '9876543210 / parent@example.com / guardian@example.com / student@example.com',
    );
  });
});
