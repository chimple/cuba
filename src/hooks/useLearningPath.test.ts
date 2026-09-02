import { act, renderHook } from '@testing-library/react';
import {
  getLastPlayedLesson,
  getNextFromList,
  recommendNextLesson,
  sortCoursesByStudentLanguage,
  useLearningPath,
} from './useLearningPath';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { schoolUtil } from '../utility/schoolUtil';
import { palUtil } from '../utility/palUtil';
import {
  EVENTS,
  LANGUAGE,
  LEARNING_PATHWAY_MODE,
  SOURCE,
  TableTypes,
} from '../common/constants';

jest.mock('../utility/util');
jest.mock('../utility/schoolUtil');
jest.mock('../utility/palUtil', () => ({
  palUtil: {
    getPalLessonPathForCourse: jest.fn(),
  },
}));
jest.mock('../growthbook/Growthbook', () => ({
  updateLocalAttributes: jest.fn(),
  useGbContext: () => ({ setGbUpdated: jest.fn() }),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'uuid-path'),
}));

const mockApi = {
  isStudentLinked: jest.fn(),
  isStudentPlayedPalLesson: jest.fn(),
  getLatestAssessmentGroup: jest.fn(),
  getSubjectLessonsBySubjectId: jest.fn(),
  getChaptersForCourse: jest.fn(),
  getLessonsForChapter: jest.fn(),
  updateLearningPath: jest.fn(),
  getLanguageWithId: jest.fn(),
};

describe('useLearningPath features used by Home tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);
    (schoolUtil.getCurrentClass as jest.Mock).mockReturnValue({
      id: 'class-1',
    });
    (Util.logEvent as jest.Mock).mockResolvedValue(undefined);
    (Util.setCurrentStudent as jest.Mock).mockResolvedValue(undefined);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: null,
    });
    (Util.getLatestLearningPathByUpdatedAt as jest.Mock).mockImplementation(
      (student: any) => student?.learning_path,
    );
    mockApi.isStudentLinked.mockResolvedValue(false);
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(false);
    mockApi.getLatestAssessmentGroup.mockResolvedValue([]);
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue(null);
    mockApi.getChaptersForCourse.mockResolvedValue([]);
    mockApi.getLessonsForChapter.mockResolvedValue([]);
    mockApi.updateLearningPath.mockResolvedValue(undefined);
    mockApi.getLanguageWithId.mockResolvedValue(undefined);
    localStorage.clear();
  });

  test('prefers the student-language math course when old English math is still attached', async () => {
    localStorage.setItem(LANGUAGE, 'hi');

    const sorted = await sortCoursesByStudentLanguage(
      [
        { id: 'english', code: 'en', subject_id: 'english-subject' },
        {
          id: 'math-english',
          code: 'maths',
          subject_id: 'math-subject',
          curriculum_id: 'curriculum-1',
          grade_id: 'grade-1',
        },
        {
          id: 'digital-skills',
          code: 'digital',
          subject_id: 'digital-subject',
        },
        {
          id: 'math-hindi',
          code: 'maths-hi',
          subject_id: 'math-subject',
          curriculum_id: 'curriculum-1',
          grade_id: 'grade-1',
        },
        { id: 'hindi', code: 'hi', subject_id: 'hindi-subject' },
      ] as TableTypes<'course'>[],
      'lang-hi',
    );

    expect(sorted.map((course) => course.id)).toEqual([
      'hindi',
      'english',
      'math-hindi',
      'math-english',
      'digital-skills',
    ]);
  });

  test('pathway rebuild/sync after class-join style course list change preserves current course index', async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 1,
        courseList: [
          {
            path_id: 'p1',
            course_id: 'c1',
            subject_id: 's1',
            type: 'chapter',
            path: [],
            completedPath: 0,
          },
          {
            path_id: 'p2',
            course_id: 'c2',
            subject_id: 's2',
            type: 'chapter',
            path: [],
            completedPath: 1,
          },
        ],
      },
      type: 'chapter',
      pathMode: LEARNING_PATHWAY_MODE.DISABLED,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify(existingPath),
    });

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [
          { id: 'c3', subject_id: 's3' },
          { id: 'c2', subject_id: 's2' },
          { id: 'c1', subject_id: 's1' },
        ],
        mode: LEARNING_PATHWAY_MODE.DISABLED,
      });
    });

    const saved = mockApi.updateLearningPath.mock.calls[0][1];
    const parsed = JSON.parse(saved);
    expect(parsed.courses.courseList.map((c: any) => c.course_id)).toEqual([
      'c3',
      'c2',
      'c1',
    ]);
    expect(parsed.courses.currentCourseIndex).toBe(1);
  });

  test('continues pending assessment after class join in full adaptive mode', async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 0,
        courseList: [
          {
            path_id: 'old-math-path',
            course_id: 'old-math-course',
            subject_id: 'math-subject',
            framework_id: 'framework-1',
            course_code: 'maths',
            type: 'framework',
            path: [
              {
                lesson_id: 'assessment-lesson-1',
                is_assessment: true,
                isPlayed: true,
              },
              {
                lesson_id: 'assessment-lesson-2',
                is_assessment: true,
                isPlayed: false,
              },
            ],
            completedPath: 0,
          },
        ],
      },
      type: 'framework',
      pathMode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify(existingPath),
    });
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(true);
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'asmt-doc-2',
      lesson_id: 'assessment-lesson-2',
    });
    (palUtil.getPalLessonPathForCourse as jest.Mock).mockResolvedValue({
      lesson_id: 'normal-pal-lesson',
      chapter_id: 'pal-chapter',
      skill_id: 'pal-skill',
    });

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [
          {
            id: 'new-math-course',
            subject_id: 'math-subject',
            framework_id: 'framework-1',
            code: 'maths',
          },
        ],
        mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
        classId: 'class-1',
      });
    });

    const saved = mockApi.updateLearningPath.mock.calls[0][1];
    const parsed = JSON.parse(saved);
    expect(parsed.courses.courseList[0].path).toEqual([
      {
        lesson_id: 'assessment-lesson-1',
        is_assessment: true,
        isPlayed: true,
      },
      {
        lesson_id: 'assessment-lesson-2',
        chapter_id: undefined,
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
    ]);
    expect(palUtil.getPalLessonPathForCourse).not.toHaveBeenCalled();
  });

  test('restores lesson index correctly from old pathway structure (migration)', () => {
    const { result } = renderHook(() => useLearningPath());
    const migrated = result.current.migrate({
      path_id: 'path-1',
      course_id: 'c1',
      subject_id: 's1',
      type: 'chapter',
      startIndex: 5,
      currentIndex: 1,
      path: [
        { lesson_id: 'l6', chapter_id: 'ch1', is_assessment: false },
        {
          lesson_id: 'l7',
          chapter_id: 'ch1',
          assignment_id: 'assign-7',
          is_assessment: false,
        },
        { lesson_id: 'l8', chapter_id: 'ch2', is_assessment: true },
      ],
    });

    expect(migrated.completedPath).toBe(1);
    expect(migrated.path).toEqual([
      {
        lesson_id: 'l6',
        chapter_id: 'ch1',
        isPlayed: true,
        is_assessment: false,
      },
      {
        lesson_id: 'l7',
        chapter_id: 'ch1',
        assignment_id: 'assign-7',
        isPlayed: false,
        is_assessment: false,
      },
    ]);
  });

  test('auto-advances to subject assessment in assessment-only mode', async () => {
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'asmt-doc-1',
      lesson_id: 'assessment-lesson-1',
    });

    const next = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1', framework_id: 'framework-1' },
      mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
    });

    expect(next).toEqual({
      lesson_id: 'assessment-lesson-1',
      chapter_id: undefined,
      source: SOURCE.INITIAL_ASSESSMENT,
      is_assessment: true,
      isPlayed: false,
    });
    expect(mockApi.getSubjectLessonsBySubjectId).toHaveBeenCalledWith(
      's1',
      { id: 'stu-1' },
      'c1',
    );
  });

  test('continues assessment sequence in assessment-only mode after prior assessment history', async () => {
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(true);
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'asmt-doc-2',
      lesson_id: 'assessment-lesson-2',
    });

    const next = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1', framework_id: 'framework-1' },
      mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
    });

    expect(next).toMatchObject({
      lesson_id: 'assessment-lesson-2',
      is_assessment: true,
    });
    expect(mockApi.getSubjectLessonsBySubjectId).toHaveBeenCalledWith(
      's1',
      { id: 'stu-1' },
      'c1',
    );
    expect(palUtil.getPalLessonPathForCourse).not.toHaveBeenCalled();
  });

  test('continues assessment sequence in full adaptive mode after first assessment is played', async () => {
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(true);
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'asmt-doc-2',
      lesson_id: 'assessment-lesson-2',
    });
    (palUtil.getPalLessonPathForCourse as jest.Mock).mockResolvedValue({
      lesson_id: 'normal-pal-lesson',
      chapter_id: 'pal-chapter',
      skill_id: 'pal-skill',
    });

    const next = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1', framework_id: 'framework-1' },
      mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
      coursePath: {
        path: [
          {
            lesson_id: 'assessment-lesson-1',
            is_assessment: true,
            isPlayed: true,
          },
        ],
      },
    });

    expect(next).toEqual({
      lesson_id: 'assessment-lesson-2',
      chapter_id: undefined,
      source: SOURCE.INITIAL_ASSESSMENT,
      is_assessment: true,
      isPlayed: false,
    });
    expect(palUtil.getPalLessonPathForCourse).not.toHaveBeenCalled();
  });

  test('skips assessment lookup in full adaptive mode after PAL phase starts', async () => {
    (palUtil.getPalLessonPathForCourse as jest.Mock).mockResolvedValue({
      lesson_id: 'normal-pal-lesson-2',
      chapter_id: 'pal-chapter-2',
      skill_id: 'pal-skill-2',
    });

    const next = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1', framework_id: 'framework-1' },
      mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
      coursePath: {
        path: [
          {
            lesson_id: 'assessment-lesson-1',
            is_assessment: true,
            isPlayed: true,
          },
          {
            lesson_id: 'normal-pal-lesson-1',
            is_assessment: false,
            isPlayed: true,
          },
        ],
      },
    });

    expect(mockApi.getSubjectLessonsBySubjectId).not.toHaveBeenCalled();
    expect(next).toEqual({
      lesson_id: 'normal-pal-lesson-2',
      chapter_id: 'pal-chapter-2',
      skill_id: 'pal-skill-2',
      source: SOURCE.LEARNING_PATHWAY_HOME_PAL,
      is_assessment: false,
      isPlayed: false,
    });
  });

  test('skips assessment recommendation when rebuilding after assessment termination', async () => {
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'asmt-doc-1',
      lesson_id: 'assessment-lesson-1',
    });
    mockApi.getChaptersForCourse.mockResolvedValue([{ id: 'chapter-1' }]);
    mockApi.getLessonsForChapter.mockResolvedValue([{ id: 'normal-lesson-1' }]);

    const next = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1' },
      mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
      skipAssessment: true,
    });

    expect(mockApi.getSubjectLessonsBySubjectId).not.toHaveBeenCalled();
    expect(next).toEqual({
      lesson_id: 'normal-lesson-1',
      chapter_id: 'chapter-1',
      source: SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
      is_assessment: false,
      isPlayed: false,
    });
  });

  test('resumes same teacher-assigned assessment after exit', async () => {
    mockApi.getLatestAssessmentGroup.mockResolvedValue([
      { id: 'assignment-11', lesson_id: 'teacher-asmt-11' },
    ]);

    const first = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1' },
      mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
      classId: 'class-1',
    });
    const second = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1' },
      mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
      classId: 'class-1',
    });

    expect(first?.lesson_id).toBe('teacher-asmt-11');
    expect(first?.assignment_id).toBe('assignment-11');
    expect(second?.lesson_id).toBe('teacher-asmt-11');
    expect(second?.assignment_id).toBe('assignment-11');
  });

  test('puts newly assigned assessment at the beginning of an existing course path', async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 0,
        courseList: [
          {
            path_id: 'old-path',
            course_id: 'c1',
            subject_id: 's1',
            type: 'chapter',
            path: [
              {
                lesson_id: 'normal-lesson-1',
                chapter_id: 'chapter-1',
                is_assessment: false,
                isPlayed: false,
              },
            ],
            completedPath: 2,
          },
        ],
      },
      type: 'chapter',
      pathMode: LEARNING_PATHWAY_MODE.DISABLED,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify(existingPath),
    });
    mockApi.getLatestAssessmentGroup.mockResolvedValue([
      { id: 'assignment-11', lesson_id: 'teacher-asmt-11' },
      { id: 'assignment-12', lesson_id: 'teacher-asmt-12' },
      { id: 'assignment-13', lesson_id: 'teacher-asmt-13' },
      { id: 'assignment-14', lesson_id: 'teacher-asmt-14' },
      { id: 'assignment-15', lesson_id: 'teacher-asmt-15' },
      { id: 'assignment-16', lesson_id: 'teacher-asmt-16' },
    ]);

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [{ id: 'c1', subject_id: 's1', framework_id: null }],
        mode: LEARNING_PATHWAY_MODE.DISABLED,
        classId: 'class-1',
      });
    });

    const saved = mockApi.updateLearningPath.mock.calls[0][1];
    const parsed = JSON.parse(saved);
    const coursePath = parsed.courses.courseList[0];

    expect(parsed.courses.currentCourseIndex).toBe(0);
    expect(coursePath.completedPath).toBe(2);
    expect(coursePath.path).toEqual([
      {
        lesson_id: 'teacher-asmt-11',
        chapter_id: undefined,
        assignment_id: 'assignment-11',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
      {
        lesson_id: 'teacher-asmt-12',
        chapter_id: undefined,
        assignment_id: 'assignment-12',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
      {
        lesson_id: 'teacher-asmt-13',
        chapter_id: undefined,
        assignment_id: 'assignment-13',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
      {
        lesson_id: 'teacher-asmt-14',
        chapter_id: undefined,
        assignment_id: 'assignment-14',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
      {
        lesson_id: 'teacher-asmt-15',
        chapter_id: undefined,
        assignment_id: 'assignment-15',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
    ]);
  });

  test('does not rebuild an in-progress assessment path when matching assessments are assigned', async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 0,
        courseList: [
          {
            path_id: 'assessment-path',
            course_id: 'c1',
            subject_id: 's1',
            type: 'chapter',
            path: [
              {
                lesson_id: 'assessment-lesson-1',
                is_assessment: true,
                isPlayed: true,
              },
              {
                lesson_id: 'assessment-lesson-2',
                is_assessment: true,
                isPlayed: false,
              },
              {
                lesson_id: 'assessment-lesson-3',
                is_assessment: true,
                isPlayed: false,
              },
            ],
            completedPath: 0,
          },
        ],
      },
      type: 'chapter',
      pathMode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify(existingPath),
    });
    mockApi.getLatestAssessmentGroup.mockResolvedValue([
      { id: 'assignment-1', lesson_id: 'assessment-lesson-1' },
      { id: 'assignment-2', lesson_id: 'assessment-lesson-2' },
      { id: 'assignment-3', lesson_id: 'assessment-lesson-3' },
    ]);

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [{ id: 'c1', subject_id: 's1', framework_id: null }],
        mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
        classId: 'class-1',
      });
    });

    const saved = mockApi.updateLearningPath.mock.calls[0][1];
    const parsed = JSON.parse(saved) as {
      courses: {
        courseList: Array<{
          path_id: string;
          path: Array<{
            lesson_id: string;
            assignment_id?: string;
            isPlayed: boolean;
          }>;
        }>;
      };
    };
    const coursePath = parsed.courses.courseList[0];

    expect(coursePath.path_id).toBe('assessment-path');
    expect(coursePath.path).toEqual([
      {
        lesson_id: 'assessment-lesson-1',
        assignment_id: 'assignment-1',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: true,
      },
      {
        lesson_id: 'assessment-lesson-2',
        assignment_id: 'assignment-2',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
      {
        lesson_id: 'assessment-lesson-3',
        assignment_id: 'assignment-3',
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
    ]);
  });

  test('does not reset an already assigned assessment path when a new batch arrives mid-assessment', async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 0,
        courseList: [
          {
            path_id: 'assigned-assessment-path',
            course_id: 'math-course',
            subject_id: 'math-subject',
            type: 'chapter',
            path: [
              {
                lesson_id: 'math-assessment-1',
                assignment_id: 'old-assignment-1',
                is_assessment: true,
                isPlayed: true,
              },
              {
                lesson_id: 'math-assessment-2',
                assignment_id: 'old-assignment-2',
                is_assessment: true,
                isPlayed: false,
              },
            ],
            completedPath: 0,
          },
        ],
      },
      type: 'chapter',
      pathMode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify(existingPath),
    });
    mockApi.getLatestAssessmentGroup.mockResolvedValue([
      { id: 'new-assignment-1', lesson_id: 'new-math-assessment-1' },
      { id: 'new-assignment-2', lesson_id: 'new-math-assessment-2' },
    ]);

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [
          {
            id: 'math-course',
            subject_id: 'math-subject',
            framework_id: null,
          },
        ],
        mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
        classId: 'class-1',
      });
    });

    expect(mockApi.updateLearningPath).not.toHaveBeenCalled();
  });

  test('initializes a newly added same-framework assessment course with synced active index', async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 0,
        courseList: [
          {
            path_id: 'grade-1-path',
            course_id: 'grade-1-course',
            subject_id: 'math-subject',
            framework_id: 'framework-1',
            type: 'chapter',
            path: [
              {
                lesson_id: 'grade-1-assessment-1',
                is_assessment: true,
                isPlayed: true,
              },
              {
                lesson_id: 'grade-1-assessment-2',
                is_assessment: true,
                isPlayed: true,
              },
              {
                lesson_id: 'grade-1-assessment-3',
                is_assessment: true,
                isPlayed: false,
              },
            ],
            completedPath: 0,
          },
        ],
      },
      type: 'chapter',
      pathMode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify(existingPath),
    });
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'grade-2-assessment-doc-3',
      lesson_id: 'grade-2-assessment-3',
    });

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [
          {
            id: 'grade-1-course',
            subject_id: 'math-subject',
            framework_id: 'framework-1',
          },
          {
            id: 'grade-2-course',
            subject_id: 'math-subject',
            framework_id: 'framework-1',
          },
        ],
        mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
      });
    });

    const saved = mockApi.updateLearningPath.mock.calls[0][1];
    const parsed = JSON.parse(saved) as {
      courses: {
        courseList: Array<{
          course_id: string;
          framework_id?: string | null;
          path: Array<{
            lesson_id: string;
            is_assessment: boolean;
            isPlayed: boolean;
          }>;
        }>;
      };
    };
    const gradeTwoPath = parsed.courses.courseList.find(
      (course) => course.course_id === 'grade-2-course',
    );

    expect(gradeTwoPath?.framework_id).toBe('framework-1');
    expect(gradeTwoPath?.path).toEqual([
      {
        lesson_id: 'grade-1-assessment-1',
        is_assessment: true,
        isPlayed: true,
      },
      {
        lesson_id: 'grade-1-assessment-2',
        is_assessment: true,
        isPlayed: true,
      },
      {
        lesson_id: 'grade-2-assessment-3',
        chapter_id: undefined,
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
    ]);
  });

  test('preserves played assessment nodes when syncing an assessment-only course without a pending node', async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 0,
        courseList: [
          {
            path_id: 'pre-class-math-path',
            course_id: 'pre-class-math-course',
            subject_id: 'math-subject',
            framework_id: null,
            course_code: 'maths',
            type: 'chapter',
            path: [
              {
                lesson_id: 'math-assessment-1',
                is_assessment: true,
                isPlayed: true,
              },
            ],
            completedPath: 0,
          },
        ],
      },
      type: 'chapter',
      pathMode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify(existingPath),
    });
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'math-assessment-doc-2',
      lesson_id: 'math-assessment-2',
    });

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [
          {
            id: 'pre-class-math-course',
            subject_id: 'math-subject',
            framework_id: null,
            code: 'maths',
          },
          {
            id: 'class-math-course',
            subject_id: 'math-subject',
            framework_id: null,
            code: 'maths',
          },
        ],
        mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
        classId: 'class-1',
      });
    });

    const saved = mockApi.updateLearningPath.mock.calls[0][1];
    const parsed = JSON.parse(saved) as {
      courses: {
        courseList: Array<{
          course_id: string;
          path: Array<{
            lesson_id: string;
            is_assessment: boolean;
            isPlayed: boolean;
          }>;
        }>;
      };
    };
    const classMathPath = parsed.courses.courseList.find(
      (course) => course.course_id === 'class-math-course',
    );

    expect(classMathPath?.path).toEqual([
      {
        lesson_id: 'math-assessment-1',
        is_assessment: true,
        isPlayed: true,
      },
      {
        lesson_id: 'math-assessment-2',
        chapter_id: undefined,
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      },
    ]);
  });

  test('marks only PAL recommended lessons with PAL source', async () => {
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(true);
    (palUtil.getPalLessonPathForCourse as jest.Mock).mockResolvedValue({
      lesson_id: 'pal-lesson-1',
      chapter_id: 'chapter-1',
      skill_id: 'skill-1',
    });

    const next = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1' },
      mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
    });

    expect(palUtil.getPalLessonPathForCourse).toHaveBeenCalledWith(
      'c1',
      'stu-1',
    );
    expect(next).toEqual({
      lesson_id: 'pal-lesson-1',
      chapter_id: 'chapter-1',
      skill_id: 'skill-1',
      source: SOURCE.LEARNING_PATHWAY_HOME_PAL,
      is_assessment: false,
      isPlayed: false,
    });
  });

  test('course progression helper returns next assessment node after last played assessment', () => {
    const next = getNextFromList(
      [{ lesson_id: 'a1' }, { lesson_id: 'a2' }],
      { lesson_id: 'a1', is_assessment: true, isPlayed: true },
      true,
    );
    expect(next).toEqual({
      lesson_id: 'a2',
      chapter_id: undefined,
      source: SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
      is_assessment: true,
      isPlayed: false,
    });
  });

  test('resume helper returns most recent played assessment node', () => {
    const last = getLastPlayedLesson(
      {
        path: [
          { lesson_id: 'n1', is_assessment: false, isPlayed: true },
          { lesson_id: 'a1', is_assessment: true, isPlayed: true },
          { lesson_id: 'a2', is_assessment: true, isPlayed: false },
        ],
      },
      'assessment',
    );
    expect(last).toEqual({
      lesson_id: 'a1',
      is_assessment: true,
      isPlayed: true,
    });
  });

  test('getPath logs assessment-active pathway when assessment is first playable node', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: null,
      language_id: 'en',
    });
    mockApi.isStudentLinked.mockResolvedValue(false);
    mockApi.getLatestAssessmentGroup.mockResolvedValue([]);
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(false);

    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: 'assessment-doc',
      lesson_id: 'assessment-lesson-77',
    });

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [
          {
            id: 'c1',
            subject_id: 's1',
            framework_id: 'framework-1',
          },
        ],
        mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
      });
    });

    expect(Util.logEvent).toHaveBeenCalledTimes(1);

    const [eventName, payload] = (Util.logEvent as jest.Mock).mock.calls[0];

    expect(eventName).toBe(EVENTS.PATHWAY_CREATED);
    expect(payload).toMatchObject({
      user_id: 'stu-1',
      current_course_id: 'c1',
      current_lesson_id: 'assessment-lesson-77',
      is_assessment_active: true,
    });
  });
  test('wraps to first chapter first lesson when last chapter last lesson is completed', async () => {
    mockApi.getChaptersForCourse.mockResolvedValue([
      { id: 'ch1' },
      { id: 'ch2' },
    ]);

    mockApi.getLessonsForChapter.mockImplementation((chapterId: string) => {
      if (chapterId === 'ch1') {
        return Promise.resolve([{ id: 'l1' }, { id: 'l2' }]);
      }
      if (chapterId === 'ch2') {
        return Promise.resolve([{ id: 'l3' }, { id: 'l4' }]);
      }
      return Promise.resolve([]);
    });

    const next = await recommendNextLesson({
      student: { id: 'stu-1' },
      course: { id: 'c1', subject_id: 's1' },
      mode: LEARNING_PATHWAY_MODE.DISABLED,
      coursePath: {
        path: [
          {
            lesson_id: 'l4',
            chapter_id: 'ch2',
            is_assessment: false,
            isPlayed: true,
          },
        ],
      },
    });

    expect(next).toEqual({
      lesson_id: 'l1',
      chapter_id: 'ch1',
      source: SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
      is_assessment: false,
      isPlayed: false,
    });
  });
});
