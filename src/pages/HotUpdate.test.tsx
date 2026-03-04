import { render, waitFor } from "@testing-library/react";
import HotUpdate from "./HotUpdate";
import { useHistory } from "react-router";
import { Capacitor } from "@capacitor/core";
import { useFeatureIsOn, useFeatureValue } from "@growthbook/growthbook-react";
import { AppUpdater, HotUpdateStatus } from "../services/AppUpdater";
import { LANGUAGE, PAGES } from "../common/constants";

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
  let historyMock;

  beforeEach(() => {
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

  it("should redirect to login if can_hot_update is false", async () => {
    (useFeatureIsOn as jest.Mock).mockReturnValue(false);
    render(<HotUpdate />);
    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
  });

  it("should redirect to login if hot_update_server is not set", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(null);
    render(<HotUpdate />);
    await waitFor(() =>
      expect(historyMock.replace).toHaveBeenCalledWith(PAGES.LOGIN),
    );
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
});
