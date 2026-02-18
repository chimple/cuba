import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import path from "path";
import DisplayChapters from "./DisplayChapters";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  CURRENT_SELECTED_CHAPTER,
  CURRENT_SELECTED_COURSE,
  CURRENT_SELECTED_GRADE,
  CURRENT_STAGE,
  GRADE_MAP,
  MODES,
  PAGES,
} from "../common/constants";

const mockHistory = {
  replace: jest.fn(),
  push: jest.fn(),
  block: jest.fn(),
  goBack: jest.fn(),
  length: 2,
};
const mockLocation = { search: "", pathname: PAGES.DISPLAY_CHAPTERS };

const mockGetCurrentStudent = jest.fn();
const mockLoadBackgroundImage = jest.fn();
const mockSetPathToBackButton = jest.fn();
const mockGetCurrentClass = jest.fn();
const mockGetCurrMode = jest.fn();
const mockRegisterBackButtonHandler = jest.fn(() => jest.fn());
const mockScreenLock = jest.fn();

const eventually = async (assertion: () => void, timeoutMs = 5000) =>
  waitFor(assertion, { timeout: timeoutMs });

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useHistory: () => mockHistory,
  useLocation: () => mockLocation,
}));

jest.mock("i18next", () => ({
  t: (k: string) => k,
}));

jest.mock("../utility/util", () => ({
  Util: {
    getCurrentStudent: () => mockGetCurrentStudent(),
    loadBackgroundImage: () => mockLoadBackgroundImage(),
    setPathToBackButton: (...args: any[]) => mockSetPathToBackButton(...args),
  },
}));

jest.mock("../utility/schoolUtil", () => ({
  schoolUtil: {
    getCurrentClass: () => mockGetCurrentClass(),
    getCurrMode: () => mockGetCurrMode(),
  },
}));

jest.mock("../common/backButtonRegistry", () => ({
  registerBackButtonHandler: (...args: any[]) =>
    mockRegisterBackButtonHandler(...args),
}));

jest.mock("@capacitor/screen-orientation", () => ({
  ScreenOrientation: {
    lock: (...args: any[]) => mockScreenLock(...args),
  },
}));

jest.mock("../components/SkeltonLoading", () => ({
  __esModule: true,
  default: ({ isLoading, header, isChapter }: any) => (
    <div data-testid="chapters-skeleton">
      {String(isLoading)}-{String(header)}-{String(isChapter)}
    </div>
  ),
}));

jest.mock("../components/displaySubjects/SelectChapter", () => ({
  __esModule: true,
  default: ({ chapters, onChapterChange, currentChapterId }: any) => (
    <div data-testid="select-chapter" data-current-chapter={currentChapterId || ""}>
      {chapters.map((chapter: any) => (
        <button
          key={chapter.id}
          type="button"
          data-testid={`chapter-${chapter.id}`}
          onClick={() => onChapterChange(chapter)}
        >
          {chapter.name}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("../components/LessonSlider", () => ({
  __esModule: true,
  default: ({ lessonData, startIndex }: any) => (
    <div
      data-testid="lesson-slider"
      data-start-index={String(startIndex)}
      data-lesson-count={String(lessonData?.length ?? 0)}
    >
      lesson-slider
    </div>
  ),
}));

jest.mock("../components/DropDown", () => ({
  __esModule: true,
  default: ({ optionList, currentValue, onValueChange }: any) => (
    <select
      data-testid="grade-dropdown"
      value={currentValue}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {optionList.map((option: any) => (
        <option value={option.id} key={option.id}>
          {option.displayName}
        </option>
      ))}
    </select>
  ),
}));

jest.mock("../components/common/BackButton", () => ({
  __esModule: true,
  default: ({ onClicked }: any) => (
    <button type="button" data-testid="chapters-back" onClick={onClicked}>
      Back
    </button>
  ),
}));

jest.mock("@ionic/react", () => ({
  IonPage: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  IonItem: ({ children }: any) => <div>{children}</div>,
  IonIcon: () => null,
  IonList: ({ children }: any) => <div>{children}</div>,
}));

describe("DisplayChapters", () => {
  const student = { id: "student-1", name: "Student One" } as any;
  const classObj = { id: "class-1", name: "Class One" } as any;
  const grade1 = { id: "g1", name: "Grade 1" } as any;
  const grade2 = { id: "g2", name: "Grade 2" } as any;

  const course1 = {
    id: "course-1",
    name: "Math",
    grade_id: "g1",
  } as any;
  const course2 = {
    id: "course-2",
    name: "English",
    grade_id: "g2",
  } as any;

  const chapter1 = { id: "chapter-1", name: "Numbers" } as any;
  const chapter2 = { id: "chapter-2", name: "Reading" } as any;

  const lesson1 = { id: "lesson-1", name: "L1" } as any;
  const lesson2 = { id: "lesson-2", name: "L2" } as any;

  const lessonResultMap = {
    "lesson-1": {
      id: "r1",
      lesson_id: "lesson-1",
      score: 10,
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    "lesson-2": {
      id: "r2",
      lesson_id: "lesson-2",
      score: 30,
      updated_at: "2026-01-03T00:00:00.000Z",
    },
  } as any;

  const mockApiHandler = {
    getStudentResultInMap: jest.fn(),
    getCoursesForClassStudent: jest.fn(),
    getCoursesForParentsStudent: jest.fn(),
    getDifferentGradesForCourse: jest.fn(),
    getChaptersForCourse: jest.fn(),
    getLessonsForChapter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockHistory.block.mockImplementation(() => jest.fn());

    mockLocation.search = "";
    mockLocation.pathname = PAGES.DISPLAY_CHAPTERS;

    mockGetCurrentStudent.mockReturnValue(student);
    mockGetCurrentClass.mockReturnValue(classObj);
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);

    mockApiHandler.getStudentResultInMap.mockResolvedValue(lessonResultMap);
    mockApiHandler.getCoursesForClassStudent.mockResolvedValue([course1, course2]);
    mockApiHandler.getCoursesForParentsStudent.mockResolvedValue([course1]);
    mockApiHandler.getDifferentGradesForCourse.mockResolvedValue({
      grades: [grade1, grade2],
      courses: [course1, course2],
    });
    mockApiHandler.getChaptersForCourse.mockResolvedValue([chapter1, chapter2]);
    mockApiHandler.getLessonsForChapter.mockResolvedValue([lesson1, lesson2]);

    jest.spyOn(ServiceConfig, "getI").mockReturnValue({
      apiHandler: mockApiHandler,
    } as any);
  });

  it("runs page initialization effects", async () => {
    render(<DisplayChapters />);

    await eventually(() => {
      expect(mockLoadBackgroundImage).toHaveBeenCalled();
      expect(mockScreenLock).toHaveBeenCalledWith({ orientation: "landscape" });
      expect(mockRegisterBackButtonHandler).toHaveBeenCalled();
      expect(mockHistory.block).toHaveBeenCalled();
    });
  });

  it("redirects to select mode if current student is missing", async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);

    render(<DisplayChapters />);

    await eventually(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
  });

  it("fetches class courses in school mode when class exists", async () => {
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockGetCurrentClass.mockReturnValue(classObj);

    render(<DisplayChapters />);

    await eventually(() => {
      expect(mockApiHandler.getCoursesForClassStudent).toHaveBeenCalledWith(
        classObj.id
      );
    });
  });

  it("fetches parent courses when mode is parent", async () => {
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);

    render(<DisplayChapters />);

    await eventually(() => {
      expect(mockApiHandler.getCoursesForParentsStudent).toHaveBeenCalledWith(
        student.id
      );
    });
  });

  it("resolves course from URL and renders chapters + grade dropdown", async () => {
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );

    const view = render(<DisplayChapters />);

    await eventually(() => {
      expect(mockApiHandler.getDifferentGradesForCourse).toHaveBeenCalledWith(
        course1
      );
      expect(view.getByTestId("select-chapter")).toBeInTheDocument();
      expect(view.getByTestId("grade-dropdown")).toBeInTheDocument();
    });
  });

  it("changes grade and refreshes chapter list", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );

    const view = render(<DisplayChapters />);

    await view.findByTestId("grade-dropdown");
    await user.selectOptions(view.getByTestId("grade-dropdown"), "g2");

    await eventually(() => {
      expect(mockApiHandler.getChaptersForCourse).toHaveBeenCalledWith(course2.id);
      expect(localStorage.getItem(CURRENT_SELECTED_GRADE)).toContain("g2");
      expect(localStorage.getItem(CURRENT_SELECTED_COURSE)).toContain(course2.id);
    });
  });

  it("updates displayed chapters when dropdown grade changes", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );
    mockApiHandler.getChaptersForCourse.mockImplementation(async (courseId: string) =>
      courseId === course1.id
        ? [{ id: "chapter-a", name: "Grade 1 Chapter" }]
        : [{ id: "chapter-b", name: "Grade 2 Chapter" }]
    );

    const view = render(<DisplayChapters />);
    await view.findByTestId("grade-dropdown");

    await eventually(() => {
      expect(view.getByTestId("chapter-chapter-a")).toBeInTheDocument();
      expect(view.queryByTestId("chapter-chapter-b")).not.toBeInTheDocument();
    });

    await user.selectOptions(view.getByTestId("grade-dropdown"), "g2");

    await eventually(() => {
      expect(view.getByTestId("chapter-chapter-b")).toBeInTheDocument();
      expect(view.queryByTestId("chapter-chapter-a")).not.toBeInTheDocument();
    });
  });

  it("selects chapter and opens lessons slider", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );

    const view = render(<DisplayChapters />);

    await view.findByTestId("select-chapter");
    await user.click(view.getByTestId(`chapter-${chapter1.id}`));

    await eventually(() => {
      expect(mockApiHandler.getLessonsForChapter).toHaveBeenCalledWith(chapter1.id);
      expect(localStorage.getItem(CURRENT_SELECTED_CHAPTER)).toContain(chapter1.id);
      expect(localStorage.getItem(CURRENT_STAGE)).toBe("2");
      expect(view.getByTestId("lesson-slider")).toBeInTheDocument();
      expect(view.getByTestId("lesson-slider")).toHaveAttribute(
        "data-start-index",
        "1"
      );
    });
  });

  it("hides grade dropdown after entering lessons stage", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );

    const view = render(<DisplayChapters />);
    await view.findByTestId("grade-dropdown");
    await user.click(view.getByTestId(`chapter-${chapter1.id}`));
    await view.findByTestId("lesson-slider");

    expect(view.queryByTestId("grade-dropdown")).not.toBeInTheDocument();
  });

  it("handles lesson API failure without rendering lesson slider", async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );
    mockApiHandler.getLessonsForChapter.mockRejectedValue(new Error("api error"));

    const view = render(<DisplayChapters />);

    await view.findByTestId("select-chapter");
    await user.click(view.getByTestId(`chapter-${chapter1.id}`));

    await eventually(() => {
      expect(mockApiHandler.getLessonsForChapter).toHaveBeenCalledWith(chapter1.id);
      expect(errorSpy).toHaveBeenCalled();
    });
    expect(view.queryByTestId("lesson-slider")).not.toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it("back button from lessons returns to chapters and clears selected chapter", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );

    const view = render(<DisplayChapters />);

    await view.findByTestId("select-chapter");
    await user.click(view.getByTestId(`chapter-${chapter1.id}`));
    await view.findByTestId("lesson-slider");

    await user.click(view.getByTestId("chapters-back"));

    await eventually(() => {
      expect(localStorage.getItem(CURRENT_SELECTED_CHAPTER)).toBeNull();
      expect(view.queryByTestId("lesson-slider")).not.toBeInTheDocument();
      expect(view.getByTestId("select-chapter")).toBeInTheDocument();
    });
  });

  it("back button from chapters routes home and clears selected course/grade", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );
    localStorage.setItem(CURRENT_SELECTED_COURSE, JSON.stringify(course1));
    localStorage.setItem(CURRENT_SELECTED_GRADE, JSON.stringify(grade1));

    const view = render(<DisplayChapters />);
    await view.findByTestId("select-chapter");

    await user.click(view.getByTestId("chapters-back"));

    await eventually(() => {
      expect(localStorage.getItem(CURRENT_SELECTED_COURSE)).toBeNull();
      expect(localStorage.getItem(CURRENT_SELECTED_GRADE)).toBeNull();
      expect(mockSetPathToBackButton).toHaveBeenCalledWith(PAGES.HOME, mockHistory);
    });
  });

  it("handles ion back callback by returning from lessons to chapters", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );

    const view = render(<DisplayChapters />);
    await view.findByTestId("select-chapter");
    await user.click(view.getByTestId(`chapter-${chapter1.id}`));
    await view.findByTestId("lesson-slider");

    let backCallback: (() => void) | undefined;
    const register = jest.fn((_priority: number, callback: () => void) => {
      backCallback = callback;
    });
    const event: any = new Event("ionBackButton");
    event.detail = { register };
    fireEvent(document, event);

    expect(register).toHaveBeenCalled();
    expect(typeof backCallback).toBe("function");

    await act(async () => {
      backCallback?.();
    });

    await eventually(() => {
      expect(localStorage.getItem(CURRENT_SELECTED_CHAPTER)).toBeNull();
      expect(view.queryByTestId("lesson-slider")).not.toBeInTheDocument();
      expect(view.getByTestId("select-chapter")).toBeInTheDocument();
    });
  });

  it("handles registered back callback from chapters stage", async () => {
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );
    localStorage.setItem(CURRENT_SELECTED_COURSE, JSON.stringify(course1));
    localStorage.setItem(CURRENT_SELECTED_GRADE, JSON.stringify(grade1));

    const view = render(<DisplayChapters />);
    await view.findByTestId("select-chapter");
    await eventually(() => {
      expect(mockRegisterBackButtonHandler).toHaveBeenCalled();
    });

    const callback =
      mockRegisterBackButtonHandler.mock.calls[
        mockRegisterBackButtonHandler.mock.calls.length - 1
      ][0];
    let handled = false;
    await act(async () => {
      handled = callback();
    });

    expect(handled).toBe(true);
    await eventually(() => {
      expect(localStorage.getItem(CURRENT_SELECTED_COURSE)).toBeNull();
      expect(localStorage.getItem(CURRENT_SELECTED_GRADE)).toBeNull();
      expect(mockSetPathToBackButton).toHaveBeenCalledWith(PAGES.HOME, mockHistory);
    });
  });

  it("hydrates from isReload localStorage and restores lessons", async () => {
    mockLocation.search = "?isReload=true";
    localStorage.setItem(CURRENT_SELECTED_COURSE, JSON.stringify(course1));
    localStorage.setItem(CURRENT_SELECTED_CHAPTER, JSON.stringify(chapter1));
    localStorage.setItem(CURRENT_SELECTED_GRADE, JSON.stringify(grade1));
    localStorage.setItem(CURRENT_STAGE, JSON.stringify(2));

    const view = render(<DisplayChapters />);

    await eventually(() => {
      expect(mockApiHandler.getChaptersForCourse).toHaveBeenCalledWith(course1.id);
      expect(mockApiHandler.getLessonsForChapter).toHaveBeenCalledWith(chapter1.id);
      expect(view.getByTestId("lesson-slider")).toBeInTheDocument();
    });
  });

  it("registers ionBackButton handling in lessons stage", async () => {
    const user = userEvent.setup();
    mockLocation.search = `?courseDocId=${course1.id}`;
    localStorage.setItem(
      GRADE_MAP,
      JSON.stringify({ grades: [grade1, grade2], courses: [course1, course2] })
    );

    const view = render(<DisplayChapters />);

    await view.findByTestId("select-chapter");
    await user.click(view.getByTestId(`chapter-${chapter1.id}`));
    await view.findByTestId("lesson-slider");

    const register = jest.fn();
    const event: any = new Event("ionBackButton");
    event.detail = { register };

    fireEvent(document, event);

    expect(register).toHaveBeenCalled();
  });

  it("shows skeleton while page is loading", () => {
    mockApiHandler.getStudentResultInMap.mockImplementation(
      () => new Promise(() => {})
    );

    const view = render(<DisplayChapters />);

    expect(view.getByTestId("chapters-skeleton")).toHaveTextContent(
      `true-${PAGES.DISPLAY_CHAPTERS}-true`
    );
  });

  it("keeps chapters page scroll container contract", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/pages/DisplayChapters.css"),
      "utf8"
    );

    expect(css).toMatch(/\.chapters-content\s*\{[\s\S]*overflow-y:\s*scroll;/);
  });
});
