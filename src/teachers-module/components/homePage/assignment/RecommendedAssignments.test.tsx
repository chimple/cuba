import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RecommendedAssignments, {
  RecommendedAssignmentsState,
} from "./RecommendedAssignments";
import { TeacherAssignmentPageType } from "./TeacherAssignment";

/* ================= MOCKS ================= */

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));

jest.mock(
  "../../../../components/displaySubjects/SelectIconImage",
  () => () => <div data-testid="select-icon">image</div>,
);
/* ================= TEST DATA ================= */

const baseAssignments: RecommendedAssignmentsState = {
  math: {
    name: "Math",
    courseCode: "MATH",
    sort_index: 1,
    isCollapsed: false,
    lessons: [
      {
        id: "1",
        _chapterId: "c1",
        name: "Algebra",
        image: null,
        selected: true,
        source: null,
        _chapterName: "",
      },
      {
        id: "2",
        _chapterId: "c2",
        name: "Geometry",
        image: null,
        selected: false,
        source: null,
        _chapterName: "",
      },
    ],
    allLessons: [],
  },
};

describe("RecommendedAssignments Component", () => {
  let mockSetState: jest.Mock;
  let mockToggleSubjectCollapse: jest.Mock;
  let mockToggleAssignmentSelection: jest.Mock;
  let mockUpdateSelectedLesson: jest.Mock;

  const renderComponent = (assignments = baseAssignments) =>
    render(
      <RecommendedAssignments
        recommendedAssignments={assignments}
        setRecommendedAssignments={mockSetState}
        toggleSubjectCollapse={mockToggleSubjectCollapse}
        toggleAssignmentSelection={mockToggleAssignmentSelection}
        updateSelectedLesson={mockUpdateSelectedLesson}
      />,
    );

  beforeEach(() => {
    mockSetState = jest.fn();
    mockToggleSubjectCollapse = jest.fn();
    mockToggleAssignmentSelection = jest.fn();
    mockUpdateSelectedLesson = jest.fn();
  });

  /* ========= EXISTING TESTS (Improved Slightly) ========= */

  test("renders subject name", () => {
    renderComponent();
    expect(screen.getByText("Math")).toBeInTheDocument();
  });

  test("renders correct selected count", () => {
    renderComponent();
    expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
  });

  test("calls toggleSubjectCollapse on subject click", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Math"));
    expect(mockToggleSubjectCollapse).toHaveBeenCalledWith(
      TeacherAssignmentPageType.RECOMMENDED,
      "math",
    );
  });

  test("calls setRecommendedAssignments when Add 5 more clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Add 5 more"));
    expect(mockSetState).toHaveBeenCalledTimes(1);
  });

  test("does not render lessons if collapsed", () => {
    renderComponent({
      ...baseAssignments,
      math: { ...baseAssignments.math, isCollapsed: true },
    });

    expect(screen.queryByText("Algebra")).not.toBeInTheDocument();
  });

  /* ========= NEW TESTS (10 ADDITIONAL) ========= */

  test("renders all lesson names", () => {
    renderComponent();
    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("Geometry")).toBeInTheDocument();
  });

  test("renders SelectIconImage for each lesson", () => {
    renderComponent();
    expect(screen.getAllByTestId("select-icon")).toHaveLength(2);
  });

  test("renders Add 5 more button", () => {
    renderComponent();
    expect(screen.getByText("Add 5 more")).toBeInTheDocument();
  });

  test("handles empty lessons array", () => {
    renderComponent({
      ...baseAssignments,
      math: { ...baseAssignments.math, lessons: [] },
    });

    expect(screen.getByText(/0\s*\/\s*0/)).toBeInTheDocument();
  });

  test("handles missing subject safely", () => {
    renderComponent({});
    expect(screen.queryByText("Math")).not.toBeInTheDocument();
  });

  test("selected count updates correctly when all selected", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: baseAssignments.math.lessons.map((l) => ({
          ...l,
          selected: true,
        })),
      },
    });

    expect(screen.getByText(/2\s*\/\s*2/)).toBeInTheDocument();
  });

  test("multiple subjects render correctly", () => {
    renderComponent({
      ...baseAssignments,
      science: {
        name: "Science",
        sort_index: 2,
        isCollapsed: false,
        lessons: [],
      },
    });

    expect(screen.getByText("Science")).toBeInTheDocument();
  });

  test("subjects are sorted by sort_index", () => {
    renderComponent({
      science: {
        name: "Science",
        sort_index: 2,
        isCollapsed: false,
        lessons: [],
      },
      math: baseAssignments.math,
    });

    const subjects = screen.getAllByText(/Math|Science/);
    expect(subjects[0]).toHaveTextContent("Math");
  });

  test("renders correctly when all subjects are collapsed", () => {
    renderComponent({
      math: { ...baseAssignments.math, isCollapsed: true },
      science: {
        name: "Science",
        sort_index: 2,
        isCollapsed: true,
        lessons: [],
        allLessons: [],
      },
    });

    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();

    expect(screen.queryByText("Algebra")).not.toBeInTheDocument();
  });
  test("renders 0 selected when no lessons are selected", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: baseAssignments.math.lessons.map((lesson) => ({
          ...lesson,
          selected: false,
        })),
      },
    });

    expect(screen.getByText(/0\s*\/\s*2/)).toBeInTheDocument();
  });
  test("renders subject even if sort_index is undefined", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        sort_index: undefined as any,
      },
    });

    expect(screen.getByText("Math")).toBeInTheDocument();
  });
  test("calls toggleSubjectCollapse only once per click", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Math"));
    expect(mockToggleSubjectCollapse).toHaveBeenCalledTimes(1);
  });

  test("Add 5 more works even when lessons are empty", () => {
    renderComponent({
      ...baseAssignments,
      math: { ...baseAssignments.math, lessons: [] },
    });

    fireEvent.click(screen.getByText("Add 5 more"));
    expect(mockSetState).toHaveBeenCalledTimes(1);
  });

  test("renders multiple subjects with lessons correctly", () => {
    renderComponent({
      ...baseAssignments,
      science: {
        name: "Science",
        courseCode: "SCI",
        sort_index: 2,
        isCollapsed: false,
        lessons: [
          {
            id: "3",
            _chapterId: "c3",
            name: "Physics",
            image: null,
            selected: true,
            source: null,
            _chapterName: "Physics test",
          },
        ],
        allLessons: [],
      },
    });

    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.getByText("Physics")).toBeInTheDocument();
  });

  test("renders correct selected count for multiple subjects", () => {
    renderComponent({
      ...baseAssignments,
      science: {
        name: "Science",
        courseCode: "SCI",
        sort_index: 2,
        isCollapsed: false,
        lessons: [
          {
            id: "3",
            _chapterId: "c3",
            name: "Physics",
            image: null,
            selected: true,
            source: null,
            _chapterName: "Physics",
          },
        ],
        allLessons: [],
      },
    });

    expect(screen.getByText(/1\s*\/\s*1/)).toBeInTheDocument();
  });

  test("renders correctly when allLessons has values but lessons empty", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: [],
        allLessons: baseAssignments.math.lessons,
      },
    });

    expect(screen.getByText(/0\s*\/\s*0/)).toBeInTheDocument();
  });

  test("renders subject count correctly when single lesson exists", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: [
          {
            id: "10",
            _chapterId: "c10",
            name: "Trigonometry",
            image: null,
            selected: false,
            source: null,
            _chapterName: "Trigonometry",
          },
        ],
      },
    });

    expect(screen.getByText(/0\s*\/\s*1/)).toBeInTheDocument();
  });

  test("renders lesson even if image is null", () => {
    renderComponent();
    expect(screen.getByText("Algebra")).toBeInTheDocument();
  });

  test("subject click works even when no lessons", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: [],
      },
    });

    fireEvent.click(screen.getByText("Math"));

    expect(mockToggleSubjectCollapse).toHaveBeenCalledWith(
      TeacherAssignmentPageType.RECOMMENDED,
      "math",
    );
  });
  test("renders selected toggle with tick image", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: [
          {
            ...baseAssignments.math.lessons[0],
            selected: true,
          },
        ],
      },
    });

    const toggle = document.getElementById(
      "recommended-assignments-toggle-circle-math-0",
    );

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveClass(
      "recommended-assignments-toggle-circle",
      "is-selected",
    );

    const tickImage = toggle?.querySelector("img");
    expect(tickImage).toBeInTheDocument();
    expect(tickImage).toHaveClass("recommended-assignments-toggle-check");
  });

  test("renders unselected toggle without tick image", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: [
          {
            ...baseAssignments.math.lessons[0],
            selected: false,
          },
        ],
      },
    });

    const toggle = document.getElementById(
      "recommended-assignments-toggle-circle-math-0",
    );

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveClass(
      "recommended-assignments-toggle-circle",
      "is-unselected",
    );

    expect(toggle?.querySelector("img")).not.toBeInTheDocument();
  });

  test("renders multiple toggles correctly", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: [
          {
            ...baseAssignments.math.lessons[0],
            selected: true,
          },
          {
            ...baseAssignments.math.lessons[0],
            id: "lesson-2",
            selected: false,
          },
        ],
      },
    });

    const toggle1 = document.getElementById(
      "recommended-assignments-toggle-circle-math-0",
    );
    const toggle2 = document.getElementById(
      "recommended-assignments-toggle-circle-math-1",
    );

    expect(toggle1).toHaveClass("is-selected");
    expect(toggle2).toHaveClass("is-unselected");
  });

  test("toggle element exists even when image missing", () => {
    renderComponent({
      math: {
        ...baseAssignments.math,
        lessons: [
          {
            ...baseAssignments.math.lessons[0],
            image: null,
            selected: false,
          },
        ],
      },
    });

    const toggle = document.getElementById(
      "recommended-assignments-toggle-circle-math-0",
    );

    expect(toggle).toBeInTheDocument();
  });
});
