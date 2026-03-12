import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddCourse from "./AddCourse";
import "@testing-library/jest-dom";
import { t } from "i18next";
import { DEFUALT_SUBJECT_CARD_COLOUR } from "../../common/constants";

/* ---------------- MOCKS ---------------- */
let mockOnline = true;
const mockPresentToast = jest.fn();

// mock slider
jest.mock("@splidejs/react-splide", () => ({
  Splide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SplideSlide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// mock icon image component
jest.mock("./SelectIconImage", () => (props: { localSrc?: string; webSrc?: string }) => (
  <div
    data-testid="icon-mock"
    data-local-src={props.localSrc}
    data-web-src={props.webSrc}
  >
    Icon
  </div>
));

// mock loading component
jest.mock("../Loading", () => () => <div>Loading...</div>);

// mock i18n
jest.mock("i18next", () => ({
  t: (key: string) => key,
}));

// mock online/offline hook
jest.mock("../../common/onlineOfflineErrorMessageHandler", () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    online: mockOnline,
    presentToast: mockPresentToast,
  }),
}));

// mock ServiceConfig API
jest.mock("../../services/ServiceConfig", () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([
          { id: "1", name: "Chimple" },
        ]),
        getAllGrades: jest.fn().mockResolvedValue([
          { id: "g1", name: "Grade 1" },
        ]),
      },
    }),
  },
}));

/* ---------------- TEST DATA ---------------- */

const mockCourses = [
  {
    id: "c1",
    name: "Maths",
    code: "math",
    curriculum_id: "1",
    grade_id: "g1",
    color: "#000",
    sort_index: 1,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    description: "Math course",
    firebase_id: null,
    framework_id: null,
    medium_id: null,
    subject_id: null,
    image: null,
    is_deleted: false,
  },
];

/* ---------------- TEST CASES ---------------- */

describe("AddCourse Component", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockOnline = true;
    mockPresentToast.mockClear();
    jest
      .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
      .mockReturnValue({
        apiHandler: {
          getAllCurriculums: jest.fn().mockResolvedValue([
            { id: "1", name: "Chimple" },
          ]),
          getAllGrades: jest.fn().mockResolvedValue([
            { id: "g1", name: "Grade 1" },
          ]),
        },
      });
  });

  test("renders curriculum header", async () => {

    const { container } = render(
      <AddCourse
        courses={mockCourses}
        onSelectedCoursesChange={jest.fn()}
      />
    );

    await waitFor(() => {
      const header = container.querySelector(".add-course-subject-header");
      expect(header).toHaveTextContent("Chimple Curriculum");
    });

  });


  test("renders course card", async () => {

    render(
      <AddCourse
        courses={mockCourses}
        onSelectedCoursesChange={jest.fn()}
      />
    );

    const course = await screen.findByText("Maths");

    expect(course).toBeInTheDocument();

  });


  test("selects course on click", async () => {

    const mockCallback = jest.fn();

    render(
      <AddCourse
        courses={mockCourses}
        onSelectedCoursesChange={mockCallback}
      />
    );

    const course = await screen.findByText("Maths");

    fireEvent.click(course);

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });

  });


  test("toggles course selection", async () => {

    const mockCallback = jest.fn();

    render(
      <AddCourse
        courses={mockCourses}
        onSelectedCoursesChange={mockCallback}
      />
    );

    const course = await screen.findByText("Maths");

    fireEvent.click(course);
    fireEvent.click(course);

    expect(mockCallback).toHaveBeenCalledTimes(2);

  });


test("displays the correct grade name for a course", async () => {
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />);

  // Wait for API calls to resolve and map to update
  await waitFor(() => {
    expect(screen.getByText("Grade 1")).toBeInTheDocument();
  });
});

test("sorts courses based on sort_index", async () => {
  const unsortedCourses = [
    { ...mockCourses[0], id: "c2", name: "Science", sort_index: 2 },
    { ...mockCourses[0], id: "c1", name: "Maths", sort_index: 1 },
  ];

  render(<AddCourse courses={unsortedCourses} onSelectedCoursesChange={jest.fn()} />);

  const items = await screen.findAllByText(/Maths|Science/);
  // Check if Maths (index 1) comes before Science (index 2)
  expect(items[0]).toHaveTextContent("Maths");
  expect(items[1]).toHaveTextContent("Science");
});

test("shows checkmark icon when course is selected", async () => {
  const { container } = render(
    <AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />
  );

  const courseCard = await screen.findByText("Maths");
  
  // Initially, the check icon container shouldn't exist or be empty
  let checkIcon = container.querySelector("#add-course-subject-card-select-icon");
  expect(checkIcon).not.toBeInTheDocument();

  // Click to select
  fireEvent.click(courseCard);

  // Check if icon appears
  checkIcon = container.querySelector("#add-course-subject-card-select-icon");
  expect(checkIcon).toBeInTheDocument();
});



test("renders nothing when no courses are provided", () => {
  render(<AddCourse courses={[]} onSelectedCoursesChange={jest.fn()} />);
  const headers = screen.queryByText(/Curriculum/i);
  expect(headers).not.toBeInTheDocument();
});


test("allows multiple courses to be selected and returned in the callback", async () => {
  const mockCallback = jest.fn();
  const multiCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science" },
  ];

  render(<AddCourse courses={multiCourses} onSelectedCoursesChange={mockCallback} />);

  const mathCard = await screen.findByText("Maths");
  const scienceCard = await screen.findByText("Science");

  // Select first
  fireEvent.click(mathCard);
  // Select second
  fireEvent.click(scienceCard);

  // The last call to the callback should contain both course objects
  const lastCallIndex = mockCallback.mock.calls.length - 1;
  const selectedList = mockCallback.mock.calls[lastCallIndex][0];
  
  expect(selectedList).toHaveLength(2);
  expect(selectedList).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: "c1" }),
    expect.objectContaining({ id: "c2" })
  ]));
});

test("applies the correct background color from course data", async () => {
  const coloredCourse = [{ 
    ...mockCourses[0], 
    color: "#FF5733" // Specific orange color
  }];

  const { container } = render(
    <AddCourse courses={coloredCourse} onSelectedCoursesChange={jest.fn()} />
  );

  await screen.findByText("Maths");
  
  // Find the div with the class 'add-course-course-icon'
  const iconDiv = container.querySelector(".add-course-course-icon");
  
  // Note: JSDOM might convert hex to rgb
  expect(iconDiv).toHaveStyle(`background-color: #FF5733`);
});

// We need to update the mock at the top of the file first to track props:
// jest.mock("./SelectIconImage", () => (props) => <div data-testid="icon-mock" data-src={props.localSrc}>Icon</div>);

test("passes the correct local image path to SelectIconImage", async () => {
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />);

  await waitFor(() => {
    const icon = screen.getByTestId("icon-mock");
    expect(icon).toHaveAttribute(
      "data-local-src",
      "courses/chapter_icons/math.png"
    );
  });
});


test("handles missing sort_index by defaulting to 0", async () => {
  const mixedSorting = [
    { ...mockCourses[0], id: "c-high", name: "Z-Math", sort_index: 10 },
    { ...mockCourses[0], id: "c-null", name: "A-Science", sort_index: null },
  ];

  render(<AddCourse courses={mixedSorting} onSelectedCoursesChange={jest.fn()} />);

  const items = await screen.findAllByText(/Math|Science/);
  // A-Science (null -> 0) should come before Z-Math (10)
  expect(items[0]).toHaveTextContent("A-Science");
  expect(items[1]).toHaveTextContent("Z-Math");
});

test("renders empty grade title if grade_id is not found in map", async () => {
  const courseWithUnknownGrade = [{ 
    ...mockCourses[0], 
    grade_id: "unknown_id" 
  }];

  render(<AddCourse courses={courseWithUnknownGrade} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Maths");
  // Ensure "Grade 1" is NOT in the document
  expect(screen.queryByText("Grade 1")).not.toBeInTheDocument();
});

test("initializes selection array correctly on first click", async () => {
    const mockCallback = jest.fn();
    render(<AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />);

    const courseCard = await screen.findByText("Maths");
    fireEvent.click(courseCard);

    expect(mockCallback).toHaveBeenCalledWith([expect.objectContaining({ id: "c1" })]);
});


test("removes course from selection when clicked a second time", async () => {
  const mockCallback = jest.fn();
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />);

  const course = await screen.findByText("Maths");

  // First click (Select)
  fireEvent.click(course);
  expect(mockCallback).toHaveBeenLastCalledWith([expect.objectContaining({ id: "c1" })]);

  // Second click (Deselect)
  fireEvent.click(course);
  expect(mockCallback).toHaveBeenLastCalledWith([]); // Should be empty
});


test("does not render courses that do not match any existing curriculum", async () => {
  const orphanCourse = [
    { ...mockCourses[0], id: "c2", curriculum_id: "non-existent-id", name: "Ghost Course" }
  ];

  render(<AddCourse courses={orphanCourse} onSelectedCoursesChange={jest.fn()} />);

  // Wait for UI to settle
  await new Promise((r) => setTimeout(r, 100)); 

  const course = screen.queryByText("Ghost Course");
  expect(course).not.toBeInTheDocument();
});

test("passes webSrc to SelectIconImage when course has an image URL", async () => {
  const courseWithImage = [{ 
    ...mockCourses[0], 
    image: "https://example.com/math.png" 
  }];

  render(<AddCourse courses={courseWithImage} onSelectedCoursesChange={jest.fn()} />);

  await waitFor(() => {
    const icon = screen.getByTestId("icon-mock");
    expect(icon).toHaveAttribute("data-web-src", "https://example.com/math.png");
  });
});



test("handles the first course selection when state is null", async () => {
  const mockCallback = jest.fn();
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />);

  const courseCard = await screen.findByText("Maths");
  fireEvent.click(courseCard);

  // Verifies that it entered the 'if (coursesSelected == null)' block
  expect(mockCallback).toHaveBeenCalledWith([expect.objectContaining({ id: "c1" })]);
});


test("uses default icon path when course image is missing", async () => {
  const noImageCourse = [{ ...mockCourses[0], image: null }];
  
  render(<AddCourse courses={noImageCourse} onSelectedCoursesChange={jest.fn()} />);

  await waitFor(() => {
    const icon = screen.getByTestId("icon-mock");
    expect(icon).toHaveAttribute("data-web-src", "assets/icons/DefaultIcon.png");
  });
});

test("initializes all courses as unselected", async () => {
  const { container } = render(
    <AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />
  );

  await screen.findByText("Maths");
  
  // Check that the selection icon is NOT present initially
  const checkIcon = container.querySelector(".add-course-gender-check-box");
  expect(checkIcon).not.toBeInTheDocument();
});

test("handles a complex sequence of selecting and deselecting different courses", async () => {
  const mockCallback = jest.fn();
  const multipleCourses = [
    { ...mockCourses[0], id: "c1", name: "Course 1" },
    { ...mockCourses[0], id: "c2", name: "Course 2" },
    { ...mockCourses[0], id: "c3", name: "Course 3" },
  ];

  render(<AddCourse courses={multipleCourses} onSelectedCoursesChange={mockCallback} />);

  const c1 = await screen.findByText("Course 1");
  const c2 = await screen.findByText("Course 2");

  // Select 1, Select 2, Deselect 1
  fireEvent.click(c1);
  fireEvent.click(c2);
  fireEvent.click(c1);

  const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
  
  expect(lastCall).toHaveLength(1);
  expect(lastCall[0].id).toBe("c2");
});

test("applies DEFUALT_SUBJECT_CARD_COLOUR when course color is null", async () => {
  const noColorCourse = [{ ...mockCourses[0], color: null }];
  const { container } = render(<AddCourse courses={noColorCourse} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Maths");
  const iconContainer = container.querySelector(".add-course-course-icon");
  
  // Verify it uses the constant from your constants file
  expect(iconContainer).toHaveStyle(`background-color: ${DEFUALT_SUBJECT_CARD_COLOUR}`);
});

test("handles courses with missing or null grade_id gracefully", async () => {
  const orphanGradeCourse = [{ ...mockCourses[0], grade_id: null }];
  
  render(<AddCourse courses={orphanGradeCourse} onSelectedCoursesChange={jest.fn()} />);

  // Should render the course name, but the grade title should be an empty string
  const courseName = await screen.findByText("Maths");
  expect(courseName).toBeInTheDocument();
  
  // Verify no grade text is rendered in the grade title slot
  const gradeSlot = screen.queryByText("Grade 1");
  expect(gradeSlot).not.toBeInTheDocument();
});



test("correctly identifies existing course in selection array during toggle", async () => {
    const mockCallback = jest.fn();
    render(<AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />);
    
    const course = await screen.findByText("Maths");
    
    // Select
    fireEvent.click(course); 
    // The internal state 'coursesSelected' is now populated.
    
    // Deselect - this triggers the 'else' branch and the 'cCourse?.id === course?.id' check
    fireEvent.click(course); 
    
    expect(mockCallback).toHaveBeenLastCalledWith([]);
});

test("shows offline toast and does not trigger selection callback on click", async () => {
  mockOnline = false;
  const mockCallback = jest.fn();
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />);

  const course = await screen.findByText("Maths");
  fireEvent.click(course);

  expect(mockPresentToast).toHaveBeenCalledWith(
    expect.objectContaining({
      message: "Device is offline.",
      color: "danger",
      duration: 3000,
      position: "bottom",
    })
  );
  expect(mockCallback).not.toHaveBeenCalled();
});

test("renders separate curriculum headers when course list spans multiple curriculums", async () => {
  const mixedCurriculumCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths", curriculum_id: "1" },
    { ...mockCourses[0], id: "c2", name: "Science", curriculum_id: "2" },
  ];

  jest
    .spyOn(
      require("../../services/ServiceConfig").ServiceConfig,
      "getI"
    )
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([
          { id: "1", name: "Chimple" },
          { id: "2", name: "CBSE" },
        ]),
        getAllGrades: jest.fn().mockResolvedValue([
          { id: "g1", name: "Grade 1" },
        ]),
      },
    });

  const { container } = render(
    <AddCourse
      courses={mixedCurriculumCourses}
      onSelectedCoursesChange={jest.fn()}
    />
  );

  await waitFor(() => {
    const headers = Array.from(
      container.querySelectorAll(".add-course-subject-header")
    ).map((node) => node.textContent);
    expect(headers).toEqual(
      expect.arrayContaining(["Chimple Curriculum", "CBSE Curriculum"])
    );
  });
  expect(screen.getByText("Maths")).toBeInTheDocument();
  expect(screen.getByText("Science")).toBeInTheDocument();
});

test("calls curriculum and grade APIs on mount", async () => {
  const getAllCurriculums = jest.fn().mockResolvedValue([
    { id: "1", name: "Chimple" },
  ]);
  const getAllGrades = jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]);

  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums,
        getAllGrades,
      },
    });

  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />);

  await waitFor(() => {
    expect(getAllCurriculums).toHaveBeenCalledTimes(1);
    expect(getAllGrades).toHaveBeenCalledTimes(1);
  });
});

test("does not render any curriculum section when API returns no curriculums", async () => {
  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([]),
        getAllGrades: jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]),
      },
    });

  const { container } = render(
    <AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />
  );

  await waitFor(() => {
    expect(container.querySelector(".add-course-subject-header")).not.toBeInTheDocument();
  });
  expect(screen.queryByText("Maths")).not.toBeInTheDocument();
});

test("renders only courses that match curriculum ids returned by API", async () => {
  const mixedCurriculumCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths", curriculum_id: "1" },
    { ...mockCourses[0], id: "c2", name: "Science", curriculum_id: "2" },
  ];

  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([{ id: "1", name: "Chimple" }]),
        getAllGrades: jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]),
      },
    });

  render(
    <AddCourse courses={mixedCurriculumCourses} onSelectedCoursesChange={jest.fn()} />
  );

  expect(await screen.findByText("Maths")).toBeInTheDocument();
  expect(screen.queryByText("Science")).not.toBeInTheDocument();
});

test("shows selected indicator only for the courses that are clicked", async () => {
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];
  const { container } = render(
    <AddCourse courses={twoCourses} onSelectedCoursesChange={jest.fn()} />
  );

  const mathCard = await screen.findByText("Maths");
  const scienceCard = await screen.findByText("Science");

  fireEvent.click(mathCard);
  expect(
    container.querySelectorAll("#add-course-subject-card-select-icon").length
  ).toBe(1);

  fireEvent.click(scienceCard);
  expect(
    container.querySelectorAll("#add-course-subject-card-select-icon").length
  ).toBe(2);
});

test("renders grade labels correctly for multiple grade ids", async () => {
  const coursesWithDifferentGrades = [
    { ...mockCourses[0], id: "c1", name: "Maths", grade_id: "g1" },
    { ...mockCourses[0], id: "c2", name: "Science", grade_id: "g2", code: "science" },
  ];

  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([{ id: "1", name: "Chimple" }]),
        getAllGrades: jest.fn().mockResolvedValue([
          { id: "g1", name: "Grade 1" },
          { id: "g2", name: "Grade 2" },
        ]),
      },
    });

  render(
    <AddCourse courses={coursesWithDifferentGrades} onSelectedCoursesChange={jest.fn()} />
  );

  expect(await screen.findByText("Grade 1")).toBeInTheDocument();
  expect(screen.getByText("Grade 2")).toBeInTheDocument();
});

test("does not show grade label when grade API returns empty list", async () => {
  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([{ id: "1", name: "Chimple" }]),
        getAllGrades: jest.fn().mockResolvedValue([]),
      },
    });

  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Maths");
  expect(screen.queryByText("Grade 1")).not.toBeInTheDocument();
});

test("does not render curriculum header for curriculum ids without matching courses", async () => {
  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([
          { id: "1", name: "Chimple" },
          { id: "2", name: "CBSE" },
        ]),
        getAllGrades: jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]),
      },
    });

  const { container } = render(
    <AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />
  );

  await waitFor(() => {
    const headers = Array.from(
      container.querySelectorAll(".add-course-subject-header")
    ).map((node) => node.textContent);
    expect(headers).toContain("Chimple Curriculum");
  });
  expect(screen.queryByText("CBSE Curriculum")).not.toBeInTheDocument();
});

test("shows offline toast and does not invoke callback even though UI toggles selection", async () => {
  mockOnline = false;
  const mockCallback = jest.fn();
  const { container } = render(
    <AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />
  );

  const course = await screen.findByText("Maths");
  fireEvent.click(course);

  expect(mockPresentToast).toHaveBeenCalledWith(
    expect.objectContaining({
      message: "Device is offline.",
      color: "danger",
    })
  );
  expect(mockCallback).not.toHaveBeenCalled();
  expect(
    container.querySelector("#add-course-subject-card-select-icon")
  ).toBeInTheDocument();
});

test("callback receives selected course again after select-deselect-select sequence", async () => {
  const mockCallback = jest.fn();
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />);

  const course = await screen.findByText("Maths");
  fireEvent.click(course);
  fireEvent.click(course);
  fireEvent.click(course);

  expect(mockCallback).toHaveBeenLastCalledWith([
    expect.objectContaining({ id: "c1" }),
  ]);
});

test("removes only the clicked course when deselecting from a multi-selection", async () => {
  const mockCallback = jest.fn();
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];

  render(<AddCourse courses={twoCourses} onSelectedCoursesChange={mockCallback} />);

  const mathCard = await screen.findByText("Maths");
  const scienceCard = await screen.findByText("Science");
  fireEvent.click(mathCard);
  fireEvent.click(scienceCard);
  fireEvent.click(scienceCard);

  expect(mockCallback).toHaveBeenLastCalledWith([
    expect.objectContaining({ id: "c1" }),
  ]);
});

test("sorts correctly when sort_index includes negative values", async () => {
  const negativeSortCourses = [
    { ...mockCourses[0], id: "c1", name: "Later", sort_index: 0 },
    { ...mockCourses[0], id: "c2", name: "Earlier", sort_index: -1, code: "earlier" },
  ];

  render(<AddCourse courses={negativeSortCourses} onSelectedCoursesChange={jest.fn()} />);

  const items = await screen.findAllByText(/Earlier|Later/);
  expect(items[0]).toHaveTextContent("Earlier");
  expect(items[1]).toHaveTextContent("Later");
});

test("falls back to default sorting value when sort_index is undefined", async () => {
  const undefinedSortCourses = [
    { ...mockCourses[0], id: "c1", name: "NoSort", sort_index: null },
    { ...mockCourses[0], id: "c2", name: "Sorted", sort_index: 2, code: "sorted" },
  ];

  render(<AddCourse courses={undefinedSortCourses} onSelectedCoursesChange={jest.fn()} />);

  const items = await screen.findAllByText(/NoSort|Sorted/);
  expect(items[0]).toHaveTextContent("NoSort");
  expect(items[1]).toHaveTextContent("Sorted");
});

test("renders one icon component per visible course", async () => {
  const threeCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths", code: "math" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
    { ...mockCourses[0], id: "c3", name: "English", code: "english" },
  ];

  render(<AddCourse courses={threeCourses} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("English");
  expect(screen.getAllByTestId("icon-mock")).toHaveLength(3);
});

test("passes per-course local icon path based on course code", async () => {
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths", code: "math" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];

  render(<AddCourse courses={twoCourses} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Science");
  const iconMocks = screen.getAllByTestId("icon-mock");
  const localSrcs = iconMocks.map((node) => node.getAttribute("data-local-src"));

  expect(localSrcs).toEqual(
    expect.arrayContaining([
      "courses/chapter_icons/math.png",
      "courses/chapter_icons/science.png",
    ])
  );
});

test("uses default webSrc when image is an empty string", async () => {
  const emptyImageCourse = [{ ...mockCourses[0], image: "" }];
  render(<AddCourse courses={emptyImageCourse} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Maths");
  const icon = screen.getByTestId("icon-mock");
  expect(icon).toHaveAttribute("data-web-src", "assets/icons/DefaultIcon.png");
});

test("shows toast on every offline click attempt", async () => {
  mockOnline = false;
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />);

  const course = await screen.findByText("Maths");
  fireEvent.click(course);
  fireEvent.click(course);

  expect(mockPresentToast).toHaveBeenCalledTimes(2);
});

test("selection indicator count decreases after deselecting one course", async () => {
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];
  const { container } = render(
    <AddCourse courses={twoCourses} onSelectedCoursesChange={jest.fn()} />
  );

  const mathCard = await screen.findByText("Maths");
  const scienceCard = await screen.findByText("Science");
  fireEvent.click(mathCard);
  fireEvent.click(scienceCard);
  expect(container.querySelectorAll("#add-course-subject-card-select-icon")).toHaveLength(2);

  fireEvent.click(scienceCard);
  expect(container.querySelectorAll("#add-course-subject-card-select-icon")).toHaveLength(1);
});

test("callback reflects current implementation payload sizes for select-select-deselect flow", async () => {
  const mockCallback = jest.fn();
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];
  render(<AddCourse courses={twoCourses} onSelectedCoursesChange={mockCallback} />);

  const mathCard = await screen.findByText("Maths");
  const scienceCard = await screen.findByText("Science");
  fireEvent.click(mathCard);
  fireEvent.click(scienceCard);
  fireEvent.click(mathCard);

  const sizes = mockCallback.mock.calls.map((call) => call[0].length);
  expect(sizes).toEqual([1, 1, 1]);
});

test("renders one curriculum header for each curriculum that has matching courses", async () => {
  const multiCourses = [
    { ...mockCourses[0], id: "c1", curriculum_id: "1", name: "Maths" },
    { ...mockCourses[0], id: "c2", curriculum_id: "2", name: "Science", code: "science" },
    { ...mockCourses[0], id: "c3", curriculum_id: "3", name: "English", code: "english" },
  ];

  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([
          { id: "1", name: "Chimple" },
          { id: "2", name: "CBSE" },
          { id: "3", name: "IG" },
          { id: "4", name: "Unused" },
        ]),
        getAllGrades: jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]),
      },
    });

  const { container } = render(
    <AddCourse courses={multiCourses} onSelectedCoursesChange={jest.fn()} />
  );

  await waitFor(() => {
    const headers = container.querySelectorAll(".add-course-subject-header");
    expect(headers).toHaveLength(3);
  });
  expect(screen.queryByText("Unused Curriculum")).not.toBeInTheDocument();
});

test("renders loading placeholder once per rendered curriculum block", async () => {
  const multiCourses = [
    { ...mockCourses[0], id: "c1", curriculum_id: "1", name: "Maths" },
    { ...mockCourses[0], id: "c2", curriculum_id: "2", name: "Science", code: "science" },
  ];

  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([
          { id: "1", name: "Chimple" },
          { id: "2", name: "CBSE" },
        ]),
        getAllGrades: jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]),
      },
    });

  render(<AddCourse courses={multiCourses} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Science");
  expect(screen.getAllByText("Loading...")).toHaveLength(2);
});

test("keeps course order stable when two courses share the same sort_index", async () => {
  const sameSortCourses = [
    { ...mockCourses[0], id: "c1", name: "First", sort_index: 1, code: "first" },
    { ...mockCourses[0], id: "c2", name: "Second", sort_index: 1, code: "second" },
  ];

  render(<AddCourse courses={sameSortCourses} onSelectedCoursesChange={jest.fn()} />);

  const items = await screen.findAllByText(/First|Second/);
  expect(items[0]).toHaveTextContent("First");
  expect(items[1]).toHaveTextContent("Second");
});

test("renders course card text for each visible course", async () => {
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths", code: "math" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
    { ...mockCourses[0], id: "c3", name: "English", code: "english" },
  ];
  render(<AddCourse courses={courses} onSelectedCoursesChange={jest.fn()} />);

  expect(await screen.findByText("Maths")).toBeInTheDocument();
  expect(screen.getByText("Science")).toBeInTheDocument();
  expect(screen.getByText("English")).toBeInTheDocument();
});

test("clicking same course twice triggers callback twice when rendered online", async () => {
  const mockCallback = jest.fn();
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={mockCallback} />);

  const course = await screen.findByText("Maths");
  fireEvent.click(course);
  fireEvent.click(course);
  expect(mockCallback).toHaveBeenCalledTimes(2);
});

test("renders empty output when all courses belong to unknown curriculums", async () => {
  const unknownCourses = [
    { ...mockCourses[0], id: "u1", name: "Unknown 1", curriculum_id: "x1" },
    { ...mockCourses[0], id: "u2", name: "Unknown 2", curriculum_id: "x2", code: "u2" },
  ];

  render(<AddCourse courses={unknownCourses} onSelectedCoursesChange={jest.fn()} />);

  await waitFor(() => {
    expect(screen.queryByText("Unknown 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Unknown 2")).not.toBeInTheDocument();
    expect(screen.queryByText(/Curriculum/)).not.toBeInTheDocument();
  });
});

test("offline toast payload includes dismiss cancel button", async () => {
  mockOnline = false;
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />);

  fireEvent.click(await screen.findByText("Maths"));

  expect(mockPresentToast).toHaveBeenCalledWith(
    expect.objectContaining({
      buttons: [expect.objectContaining({ text: "Dismiss", role: "cancel" })],
    })
  );
});

test("offline clicks on multiple courses do not trigger selection callback", async () => {
  mockOnline = false;
  const mockCallback = jest.fn();
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];
  render(<AddCourse courses={twoCourses} onSelectedCoursesChange={mockCallback} />);

  fireEvent.click(await screen.findByText("Maths"));
  fireEvent.click(await screen.findByText("Science"));
  expect(mockCallback).not.toHaveBeenCalled();
});

test("renders a single header when multiple courses belong to one curriculum", async () => {
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];
  const { container } = render(
    <AddCourse courses={twoCourses} onSelectedCoursesChange={jest.fn()} />
  );

  await screen.findByText("Science");
  expect(container.querySelectorAll(".add-course-subject-header")).toHaveLength(1);
});

test("renders per-card curriculum text for each visible course", async () => {
  const twoCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
  ];
  render(<AddCourse courses={twoCourses} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Science");
  expect(screen.getAllByText("Chimple Curriculum")).toHaveLength(3);
});

test("calls curriculum and grade APIs even when courses prop is empty", async () => {
  const getAllCurriculums = jest.fn().mockResolvedValue([{ id: "1", name: "Chimple" }]);
  const getAllGrades = jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]);

  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums,
        getAllGrades,
      },
    });

  render(<AddCourse courses={[]} onSelectedCoursesChange={jest.fn()} />);

  await waitFor(() => {
    expect(getAllCurriculums).toHaveBeenCalledTimes(1);
    expect(getAllGrades).toHaveBeenCalledTimes(1);
  });
});

test("does not render loading placeholder when no curriculum section is rendered", async () => {
  const unknownCourses = [{ ...mockCourses[0], id: "x1", curriculum_id: "unknown" }];
  render(<AddCourse courses={unknownCourses} onSelectedCoursesChange={jest.fn()} />);

  await waitFor(() => {
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});

test("keeps initial course list when rerendered with different courses", async () => {
  const { rerender } = render(
    <AddCourse courses={[{ ...mockCourses[0], id: "c1", name: "Maths" }]} onSelectedCoursesChange={jest.fn()} />
  );
  expect(await screen.findByText("Maths")).toBeInTheDocument();

  rerender(
    <AddCourse
      courses={[{ ...mockCourses[0], id: "c2", name: "Science", code: "science" }]}
      onSelectedCoursesChange={jest.fn()}
    />
  );

  expect(screen.getByText("Maths")).toBeInTheDocument();
  expect(screen.queryByText("Science")).not.toBeInTheDocument();
});

test("applies mixed explicit and default icon background colors", async () => {
  const mixedColorCourses = [
    { ...mockCourses[0], id: "c1", name: "Maths", color: "#123456" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science", color: null },
  ];
  const { container } = render(
    <AddCourse courses={mixedColorCourses} onSelectedCoursesChange={jest.fn()} />
  );

  await screen.findByText("Science");
  const iconDivs = Array.from(container.querySelectorAll(".add-course-course-icon"));
  const styles = iconDivs.map((node) => node.getAttribute("style") || "");
  expect(styles.some((s) => s.includes("rgb(18, 52, 86)"))).toBe(true);
  expect(styles.some((s) => !s.includes("rgb(18, 52, 86)"))).toBe(true);
});

test("preserves course code casing while building local icon path", async () => {
  const codedCourse = [{ ...mockCourses[0], id: "c1", code: "MATH_ADV" }];
  render(<AddCourse courses={codedCourse} onSelectedCoursesChange={jest.fn()} />);

  const icon = await screen.findByTestId("icon-mock");
  expect(icon).toHaveAttribute(
    "data-local-src",
    "courses/chapter_icons/MATH_ADV.png"
  );
});

test("selection indicator returns to zero after selecting and deselecting same course", async () => {
  const { container } = render(
    <AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />
  );
  const course = await screen.findByText("Maths");

  fireEvent.click(course);
  expect(container.querySelectorAll("#add-course-subject-card-select-icon")).toHaveLength(1);

  fireEvent.click(course);
  expect(container.querySelectorAll("#add-course-subject-card-select-icon")).toHaveLength(0);
});

test("offline toast payload includes duration and bottom position", async () => {
  mockOnline = false;
  render(<AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />);

  fireEvent.click(await screen.findByText("Maths"));
  expect(mockPresentToast).toHaveBeenCalledWith(
    expect.objectContaining({
      duration: 3000,
      position: "bottom",
    })
  );
});

test("renders one clickable subject button per visible course", async () => {
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
    { ...mockCourses[0], id: "c3", name: "English", code: "english" },
  ];
  const { container } = render(
    <AddCourse courses={courses} onSelectedCoursesChange={jest.fn()} />
  );

  await screen.findByText("English");
  expect(container.querySelectorAll(".add-course-subject-button")).toHaveLength(3);
});

test("subject button count excludes courses filtered out by curriculum mismatch", async () => {
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths", curriculum_id: "1" },
    { ...mockCourses[0], id: "c2", name: "Ghost", curriculum_id: "x1", code: "ghost" },
  ];
  const { container } = render(
    <AddCourse courses={courses} onSelectedCoursesChange={jest.fn()} />
  );

  await screen.findByText("Maths");
  expect(container.querySelectorAll(".add-course-subject-button")).toHaveLength(1);
  expect(screen.queryByText("Ghost")).not.toBeInTheDocument();
});

test("selecting three courses yields callback payload of length three", async () => {
  const mockCallback = jest.fn();
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
    { ...mockCourses[0], id: "c3", name: "English", code: "english" },
  ];
  render(<AddCourse courses={courses} onSelectedCoursesChange={mockCallback} />);

  fireEvent.click(await screen.findByText("Maths"));
  fireEvent.click(await screen.findByText("Science"));
  fireEvent.click(await screen.findByText("English"));

  expect(mockCallback).toHaveBeenLastCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ id: "c1" }),
      expect.objectContaining({ id: "c2" }),
      expect.objectContaining({ id: "c3" }),
    ])
  );
});

test("deselecting the middle course after selecting three leaves first and third ids", async () => {
  const mockCallback = jest.fn();
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science" },
    { ...mockCourses[0], id: "c3", name: "English", code: "english" },
  ];
  render(<AddCourse courses={courses} onSelectedCoursesChange={mockCallback} />);

  const maths = await screen.findByText("Maths");
  const science = await screen.findByText("Science");
  const english = await screen.findByText("English");
  fireEvent.click(maths);
  fireEvent.click(science);
  fireEvent.click(english);
  fireEvent.click(science);

  expect(mockCallback).toHaveBeenLastCalledWith([
    expect.objectContaining({ id: "c1" }),
    expect.objectContaining({ id: "c3" }),
  ]);
});

test("selected card renders check icon class", async () => {
  const { container } = render(
    <AddCourse courses={mockCourses} onSelectedCoursesChange={jest.fn()} />
  );
  fireEvent.click(await screen.findByText("Maths"));
  expect(container.querySelector(".add-course-gender-check-box")).toBeInTheDocument();
});

test("mixed custom and default webSrc values are both present across cards", async () => {
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths", image: "https://img/maths.png" },
    { ...mockCourses[0], id: "c2", name: "Science", code: "science", image: null },
  ];
  render(<AddCourse courses={courses} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Science");
  const srcs = screen
    .getAllByTestId("icon-mock")
    .map((icon) => icon.getAttribute("data-web-src"));
  expect(srcs).toEqual(
    expect.arrayContaining(["https://img/maths.png", "assets/icons/DefaultIcon.png"])
  );
});

test("renders two headers and two buttons for two valid curriculums with one course each", async () => {
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths", curriculum_id: "1" },
    { ...mockCourses[0], id: "c2", name: "Science", curriculum_id: "2", code: "science" },
  ];
  jest
    .spyOn(require("../../services/ServiceConfig").ServiceConfig, "getI")
    .mockReturnValue({
      apiHandler: {
        getAllCurriculums: jest.fn().mockResolvedValue([
          { id: "1", name: "Chimple" },
          { id: "2", name: "CBSE" },
        ]),
        getAllGrades: jest.fn().mockResolvedValue([{ id: "g1", name: "Grade 1" }]),
      },
    });

  const { container } = render(
    <AddCourse courses={courses} onSelectedCoursesChange={jest.fn()} />
  );
  await screen.findByText("Science");
  expect(container.querySelectorAll(".add-course-subject-header")).toHaveLength(2);
  expect(container.querySelectorAll(".add-course-subject-button")).toHaveLength(2);
});

test("renders no headers and no subject buttons when no course matches loaded curriculums", async () => {
  const unknownCourses = [
    { ...mockCourses[0], id: "u1", name: "U1", curriculum_id: "x1" },
    { ...mockCourses[0], id: "u2", name: "U2", curriculum_id: "x2", code: "u2" },
  ];
  const { container } = render(
    <AddCourse courses={unknownCourses} onSelectedCoursesChange={jest.fn()} />
  );

  await waitFor(() => {
    expect(container.querySelectorAll(".add-course-subject-header")).toHaveLength(0);
    expect(container.querySelectorAll(".add-course-subject-button")).toHaveLength(0);
  });
});

test("renders repeated grade title for multiple courses sharing same grade", async () => {
  const courses = [
    { ...mockCourses[0], id: "c1", name: "Maths", grade_id: "g1" },
    { ...mockCourses[0], id: "c2", name: "Science", grade_id: "g1", code: "science" },
  ];
  render(<AddCourse courses={courses} onSelectedCoursesChange={jest.fn()} />);

  await screen.findByText("Science");
  expect(screen.getAllByText("Grade 1")).toHaveLength(2);
});

});
