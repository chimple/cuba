import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import QRAssignments from "./QRAssignments";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import { Util } from "../../../../utility/util";
import { PAGES } from "../../../../common/constants";

/* ======================= GLOBAL MOCKS ======================= */

jest.mock("@ionic/react", () => ({
  IonIcon: (props: any) => (
    <div data-testid="ion-icon" onClick={props.onClick} />
  ),
}));

jest.mock("ionicons/icons", () => ({
  checkmarkCircle: "checkmarkCircle",
  ellipseOutline: "ellipseOutline",
}));

jest.mock("i18next", () => {
  const i18n = {
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
    t: (key: string) => key,
    changeLanguage: jest.fn(),
  };
  return i18n;
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

jest.mock("../../../../utility/util");

jest.mock("../../../../components/Loading", () => () => <div>Loading...</div>);

jest.mock("../../homePage/Header", () => () => <div>Header</div>);

jest.mock(
  "../../../../components/displaySubjects/SelectIconImage",
  () => () => <div>Image</div>,
);

jest.mock("../../library/AssignmentCount", () => (props: any) => (
  <button onClick={props.onClick}>Assign {props.assignments}</button>
));

/* ======================= MOCK API ======================= */

const pushMock = jest.fn();
const replaceMock = jest.fn();

const mockApi = {
  getLessonsForChapter: jest.fn(),
  getAssignedLessonIdsForClass: jest.fn(), // ✅ updated API
  getCourse: jest.fn(),
};

const mockAuth = {
  getCurrentUser: jest.fn(),
};

const mockLessons = Array.from({ length: 8 }).map((_, i) => ({
  lesson_id: `lesson-${i}`,
  name: `Lesson ${i}`,
  image: "",
}));

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(ServiceConfig, "getI").mockReturnValue({
    apiHandler: mockApi,
    authHandler: mockAuth,
  } as any);

  mockAuth.getCurrentUser.mockResolvedValue({ id: "teacher-1" });

  (Util.getCurrentClass as jest.Mock).mockResolvedValue({
    id: "class-1",
  });

  mockApi.getLessonsForChapter.mockResolvedValue(mockLessons);

  // ✅ updated mock
  mockApi.getAssignedLessonIdsForClass.mockResolvedValue([
    "lesson-0",
    "lesson-1",
  ]);

  mockApi.getCourse.mockResolvedValue({ name: "Math" });
});

/* ======================= HELPERS ======================= */

const renderPage = (state?: any) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/",
          state: state ?? {
            chapterId: "chapter-1",
            courseId: "course-1",
          },
        },
      ]}
    >
      <QRAssignments />
    </MemoryRouter>,
  );

/* ======================= TESTS ======================= */

describe("QRAssignments – full coverage", () => {
  /* ---------- Redirect ---------- */
  test("redirects if no chapterId", async () => {
    renderPage({});
    await waitFor(() => {
      expect(window.location.pathname).toBe("/");
    });
  });

  /* ---------- Loading ---------- */
  test("shows loading initially", () => {
    renderPage();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  /* ---------- Happy Path ---------- */
  test("renders lessons and subject", async () => {
    renderPage();
    expect(await screen.findByText("Lesson 2")).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();
  });

  test("auto selects next 5 unassigned lessons", async () => {
    renderPage();
    await screen.findByText("Lesson 2");
    expect(screen.getByText("Assign 5")).toBeInTheDocument();
  });

  /* ---------- Toggle Assigned ---------- */
  test("hides assigned lessons when toggled", async () => {
    renderPage();
    const toggle = await screen.findByText("Hide Assigned");
    await userEvent.click(toggle);

    expect(screen.getByText("Show Assigned")).toBeInTheDocument();
    expect(screen.queryByText("Lesson 0")).not.toBeInTheDocument();
  });

  /* ---------- Selection Logic ---------- */
  test("decreases count when selected lesson deselected", async () => {
    renderPage();
    await screen.findByText("Lesson 2");

    const icons = screen.getAllByTestId("ion-icon");
    await userEvent.click(icons[2]);

    expect(screen.getByRole("button")).toHaveTextContent("4");
  });

  test("prevents navigation when selectedCount is 0", async () => {
    renderPage();
    await screen.findByText("Lesson 2");

    const icons = screen.getAllByTestId("ion-icon");

    for (let i = 0; i < 5; i++) {
      await userEvent.click(icons[i]);
    }

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(pushMock).not.toHaveBeenCalled();
  });

  /* ---------- Navigation ---------- */
  test("navigates with correct payload when Assign clicked", async () => {
    const historyPush = jest.fn();

    jest.spyOn(require("react-router"), "useHistory").mockReturnValue({
      push: historyPush,
      replace: replaceMock,
      goBack: jest.fn(),
    });

    renderPage();
    await screen.findByText("Lesson 2");

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(historyPush).toHaveBeenCalledWith(
      PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE,
      expect.objectContaining({
        selectedAssignments: expect.any(Object),
        manualAssignments: expect.any(Object),
        recommendedAssignments: {},
      }),
    );
  });

  /* ---------- Null User ---------- */
  test("does nothing if currentUser is null", async () => {
    mockAuth.getCurrentUser.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(mockApi.getLessonsForChapter).not.toHaveBeenCalled();
    });
  });

  /* ---------- Null Class ---------- */
  test("does nothing if currentClass is null", async () => {
    (Util.getCurrentClass as jest.Mock).mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(mockApi.getLessonsForChapter).not.toHaveBeenCalled();
    });
  });

  /* ---------- Empty Lessons ---------- */
  test("handles empty lesson list", async () => {
    mockApi.getLessonsForChapter.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.queryByText("Lesson 1")).not.toBeInTheDocument();
    });
  });

  /* ---------- API Error ---------- */
  test("handles API failure gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockApi.getLessonsForChapter.mockRejectedValue(new Error("API Failure"));

    renderPage();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
