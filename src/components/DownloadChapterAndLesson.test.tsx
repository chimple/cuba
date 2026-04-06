import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadLesson from './DownloadChapterAndLesson';
import { ServiceConfig } from '../services/ServiceConfig';
import { Capacitor } from '@capacitor/core';
import { Util } from '../utility/util';
import { DOWNLOADING_CHAPTER_ID } from '../common/constants';

const mockPresentToast = jest.fn();

jest.mock('../utility/util', () => ({
  Util: {
    getStoredLessonIds: jest.fn(() => []),
    isChapterDownloaded: jest.fn(async () => true),
    storeLessonIdToLocalStorage: jest.fn(),
    downloadZipBundle: jest.fn(async () => true),
    deleteDownloadedLesson: jest.fn(async () => undefined),
    getLocalLessonVersion: jest.fn(async () => 0),
  },
}));

jest.mock('../common/onlineOfflineErrorMessageHandler', () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    online: true,
    presentToast: (...args: any[]) => mockPresentToast(...args),
  }),
}));

jest.mock('i18next', () => ({
  t: (k: string) => k,
}));

jest.mock('./parent/DialogBoxButtons​', () => ({
  __esModule: true,
  default: ({ showDialogBox, onYesButtonClicked, onNoButtonClicked }: any) =>
    showDialogBox ? (
      <div data-testid="dialog-box-buttons">
        <button
          type="button"
          data-testid="dialog-yes"
          onClick={onYesButtonClicked}
        >
          yes
        </button>
        <button
          type="button"
          data-testid="dialog-no"
          onClick={onNoButtonClicked}
        >
          no
        </button>
      </div>
    ) : null,
}));

describe('DownloadChapterAndLesson', () => {
  const mockApiHandler = {
    getLessonsForChapter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockApiHandler.getLessonsForChapter.mockResolvedValue([]);
    (Util.getStoredLessonIds as jest.Mock).mockReturnValue([]);
    (Util.isChapterDownloaded as jest.Mock).mockResolvedValue(true);
    (Util.downloadZipBundle as jest.Mock).mockResolvedValue(true);

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApiHandler,
    } as any);
  });

  it('does not render download button on web', () => {
    jest.spyOn(Capacitor, 'getPlatform').mockReturnValue('web' as any);
    jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);

    const view = render(<DownloadLesson lessonId="lesson-1" />);

    expect(
      view.container.querySelector('.download-or-delete-button'),
    ).not.toBeInTheDocument();
  });

  it('renders and triggers lesson download on android', async () => {
    const user = userEvent.setup();
    jest.spyOn(Capacitor, 'getPlatform').mockReturnValue('android' as any);
    jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    const view = render(
      <DownloadLesson
        lessonId="lesson-42"
        lessonRow={{ id: 'lesson-42', version: '1' } as any}
      />,
    );
    const button = view.container.querySelector('.download-or-delete-button');

    expect(button).toBeInTheDocument();

    await user.click(button as HTMLElement);

    await waitFor(() => {
      expect(Util.downloadZipBundle).toHaveBeenCalledWith(
        ['lesson-42'],
        undefined,
        undefined,
        {},
      );
    });
  });

  it('opens delete confirmation and deletes lesson on android', async () => {
    const user = userEvent.setup();
    const onDownloadOrDelete = jest.fn();

    jest.spyOn(Capacitor, 'getPlatform').mockReturnValue('android' as any);
    jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    (Util.getStoredLessonIds as jest.Mock).mockReturnValue(['lesson-42']);

    const view = render(
      <DownloadLesson
        lessonId="lesson-42"
        onDownloadOrDelete={onDownloadOrDelete}
      />,
    );

    await waitFor(() => {
      expect(
        view.container.querySelector('.lesson-or-chapter-download-icon'),
      ).toBeInTheDocument();
    });

    await user.click(
      view.container.querySelector(
        '.lesson-or-chapter-download-icon',
      ) as HTMLElement,
    );

    expect(screen.getByTestId('dialog-box-buttons')).toBeInTheDocument();

    await user.click(screen.getByTestId('dialog-yes'));

    await waitFor(() => {
      expect(Util.deleteDownloadedLesson).toHaveBeenCalledWith(['lesson-42']);
      expect(onDownloadOrDelete).toHaveBeenCalled();
    });

    expect(Util.downloadZipBundle).not.toHaveBeenCalled();
  });

  it('downloads all missing lesson bundles for a chapter on android', async () => {
    const user = userEvent.setup();
    const onDownloadOrDelete = jest.fn();

    jest.spyOn(Capacitor, 'getPlatform').mockReturnValue('android' as any);
    jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    (Util.getStoredLessonIds as jest.Mock).mockReturnValue(['cocos-1']);
    mockApiHandler.getLessonsForChapter.mockResolvedValue([
      { cocos_lesson_id: 'cocos-1', version: '1' },
      { cocos_lesson_id: 'cocos-2', version: '1' },
      { cocos_lesson_id: undefined },
    ]);

    const chapter = { id: 'chapter-1' } as any;
    const view = render(
      <DownloadLesson
        chapter={chapter}
        onDownloadOrDelete={onDownloadOrDelete}
      />,
    );

    const button = view.container.querySelector('.download-or-delete-button');
    expect(button).toBeInTheDocument();

    await user.click(button as HTMLElement);

    await waitFor(() => {
      expect(mockApiHandler.getLessonsForChapter).toHaveBeenCalledWith(
        'chapter-1',
      );
      expect(Util.storeLessonIdToLocalStorage).toHaveBeenCalledWith(
        'chapter-1',
        DOWNLOADING_CHAPTER_ID,
      );
      expect(Util.downloadZipBundle).toHaveBeenCalledWith(
        ['cocos-2'],
        'chapter-1',
        undefined,
        {},
      );
      expect(onDownloadOrDelete).toHaveBeenCalled();
    });
  });

  it('opens delete confirmation and deletes chapter lessons on android', async () => {
    const user = userEvent.setup();
    const onDownloadOrDelete = jest.fn();

    jest.spyOn(Capacitor, 'getPlatform').mockReturnValue('android' as any);
    jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    (Util.isChapterDownloaded as jest.Mock).mockResolvedValue(false);
    mockApiHandler.getLessonsForChapter.mockResolvedValue([
      { cocos_lesson_id: 'cocos-101' },
      { cocos_lesson_id: 'cocos-102' },
    ]);

    const chapter = { id: 'chapter-7' } as any;
    const view = render(
      <DownloadLesson
        chapter={chapter}
        onDownloadOrDelete={onDownloadOrDelete}
      />,
    );

    await waitFor(() => {
      expect(
        view.container.querySelector('.lesson-or-chapter-download-icon'),
      ).toBeInTheDocument();
    });

    await user.click(
      view.container.querySelector(
        '.lesson-or-chapter-download-icon',
      ) as HTMLElement,
    );

    expect(screen.getByTestId('dialog-box-buttons')).toBeInTheDocument();

    await user.click(screen.getByTestId('dialog-yes'));

    await waitFor(() => {
      expect(mockApiHandler.getLessonsForChapter).toHaveBeenCalledWith(
        'chapter-7',
      );
      expect(Util.deleteDownloadedLesson).toHaveBeenCalledWith([
        'cocos-101',
        'cocos-102',
      ]);
      expect(onDownloadOrDelete).toHaveBeenCalled();
    });

    expect(Util.downloadZipBundle).not.toHaveBeenCalled();
  });
});
