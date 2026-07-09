import {
  ensurePlayableLearningPath,
  sanitizeLearningPathCourse,
} from './usePathwaySVG';
import { CoursePath, LearningPath, LessonNode } from './useLearningPath';
import { RECOMMENDATION_TYPE } from '../common/constants';

const buildCourse = (overrides?: Partial<CoursePath>): CoursePath => ({
  path_id: 'path-1',
  course_id: 'course-1',
  subject_id: 'subject-1',
  framework_id: null,
  course_code: 'kannada',
  display_name: 'Kannada',
  type: RECOMMENDATION_TYPE.CHAPTER,
  completedPath: 0,
  path: [],
  ...overrides,
});

const buildLearningPath = (
  courseList: CoursePath[],
  currentCourseIndex = 0,
): LearningPath => ({
  courses: {
    courseList,
    currentCourseIndex,
  },
  type: RECOMMENDATION_TYPE.CHAPTER,
  pathMode: 'disabled',
  updated_at: '2025-01-01T00:00:00.000Z',
});

describe('usePathwaySVG stale lesson cleanup', () => {
  test('rebuilds a course after removing stale active lessons', async () => {
    const staleLessonNode: LessonNode = {
      lesson_id: 'deleted-lesson',
      chapter_id: 'chapter-1',
      is_assessment: false,
      isPlayed: false,
    };
    const replacementLesson: LessonNode = {
      lesson_id: 'replacement-lesson',
      chapter_id: 'chapter-2',
      is_assessment: false,
      isPlayed: false,
    };

    const result = await sanitizeLearningPathCourse({
      course: buildCourse({ path: [staleLessonNode] }),
      getCachedLesson: jest.fn().mockResolvedValue(null),
      resolveNextLesson: jest.fn().mockResolvedValue(replacementLesson),
    });

    expect(result.updated).toBe(true);
    expect(result.course.path).toEqual([replacementLesson]);
  });

  test('moves to the next playable course when the selected course becomes empty', async () => {
    const learningPath = buildLearningPath(
      [
        buildCourse({
          course_id: 'course-stale',
          path: [
            {
              lesson_id: 'deleted-lesson',
              chapter_id: 'chapter-1',
              is_assessment: false,
              isPlayed: false,
            },
          ],
        }),
        buildCourse({
          path_id: 'path-2',
          course_id: 'course-valid',
          path: [
            {
              lesson_id: 'valid-lesson',
              chapter_id: 'chapter-2',
              is_assessment: false,
              isPlayed: false,
            },
          ],
        }),
      ],
      0,
    );

    const result = await ensurePlayableLearningPath({
      learningPath,
      getCachedLesson: jest
        .fn()
        .mockImplementation(async (lessonId: string) =>
          lessonId === 'valid-lesson' ? { id: lessonId } : null,
        ),
      resolveNextLesson: jest.fn().mockResolvedValue(null),
    });

    expect(result.updated).toBe(true);
    expect(result.learningPath.courses.currentCourseIndex).toBe(1);
    expect(result.currentCourse?.course_id).toBe('course-valid');
    expect(result.learningPath.courses.courseList[0].path).toEqual([]);
  });

  test('keeps reward snapshots from appending a replacement lesson', async () => {
    const playedLesson: LessonNode = {
      lesson_id: 'played-lesson',
      chapter_id: 'chapter-1',
      is_assessment: false,
      isPlayed: true,
    };
    const replacementLesson: LessonNode = {
      lesson_id: 'replacement-lesson',
      chapter_id: 'chapter-2',
      is_assessment: false,
      isPlayed: false,
    };

    const result = await ensurePlayableLearningPath({
      learningPath: buildLearningPath([buildCourse({ path: [playedLesson] })]),
      getCachedLesson: jest
        .fn()
        .mockResolvedValue({ id: playedLesson.lesson_id }),
      resolveNextLesson: jest.fn().mockResolvedValue(replacementLesson),
      options: {
        allowCourseSwitch: false,
        allowReplacementLesson: false,
      },
    });

    expect(result.updated).toBe(false);
    expect(result.currentCourse?.path).toEqual([playedLesson]);
  });
});
