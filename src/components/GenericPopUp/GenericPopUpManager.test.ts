import PopupManager from "./GenericPopUpManager";
import { PopupConfig } from "./GenericPopUpType";
import {
  GENERIC_POPUP_TRIGGER_CONDITION,
  LANGUAGE,
  SHOW_GENERIC_POPUP,
} from "../../common/constants";
import { Util } from "../../utility/util";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import {
  createPopupConfig,
  installAnalyticsMock,
  mockLocalStorageFailure,
  mockNavigation,
  setFixedSystemTime,
  useRealClock,
} from "./GenericPopUp.testUtils";

jest.mock("../../utility/util", () => ({
  Util: {
    getCurrentStudent: jest.fn(),
  },
}));

const mockedGetCurrentStudent = Util.getCurrentStudent as jest.Mock;

const getTodayKey = (config: PopupConfig, studentId = "student-1") => {
  const today = new Date().toISOString().split("T")[0];
  return `GB_POPUP_${studentId}_${config.id}_${today}`;
};

const listenForPopupEvent = () => {
  const handler = jest.fn();
  window.addEventListener(SHOW_GENERIC_POPUP, handler as EventListener);
  return {
    handler,
    cleanup: () =>
      window.removeEventListener(SHOW_GENERIC_POPUP, handler as EventListener),
  };
};

describe("GenericPopUpManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setFixedSystemTime("2026-02-15T12:00:00.000Z");
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    mockedGetCurrentStudent.mockReturnValue({ id: "student-1" });
    installAnalyticsMock();
    delete (window as any).isAnyPopupOpen;
    (PopupManager as any).isPopupActive = false;
    (PopupManager as any).sessionGamesPlayed = 0;
  });

  afterEach(() => {
    jest.clearAllTimers();
    useRealClock();
  });

  it("shows popup on APP_OPEN when config is eligible and emits analytics", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.APP_OPEN,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();
    const track = (window as any).analytics.track as jest.Mock;

    PopupManager.onAppOpen(config);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.config).toEqual(config);
    expect(event.detail.localized.heading).toBe("Popup heading");
    expect(localStorage.getItem(getTodayKey(config))).toBe("1");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("popup_shown", {
      popup_id: config.id,
      trigger_type: config.triggers.type,
      screen_name: "home",
    });

    cleanup();
  });

  it("does nothing on APP_OPEN when trigger type is different", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.GAME_COMPLETE,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();
    const track = (window as any).analytics.track as jest.Mock;

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBeNull();

    cleanup();
  });

  it("fires GAME_COMPLETE only when played count reaches configured threshold", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.GAME_COMPLETE,
        value: 2,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onGameComplete(config);
    PopupManager.onGameComplete(config);
    PopupManager.onGameComplete(config);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(getTodayKey(config))).toBe("1");

    cleanup();
  });

  it("ignores malformed GAME_COMPLETE config with missing trigger", () => {
    expect(() => PopupManager.onGameComplete({} as PopupConfig)).not.toThrow();
  });

  it("schedules TIME_ELAPSED popup and shows only after configured delay", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.TIME_ELAPSED,
        value: 5,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onTimeElapsed(config);
    jest.advanceTimersByTime(4999);
    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("does nothing for TIME_ELAPSED entry when trigger type is different", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.APP_OPEN,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onTimeElapsed(config);
    jest.runAllTimers();

    expect(handler).not.toHaveBeenCalled();

    cleanup();
  });

  it("prevents duplicate popup show when multiple TIME_ELAPSED timers fire together", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.TIME_ELAPSED,
        value: 1,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onTimeElapsed(config);
    PopupManager.onTimeElapsed(config);
    jest.advanceTimersByTime(1000);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(getTodayKey(config))).toBe("1");

    cleanup();
  });

  it("blocks popup when manager already has an active popup", () => {
    const config = createPopupConfig();
    const { handler, cleanup } = listenForPopupEvent();

    (PopupManager as any).isPopupActive = true;
    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBeNull();

    cleanup();
  });

  it("blocks popup when another global popup lock is active", () => {
    const config = createPopupConfig();
    const { handler, cleanup } = listenForPopupEvent();
    (window as any).isAnyPopupOpen = jest.fn(() => true);

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBeNull();

    cleanup();
  });

  it("blocks popup when config is not active", () => {
    const config = createPopupConfig({ isActive: false });
    const { handler, cleanup } = listenForPopupEvent();
    const track = (window as any).analytics.track as jest.Mock;

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBeNull();

    cleanup();
  });

  it("blocks popup when day-of-week is outside schedule", () => {
    const today = new Date().getDay();
    const invalidDay = today === 0 ? 1 : 0;
    const config = createPopupConfig({
      schedule: { daysOfWeek: [invalidDay] },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBeNull();

    cleanup();
  });

  it("allows popup when now equals schedule startDate boundary", () => {
    const nowIso = new Date().toISOString();
    const config = createPopupConfig({
      schedule: {
        startDate: nowIso,
        endDate: new Date(Date.now() + 1000).toISOString(),
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("allows popup when now equals schedule endDate boundary", () => {
    const nowIso = new Date().toISOString();
    const config = createPopupConfig({
      schedule: {
        startDate: new Date(Date.now() - 1000).toISOString(),
        endDate: nowIso,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("blocks popup when now is before schedule startDate", () => {
    const config = createPopupConfig({
      schedule: {
        startDate: new Date(Date.now() + 1000).toISOString(),
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();

    cleanup();
  });

  it("blocks popup when now is after schedule endDate", () => {
    const config = createPopupConfig({
      schedule: {
        endDate: new Date(Date.now() - 1000).toISOString(),
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();

    cleanup();
  });

  it("blocks popup when views count equals daily cap boundary", () => {
    const config = createPopupConfig({
      schedule: { maxViewsPerDay: 2 },
    });
    localStorage.setItem(getTodayKey(config), "2");
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBe("2");

    cleanup();
  });

  it("blocks popup when current student is missing", () => {
    const config = createPopupConfig();
    mockedGetCurrentStudent.mockReturnValue(undefined);
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBeNull();

    cleanup();
  });

  it("localizes by LANGUAGE key, then falls back to en", () => {
    const config = createPopupConfig();
    const { handler, cleanup } = listenForPopupEvent();
    localStorage.setItem(LANGUAGE, "es");

    PopupManager.onAppOpen(config);

    const eventEs = handler.mock.calls[0][0] as CustomEvent;
    expect(eventEs.detail.localized.heading).toBe("Encabezado");

    handler.mockClear();
    (PopupManager as any).isPopupActive = false;
    localStorage.setItem(LANGUAGE, "fr");
    PopupManager.onAppOpen(config);

    const eventEnFallback = handler.mock.calls[0][0] as CustomEvent;
    expect(eventEnFallback.detail.localized.heading).toBe("Popup heading");

    cleanup();
  });

  it("falls back to first content entry when language and en are missing", () => {
    const config = createPopupConfig({
      content: {
        es: {
          thumbnailImageUrl: "/only-es-thumb.png",
          heading: "Solo ES",
          buttonText: "Ir",
        },
      },
    });
    localStorage.setItem(LANGUAGE, "fr");
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.localized.heading).toBe("Solo ES");

    cleanup();
  });

  it("tracks dismiss analytics and clears active state", () => {
    const config = createPopupConfig();
    const track = (window as any).analytics.track as jest.Mock;
    (PopupManager as any).isPopupActive = true;

    PopupManager.onDismiss(config);

    expect((PopupManager as any).isPopupActive).toBe(false);
    expect(track).toHaveBeenCalledWith("popup_dismissed", {
      popup_id: config.id,
    });
  });

  it("routes deep-link tab targets to internal home tabs and keeps active flag (current behavior)", () => {
    const config = createPopupConfig({
      action: { type: "DEEP_LINK", target: "SUBJECTS" },
    });
    const { replaceSpy, restore } = mockNavigation();
    const track = (window as any).analytics.track as jest.Mock;
    (PopupManager as any).isPopupActive = true;

    PopupManager.onAction(config);

    expect(track).toHaveBeenCalledWith("popup_action", {
      popup_id: config.id,
      action_type: "CLICK_BUTTON",
      target: "SUBJECTS",
    });
    expect(replaceSpy).toHaveBeenCalledWith("/home?tab=SUBJECTS");
    expect((PopupManager as any).isPopupActive).toBe(true);
    restore();
  });

  it("routes leaderboard/rewards tab targets to leaderboard base route", () => {
    const config = createPopupConfig({
      action: { type: "DEEP_LINK", target: "LEADERBOARD" },
    });
    const { replaceSpy, restore } = mockNavigation();

    PopupManager.onAction(config);

    expect(replaceSpy).toHaveBeenCalledWith("/leaderboard?tab=LEADERBOARD");
    restore();
  });

  it("routes slash-prefixed deep links with direct replace", () => {
    const config = createPopupConfig({
      action: { type: "DEEP_LINK", target: "/profile" },
    });
    const { replaceSpy, restore } = mockNavigation();

    PopupManager.onAction(config);

    expect(replaceSpy).toHaveBeenCalledWith("/profile");
    restore();
  });

  it("opens external deep links in browser tab on web and clears active state", () => {
    const config = createPopupConfig({
      action: { type: "DEEP_LINK", target: "https://example.com/docs" },
    });
    const { openSpy, restore } = mockNavigation();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (PopupManager as any).isPopupActive = true;

    PopupManager.onAction(config);

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/docs",
      "_blank",
      "noopener,noreferrer",
    );
    expect((PopupManager as any).isPopupActive).toBe(false);
    restore();
  });

  it("opens external deep links with Capacitor Browser on native", () => {
    const config = createPopupConfig({
      action: { type: "DEEP_LINK", target: "https://example.com/native" },
    });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    PopupManager.onAction(config);

    expect(Browser.open).toHaveBeenCalledWith({
      url: "https://example.com/native",
    });
  });

  it("clears active state when action is missing", () => {
    const config = createPopupConfig({ action: undefined });
    (PopupManager as any).isPopupActive = true;

    PopupManager.onAction(config);

    expect((PopupManager as any).isPopupActive).toBe(false);
  });

  it("does not crash when analytics object is missing", () => {
    const config = createPopupConfig();
    delete (window as any).analytics;
    const { restore } = mockNavigation();

    expect(() => PopupManager.onAppOpen(config)).not.toThrow();
    expect(() => PopupManager.onDismiss(config)).not.toThrow();
    expect(() => PopupManager.onAction(config)).not.toThrow();
    restore();
  });

  it("propagates analytics errors during popup show (current behavior)", () => {
    const config = createPopupConfig();
    installAnalyticsMock(true);
    const { handler, cleanup } = listenForPopupEvent();

    expect(() => PopupManager.onAppOpen(config)).toThrow("analytics failure");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(getTodayKey(config))).toBe("1");

    cleanup();
  });

  it("throws when localStorage getItem fails while checking daily cap", () => {
    const config = createPopupConfig();
    const getItemSpy = mockLocalStorageFailure("getItem");

    expect(() => PopupManager.onAppOpen(config)).toThrow(
      "localStorage.getItem failed",
    );

    getItemSpy.mockRestore();
  });

  it("throws when localStorage setItem fails while incrementing views", () => {
    const config = createPopupConfig();
    const setItemSpy = mockLocalStorageFailure("setItem");
    const { handler, cleanup } = listenForPopupEvent();

    expect(() => PopupManager.onAppOpen(config)).toThrow(
      "localStorage.setItem failed",
    );
    expect(handler).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
    cleanup();
  });

  it("routes REWARDS target to /leaderboard base route", () => {
    const config = createPopupConfig({
      action: { type: "DEEP_LINK", target: "REWARDS" },
    });
    const { replaceSpy, restore } = mockNavigation();

    PopupManager.onAction(config);

    expect(replaceSpy).toHaveBeenCalledWith("/leaderboard?tab=REWARDS");
    restore();
  });

  it("falls back screen_name to 'unknown' when not provided", () => {
    const config = createPopupConfig({ screen_name: undefined });
    const { handler, cleanup } = listenForPopupEvent();
    const track = (window as any).analytics.track as jest.Mock;

    PopupManager.onAppOpen(config);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("popup_shown", {
      popup_id: config.id,
      trigger_type: config.triggers.type,
      screen_name: "unknown",
    });

    cleanup();
  });

  it("uses navigator.language when LANGUAGE key is absent from localStorage", () => {
    const config = createPopupConfig({
      content: {
        en: {
          thumbnailImageUrl: "/thumb.png",
          heading: "English heading",
          buttonText: "Go",
        },
      },
    });
    localStorage.removeItem(LANGUAGE);
    Object.defineProperty(navigator, "language", {
      value: "en-US",
      configurable: true,
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.localized.heading).toBe("English heading");

    cleanup();
  });

  it("does not fire popup when GAME_COMPLETE count is below threshold", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.GAME_COMPLETE,
        value: 3,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onGameComplete(config);
    PopupManager.onGameComplete(config);

    expect(handler).not.toHaveBeenCalled();
    expect(localStorage.getItem(getTodayKey(config))).toBeNull();

    cleanup();
  });

  it("allows popup when daily views are below cap (count < maxViewsPerDay)", () => {
    const config = createPopupConfig({
      schedule: { maxViewsPerDay: 3 },
    });
    localStorage.setItem(getTodayKey(config), "2");
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onAppOpen(config);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(getTodayKey(config))).toBe("3");

    cleanup();
  });

  it("emits popup_action analytics with undefined target when action type is not DEEP_LINK", () => {
    const config = createPopupConfig({
      action: { type: "OTHER" as any, target: "something" },
    });
    const track = (window as any).analytics.track as jest.Mock;

    PopupManager.onAction(config);

    expect(track).toHaveBeenCalledWith("popup_action", {
      popup_id: config.id,
      action_type: "CLICK_BUTTON",
      target: "something",
    });
    expect((PopupManager as any).isPopupActive).toBe(false);
  });

  it("onDismiss is idempotent when already inactive", () => {
    const config = createPopupConfig();
    const track = (window as any).analytics.track as jest.Mock;
    (PopupManager as any).isPopupActive = false;

    PopupManager.onDismiss(config);

    expect((PopupManager as any).isPopupActive).toBe(false);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("popup_dismissed", {
      popup_id: config.id,
    });
  });

  it("blocks TIME_ELAPSED timer scheduling when isPopupActive is already true", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.TIME_ELAPSED,
        value: 1,
      },
    });
    (PopupManager as any).isPopupActive = true;
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onTimeElapsed(config);
    jest.advanceTimersByTime(2000);

    expect(handler).not.toHaveBeenCalled();

    cleanup();
  });

  it("does not fire GAME_COMPLETE popup again after threshold has been passed", () => {
    const config = createPopupConfig({
      triggers: {
        type: GENERIC_POPUP_TRIGGER_CONDITION.GAME_COMPLETE,
        value: 1,
      },
    });
    const { handler, cleanup } = listenForPopupEvent();

    PopupManager.onGameComplete(config);
    expect(handler).toHaveBeenCalledTimes(1);

    handler.mockClear();
    (PopupManager as any).isPopupActive = false;
    PopupManager.onGameComplete(config);
    PopupManager.onGameComplete(config);

    expect(handler).not.toHaveBeenCalled();

    cleanup();
  });
});
