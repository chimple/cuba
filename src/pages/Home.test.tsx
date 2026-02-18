import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Home from "./Home";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import { PAGES } from "../common/constants";
import { updateLocalAttributes } from "../growthbook/Growthbook";

const mockHistoryReplace = jest.fn();
const mockHistoryPush = jest.fn();
let mockLocationSearch = "";

jest.mock("@ionic/react", () => ({
  IonPage: (props: any) => <div>{props.children}</div>,
  IonHeader: (props: any) => <div>{props.children}</div>,
  useIonRouter: () => ({}),
}));

jest.mock("react-router", () => ({
  useHistory: () => ({ replace: mockHistoryReplace, push: mockHistoryPush }),
  useLocation: () => ({ search: mockLocationSearch }),
}));

jest.mock("../components/HomeHeader", () => (props: any) => (
  <div>
    <button onClick={() => props.onHeaderIconClick("HOME")}>go-home</button>
    <button onClick={() => props.onHeaderIconClick("SUBJECTS")}>go-subjects</button>
    <button onClick={() => props.onHeaderIconClick("ASSIGNMENT")}>
      go-assignment
    </button>
    <button onClick={() => props.onHeaderIconClick("LIVE-QUIZ")}>go-livequiz</button>
    <button onClick={() => props.onHeaderIconClick("HOME")}>stay-home</button>
  </div>
));
jest.mock("../components/LearningPathway", () => () => <div data-testid="learning-pathway" />);
jest.mock("./Subjects", () => () => <div data-testid="subjects-tab" />);
jest.mock("./Assignment", () => (props: any) => (
  <div data-testid="assignment-tab">
    <button onClick={props.onPlayMoreHomework}>play-more-homework</button>
  </div>
));
jest.mock("./LiveQuiz", () => () => <div data-testid="livequiz-tab" />);
jest.mock("./SearchLesson", () => () => <div data-testid="search-tab" />);
jest.mock("../components/SkeltonLoading", () => () => <div data-testid="skeleton" />);
jest.mock("../components/WinterCampaignPopup/WinterCampaignPopupGating", () => () => (
  <div data-testid="winter-campaign-gating" />
));

jest.mock("../utility/util");
jest.mock("../i18n", () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    language: "en",
  },
}));
jest.mock("../growthbook/Growthbook", () => ({
  updateLocalAttributes: jest.fn(),
  useGbContext: () => ({ setGbUpdated: jest.fn() }),
}));
jest.mock("@growthbook/growthbook-react", () => ({
  useFeatureIsOn: jest.fn(() => false),
  useGrowthBook: jest.fn(() => ({
    getFeatureValue: jest.fn(() => null),
  })),
}));
jest.mock("@capacitor/app", () => ({
  App: { addListener: jest.fn() },
}));

const mockApi = {
  getLanguageWithId: jest.fn(),
  getStudentResultInMap: jest.fn(),
  isStudentLinked: jest.fn(),
  getStudentClassesAndSchools: jest.fn(),
  getPendingAssignments: jest.fn(),
  getLesson: jest.fn(),
  assignmentListner: jest.fn(),
  assignmentUserListner: jest.fn(),
  authHandler: { getCurrentUser: jest.fn() },
};

describe("Home page (Home tab)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockLocationSearch = "";
    jest.spyOn(ServiceConfig, "getI").mockReturnValue({
      apiHandler: mockApi,
      authHandler: { getCurrentUser: jest.fn().mockResolvedValue({ id: "parent-1" }) },
    } as any);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "stu-1",
      language_id: "lang-1",
      stars: 2,
    });
    (Util.logDeviceInfo as jest.Mock).mockResolvedValue({});
    (Util.checkDownloadedLessonsFromLocal as jest.Mock).mockImplementation(() => {});
    (Util.loadBackgroundImage as jest.Mock).mockImplementation(() => {});
    (Util.getAllUnlockedRewards as jest.Mock).mockResolvedValue([]);
    (Util.updateSchStdAttb as jest.Mock).mockResolvedValue(undefined);

    mockApi.getLanguageWithId.mockResolvedValue({ id: "lang-1", code: "en" });
    mockApi.getStudentResultInMap.mockResolvedValue({});
    mockApi.isStudentLinked.mockResolvedValue(true);
    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "class-1" }],
      schools: [{ id: "school-1", name: "School One" }],
    });
    mockApi.getPendingAssignments.mockResolvedValue([]);
    mockApi.assignmentListner.mockResolvedValue(undefined);
    mockApi.assignmentUserListner.mockResolvedValue(undefined);
  });

  test("redirects to select mode when no current student", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    render(<Home />);
    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
  });

  test("shows learning pathway by default on home tab", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
  });

  test("navigates to subjects tab from header icon", async () => {
    render(<Home />);
    await screen.findByTestId("learning-pathway");
    fireEvent.click(screen.getByText("go-subjects"));
    await waitFor(() => {
      expect(screen.getByTestId("subjects-tab")).toBeInTheDocument();
    });
  });

  test("navigates to assignment tab and back to home via callback", async () => {
    render(<Home />);
    await screen.findByTestId("learning-pathway");
    fireEvent.click(screen.getByText("go-assignment"));
    await screen.findByTestId("assignment-tab");

    fireEvent.click(screen.getByText("play-more-homework"));
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
  });

  test("navigates to live quiz tab from header icon", async () => {
    render(<Home />);
    await screen.findByTestId("learning-pathway");
    fireEvent.click(screen.getByText("go-livequiz"));
    await waitFor(() => {
      expect(screen.getByTestId("livequiz-tab")).toBeInTheDocument();
    });
  });

  test("renders winter campaign gating component", async () => {
    render(<Home />);
    expect(await screen.findByTestId("winter-campaign-gating")).toBeInTheDocument();
  });

  test("renders skeleton component in slider content", () => {
    render(<Home />);
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  test("calls language API with current student language id", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(mockApi.getLanguageWithId).toHaveBeenCalledWith("lang-1");
    });
  });

  test("calls downloaded-lesson and background initialization helpers", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(Util.checkDownloadedLessonsFromLocal).toHaveBeenCalled();
      expect(Util.loadBackgroundImage).toHaveBeenCalled();
    });
  });

  test("calls assignment listeners for linked class and student after join-class event", async () => {
    render(<Home />);
    window.dispatchEvent(new Event("JoinClassListner"));
    await waitFor(() => {
      expect(mockApi.assignmentListner).toHaveBeenCalledWith("class-1", expect.any(Function));
      expect(mockApi.assignmentUserListner).toHaveBeenCalledWith("stu-1", expect.any(Function));
    });
  });

  test("invokes updateLocalAttributes during assignment fetch", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(updateLocalAttributes).toHaveBeenCalled();
    });
  });

  test("handles missing language document without crashing", async () => {
    mockApi.getLanguageWithId.mockResolvedValue(null);
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
  });

  test("handles missing class-school data gracefully", async () => {
    mockApi.getStudentClassesAndSchools.mockResolvedValue(null);
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
  });

  test("returns to home view when home icon clicked from subjects", async () => {
    render(<Home />);
    fireEvent.click(await screen.findByText("go-subjects"));
    expect(await screen.findByTestId("subjects-tab")).toBeInTheDocument();
    fireEvent.click(screen.getByText("go-home"));
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
  });

  test("stays on home when home icon clicked while already on home", async () => {
    render(<Home />);
    expect(await screen.findByTestId("learning-pathway")).toBeInTheDocument();
    fireEvent.click(screen.getByText("stay-home"));
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
  });

  test("supports sequence of tab transitions", async () => {
    render(<Home />);
    fireEvent.click(await screen.findByText("go-subjects"));
    expect(await screen.findByTestId("subjects-tab")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-assignment"));
    expect(await screen.findByTestId("assignment-tab")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-livequiz"));
    expect(await screen.findByTestId("livequiz-tab")).toBeInTheDocument();
  });

  test("reads tab query param on mount when provided", async () => {
    mockLocationSearch = "?tab=SUBJECTS";
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("subjects-tab")).toBeInTheDocument();
    });
  });

  test("falls back to home tab for unknown tab query value", async () => {
    mockLocationSearch = "?tab=UNKNOWN_TAB";
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
  });

  test("does not request pending assignments when linked classes are empty", async () => {
    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [{ id: "school-1", name: "School One" }],
    });
    mockApi.getPendingAssignments.mockRejectedValue(new Error("assignments-failed"));
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("learning-pathway")).toBeInTheDocument();
    });
    expect(mockApi.getPendingAssignments).not.toHaveBeenCalled();
  });

  test("uses history replace for redirect path only when student missing", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(mockHistoryReplace).not.toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
  });
});
