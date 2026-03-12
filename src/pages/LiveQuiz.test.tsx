import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import LiveQuiz from "./LiveQuiz";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import { LIVE_QUIZ, PAGES } from "../common/constants";

const mockReplace = jest.fn();
const mockLessonSliderSpy = jest.fn();

jest.mock("react-router", () => ({
  useHistory: () => ({ replace: mockReplace }),
}));

jest.mock("../components/LessonSlider", () => (props: any) => {
  mockLessonSliderSpy(props);
  return <div data-testid="lesson-slider">{props.lessonData?.length ?? 0}</div>;
});

jest.mock("../components/SkeltonLoading", () => (props: any) =>
  props.isLoading ? <div data-testid="livequiz-loading" /> : null
);

jest.mock("../utility/util");
jest.mock("../i18n", () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    language: "en",
    t: (s: string) => s,
  },
}));
jest.mock("i18next", () => ({
  t: (s: string) => s,
}));

const mockApi = {
  getStudentResultInMap: jest.fn(),
  getStudentClassesAndSchools: jest.fn(),
  getLiveQuizLessons: jest.fn(),
  getLesson: jest.fn(),
  assignmentListner: jest.fn(),
  assignmentUserListner: jest.fn(),
  getAssignmentById: jest.fn(),
  removeAssignmentChannel: jest.fn(),
};

describe("LiveQuiz page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLessonSliderSpy.mockReset();
    jest.spyOn(ServiceConfig, "getI").mockReturnValue({ apiHandler: mockApi } as any);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "stu-1" });
    mockApi.getStudentResultInMap.mockResolvedValue({ l1: { score: 10 } });
    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "c1" }],
    });
    mockApi.getLiveQuizLessons.mockResolvedValue([
      { id: "a2", lesson_id: "l2", created_at: "2026-01-02T00:00:00.000Z", type: LIVE_QUIZ },
      { id: "a1", lesson_id: "l1", created_at: "2026-01-01T00:00:00.000Z", type: LIVE_QUIZ },
    ]);
    mockApi.getLesson.mockImplementation((id: string) => Promise.resolve({ id, name: `Lesson ${id}` }));
    mockApi.assignmentListner.mockImplementation((_classId: string, cb: Function) => {
      (mockApi.assignmentListner as any).cb = cb;
    });
    mockApi.assignmentUserListner.mockImplementation((_studentId: string, cb: Function) => {
      (mockApi.assignmentUserListner as any).cb = cb;
    });
    mockApi.getAssignmentById.mockResolvedValue({ id: "a-x", type: LIVE_QUIZ });
  });

  const renderPage = (liveQuizCount = jest.fn()) => {
    const ui = render(<LiveQuiz liveQuizCount={liveQuizCount} />);
    return { liveQuizCount, ...ui };
  };
  const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  test("redirects to select mode when student is missing", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    renderPage();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
  });

  test("shows loading skeleton during init", () => {
    renderPage();
    expect(screen.getByTestId("livequiz-loading")).toBeInTheDocument();
  });

  test("renders lesson slider when quizzes are available", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("lesson-slider")).toBeInTheDocument();
    });
  });

  test("passes sorted lessons to slider by assignment created date", async () => {
    renderPage();
    await waitFor(() => {
      const call = mockLessonSliderSpy.mock.calls[mockLessonSliderSpy.mock.calls.length - 1][0];
      expect(call.assignments[0].id).toBe("a2");
      expect(call.assignments[1].id).toBe("a1");
    });
  });

  test("passes lesson score map to slider", async () => {
    renderPage();
    await waitFor(() => {
      const call = mockLessonSliderSpy.mock.calls[mockLessonSliderSpy.mock.calls.length - 1][0];
      expect(call.lessonsScoreMap).toEqual({ l1: { score: 10 } });
    });
  });

  test("calls liveQuizCount with fetched assignment count", async () => {
    const { liveQuizCount } = renderPage();
    await waitFor(() => {
      expect(liveQuizCount).toHaveBeenCalledWith(2);
    });
  });

  test("shows empty state when linked class exists but no quizzes", async () => {
    mockApi.getLiveQuizLessons.mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("You do not have any live quizzes available.")).toBeInTheDocument();
    });
  });

  test("shows empty state when classes list is empty", async () => {
    mockApi.getStudentClassesAndSchools.mockResolvedValue({ classes: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("You do not have any live quizzes available.")).toBeInTheDocument();
    });
  });

  test("requests student results map on init", async () => {
    renderPage();
    await waitFor(() => {
      expect(mockApi.getStudentResultInMap).toHaveBeenCalledWith("stu-1");
    });
  });

  test("fetches lessons for each class", async () => {
    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "c1" }, { id: "c2" }],
    });
    mockApi.getLiveQuizLessons.mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(mockApi.getLiveQuizLessons).toHaveBeenCalledWith("c1", "stu-1");
      expect(mockApi.getLiveQuizLessons).toHaveBeenCalledWith("c2", "stu-1");
    });
  });

  test("filters out null lessons before rendering slider", async () => {
    mockApi.getLesson
      .mockResolvedValueOnce({ id: "l2" })
      .mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => {
      const call = mockLessonSliderSpy.mock.calls[mockLessonSliderSpy.mock.calls.length - 1][0];
      expect(call.lessonData).toEqual([{ id: "l2" }]);
    });
  });

  test("registers assignment listener for current class", async () => {
    renderPage();
    await waitFor(() => {
      expect(mockApi.assignmentListner).toHaveBeenCalledWith("c1", expect.any(Function));
    });
  });

  test("registers assignment-user listener for student", async () => {
    renderPage();
    await waitFor(() => {
      expect(mockApi.assignmentUserListner).toHaveBeenCalledWith("stu-1", expect.any(Function));
    });
  });

  test("debounces re-init for live-quiz assignment events", async () => {
    renderPage();
    await waitFor(() => expect(mockApi.assignmentListner).toHaveBeenCalled());
    const initialGetCalls = mockApi.getStudentResultInMap.mock.calls.length;
    (mockApi.assignmentListner as any).cb({ type: LIVE_QUIZ });
    await waitFor(() => {
      expect(mockApi.getStudentResultInMap.mock.calls.length).toBeGreaterThan(initialGetCalls);
    }, { timeout: 2500 });
  });

  test("ignores non-live-quiz assignment listener events", async () => {
    renderPage();
    await waitFor(() => expect(mockApi.assignmentListner).toHaveBeenCalled());
    (mockApi.assignmentListner as any).cb({ type: "HOMEWORK" });
    await waitFor(() => {
      expect(mockApi.getAssignmentById).not.toHaveBeenCalled();
    });
  });

  test("assignment-user listener triggers re-init for live-quiz assignments", async () => {
    renderPage();
    await waitFor(() => expect(mockApi.assignmentUserListner).toHaveBeenCalled());
    const initialGetCalls = mockApi.getStudentResultInMap.mock.calls.length;
    await (mockApi.assignmentUserListner as any).cb({ assignment_id: "a-x" });
    await waitFor(() => {
      expect(mockApi.getStudentResultInMap.mock.calls.length).toBeGreaterThan(initialGetCalls);
    }, { timeout: 2500 });
  });

  test("assignment-user listener ignores non-live-quiz assignment type", async () => {
    mockApi.getAssignmentById.mockResolvedValue({ id: "a-x", type: "HOMEWORK" });
    renderPage();
    await waitFor(() => expect(mockApi.assignmentUserListner).toHaveBeenCalled());
    await (mockApi.assignmentUserListner as any).cb({ assignment_id: "a-x" });
    expect(mockApi.getAssignmentById).toHaveBeenCalledWith("a-x");
  });

  test("does nothing when assignment-user callback receives falsy payload", async () => {
    renderPage();
    await waitFor(() => expect(mockApi.assignmentUserListner).toHaveBeenCalled());
    await (mockApi.assignmentUserListner as any).cb(null);
    expect(mockApi.getAssignmentById).not.toHaveBeenCalled();
  });

  test("passes fixed slider flags for home live quiz card", async () => {
    renderPage();
    await waitFor(() => {
      const call = mockLessonSliderSpy.mock.calls[mockLessonSliderSpy.mock.calls.length - 1][0];
      expect(call.isHome).toBe(true);
      expect(call.showSubjectName).toBe(true);
      expect(call.showChapterName).toBe(true);
      expect(call.showDate).toBe(true);
      expect(call.startIndex).toBe(0);
    });
  });

  test("cleans assignment channel on unmount", async () => {
    const { unmount } = renderPage();
    await waitFor(() => {
      expect(mockApi.assignmentListner).toHaveBeenCalled();
    });
    unmount();
    expect(mockApi.removeAssignmentChannel).toHaveBeenCalled();
  });
});
