import {
  getExactClassName,
  getClassDisplayLabel,
  parseGradeSection,
  toCommaString,
} from './ClassDetailsPageUtils';

describe('ClassDetailsPageUtils', () => {
  describe('toCommaString', () => {
    it('returns empty string for nullish values', () => {
      expect(toCommaString(undefined)).toBe('');
      expect(toCommaString(null)).toBe('');
    });

    it('joins array values and removes falsy entries', () => {
      expect(toCommaString(['Math', '', 'Science'])).toBe('Math, Science');
    });

    it('trims string inputs', () => {
      expect(toCommaString('  English  ')).toBe('English');
    });
  });

  describe('parseGradeSection', () => {
    it('parses numeric class names with section suffix', () => {
      expect(parseGradeSection('5A')).toEqual({
        grade: 5,
        section: 'A',
      });
    });

    it('parses numeric class names with dash separators', () => {
      expect(parseGradeSection('10 - B')).toEqual({
        grade: 10,
        section: 'B',
      });
    });

    it('maps LKG and UKG class names to grade 0', () => {
      expect(parseGradeSection('lkg')).toEqual({
        grade: 0,
        section: 'LKG',
      });
      expect(parseGradeSection('UKG C')).toEqual({
        grade: 0,
        section: 'UKG C',
      });
    });

    it('keeps KG label from class name when fallback section is plain', () => {
      expect(parseGradeSection('ukg c', undefined, 'C')).toEqual({
        grade: 0,
        section: 'UKG C',
      });
    });

    it('uses KG-labeled fallback section when provided', () => {
      expect(parseGradeSection('ukg c', undefined, 'UKG C')).toEqual({
        grade: 0,
        section: 'UKG C',
      });
    });

    it('returns fallback values for unsupported names', () => {
      expect(parseGradeSection('Senior A', 3, 'A')).toEqual({
        grade: 3,
        section: 'A',
      });
    });

    it.each(['class 1', 'Class 1', 'CLASS 1', '1'])(
      'maps "%s" to grade 1 with no section',
      (className) => {
        expect(parseGradeSection(className)).toEqual({
          grade: 1,
          section: undefined,
        });
      },
    );

    it('ignores fallback section for plain numeric class names', () => {
      expect(parseGradeSection('1', 1, 'A')).toEqual({
        grade: 1,
        section: undefined,
      });
    });

    it.each([
      'class 1 a',
      'class 1 A',
      'Class 1 a',
      'Class 1 A',
      'CLASS 1 a',
      'CLASS 1 A',
      'class 1a',
      'class 1A',
      'Class 1a',
      'Class 1A',
      'CLASS 1a',
      'CLASS 1A',
      '1 A',
      '1 a',
      '1A',
      '1a',
    ])('maps "%s" to grade 1 with section A', (className) => {
      expect(parseGradeSection(className)).toEqual({
        grade: 1,
        section: 'A',
      });
    });
  });

  describe('getClassDisplayLabel', () => {
    it('renders numeric classes with section as-is', () => {
      expect(getClassDisplayLabel(5, 'A')).toBe('5A');
    });

    it('renders KG labels without 0 prefix', () => {
      expect(getClassDisplayLabel(0, 'lkg')).toBe('LKG');
      expect(getClassDisplayLabel(0, 'Ukg A')).toBe('UKG A');
    });

    it('prefers class name when provided', () => {
      expect(getClassDisplayLabel(0, 'A', 'ukg b')).toBe('ukg b');
      expect(getClassDisplayLabel(5, 'a', 'Class 1 a')).toBe('Class 1 a');
    });

    it('trims exact class name before displaying', () => {
      expect(getClassDisplayLabel(3, '', '  Class 3  ')).toBe('Class 3');
    });
  });

  describe('getExactClassName', () => {
    it('reads class_name when present', () => {
      expect(getExactClassName({ class_name: ' Class 1 A ' })).toBe(
        'Class 1 A',
      );
    });

    it('falls back to name when class_name is missing', () => {
      expect(getExactClassName({ name: ' UKG A ' })).toBe('UKG A');
    });

    it('returns empty when no name fields exist', () => {
      expect(getExactClassName({})).toBe('');
    });
  });
});
