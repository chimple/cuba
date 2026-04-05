import React, { useState, useEffect } from 'react';
import { Util } from '../utility/util';
import { ServiceConfig } from '../services/ServiceConfig';
import './DownloadChapterAndLesson.css';
import { t } from 'i18next';
import DialogBoxButtons from './parent/DialogBoxButtons​';
import { TfiDownload, TfiTrash } from 'react-icons/tfi';
import { Capacitor } from '@capacitor/core';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';
import {
  ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
  DOWNLOADING_CHAPTER_ID,
  LESSON_DOWNLOAD_SUCCESS_EVENT,
  TableTypes,
} from '../common/constants';

const DownloadLesson: React.FC<{
  lessonId?: string;
  lessonRow?: TableTypes<'lesson'>;
  chapter?: TableTypes<'chapter'>;
  downloadButtonLoading?: boolean;
  onDownloadOrDelete?: () => void;
}> = ({
  lessonId,
  lessonRow,
  chapter,
  downloadButtonLoading = false,
  onDownloadOrDelete,
}) => {
  const [showIcon, setShowIcon] = useState(true);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storedLessonID, setStoredLessonID] = useState<string[]>([]);
  const api = ServiceConfig.getI().apiHandler;
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();

  useEffect(() => {
    init();
    setLoading(downloadButtonLoading);
  }, [downloadButtonLoading]);

  useEffect(() => {
    const handleLessonDownloaded = (lessonDownloaded: Event) => {
      const lessonEvent = lessonDownloaded as CustomEvent<{ lessonId: string }>;
      const downloadedLessonId = lessonEvent.detail.lessonId;

      if (downloadedLessonId === lessonId) {
        setShowIcon(false);
        setLoading(false);
        if (storedLessonID && lessonId) {
          setStoredLessonID([...storedLessonID, lessonId]);
        }
      }
    };

    const chapterDownloaded = (event: Event) => {
      const chapterEvent = event as CustomEvent<{ chapterId: string }>;
      if (chapter) {
        if (chapter?.id === chapterEvent.detail.chapterId) {
          setLoading(false);
          setShowIcon(false);
        }
      }
    };

    window.addEventListener(
      LESSON_DOWNLOAD_SUCCESS_EVENT,
      handleLessonDownloaded,
    );
    window.addEventListener(
      ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
      chapterDownloaded,
    );

    return () => {
      window.removeEventListener(
        LESSON_DOWNLOAD_SUCCESS_EVENT,
        handleLessonDownloaded,
      );
      window.removeEventListener(
        ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
        chapterDownloaded,
      );
    };
  }, []);

  async function init() {
    const storedLessonIds = Util.getStoredLessonIds();
    setStoredLessonID(storedLessonIds);
    if (lessonId && storedLessonIds.includes(lessonId)) {
      setShowIcon(false);
      downloadButtonLoading = false;
    }
    if (chapter) {
      const isChapterDownloaded = await Util.isChapterDownloaded(chapter.id);
      setShowIcon(isChapterDownloaded);
    }
    const storedItems = JSON.parse(
      localStorage.getItem(DOWNLOADING_CHAPTER_ID) || JSON.stringify([]),
    );
    if (storedItems && storedItems.includes(chapter?.id)) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);

    const buildVersionAwarePayload = async (
      lessons: TableTypes<'lesson'>[],
      storedLessonID: string[],
    ) => {
      const downloadIds: string[] = [];
      const lessonVersionMap: Record<string, number> = {};

      for (const lesson of lessons) {
        const bundleId = lesson.cocos_lesson_id;
        if (!bundleId) continue;

        const dbVersion = Number(lesson.version ?? 1);
        const localVersion = await Util.getLocalLessonVersion(bundleId);

        const isOutdated = localVersion < dbVersion;
        const isMissing = !storedLessonID.includes(bundleId);

        if (isMissing || isOutdated) {
          downloadIds.push(bundleId);
        }

        if (isOutdated) {
          lessonVersionMap[bundleId] = dbVersion;
        }
      }

      return { downloadIds, lessonVersionMap };
    };

    if (!online) {
      presentToast({
        message: t(
          `Device is offline. Cannot download ${chapter ? 'Chapter' : 'Lesson'}`,
        ),
        color: 'danger',
        duration: 3000,
        position: 'bottom',
        buttons: [
          {
            text: 'Dismiss',
            role: 'cancel',
          },
        ],
      });

      setLoading(false);
      return;
    }

    const storeLessonID: string[] = [];
    const lessonVersionMap: Record<string, number> = {};

    if (chapter) {
      const lessons: TableTypes<'lesson'>[] = await api.getLessonsForChapter(
        chapter.id,
      );

      const payload = await buildVersionAwarePayload(lessons, storedLessonID);

      Util.storeLessonIdToLocalStorage(chapter.id, DOWNLOADING_CHAPTER_ID);

      storeLessonID.push(...payload.downloadIds);

      if (storeLessonID.length > 0) {
        await Util.downloadZipBundle(
          storeLessonID,
          chapter.id,
          undefined,
          payload.lessonVersionMap,
        );
      }
    } else {
      if (lessonId && lessonRow) {
        const dbVersion = Number(lessonRow.version ?? 1);
        const localVersion = await Util.getLocalLessonVersion(lessonId);

        const isOutdated = localVersion < dbVersion;
        const shouldDownload = !storedLessonID.includes(lessonId) || isOutdated;

        if (isOutdated) {
          lessonVersionMap[lessonId] = dbVersion;
        }

        if (shouldDownload) {
          await Util.downloadZipBundle(
            [lessonId],
            undefined,
            undefined,
            lessonVersionMap,
          );
          storeLessonID.push(lessonId);
        }
      }
    }

    setShowIcon(false);
    setLoading(false);
    setStoredLessonID((prev) => [...new Set([...prev, ...storeLessonID])]);
    if (onDownloadOrDelete) onDownloadOrDelete();
  };

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    if (chapter) {
      const lessons: TableTypes<'lesson'>[] = await api.getLessonsForChapter(
        chapter.id,
      );
      const storeLessonID: string[] = [];
      lessons.forEach(async (e) => {
        if (e.cocos_lesson_id) {
          storeLessonID.push(e.cocos_lesson_id);
          setShowIcon(true);
        }
        if (onDownloadOrDelete) onDownloadOrDelete();
      });

      await Util.deleteDownloadedLesson(storeLessonID);
      // Filter out deleted lesson IDs from storedLessonID
      const updatedStoredLessonIDs = storedLessonID.filter(
        (id) => !storeLessonID.includes(id),
      );
      setStoredLessonID(updatedStoredLessonIDs);
    } else if (lessonId) {
      await Util.deleteDownloadedLesson([lessonId]);
      setShowIcon(true);
      if (onDownloadOrDelete) onDownloadOrDelete();
      // Filter out deleted lesson ID from storedLessonID
      const updatedStoredLessonIDs = storedLessonID.filter(
        (id) => id !== lessonId,
      );
      setStoredLessonID(updatedStoredLessonIDs);
    }
    setLoading(false);
  };

  return Capacitor.isNativePlatform() ? (
    <div
      className="download-or-delete-button"
      onClick={(event) => {
        const mouseEvent = event as React.MouseEvent<HTMLDivElement>;
        mouseEvent.stopPropagation();
        handleDownload();
      }}
    >
      {showDialogBox && (
        <DialogBoxButtons
          width={'40vw'}
          height={'30vh'}
          message={t(
            `Do you want to Delete this ${chapter ? 'Chapter' : 'Lesson'}`,
          )}
          showDialogBox={showDialogBox}
          yesText={t('Yes')}
          noText={t('No')}
          handleClose={() => {
            setShowDialogBox(false);
          }}
          onNoButtonClicked={(event) => {
            const mouseEvent = event as React.MouseEvent;
            mouseEvent.stopPropagation();
            setShowDialogBox(false);
          }}
          onYesButtonClicked={(event) => {
            const mouseEvent = event as React.MouseEvent;
            mouseEvent.stopPropagation();
            setShowDialogBox(false);
            handleDelete();
          }}
        />
      )}

      {loading ? (
        <div className="loading-button-container">
          <div className="loading-button"></div>
        </div>
      ) : showIcon ? (
        <TfiDownload className="lesson-or-chapter-delete-icon" />
      ) : (
        <div
          onClick={(event) => {
            const mouseEvent = event as React.MouseEvent<HTMLDivElement>;
            mouseEvent.stopPropagation();
            setShowDialogBox(!showDialogBox);
          }}
        >
          <TfiTrash className="lesson-or-chapter-download-icon" />
        </div>
      )}
    </div>
  ) : null;
};

export default DownloadLesson;
