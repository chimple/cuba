// Coverage: App-level GrowthBook popup routing by URL tab/screen, trigger payload variants, false-positive mismatch blocking, and malformed/null payload negatives.
import { render, act, waitFor } from "@testing-library/react";
import App from "./App";
import PopupManager from "./components/GenericPopUp/GenericPopUpManager";
import { GENERIC_POP_UP } from "./common/constants";

const growthbookMock = jest.requireMock("@growthbook/growthbook-react") as {
  __resetGrowthBookMock: () => void;
  __setGrowthBookMock: (partial: {
    attributes?: Record<string, unknown>;
    features?: Record<string, unknown>;
    flags?: Record<string, boolean>;
  }) => void;
};

describe("App Component", () => {
  let onAppOpenSpy: jest.SpyInstance;
  let onTimeElapsedSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    growthbookMock.__resetGrowthBookMock();
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

  // Covers: renders app shell without crashing.
  it("renders without crashing", () => {
    let unmount: () => void;

    act(() => {
      const result = render(<App />);
      unmount = result.unmount;
    });

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

  // Covers: positive routing when tab/screen match for APP_OPEN, GAME_COMPLETE, TIME_ELAPSED and APP_CLOSE-like payload variants.
  test.each([
    { name: "home tab with APP_OPEN trigger", tab: "home", trigger: { type: "APP_OPEN", value: 1 } },
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
  ])("routes growthbook popup config to PopupManager for $name", async ({ tab, trigger }) => {
    const popupConfig = {
      ...popupConfigBase,
      id: `gb-popup-${tab}-${trigger.type}`,
      screen_name: tab,
      triggers: trigger,
    };

    growthbookMock.__setGrowthBookMock({
      features: {
        [GENERIC_POP_UP]: popupConfig,
      },
    });
    window.history.replaceState({}, "", `/?tab=${tab}`);

    render(<App />);

    await waitFor(() =>
      expect(PopupManager.onAppOpen).toHaveBeenCalledWith(popupConfig),
    );
    await waitFor(() =>
      expect(PopupManager.onTimeElapsed).toHaveBeenCalledWith(popupConfig),
    );
  });

  // Covers: false-positive prevention when current tab does not match popup screen_name.
  test("does not route popup when current tab does not match screen_name (false positive prevention)", async () => {
    const popupConfig = {
      ...popupConfigBase,
      id: "gb-popup-mismatch",
      screen_name: "leaderboard",
      triggers: { type: "APP_OPEN", value: 1 },
    };

    growthbookMock.__setGrowthBookMock({
      features: {
        [GENERIC_POP_UP]: popupConfig,
      },
    });
    window.history.replaceState({}, "", "/?tab=home");

    render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(PopupManager.onAppOpen).not.toHaveBeenCalled();
    expect(PopupManager.onTimeElapsed).not.toHaveBeenCalled();
  });

  // Covers: negative payload gating for malformed and null GrowthBook popup payloads.
  test.each([
    { name: "missing screen_name", payload: { id: "gb-popup-no-screen" } },
    { name: "null payload", payload: null },
  ])("does not route popup when growthbook payload is malformed: $name", async ({ payload }) => {
    growthbookMock.__setGrowthBookMock({
      features: {
        [GENERIC_POP_UP]: payload as any,
      },
    });
    window.history.replaceState({}, "", "/?tab=leaderboard");

    render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(PopupManager.onAppOpen).not.toHaveBeenCalled();
    expect(PopupManager.onTimeElapsed).not.toHaveBeenCalled();
  });
});
