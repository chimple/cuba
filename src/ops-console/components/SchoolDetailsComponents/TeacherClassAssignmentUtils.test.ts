import {
  getTeacherClassAssignmentDiff,
  normalizeClassIds,
  parseClassIdsFromCsv,
  toClassIdsCsv,
} from './TeacherClassAssignmentUtils';

describe('TeacherClassAssignmentUtils', () => {
  describe('normalizeClassIds', () => {
    it('trims, de-duplicates and sorts class ids', () => {
      expect(
        normalizeClassIds([' class-b ', 'class-a', 'class-b', '']),
      ).toEqual(['class-a', 'class-b']);
    });
  });

  describe('parseClassIdsFromCsv', () => {
    it('parses csv into normalized class ids', () => {
      expect(
        parseClassIdsFromCsv(' class-c, class-a, class-c ,, class-b '),
      ).toEqual(['class-a', 'class-b', 'class-c']);
    });
  });

  describe('toClassIdsCsv', () => {
    it('converts class ids into normalized csv value', () => {
      expect(toClassIdsCsv(['class-b', ' class-a ', 'class-b'])).toBe(
        'class-a,class-b',
      );
    });
  });

  describe('getTeacherClassAssignmentDiff', () => {
    it('returns add/remove diff for changed class assignments', () => {
      expect(
        getTeacherClassAssignmentDiff(
          ['class-a', 'class-b'],
          ['class-b', 'class-c'],
        ),
      ).toEqual({
        classIdsToAdd: ['class-c'],
        classIdsToRemove: ['class-a'],
        hasChanges: true,
      });
    });

    it('returns empty diff when class assignments are unchanged', () => {
      expect(
        getTeacherClassAssignmentDiff(
          ['class-a', 'class-b'],
          [' class-b ', 'class-a', 'class-b'],
        ),
      ).toEqual({
        classIdsToAdd: [],
        classIdsToRemove: [],
        hasChanges: false,
      });
    });
  });
});
