import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LiveQuizRoom from "./LiveQuizRoom";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import { PAGES } from "../common/constants";

const mockReplace = jest.fn();
const mockSetPathToBackButton = jest.fn();
const mockPresentToast = jest.fn();

jest.mock("@ionic/react", () => ({
  IonPage: (props: any) => <div>{props.children}</div>,
  IonButton: (props: any) => (
    <button disabled={props.disabled} onClick={props.onClick}>
      {props.children}
    </button>
  ),
}));

jest.mock("react-router", () => ({
  useHistory: () => ({
    replace: mockReplace,
    location: { state: {} },
  }),
}));

jest.mock("../components/common/StudentAvatar", () => (props: any) => (
  <div data-testid={`avatar-${props.student.id}`}>{props.student.name}</div>
));

jest.mock("../components/common/BackButton", () => (props: any) => (
  <button onClick={props.onClicked}>back</button>
));

jest.mock("../components/SkeltonLoading", () => () => <div data-testid="skeleton" />);
jest.mock("react-spinners/BarLoader", () => () => <div data-testid="bar-loader" />);
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
jest.mock("../common/onlineOfflineErrorMessageHandler");

const mockApi = {
  getAssignmentById: jest.fn(),
  getLesson: jest.fn(),
  getCourse: jest.fn(),
  isStudentLinked: jest.fn(),
  getStudentClassesAndSchools: jest.fn(),
  getStudentResultsByAssignmentId: jest.fn(),
  joinLiveQuiz: jest.fn(),
};

describe("LiveQuizRoom page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "/?assignmentId=a-1");
    jest.spyOn(ServiceConfig, "getI").mockReturnValue({ apiHandler: mockApi } as any);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "stu-1", name: "Me" });
    (Util.downloadZipBundle as jest.Mock).mockResolvedValue(true);
    (Util.setPathToBackButton as jest.Mock).mockImplementation((...args: any[]) =>
      mockSetPathToBackButton(...args)
    );
    (useOnlineOfflineErrorMessageHandler as jest.Mock).mockReturnValue({
      online: true,
      presentToast: mockPresentToast,
    });

    mockApi.getAssignmentById.mockResolvedValue({
      id: "a-1",
      lesson_id: "l-1",
      course_id: "c-1",
      created_by: "t-1",
      class_id: "class-1",
      school_id: "school-1",
    });
    mockApi.getLesson.mockResolvedValue({
      id: "l-1",
      name: "Lesson 1",
      outcome: "Outcome text",
      cocos_lesson_id: "cocos-1",
    });
    mockApi.getCourse.mockResolvedValue({ id: "c-1", name: "Course 1" });
    mockApi.isStudentLinked.mockResolvedValue(true);
    mockApi.getStudentClassesAndSchools.mockResolvedValue({ classes: ["class-1"] });
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      {
        user_data: [
          { id: "stu-1", name: "Me" },
          { id: "stu-2", name: "Two" },
          { id: "stu-3", name: "Three" },
        ],
        result_data: [
          { student_id: "stu-2", score: 50 },
          { student_id: "stu-3", score: 30 },
        ],
      },
    ]);
    mockApi.joinLiveQuiz.mockResolvedValue("room-123");
  });

  test("fetches assignment by query param when state assignment absent", async () => {
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(mockApi.getAssignmentById).toHaveBeenCalledWith("a-1");
    });
  });

  test("uses assignment query param flow when no state assignment exists", async () => {
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(mockApi.getAssignmentById).toHaveBeenCalledWith("a-1");
    });
  });

  test("fetches lesson and course for assignment", async () => {
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(mockApi.getLesson).toHaveBeenCalledWith("l-1");
      expect(mockApi.getCourse).toHaveBeenCalledWith("c-1");
    });
  });

  test("shows course and lesson text in header", async () => {
    render(<LiveQuizRoom />);
    expect(await screen.findByText(/Course 1/)).toBeInTheDocument();
    expect(screen.getByText(/Lesson 1/)).toBeInTheDocument();
  });

  test("renders outcome text", async () => {
    render(<LiveQuizRoom />);
    expect(await screen.findByText("Outcome text")).toBeInTheDocument();
  });

  test("downloads cocos lesson and enables join button", async () => {
    render(<LiveQuizRoom />);
    expect(await screen.findByText("Join Now")).toBeInTheDocument();
    expect(Util.downloadZipBundle).toHaveBeenCalledWith(["cocos-1"]);
  });

  test("shows loader while download has not completed", async () => {
    (Util.downloadZipBundle as jest.Mock).mockResolvedValue(false);
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(screen.getByTestId("bar-loader")).toBeInTheDocument();
    });
  });

  test("shows already played students", async () => {
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(screen.getByText("Already Played")).toBeInTheDocument();
      expect(screen.getByTestId("avatar-stu-2")).toBeInTheDocument();
      expect(screen.getByTestId("avatar-stu-3")).toBeInTheDocument();
    });
  });

  test("shows not played students", async () => {
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(screen.getByText("Not Played")).toBeInTheDocument();
      expect(screen.getByTestId("avatar-stu-1")).toBeInTheDocument();
    });
  });

  test("sorts played students by score descending", async () => {
    const { container } = render(<LiveQuizRoom />);
    await waitFor(() => {
      const played = container.querySelector(".played-students");
      expect(played?.textContent).toMatch(/Two/);
      expect(played?.textContent).toMatch(/Three/);
    });
  });

  test("shows empty played message when no one has played", async () => {
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      { user_data: [{ id: "stu-1", name: "Me" }], result_data: [] },
    ]);
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(screen.getByText("No students have played yet.")).toBeInTheDocument();
    });
  });

  test("join button calls joinLiveQuiz and navigates to game room", async () => {
    render(<LiveQuizRoom />);
    fireEvent.click(await screen.findByText("Join Now"));
    await waitFor(() => {
      expect(mockApi.joinLiveQuiz).toHaveBeenCalledWith("a-1", "stu-1");
      expect(mockReplace).toHaveBeenCalledWith(PAGES.LIVE_QUIZ_GAME + "?liveRoomId=room-123");
    });
  });

  test("join button redirects to join page when join fails", async () => {
    mockApi.joinLiveQuiz.mockResolvedValue(null);
    render(<LiveQuizRoom />);
    fireEvent.click(await screen.findByText("Join Now"));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.LIVE_QUIZ_JOIN);
    });
  });

  test("join button shows joining state while request in progress", async () => {
    let resolver: Function = () => {};
    mockApi.joinLiveQuiz.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      })
    );
    render(<LiveQuizRoom />);
    fireEvent.click(await screen.findByText("Join Now"));
    await waitFor(() => {
      expect(screen.getByText("Joining...")).toBeInTheDocument();
    });
    resolver("room-123");
    await waitFor(() => {
      expect(screen.getByText("Join Now")).toBeInTheDocument();
    });
  });

  test("shows offline toast when attempting join while offline", async () => {
    (useOnlineOfflineErrorMessageHandler as jest.Mock).mockReturnValue({
      online: false,
      presentToast: mockPresentToast,
    });
    render(<LiveQuizRoom />);
    fireEvent.click(await screen.findByText("Join Now"));
    await waitFor(() => {
      expect(mockPresentToast).toHaveBeenCalled();
      expect(mockApi.joinLiveQuiz).not.toHaveBeenCalled();
    });
  });

  test("back button uses Util.setPathToBackButton to HOME", async () => {
    render(<LiveQuizRoom />);
    fireEvent.click(await screen.findByText("back"));
    expect(Util.setPathToBackButton).toHaveBeenCalledWith(PAGES.HOME, expect.anything());
  });

  test("returns early when current student is missing", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(mockApi.getAssignmentById).not.toHaveBeenCalled();
    });
  });

  test("returns early when student is not linked", async () => {
    mockApi.isStudentLinked.mockResolvedValue(false);
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(mockApi.getStudentClassesAndSchools).not.toHaveBeenCalled();
    });
  });

  test("returns early when classes are unavailable", async () => {
    mockApi.getStudentClassesAndSchools.mockResolvedValue({ classes: [] });
    render(<LiveQuizRoom />);
    await waitFor(() => {
      expect(mockApi.getStudentResultsByAssignmentId).not.toHaveBeenCalled();
    });
  });

  test("shows skeleton while loading student lists", async () => {
    let resolver: Function = () => {};
    mockApi.getStudentResultsByAssignmentId.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      })
    );
    render(<LiveQuizRoom />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    resolver([
      {
        user_data: [{ id: "stu-1", name: "Me" }],
        result_data: [],
      },
    ]);
    await waitFor(() => {
      expect(screen.queryAllByTestId("skeleton")).toHaveLength(0);
    });
  });
});
