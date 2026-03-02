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

  test("assign button shows initial count 0", async () => {
    render(
      <MemoryRouter>
        <TeacherRecommendedAssignments />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("assign-btn")).toHaveTextContent(
      "Assign 0",
    );
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
test("handles empty courses response", async () => {
  mockApi.getCoursesForClassStudent.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <TeacherRecommendedAssignments />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockApi.getCoursesForClassStudent).toHaveBeenCalled();
  });

  expect(screen.getByText("Header")).toBeInTheDocument();
  expect(screen.getByTestId("assign-btn")).toHaveTextContent("Assign 0");
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
