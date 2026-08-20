import {
  filterHiddenTeacherLessons,
  isHiddenTeacherLesson,
} from './lessonFilters';

describe('teacher lesson filters', () => {
  it('hides lessons with live_quiz_math playable IDs', () => {
    expect(
      isHiddenTeacherLesson({
        id: 'lesson-doc-id',
        cocos_lesson_id: 'live_quiz_math_g1',
      }),
    ).toBe(true);
  });

  it('hides only exact mz_fc1_0000 lessons', () => {
    expect(
      isHiddenTeacherLesson({
        id: 'lesson-doc-id',
        cocos_lesson_id: 'mz_fc1_0000',
      }),
    ).toBe(true);

    expect(
      isHiddenTeacherLesson({
        id: 'lesson-doc-id',
        cocos_lesson_id: 'mz_fc1_0000_extra',
      }),
    ).toBe(false);
  });

  it('keeps non-math live quiz lessons', () => {
    expect(
      isHiddenTeacherLesson({
        id: 'live_quiz_hi_g1',
        cocos_lesson_id: 'live_quiz_hi_g1',
      }),
    ).toBe(false);
  });

  it('filters hidden lessons from a list', () => {
    expect(
      filterHiddenTeacherLessons([
        { id: 'lesson-1' },
        { id: 'live_quiz_math_g3' },
        { id: 'lesson-2', cocos_lesson_id: 'live_quiz_math_g2' },
        { id: 'lesson-3', cocos_lesson_id: 'mz_fc1_0000' },
      ]),
    ).toEqual([{ id: 'lesson-1' }]);
  });
});
