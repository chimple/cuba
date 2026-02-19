import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import ChapterLessonBox from "./chapterLessonBox";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { COURSE_CHANGED } from "../../common/constants";

const mockT = jest.fn((s: string) => `tr:${s}`);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockT }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

jest.mock("../../utility/util");

const mockApi = {
  getLesson: jest.fn(),
  getChapterById: jest.fn(),
};

const buildLearningPath = (opts?: {
  currentCourseIndex?: number;
  firstPath?: any;
  secondPath?: any;
}) =>
  JSON.stringify({
    courses: {
      currentCourseIndex: opts?.currentCourseIndex ?? 0,
      courseList: [
        {
          course_id: "c1",
          path: opts?.firstPath ?? [
            { lesson_id: "l-played", chapter_id: "ch-played", isPlayed: true },
            { lesson_id: "l-active", chapter_id: "ch-active", isPlayed: false },
          ],
        },
        {
          course_id: "c2",
          path: opts?.secondPath ?? [
            { lesson_id: "l2-active", chapter_id: "ch2-active", isPlayed: false },
          ],
        },
      ],
    },
  });

describe("chapterLessonBox", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(ServiceConfig, "getI").mockReturnValue({ apiHandler: mockApi } as any);
    mockT.mockImplementation((s: string) => `tr:${s}`);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: buildLearningPath(),
    });
    mockApi.getLesson.mockResolvedValue({ id: "l-active", name: "Lesson Active" });
    mockApi.getChapterById.mockResolvedValue({ id: "ch-active", name: "Chapter Active" });
  });

  test("renders base structure", () => {
    const { container } = render(<ChapterLessonBox />);
    expect(container.querySelector(".chapter-lesson-box")).toBeInTheDocument();
    expect(container.querySelector(".chapter-lesson-text")).toBeInTheDocument();
  });

  test("applies container style prop", () => {
    render(<ChapterLessonBox containerStyle={{ width: "321px" }} />);
    const root = document.querySelector(".chapter-lesson-box") as HTMLElement;
    expect(root.style.width).toBe("321px");
  });

  test("uses prop values when chapterName and lessonName are provided", async () => {
    render(<ChapterLessonBox chapterName="Chapter P" lessonName="Lesson P" />);
    await waitFor(() => {
      expect(screen.getByText("tr:Chapter P : tr:Lesson P")).toBeInTheDocument();
    });
  });

  test("does not call API when chapterName and lessonName are provided", async () => {
    render(<ChapterLessonBox chapterName="Chapter P" lessonName="Lesson P" />);
    await waitFor(() => {
      expect(screen.getByText("tr:Chapter P : tr:Lesson P")).toBeInTheDocument();
    });
    expect(mockApi.getLesson).not.toHaveBeenCalled();
    expect(mockApi.getChapterById).not.toHaveBeenCalled();
  });

  test("fetches active lesson/chapter from learning path on mount", async () => {
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledWith("l-active");
      expect(mockApi.getChapterById).toHaveBeenCalledWith("ch-active");
      expect(screen.getByText("tr:Chapter Active : tr:Lesson Active")).toBeInTheDocument();
    });
  });

  test("uses lesson-only label when chapter_id is missing", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: buildLearningPath({
        firstPath: [{ lesson_id: "l-active", chapter_id: undefined, isPlayed: false }],
      }),
    });
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getChapterById).not.toHaveBeenCalled();
      expect(screen.getByText("tr:Lesson Active")).toBeInTheDocument();
    });
  });

  test("uses translated default chapter fallback when lesson is missing", async () => {
    mockApi.getLesson.mockResolvedValue(null);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: buildLearningPath({
        firstPath: [{ lesson_id: undefined, chapter_id: undefined, isPlayed: false }],
      }),
    });
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(screen.getByText("tr:default.chapter")).toBeInTheDocument();
    });
  });

  test("calls t() for chapter and lesson labels", async () => {
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockT).toHaveBeenCalledWith("Chapter Active");
      expect(mockT).toHaveBeenCalledWith("Lesson Active");
    });
  });

  test("uses currentCourseIndex to resolve active course", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: buildLearningPath({ currentCourseIndex: 1 }),
    });
    mockApi.getLesson.mockResolvedValue({ id: "l2-active", name: "Lesson Two" });
    mockApi.getChapterById.mockResolvedValue({ id: "ch2-active", name: "Chapter Two" });
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledWith("l2-active");
      expect(screen.getByText("tr:Chapter Two : tr:Lesson Two")).toBeInTheDocument();
    });
  });

  test("ignores played nodes and uses first unplayed node", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: buildLearningPath({
        firstPath: [
          { lesson_id: "l-played-1", chapter_id: "ch-played-1", isPlayed: true },
          { lesson_id: "l-active-2", chapter_id: "ch-active-2", isPlayed: false },
          { lesson_id: "l-next", chapter_id: "ch-next", isPlayed: false },
        ],
      }),
    });
    mockApi.getLesson.mockResolvedValue({ id: "l-active-2", name: "Lesson Two Active" });
    mockApi.getChapterById.mockResolvedValue({ id: "ch-active-2", name: "Chapter Two Active" });
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledWith("l-active-2");
      expect(screen.getByText("tr:Chapter Two Active : tr:Lesson Two Active")).toBeInTheDocument();
    });
  });

  test("does not fetch when current student is null", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getLesson).not.toHaveBeenCalled();
      expect(mockApi.getChapterById).not.toHaveBeenCalled();
    });
  });

  test("does not fetch when student has no learning_path", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "stu-1", learning_path: null });
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getLesson).not.toHaveBeenCalled();
      expect(mockApi.getChapterById).not.toHaveBeenCalled();
    });
  });

  test("adds and removes COURSE_CHANGED listener", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(<ChapterLessonBox />);
    expect(addSpy).toHaveBeenCalledWith(COURSE_CHANGED, expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(COURSE_CHANGED, expect.any(Function));
  });

  test("updates chapter text on COURSE_CHANGED event", async () => {
    render(<ChapterLessonBox />);
    await screen.findByText("tr:Chapter Active : tr:Lesson Active");

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      learning_path: buildLearningPath({ currentCourseIndex: 1 }),
    });
    mockApi.getLesson.mockResolvedValue({ id: "l2-active", name: "Lesson New" });
    mockApi.getChapterById.mockResolvedValue({ id: "ch2-active", name: "Chapter New" });

    act(() => {
      window.dispatchEvent(new Event(COURSE_CHANGED));
    });

    await waitFor(() => {
      expect(screen.getByText("tr:Chapter New : tr:Lesson New")).toBeInTheDocument();
    });
  });

  test("logs error when COURSE_CHANGED handler update fails", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<ChapterLessonBox />);
    await screen.findByText("tr:Chapter Active : tr:Lesson Active");

    mockApi.getLesson.mockRejectedValue(new Error("fetch-fail"));
    act(() => {
      window.dispatchEvent(new Event(COURSE_CHANGED));
    });

    await waitFor(() => {
      expect(errSpy).toHaveBeenCalledWith(
        "Error handling course change:",
        expect.any(Error)
      );
    });
    errSpy.mockRestore();
  });

  test("does not react to COURSE_CHANGED after unmount", async () => {
    const { unmount } = render(<ChapterLessonBox />);
    await screen.findByText("tr:Chapter Active : tr:Lesson Active");
    unmount();

    const lessonCalls = mockApi.getLesson.mock.calls.length;
    act(() => {
      window.dispatchEvent(new Event(COURSE_CHANGED));
    });
    expect(mockApi.getLesson.mock.calls.length).toBe(lessonCalls);
  });

  test("chapterName without lessonName falls back to learning-path fetch", async () => {
    render(<ChapterLessonBox chapterName="OnlyChapter" />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalled();
      expect(screen.getByText("tr:Chapter Active : tr:Lesson Active")).toBeInTheDocument();
    });
  });

  test("lessonName without chapterName falls back to learning-path fetch", async () => {
    render(<ChapterLessonBox lessonName="OnlyLesson" />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalled();
      expect(screen.getByText("tr:Chapter Active : tr:Lesson Active")).toBeInTheDocument();
    });
  });

  test("calls getLesson with active lesson id only once on initial mount", async () => {
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledTimes(1);
      expect(mockApi.getLesson).toHaveBeenCalledWith("l-active");
    });
  });

  test("calls getChapterById only when active path has chapter_id", async () => {
    render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(mockApi.getChapterById).toHaveBeenCalledTimes(1);
      expect(mockApi.getChapterById).toHaveBeenCalledWith("ch-active");
    });
  });

  test("keeps text node rendered even when no chapter value is available", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    const { container } = render(<ChapterLessonBox />);
    await waitFor(() => {
      expect(container.querySelector(".chapter-lesson-text")).toBeInTheDocument();
      expect(container.querySelector(".chapter-lesson-text")?.textContent).toBe("");
    });
  });
});
