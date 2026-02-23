import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AssignmentPage from "./Assignment";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import { Capacitor } from "@capacitor/core";
import { useFeatureIsOn, useGrowthBook } from "@growthbook/growthbook-react";
import { PAGES, LIVE_QUIZ } from "../common/constants";

/* ======================================================
   i18n MOCK (CHAINABLE – IMPORTANT)
====================================================== */
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

/* ======================================================
   ROUTER / GROWTHBOOK / CONTEXT MOCKS
====================================================== */
const mockHistory = { replace: jest.fn(), push: jest.fn() };

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useHistory: () => mockHistory,
}));
const mockGetFeatureValue = jest.fn();

jest.mock("@growthbook/growthbook-react", () => ({
  useFeatureIsOn: jest.fn(),
  useGrowthBook: () => ({
    setAttributes: jest.fn(),
    getFeatureValue: mockGetFeatureValue,
  }),
}));

jest.mock("../growthbook/Growthbook", () => ({
  useGbContext: () => ({
    gbUpdated: false,
    setGbUpdated: jest.fn(),
  }),
}));

/* ======================================================
   UTIL / COMPONENT MOCKS
====================================================== */
jest.mock("../utility/util", () => ({
  Util: {
    getCurrentStudent: jest.fn(),
    setCurrentClass: jest.fn(),
    loadBackgroundImage: jest.fn(),
    getStoredLessonIds: jest.fn(),
    downloadZipBundle: jest.fn(),
  },
}));

jest.mock("../components/SkeltonLoading", () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton-loading" />,
}));

jest.mock("../components/assignment/JoinClass", () => ({
  __esModule: true,
  default: () => <div>JoinClass Component</div>,
}));

jest.mock("../components/LessonSlider", () => ({
  __esModule: true,
  default: ({ lessonData }: any) => (
    <div>LessonSlider {lessonData?.[0]?.name}</div>
  ),
}));

jest.mock("../components/assignment/HomeworkPathway", () => ({
  __esModule: true,
  default: () => <div>HomeworkPathway Component</div>,
}));

jest.mock("../components/assignment/HomeworkCompleteModal", () => ({
  __esModule: true,
  default: ({ text, onPlayMore }: any) => (
    <div>
      {text}
      <button onClick={onPlayMore}>Play More</button>
    </div>
  ),
}));

jest.mock("@ionic/react", () => ({
  IonButton: ({ children, onClick, disabled }: any) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

const mockPresentToast = jest.fn();
jest.mock("../common/onlineOfflineErrorMessageHandler", () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    online: true,
    presentToast: mockPresentToast,
  }),
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

jest.mock("@capacitor/keyboard", () => ({
  Keyboard: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

/* ======================================================
   API MOCK
====================================================== */
const mockApi = {
  getStudentClassesAndSchools: jest.fn(),
  getPendingAssignments: jest.fn(),
  getLesson: jest.fn(),
  getChaptersByIds: jest.fn(),
  syncDB: jest.fn(),
  removeAssignmentChannel: jest.fn(),
  assignmentListner: jest.fn(),
  assignmentUserListner: jest.fn(),
  getAssignmentById: jest.fn(),
};

const assignmentCount = jest.fn();
const onPlayMoreHomework = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();

  jest.spyOn(ServiceConfig, "getI").mockReturnValue({
    apiHandler: mockApi,
  } as any);

  mockApi.syncDB.mockResolvedValue(true);
  mockApi.getChaptersByIds.mockResolvedValue([]);
  (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
  (Util.getStoredLessonIds as jest.Mock).mockReturnValue([]);
});

const flush = () => new Promise((r) => setTimeout(r, 0));

/* ======================================================
   TESTS
====================================================== */
describe("AssignmentPage", () => {
  test("shows skeleton loader initially", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "s1" });
    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });

    render(
      <MemoryRouter>
        <AssignmentPage assignmentCount={assignmentCount} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("skeleton-loading")).toBeInTheDocument();
    await flush();
  });

  test("redirects to SELECT_MODE when no student", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);

    render(
      <MemoryRouter>
        <AssignmentPage assignmentCount={assignmentCount} />
      </MemoryRouter>
    );

    await flush();
    expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
  });

  test("renders JoinClass when student not linked", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "s1" });

    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });

    render(
      <MemoryRouter>
        <AssignmentPage assignmentCount={assignmentCount} />
      </MemoryRouter>
    );

    expect(await screen.findByText("JoinClass Component")).toBeInTheDocument();
  });

  test("renders LessonSlider when homework pathway OFF", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "s1" });

    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "c1", school_id: "sch1", name: "Class A" }],
      schools: [{ id: "sch1", name: "My School" }],
    });

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: "a1", lesson_id: "l1", type: "HOMEWORK" },
    ]);

    mockApi.getLesson.mockResolvedValue({ id: "l1", name: "Math" });

    render(
      <MemoryRouter>
        <AssignmentPage assignmentCount={assignmentCount} />
      </MemoryRouter>
    );

    expect(await screen.findByText("LessonSlider Math")).toBeInTheDocument();
    expect(assignmentCount).toHaveBeenCalledWith(1);
  });

  test("renders HomeworkPathway when flag ON", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    mockGetFeatureValue.mockReturnValue(true);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "s1" });

    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "c1", school_id: "sch1" }],
      schools: [{ id: "sch1", name: "My School" }],
    });

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: "a1", lesson_id: "l1", type: "HOMEWORK" },
    ]);

    render(
      <MemoryRouter>
        <AssignmentPage assignmentCount={assignmentCount} />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("HomeworkPathway Component")
    ).toBeInTheDocument();
  });

  test("shows HomeworkCompleteModal when no assignments", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "s1" });

    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "c1", school_id: "sch1" }],
      schools: [{ id: "sch1", name: "My School" }],
    });

    mockApi.getPendingAssignments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AssignmentPage
          assignmentCount={assignmentCount}
          onPlayMoreHomework={onPlayMoreHomework}
        />
      </MemoryRouter>
    );

    const text = await screen.findByText(
      "Yay!! You have completed all the Homework!!"
    );
    expect(text).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /play more/i }));
    expect(onPlayMoreHomework).toHaveBeenCalled();
  });

  test("ignores LIVE_QUIZ assignments", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "s1" });

    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "c1", school_id: "sch1" }],
      schools: [{ id: "sch1", name: "My School" }],
    });

    mockApi.getPendingAssignments.mockResolvedValue([
      { id: "a1", type: LIVE_QUIZ },
    ]);

    render(
      <MemoryRouter>
        <AssignmentPage assignmentCount={assignmentCount} />
      </MemoryRouter>
    );

    await flush();
    expect(assignmentCount).toHaveBeenCalledWith(0);
  });

  test("cleans up listeners on unmount", async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: "s1" });

    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: "c1", school_id: "sch1" }],
      schools: [{ id: "sch1", name: "My School" }],
    });

    const { unmount } = render(
      <MemoryRouter>
        <AssignmentPage assignmentCount={assignmentCount} />
      </MemoryRouter>
    );

    await flush();
    unmount();

    expect(mockApi.removeAssignmentChannel).toHaveBeenCalled();
  });
});
