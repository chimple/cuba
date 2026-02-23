import { act, renderHook } from "@testing-library/react";
import {
  getLastPlayedLesson,
  getNextFromList,
  recommendNextLesson,
  useLearningPath,
} from "./useLearningPath";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";
import { EVENTS, LEARNING_PATHWAY_MODE } from "../common/constants";

jest.mock("../utility/util");
jest.mock("../utility/schoolUtil");
jest.mock("../utility/palUtil", () => ({
  palUtil: {
    getPalLessonPathForCourse: jest.fn(),
  },
}));
jest.mock("../growthbook/Growthbook", () => ({
  updateLocalAttributes: jest.fn(),
  useGbContext: () => ({ setGbUpdated: jest.fn() }),
}));
jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-path"),
}));

const mockApi = {
  isStudentLinked: jest.fn(),
  isStudentPlayedPalLesson: jest.fn(),
  getLatestAssessmentGroup: jest.fn(),
  getSubjectLessonsBySubjectId: jest.fn(),
  getChaptersForCourse: jest.fn(),
  getLessonsForChapter: jest.fn(),
  updateLearningPath: jest.fn(),
};

describe("useLearningPath features used by Home tab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ServiceConfig, "getI").mockReturnValue({ apiHandler: mockApi } as any);
    (schoolUtil.getCurrentClass as jest.Mock).mockReturnValue({ id: "class-1" });
    (Util.logEvent as jest.Mock).mockResolvedValue(undefined);
    (Util.setCurrentStudent as jest.Mock).mockResolvedValue(undefined);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: null,
    });
    mockApi.isStudentLinked.mockResolvedValue(false);
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(false);
    mockApi.getLatestAssessmentGroup.mockResolvedValue([]);
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue(null);
    mockApi.getChaptersForCourse.mockResolvedValue([]);
    mockApi.getLessonsForChapter.mockResolvedValue([]);
    mockApi.updateLearningPath.mockResolvedValue(undefined);
  });

  test("pathway rebuild/sync after class-join style course list change preserves current course index", async () => {
    const existingPath = {
      courses: {
        currentCourseIndex: 1,
        courseList: [
          { path_id: "p1", course_id: "c1", subject_id: "s1", type: "chapter", path: [], completedPath: 0 },
          { path_id: "p2", course_id: "c2", subject_id: "s2", type: "chapter", path: [], completedPath: 1 },
        ],
      },
      type: "chapter",
      pathMode: LEARNING_PATHWAY_MODE.DISABLED,
    };
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: JSON.stringify(existingPath),
    });

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [
          { id: "c3", subject_id: "s3" },
          { id: "c2", subject_id: "s2" },
          { id: "c1", subject_id: "s1" },
        ],
        mode: LEARNING_PATHWAY_MODE.DISABLED,
      });
    });

    const saved = mockApi.updateLearningPath.mock.calls[0][1];
    const parsed = JSON.parse(saved);
    expect(parsed.courses.courseList.map((c: any) => c.course_id)).toEqual(["c3", "c2", "c1"]);
    expect(parsed.courses.currentCourseIndex).toBe(1);
  });

  test("restores lesson index correctly from old pathway structure (migration)", () => {
    const { result } = renderHook(() => useLearningPath());
    const migrated = result.current.migrate({
      path_id: "path-1",
      course_id: "c1",
      subject_id: "s1",
      type: "chapter",
      startIndex: 5,
      currentIndex: 1,
      path: [
        { lesson_id: "l6", chapter_id: "ch1", is_assessment: false },
        { lesson_id: "l7", chapter_id: "ch1", is_assessment: false },
        { lesson_id: "l8", chapter_id: "ch2", is_assessment: true },
      ],
    });

    expect(migrated.completedPath).toBe(1);
    expect(migrated.path).toEqual([
      { lesson_id: "l6", chapter_id: "ch1", isPlayed: true, is_assessment: false },
      { lesson_id: "l7", chapter_id: "ch1", isPlayed: false, is_assessment: false },
    ]);
  });

  test("auto-advances to subject assessment in assessment-only mode", async () => {
    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: "asmt-doc-1",
      lesson_id: "assessment-lesson-1",
    });

    const next = await recommendNextLesson({
      student: { id: "stu-1" },
      course: { id: "c1", subject_id: "s1" },
      mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
    });

    expect(next).toEqual({
      lesson_id: "assessment-lesson-1",
      chapter_id: undefined,
      is_assessment: true,
      isPlayed: false,
    });
  });

  test("resumes same teacher-assigned assessment after exit", async () => {
    mockApi.getLatestAssessmentGroup.mockResolvedValue([{ lesson_id: "teacher-asmt-11" }]);

    const first = await recommendNextLesson({
      student: { id: "stu-1" },
      course: { id: "c1", subject_id: "s1" },
      mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
      classId: "class-1",
    });
    const second = await recommendNextLesson({
      student: { id: "stu-1" },
      course: { id: "c1", subject_id: "s1" },
      mode: LEARNING_PATHWAY_MODE.FULL_ADAPTIVE,
      classId: "class-1",
    });

    expect(first?.lesson_id).toBe("teacher-asmt-11");
    expect(second?.lesson_id).toBe("teacher-asmt-11");
  });

  test("course progression helper returns next assessment node after last played assessment", () => {
    const next = getNextFromList(
      [{ lesson_id: "a1" }, { lesson_id: "a2" }],
      { lesson_id: "a1", is_assessment: true, isPlayed: true },
      true
    );
    expect(next).toEqual({
      lesson_id: "a2",
      chapter_id: undefined,
      is_assessment: true,
      isPlayed: false,
    });
  });

  test("resume helper returns most recent played assessment node", () => {
    const last = getLastPlayedLesson(
      {
        path: [
          { lesson_id: "n1", is_assessment: false, isPlayed: true },
          { lesson_id: "a1", is_assessment: true, isPlayed: true },
          { lesson_id: "a2", is_assessment: true, isPlayed: false },
        ],
      },
      "assessment"
    );
    expect(last).toEqual({
      lesson_id: "a1",
      is_assessment: true,
      isPlayed: true,
    });
  });

  test("getPath logs assessment-active pathway when assessment is first playable node", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: null,
      language_id: "en",
    });
    mockApi.isStudentLinked.mockResolvedValue(false);
    mockApi.getLatestAssessmentGroup.mockResolvedValue([]);
    mockApi.isStudentPlayedPalLesson.mockResolvedValue(false);

    mockApi.getSubjectLessonsBySubjectId.mockResolvedValue({
      id: "assessment-doc",
      lesson_id: "assessment-lesson-77",
    });

    const { result } = renderHook(() => useLearningPath());
    await act(async () => {
      await result.current.getPath({
        courses: [{ id: "c1", subject_id: "s1", framework_id: null }],
        mode: LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY,
      });
    });

    expect(Util.logEvent).toHaveBeenCalledTimes(1);

    const [eventName, payload] = (Util.logEvent as jest.Mock).mock.calls[0];

    expect(eventName).toBe(EVENTS.PATHWAY_CREATED);
    expect(payload).toMatchObject({
      user_id: "stu-1",
      current_course_id: "c1",
      current_lesson_id: "assessment-lesson-77",
      is_assessment_active: true,
    });
  });
test("wraps to first chapter first lesson when last chapter last lesson is completed", async () => {
  mockApi.getChaptersForCourse.mockResolvedValue([
    { id: "ch1" },
    { id: "ch2" },
  ]);

  mockApi.getLessonsForChapter.mockImplementation((chapterId: string) => {
    if (chapterId === "ch1") {
      return Promise.resolve([{ id: "l1" }, { id: "l2" }]);
    }
    if (chapterId === "ch2") {
      return Promise.resolve([{ id: "l3" }, { id: "l4" }]);
    }
    return Promise.resolve([]);
  });

  const next = await recommendNextLesson({
    student: { id: "stu-1" },
    course: { id: "c1", subject_id: "s1" },
    mode: LEARNING_PATHWAY_MODE.DISABLED,
    coursePath: {
      path: [
        {
          lesson_id: "l4",
          chapter_id: "ch2",
          is_assessment: false,
          isPlayed: true,
        },
      ],
    },
  });

  expect(next).toEqual({
    lesson_id: "l1",
    chapter_id: "ch1",
    is_assessment: false,
    isPlayed: false,
  });
});
});
