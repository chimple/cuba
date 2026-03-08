import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import TeacherRecommendedAssignments from "./TeacherRecommendedAssignments";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import { Util } from "../../../../utility/util";
import { PAGES } from "../../../../common/constants";

/* ================= GLOBAL MOCKS ================= */

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: () => new Promise(() => {}) },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

jest.mock("../../../../utility/util");

jest.mock("../Header", () => () => <div>Header</div>);

jest.mock("../../library/AssignmentCount", () => (props: any) => (
  <button data-testid="assign-btn" onClick={props.onClick}>
    Assign {props.assignments}
  </button>
));

jest.mock("./RecommendedAssignments", () => (props: any) => (
  <div>
    <div>RecommendedAssignments</div>
    <button
      data-testid="toggle-lesson"
      onClick={() =>
        props.toggleAssignmentSelection(null, null, null, "course-1", 0)
      }
    >
      Toggle
    </button>
  </div>
));

/* ================= MOCK API ================= */

const replaceMock = jest.fn();

const mockApi = {
  getCoursesForClassStudent: jest.fn(),
  getLastAssignmentsForRecommendations: jest.fn(),
  getChaptersForCourse: jest.fn(),
  getLessonsForChapter: jest.fn(),
  isAssignmentAlreadyAssigned: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(require("react-router"), "useHistory").mockReturnValue({
    push: jest.fn(),
    replace: replaceMock,
    goBack: jest.fn(),
  });

  jest.spyOn(ServiceConfig, "getI").mockReturnValue({
    apiHandler: mockApi,
  } as any);

  (Util.getCurrentClass as jest.Mock).mockReturnValue({
    id: "class-1",
    school_id: "school-1",
  });

  mockApi.getCoursesForClassStudent.mockResolvedValue([
    { id: "course-1", name: "Math", code: "MATH", sort_index: 1 },
  ]);

  mockApi.getLastAssignmentsForRecommendations.mockResolvedValue([]);

  mockApi.getChaptersForCourse.mockResolvedValue([{ id: "chapter-1" }]);

  mockApi.getLessonsForChapter.mockResolvedValue([
    { id: "lesson-1", name: "Lesson 1", image: null },
    { id: "lesson-2", name: "Lesson 2", image: null },
  ]);

  mockApi.isAssignmentAlreadyAssigned.mockResolvedValue(false);
});

/* ================= TESTS ================= */

describe("TeacherRecommendedAssignments – full coverage", () => {
  test("redirects if no current class", async () => {
    (Util.getCurrentClass as jest.Mock).mockReturnValue(null);

    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS);
    });
  });

  test("renders header and assignments", async () => {
    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("RecommendedAssignments"),
    ).toBeInTheDocument();

    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  test("navigates when Assign clicked with selection", async () => {
    const historyReplace = jest.fn();

    jest.spyOn(require("react-router"), "useHistory").mockReturnValue({
      push: jest.fn(),
      replace: historyReplace,
      goBack: jest.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    await screen.findByText("RecommendedAssignments");

    await userEvent.click(screen.getByTestId("assign-btn"));

    expect(historyReplace).toHaveBeenCalledWith(
      PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE,
      expect.objectContaining({
        selectedAssignments: expect.any(Object),
      }),
    );
  });

  test("does not navigate if nothing selected", async () => {
    mockApi.getLessonsForChapter.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    await screen.findByTestId("assign-btn");

    await userEvent.click(screen.getByTestId("assign-btn"));

    expect(replaceMock).not.toHaveBeenCalledWith(
      PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE,
      expect.anything(),
    );
  });

  test("calls getCoursesForClassStudent on mount", async () => {
    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockApi.getCoursesForClassStudent).toHaveBeenCalled();
    });
  });

  test("calls getLessonsForChapter for each chapter", async () => {
    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockApi.getLessonsForChapter).toHaveBeenCalledWith("chapter-1");
    });
  });

  test("multiple toggles do not crash", async () => {
    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    await screen.findByText("RecommendedAssignments");

    await userEvent.click(screen.getByTestId("toggle-lesson"));
    await userEvent.click(screen.getByTestId("toggle-lesson"));

    expect(screen.getByTestId("assign-btn")).toBeInTheDocument();
  });

  test("renders assign button always", async () => {
    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("assign-btn")).toBeInTheDocument();
  });
});

test("does not navigate when assign count is zero", async () => {
  mockApi.getLessonsForChapter.mockResolvedValue([]);

  const historyReplace = jest.fn();

  jest.spyOn(require("react-router"), "useHistory").mockReturnValue({
    push: jest.fn(),
    replace: historyReplace,
    goBack: jest.fn(),
  });

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByTestId("assign-btn");

  await userEvent.click(screen.getByTestId("assign-btn"));

  expect(historyReplace).not.toHaveBeenCalledWith(
    PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE,
    expect.anything(),
  );
});
test("calls getLastAssignmentsForRecommendations on mount", async () => {
  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockApi.getLastAssignmentsForRecommendations).toHaveBeenCalledWith(
      "class-1",
    );
  });
});

test("calls getChaptersForCourse with correct course id", async () => {
  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockApi.getChaptersForCourse).toHaveBeenCalledWith("course-1");
  });
});

test("calls isAssignmentAlreadyAssigned for lessons", async () => {
  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockApi.isAssignmentAlreadyAssigned).toHaveBeenCalled();
  });
});

test("handles multiple courses", async () => {
  mockApi.getCoursesForClassStudent.mockResolvedValue([
    { id: "course-1", name: "Math", code: "MATH", sort_index: 1 },
    { id: "course-2", name: "Science", code: "SCI", sort_index: 2 },
  ]);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockApi.getChaptersForCourse).toHaveBeenCalledTimes(2);
  });
});

test("handles empty chapters", async () => {
  mockApi.getChaptersForCourse.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByTestId("assign-btn");

  expect(screen.getByTestId("assign-btn")).toHaveTextContent("Assign 0");
});

test("handles already assigned lessons", async () => {
  mockApi.isAssignmentAlreadyAssigned.mockResolvedValue(true);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByTestId("assign-btn");

  expect(screen.getByTestId("assign-btn")).toHaveTextContent("Assign 0");
});

test("toggle updates without crashing when lessons exist", async () => {
  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByText("RecommendedAssignments");

  await userEvent.click(screen.getByTestId("toggle-lesson"));

  expect(screen.getByTestId("assign-btn")).toBeInTheDocument();
});

test("assign button remains when chapters empty", async () => {
  mockApi.getChaptersForCourse.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  expect(await screen.findByTestId("assign-btn")).toBeInTheDocument();
});

test("assign button remains when lessons empty", async () => {
  mockApi.getLessonsForChapter.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  expect(await screen.findByTestId("assign-btn")).toBeInTheDocument();
});

test("replace not called on valid mount", async () => {
  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByText("RecommendedAssignments");

  expect(replaceMock).not.toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS);
});

test("renders component multiple times without crash", async () => {
  const { rerender } = render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByText("RecommendedAssignments");

  rerender(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  expect(screen.getByTestId("assign-btn")).toBeInTheDocument();
});

test("handles undefined lastAssignments response", async () => {
  mockApi.getLastAssignmentsForRecommendations.mockResolvedValue(undefined);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByTestId("assign-btn");

  expect(screen.getByTestId("assign-btn")).toBeInTheDocument();
});

test("handles multiple chapters", async () => {
  mockApi.getChaptersForCourse.mockResolvedValue([
    { id: "chapter-1" },
    { id: "chapter-2" },
  ]);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockApi.getLessonsForChapter).toHaveBeenCalledTimes(2);
  });
});

test("assign button text updates correctly after toggle", async () => {
  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await screen.findByText("RecommendedAssignments");

  await userEvent.click(screen.getByTestId("toggle-lesson"));

  expect(screen.getByTestId("assign-btn").textContent).toContain("Assign");
});

test("component loads even if API resolves slowly", async () => {
  mockApi.getCoursesForClassStudent.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve([]), 10)),
  );

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockApi.getCoursesForClassStudent).toHaveBeenCalled();
  });
});
