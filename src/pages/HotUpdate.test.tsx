import { act, render, waitFor } from "@testing-library/react";
import HotUpdate from "./HotUpdate";
import { useHistory } from "react-router";
import { Capacitor } from "@capacitor/core";
import { useFeatureIsOn, useFeatureValue } from "@growthbook/growthbook-react";
import { AppUpdater, HotUpdateStatus } from "../services/AppUpdater";
import { LANGUAGE, PAGES } from "../common/constants";

jest.mock("../components/Loading", () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="loading-state">{String(isLoading)}</div>
  ),
}));

jest.mock("react-router", () => ({
  useHistory: jest.fn(),
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

jest.mock("@growthbook/growthbook-react", () => ({
  useFeatureIsOn: jest.fn(),
  useFeatureValue: jest.fn(),
}));

jest.mock("../services/AppUpdater", () => ({
  AppUpdater: {
    sync: jest.fn(),
  },
  HotUpdateStatus: {
    CHECKING_FOR_UPDATE: "Checking for an update",
    COPY_FROM_BUNDLE: "Getting ready for an update in the background",
    FOUND_UPDATE: "Found a new update",
    DOWNLOADING_THE_UPDATES: "Downloading the latest updates",
    ALREADY_UPDATED: "Already on the latest version",
    ERROR: "Something went wrong",
  },
}));

describe("HotUpdate Page", () => {
  let historyMock: { replace: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    historyMock = {
      replace: jest.fn(),
    };
    (useHistory as jest.Mock).mockReturnValue(historyMock);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    (useFeatureValue as jest.Mock).mockReturnValue("http://localhost:3000");
    localStorage.clear();
  });

  it("should redirect to login if not a native platform", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    render(<HotUpdate />);
    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });

  it("should not call AppUpdater.sync if not a native platform", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    render(<HotUpdate />);
    await waitFor(() => expect(historyMock.replace).toHaveBeenCalled());
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to login if can_hot_update is false", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    render(<HotUpdate />);
    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });

  it("should not call AppUpdater.sync if can_hot_update is false", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    render(<HotUpdate />);
    await waitFor(() => expect(historyMock.replace).toHaveBeenCalled());
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to login if hot_update_server is not set", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(null);
    render(<HotUpdate />);
    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });

  it("should not call AppUpdater.sync if hot_update_server is not set", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(null);
    render(<HotUpdate />);
    await waitFor(() => expect(historyMock.replace).toHaveBeenCalled());
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should call AppUpdater.sync on native platform with feature flags on", async () => {
    render(<HotUpdate />);
    await waitFor(() =>
      expect(AppUpdater.sync).toHaveBeenCalledWith(
        "http://localhost:3000",
        expect.any(Function),
      ),
    );
  });

  it("should redirect to select mode if language is set in localStorage", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "en");
    render(<HotUpdate />);
    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
  });

  it("should handle error during sync and redirect", async () => {
    (AppUpdater.sync as jest.Mock).mockImplementation(
      (_url: string, callback: Function) => {
        callback(HotUpdateStatus.ERROR);
      },
    );

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });

  it("should redirect when already updated", async () => {
    (AppUpdater.sync as jest.Mock).mockImplementation(
      (_url: string, callback: Function) => {
        callback(HotUpdateStatus.ALREADY_UPDATED);
      },
    );

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });
  it("should redirect when update is found", async () => {
    (AppUpdater.sync as jest.Mock).mockImplementation(
      (_url: string, callback: Function) => {
        callback(HotUpdateStatus.FOUND_UPDATE);
      },
    );

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });

  it("should stop loading after successful init", async () => {
    const { getByTestId } = render(<HotUpdate />);
    await waitFor(() =>
      expect(getByTestId("loading-state")).toHaveTextContent("false"),
    );
  });

  it("should redirect to select mode when sync throws and language exists", async () => {
    localStorage.setItem(LANGUAGE, "en");
    (AppUpdater.sync as jest.Mock).mockImplementation(() => {
      throw new Error("sync failed");
    });

    const { getByTestId } = render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
    await waitFor(() =>
      expect(getByTestId("loading-state")).toHaveTextContent("false"),
    );
  });

  it("should redirect to select mode on non-native platform when language exists", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "te");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
  });

  it("should not call sync on non-native platform even when language exists", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "te");

    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalled());
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to select mode when can_hot_update is false and language exists", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "kn");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
  });

  it("should redirect to select mode when hot_update_server is null and language exists", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(null);
    localStorage.setItem(LANGUAGE, "mr");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to login when hot_update_server is empty string and language is missing", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue("");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to select mode when hot_update_server is empty string and language exists", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue("");
    localStorage.setItem(LANGUAGE, "bn");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to login when hot_update_server is undefined and language is missing", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(undefined);

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to select mode when hot_update_server is undefined and language exists", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(undefined);
    localStorage.setItem(LANGUAGE, "as");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to select mode when language is an empty string", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
  });

  it("should redirect to select mode when language is 0 string", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "0");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
  });

  it("should redirect to select mode when language literal 'null' exists in localStorage", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "null");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
  });

  it("should redirect to login when LANGUAGE key is removed from localStorage", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "en");
    localStorage.removeItem(LANGUAGE);

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });

  it("should call sync exactly once when native and feature flags are valid", async () => {
    render(<HotUpdate />);

    await waitFor(() => expect(AppUpdater.sync).toHaveBeenCalledTimes(1));
  });

  it("should pass the hot update URL from GrowthBook to sync", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue("https://example.com/v9");

    render(<HotUpdate />);

    await waitFor(() =>
      expect(AppUpdater.sync).toHaveBeenCalledWith(
        "https://example.com/v9",
        expect.any(Function),
      ),
    );
  });

  it("should pass a callback function as second argument to sync", async () => {
    render(<HotUpdate />);

    await waitFor(() => expect(AppUpdater.sync).toHaveBeenCalledTimes(1));
    const syncCallback = (AppUpdater.sync as jest.Mock).mock.calls[0][1];
    expect(typeof syncCallback).toBe("function");
  });

  it("should keep redirect count stable when sync callback emits all statuses", async () => {
    let capturedStatusCallback: (status: string) => void = () => undefined;
    (AppUpdater.sync as jest.Mock).mockImplementation(
      (_url: string, callback: (status: string) => void) => {
        capturedStatusCallback = callback;
      },
    );

    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalledTimes(1));

    act(() => {
      capturedStatusCallback(HotUpdateStatus.CHECKING_FOR_UPDATE);
      capturedStatusCallback(HotUpdateStatus.COPY_FROM_BUNDLE);
      capturedStatusCallback(HotUpdateStatus.FOUND_UPDATE);
      capturedStatusCallback(HotUpdateStatus.DOWNLOADING_THE_UPDATES);
      capturedStatusCallback(HotUpdateStatus.ALREADY_UPDATED);
      capturedStatusCallback(HotUpdateStatus.ERROR);
    });

    expect(historyMock.replace).toHaveBeenCalledTimes(1);
  });

  it("should redirect to login when sync throws and language is missing", async () => {
    (AppUpdater.sync as jest.Mock).mockImplementation(() => {
      throw new Error("sync crashed");
    });

    const { getByTestId } = render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
    await waitFor(() =>
      expect(getByTestId("loading-state")).toHaveTextContent("false"),
    );
  });

  it("should redirect to select mode when sync throws and empty language string is set", async () => {
    localStorage.setItem(LANGUAGE, "");
    (AppUpdater.sync as jest.Mock).mockImplementation(() => {
      throw new Error("sync crashed");
    });

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
  });

  it("should redirect to login when Capacitor.isNativePlatform throws and language is missing", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockImplementation(() => {
      throw new Error("native check failed");
    });

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should redirect to select mode when Capacitor.isNativePlatform throws and language exists", async () => {
    localStorage.setItem(LANGUAGE, "ml");
    (Capacitor.isNativePlatform as jest.Mock).mockImplementation(() => {
      throw new Error("native check failed");
    });

    render(<HotUpdate />);

    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
    );
    expect(AppUpdater.sync).not.toHaveBeenCalled();
  });

  it("should eventually render loading false after init completes", async () => {
    const { getByTestId } = render(<HotUpdate />);

    await waitFor(() =>
      expect(getByTestId("loading-state")).toHaveTextContent("false"),
    );
  });

  it("should redirect exactly once on non-native flow", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalledTimes(1));
  });

  it("should redirect exactly once when can_hot_update is false", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);

    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalledTimes(1));
  });

  it("should redirect exactly once when hot_update_server is null", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(null);

    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalledTimes(1));
  });

  it("should redirect exactly once on native successful flow", async () => {
    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalledTimes(1));
  });

  it("should keep calling select mode in every short-circuit branch when language exists", async () => {
    const runAndAssert = async () => {
      render(<HotUpdate />);
      await waitFor(() =>
        expect(historyMock.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE),
      );
    };

    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.setItem(LANGUAGE, "en");
    await runAndAssert();

    jest.clearAllMocks();
    historyMock = { replace: jest.fn() };
    (useHistory as jest.Mock).mockReturnValue(historyMock);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    (useFeatureValue as jest.Mock).mockReturnValue("http://localhost:3000");
    localStorage.setItem(LANGUAGE, "en");
    await runAndAssert();

    jest.clearAllMocks();
    historyMock = { replace: jest.fn() };
    (useHistory as jest.Mock).mockReturnValue(historyMock);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    (useFeatureValue as jest.Mock).mockReturnValue(null);
    localStorage.setItem(LANGUAGE, "en");
    await runAndAssert();
  });

  it("should keep calling login in every short-circuit branch when language is missing", async () => {
    const runAndAssert = async () => {
      render(<HotUpdate />);
      await waitFor(() =>
        expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
      );
    };

    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    localStorage.removeItem(LANGUAGE);
    await runAndAssert();

    jest.clearAllMocks();
    historyMock = { replace: jest.fn() };
    (useHistory as jest.Mock).mockReturnValue(historyMock);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    (useFeatureValue as jest.Mock).mockReturnValue("http://localhost:3000");
    localStorage.removeItem(LANGUAGE);
    await runAndAssert();

    jest.clearAllMocks();
    historyMock = { replace: jest.fn() };
    (useHistory as jest.Mock).mockReturnValue(historyMock);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (useFeatureIsOn as jest.Mock).mockReturnValue(true);
    (useFeatureValue as jest.Mock).mockReturnValue(null);
    localStorage.removeItem(LANGUAGE);
    await runAndAssert();
  });

  it("should not mutate localStorage language value during successful init", async () => {
    localStorage.setItem(LANGUAGE, "en");
    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalled());
    expect(localStorage.getItem(LANGUAGE)).toBe("en");
  });

  it("should not mutate localStorage language value during non-native short-circuit", async () => {
    localStorage.setItem(LANGUAGE, "en");
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalled());
    expect(localStorage.getItem(LANGUAGE)).toBe("en");
  });

  it("should not mutate localStorage language value during sync error handling", async () => {
    localStorage.setItem(LANGUAGE, "en");
    (AppUpdater.sync as jest.Mock).mockImplementation(() => {
      throw new Error("sync fail");
    });
    render(<HotUpdate />);

    await waitFor(() => expect(historyMock.replace).toHaveBeenCalled());
    expect(localStorage.getItem(LANGUAGE)).toBe("en");
  });
});
