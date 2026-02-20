import { render, act, waitFor } from "@testing-library/react";
import App from "./App";
import PopupManager from "./components/GenericPopUp/GenericPopUpManager";
import { GENERIC_POP_UP } from "./common/constants";

const mockGetFeatureValue = jest.fn();

jest.mock("@growthbook/growthbook-react", () => ({
  useGrowthBook: jest.fn(() => ({
    getFeatureValue: mockGetFeatureValue,
    setAttributes: jest.fn(),
    getAttributes: jest.fn(),
  })),
  useFeatureIsOn: jest.fn(() => false),
  useFeatureValue: jest.fn((_: string, fallback: unknown) => fallback),
}));

describe("App Component", () => {
  let onAppOpenSpy: jest.SpyInstance;
  let onTimeElapsedSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    mockGetFeatureValue.mockReset();
    mockGetFeatureValue.mockReturnValue(null);
    onAppOpenSpy = jest
      .spyOn(PopupManager, "onAppOpen")
      .mockImplementation(() => {});
    onTimeElapsedSpy = jest
      .spyOn(PopupManager, "onTimeElapsed")
      .mockImplementation(() => {});
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    onAppOpenSpy?.mockRestore();
    onTimeElapsedSpy?.mockRestore();
  });

  it("renders without crashing", () => {
    let unmount: () => void;

    act(() => {
      const result = render(<App />);
      unmount = result.unmount;
    });

    // Just ensure it mounted successfully
    expect(document.body).toBeTruthy();

    act(() => {
      unmount();
    });
  });

  const popupConfigBase = {
    id: "gb-popup-app-1",
    isActive: true,
    priority: 1,
    schedule: {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      maxViewsPerDay: 3,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.000Z",
    },
    content: {
      en: {
        thumbnailImageUrl: "/thumb.png",
        heading: "Heading",
        buttonText: "Continue",
      },
    },
    action: { type: "DEEP_LINK", target: "SUBJECTS" },
  };

  test.each([
    {
      name: "home tab with APP_OPEN trigger",
      tab: "home",
      trigger: { type: "APP_OPEN", value: 1 },
    },
    {
      name: "home tab with GAME_COMPLETE trigger",
      tab: "home",
      trigger: { type: "GAME_COMPLETE", value: 2 },
    },
    {
      name: "leaderboard tab with TIME_ELAPSED trigger",
      tab: "leaderboard",
      trigger: { type: "TIME_ELAPSED", value: 30 },
    },
    {
      name: "leaderboard tab with APP_CLOSE-like trigger",
      tab: "leaderboard",
      trigger: { type: "APP_CLOSE", value: 1 },
    },
  ])(
    "routes growthbook popup config to PopupManager for $name",
    async ({ tab, trigger }) => {
      const popupConfig = {
        ...popupConfigBase,
        id: `gb-popup-${tab}-${trigger.type}`,
        screen_name: tab,
        triggers: trigger,
      };
      mockGetFeatureValue.mockImplementation((key: string, fallback: any) =>
        key === GENERIC_POP_UP ? popupConfig : fallback,
      );
      window.history.replaceState({}, "", `/?tab=${tab}`);

      render(<App />);

      await waitFor(() =>
        expect(PopupManager.onAppOpen).toHaveBeenCalledWith(popupConfig),
      );
      await waitFor(() =>
        expect(PopupManager.onTimeElapsed).toHaveBeenCalledWith(popupConfig),
      );
    },
  );

  test("does not route popup when current tab does not match screen_name (false positive prevention)", async () => {
    const popupConfig = {
      ...popupConfigBase,
      id: "gb-popup-mismatch",
      screen_name: "leaderboard",
      triggers: { type: "APP_OPEN", value: 1 },
    };
    mockGetFeatureValue.mockImplementation((key: string, fallback: any) =>
      key === GENERIC_POP_UP ? popupConfig : fallback,
    );
    window.history.replaceState({}, "", "/?tab=home");

    render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(PopupManager.onAppOpen).not.toHaveBeenCalled();
    expect(PopupManager.onTimeElapsed).not.toHaveBeenCalled();
  });

  test.each([
    { name: "missing screen_name", payload: { id: "gb-popup-no-screen" } },
    { name: "null payload", payload: null },
  ])(
    "does not route popup when growthbook payload is malformed: $name",
    async ({ payload }) => {
      mockGetFeatureValue.mockImplementation((key: string, fallback: any) =>
        key === GENERIC_POP_UP ? payload : fallback,
      );
      window.history.replaceState({}, "", "/?tab=leaderboard");

      render(<App />);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(PopupManager.onAppOpen).not.toHaveBeenCalled();
      expect(PopupManager.onTimeElapsed).not.toHaveBeenCalled();
    },
  );
});
