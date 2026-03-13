import React from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import path from "path";
import Subjects from "./Subjects";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  CONTINUE,
  CURRENT_SELECTED_COURSE,
  GRADE_MAP,
  HOMEHEADERLIST,
  MODES,
  PAGES,
} from "../common/constants";

const mockHistory = { replace: jest.fn(), push: jest.fn() };
const mockLocation = { search: "", pathname: PAGES.DISPLAY_SUBJECTS };

const mockGetCurrentStudent = jest.fn();
const mockGetCurrentClass = jest.fn();
const mockGetCurrMode = jest.fn();

const eventually = async (assertion: () => void, timeoutMs = 5000) =>
  waitFor(assertion, { timeout: timeoutMs });

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useHistory: () => mockHistory,
  useLocation: () => mockLocation,
}));

jest.mock("../utility/util", () => ({
  Util: {
    getCurrentStudent: () => mockGetCurrentStudent(),
  },
}));

jest.mock("../utility/schoolUtil", () => ({
  schoolUtil: {
    getCurrentClass: () => mockGetCurrentClass(),
    getCurrMode: () => mockGetCurrMode(),
  },
}));

jest.mock("../components/SkeltonLoading", () => ({
  __esModule: true,
  default: ({ isLoading, header }: any) => (
    <div data-testid="subjects-skeleton">{String(isLoading)}-{String(header)}</div>
  ),
}));

jest.mock("../components/displaySubjects/SelectCourse", () => ({
  __esModule: true,
  default: ({ courses, modeParent, onCourseChange }: any) => (
    <div data-testid="select-course" data-mode-parent={String(modeParent)}>
      {courses.map((course: any) => (
        <button
          type="button"
          key={course.id}
          data-testid={`course-${course.id}`}
          onClick={() => onCourseChange(course)}
        >
          {course.name}
        </button>
      ))}
    </div>
  ),
}));

describe("Subjects", () => {
  const student = { id: "student-1", name: "Student One" } as any;
  const linkedClass = { id: "class-1", name: "Class One" } as any;
  const grade1 = { id: "g1", name: "Grade 1" } as any;
  const grade2 = { id: "g2", name: "Grade 2" } as any;
  const course1 = {
    id: "course-1",
    name: "Mathematics",
    grade_id: "g1",
  } as any;
  const course2 = {
    id: "course-2",
    name: "English",
    grade_id: "g2",
  } as any;

  const mockApiHandler = {
    isStudentLinked: jest.fn(),
    getStudentResultInMap: jest.fn(),
    getCoursesForClassStudent: jest.fn(),
    getCoursesForParentsStudent: jest.fn(),
    getDifferentGradesForCourse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockLocation.search = "";
    mockLocation.pathname = PAGES.DISPLAY_SUBJECTS;

    mockGetCurrentStudent.mockReturnValue(student);
    mockGetCurrentClass.mockReturnValue(linkedClass);
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);

    mockApiHandler.isStudentLinked.mockResolvedValue(false);
    mockApiHandler.getStudentResultInMap.mockResolvedValue({
      "lesson-1": {
        id: "result-1",
        lesson_id: "lesson-1",
        score: 40,
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    });
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([course1]);
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([course1]);
    mockApiHandler.getDifferentGradesForCourse.mockResolvedValue({
      grades: [grade1, grade2],
      courses: [course1, course2],
    });

    jest.spyOn(ServiceConfig, "getI").mockReturnValue({
      apiHandler: mockApiHandler,
    } as any);
  });

  it("shows skeleton header for subjects and then renders course selector", async () => {
    const view = render(<Subjects />);

    expect(view.getByTestId("subjects-skeleton")).toHaveTextContent(
      `true-${HOMEHEADERLIST.SUBJECTS}`
    );

    await eventually(() => {
      expect(view.getByTestId("select-course")).toBeInTheDocument();
    });
  });

  it("redirects to select mode when current student is missing", async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);

    render(<Subjects />);

    await eventually(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });

    expect(mockApiHandler.isStudentLinked).not.toHaveBeenCalled();
    expect(mockApiHandler.getCoursesForParentsStudent).not.toHaveBeenCalled();
  });

  it("fetches class courses when student is linked", async () => {
    mockApiHandler.isStudentLinked.mockResolvedValue(true);
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);

    render(<Subjects />);

    await eventually(() => {
      expect(mockApiHandler.getCoursesForClassStudent).toHaveBeenCalledWith(
        linkedClass.id
      );
    });

    expect(mockApiHandler.getCoursesForParentsStudent).not.toHaveBeenCalled();
  });

  it("displays class courses when student is linked to class", async () => {
    mockApiHandler.isStudentLinked.mockResolvedValue(true);
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([course1]);
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([course2]);

    const view = render(<Subjects />);

    await eventually(() => {
      expect(view.getByTestId(`course-${course1.id}`)).toBeInTheDocument();
    });
    expect(view.queryByTestId(`course-${course2.id}`)).not.toBeInTheDocument();
  });

  it("fetches parent courses when student is not linked", async () => {
    mockApiHandler.isStudentLinked.mockResolvedValue(false);

    render(<Subjects />);

    await eventually(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalledWith(
        student.id
      );
    });

    expect(mockApiHandler.getCoursesForClassStudent).not.toHaveBeenCalled();
  });

  it("displays parent courses when student is not linked to class", async () => {
    mockApiHandler.isStudentLinked.mockResolvedValue(false);
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([course2]);
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([course1]);

    const view = render(<Subjects />);

    await eventually(() => {
      expect(view.getByTestId(`course-${course2.id}`)).toBeInTheDocument();
    });
    expect(view.queryByTestId(`course-${course1.id}`)).not.toBeInTheDocument();
  });

  it("passes modeParent=true for parent mode with unlinked student", async () => {
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);
    mockApiHandler.isStudentLinked.mockResolvedValue(false);

    const view = render(<Subjects />);

    await eventually(() => {
      expect(view.getByTestId("select-course")).toHaveAttribute(
        "data-mode-parent",
        "true"
      );
    });
  });

  it("passes modeParent=false for school mode", async () => {
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockApiHandler.isStudentLinked.mockResolvedValue(false);

    const view = render(<Subjects />);

    await eventually(() => {
      expect(view.getByTestId("select-course")).toHaveAttribute(
        "data-mode-parent",
        "false"
      );
    });
  });

  it("handles isReload query by reloading courses", async () => {
    mockLocation.search = "?isReload=true";

    render(<Subjects />);

    await eventually(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalled();
    });
  });

  it("does not render select course when courses list is empty", async () => {
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([]);

    const view = render(<Subjects />);

    await eventually(() => {
      expect(view.getByTestId("subjects-skeleton")).toHaveTextContent(
        `false-${HOMEHEADERLIST.SUBJECTS}`
      );
    });

    expect(view.queryByTestId("select-course")).not.toBeInTheDocument();
  });

  it("stores selected grade map and current course, then navigates to chapters", async () => {
    const user = userEvent.setup();
    const view = render(<Subjects />);

    await view.findByTestId("select-course");
    await user.click(view.getByTestId(`course-${course1.id}`));

    await eventually(() => {
      expect(localStorage.getItem(GRADE_MAP)).toBeTruthy();
      expect(localStorage.getItem(CURRENT_SELECTED_COURSE)).toBeTruthy();
      expect(mockHistory.push).toHaveBeenCalledWith(
        `${PAGES.DISPLAY_CHAPTERS}?courseDocId=${course1.id}`
      );
    });
  });

  it("falls back to first grade when selected course grade is not in grade map", async () => {
    const user = userEvent.setup();
    mockApiHandler.getDifferentGradesForCourse.mockResolvedValue({
      grades: [grade2],
      courses: [course2],
    });

    const view = render(<Subjects />);

    await view.findByTestId("select-course");
    await user.click(view.getByTestId(`course-${course1.id}`));

    await eventually(() => {
      const parsedGradeMap = JSON.parse(localStorage.getItem(GRADE_MAP) || "{}");
      expect(parsedGradeMap.grades[0].id).toBe("g2");
      expect(mockHistory.push).toHaveBeenCalled();
    });
  });

  it("keeps continue query param while navigating to chapters", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?${CONTINUE}=true`;

    const view = render(<Subjects />);
    await view.findByTestId("select-course");

    await user.click(view.getByTestId(`course-${course1.id}`));

    await eventually(() => {
      expect(mockHistory.push).toHaveBeenCalledWith(
        `${PAGES.DISPLAY_CHAPTERS}?${CONTINUE}=true&courseDocId=${course1.id}`
      );
    });
  });

  it("loads grade map from localStorage if already present", async () => {
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1], courses: [course1] })
    );

    render(<Subjects />);

    await eventually(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalled();
    });

    expect(localStorage.getItem(GRADE_MAP)).toContain("g1");
  });

  it("keeps subjects page scroll container contract", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/pages/Subjects.css"),
      "utf8"
    );

    expect(css).toMatch(/\.subjects-content\s*\{[\s\S]*overflow-y:\s*scroll;/);
    expect(css).toMatch(
      /\.subjects-content::-webkit-scrollbar\s*\{[\s\S]*display:\s*none;/
    );
  });
});
