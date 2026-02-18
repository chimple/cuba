import React from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DownloadLesson from "./DownloadChapterAndLesson";
import { ServiceConfig } from "../services/ServiceConfig";
import { Capacitor } from "@capacitor/core";
import { Util } from "../utility/util";

const mockPresentToast = jest.fn();

jest.mock("../utility/util", () => ({
  Util: {
    getStoredLessonIds: jest.fn(() => []),
    isChapterDownloaded: jest.fn(async () => true),
    storeLessonIdToLocalStorage: jest.fn(),
    downloadZipBundle: jest.fn(async () => true),
    deleteDownloadedLesson: jest.fn(async () => undefined),
  },
}));

jest.mock("../common/onlineOfflineErrorMessageHandler", () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    online: true,
    presentToast: (...args: any[]) => mockPresentToast(...args),
  }),
}));

jest.mock("i18next", () => ({
  t: (k: string) => k,
}));

jest.mock("./parent/DialogBoxButtons​", () => ({
  __esModule: true,
  default: () => null,
}));

describe("DownloadChapterAndLesson", () => {
  const mockApiHandler = {
    getLessonsForChapter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiHandler.getLessonsForChapter.mockResolvedValue([]);
    (Util.getStoredLessonIds as jest.Mock).mockReturnValue([]);
    (Util.isChapterDownloaded as jest.Mock).mockResolvedValue(true);
    (Util.downloadZipBundle as jest.Mock).mockResolvedValue(true);

    jest.spyOn(ServiceConfig, "getI").mockReturnValue({
      apiHandler: mockApiHandler,
    } as any);
  });

  it("does not render download button on web", () => {
    jest.spyOn(Capacitor, "getPlatform").mockReturnValue("web" as any);
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);

    const view = render(<DownloadLesson lessonId="lesson-1" />);

    expect(
      view.container.querySelector(".download-or-delete-button")
    ).not.toBeInTheDocument();
  });

  it("renders and triggers lesson download on android", async () => {
    const user = userEvent.setup();
    jest.spyOn(Capacitor, "getPlatform").mockReturnValue("android" as any);
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);

    const view = render(<DownloadLesson lessonId="lesson-42" />);
    const button = view.container.querySelector(".download-or-delete-button");

    expect(button).toBeInTheDocument();

    await user.click(button as HTMLElement);

    await waitFor(() => {
      expect(Util.downloadZipBundle).toHaveBeenCalledWith(["lesson-42"]);
    });
  });
});
