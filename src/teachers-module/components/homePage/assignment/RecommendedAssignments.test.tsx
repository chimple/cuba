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

jest.mock("@ionic/react", () => ({
  IonIcon: (props: any) => (
    <div data-testid="ion-icon" onClick={props.onClick}>
      icon
    </div>
  ),
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
      },
      {
        id: "2",
        _chapterId: "c2",
        name: "Geometry",
        image: null,
        selected: false,
        source: null,
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
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  test("calls toggleSubjectCollapse on subject click", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Math"));
    expect(mockToggleSubjectCollapse).toHaveBeenCalledWith(
      TeacherAssignmentPageType.RECOMMENDED,
      "math",
    );
  });

  test("calls toggleAssignmentSelection when icon clicked", () => {
    renderComponent();
    fireEvent.click(screen.getAllByTestId("ion-icon")[0]);
    expect(mockToggleAssignmentSelection).toHaveBeenCalledTimes(1);
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

  test("renders correct number of icons", () => {
    renderComponent();
    expect(screen.getAllByTestId("ion-icon")).toHaveLength(2);
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

    expect(screen.getByText("0/0")).toBeInTheDocument();
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

    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  test("toggleAssignmentSelection receives correct parameters", () => {
    renderComponent();
    fireEvent.click(screen.getAllByTestId("ion-icon")[1]);

    expect(mockToggleAssignmentSelection).toHaveBeenCalledWith(
      TeacherAssignmentPageType.RECOMMENDED,
      baseAssignments,
      mockSetState,
      "math",
      1,
    );
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
  test("does not allow lesson toggle when subject is collapsed", () => {
    renderComponent({
      ...baseAssignments,
      math: { ...baseAssignments.math, isCollapsed: true },
    });

    expect(screen.queryByTestId("ion-icon")).not.toBeInTheDocument();
    expect(mockToggleAssignmentSelection).not.toHaveBeenCalled();
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

    expect(screen.getByText("0/2")).toBeInTheDocument();
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
});
