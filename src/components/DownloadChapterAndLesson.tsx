import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadChapterAndLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { TfiDownload, TfiTrash } from "react-icons/tfi";
import { Capacitor } from "@capacitor/core";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import {
  ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
  DOWNLOADED_LESSON_ID,
  DOWNLOADING_CHAPTER_ID,
  LESSON_DOWNLOAD_SUCCESS_EVENT,
  TableTypes,
} from "../common/constants";

const DownloadLesson: React.FC<{
  lessonId?: string;
  chapter?: TableTypes<"chapter">;
  downloadButtonLoading?: boolean;
  onDownloadOrDelete?: () => void;
}> = ({
  lessonId,
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
    const handleLessonDownloaded = (lessonDownloaded) => {
      const downloadedLessonId = lessonDownloaded.detail.lessonId;

      if (downloadedLessonId === lessonId) {
        setShowIcon(false);
        setLoading(false);
        if (storedLessonID && lessonId) {
          setStoredLessonID([...storedLessonID, lessonId]);
        }
      }
    };

    const chapterDownloaded = (event) => {
      if (chapter) {
        if (chapter?.id === event.detail.chapterId) {
          setLoading(false);
          setShowIcon(false);
        }
      }
    };

    window.addEventListener(
      LESSON_DOWNLOAD_SUCCESS_EVENT,
      handleLessonDownloaded
    );
    window.addEventListener(
      ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
      chapterDownloaded
    );

    return () => {
      window.removeEventListener(
        LESSON_DOWNLOAD_SUCCESS_EVENT,
        handleLessonDownloaded
      );
      window.removeEventListener(
        ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
        chapterDownloaded
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
      localStorage.getItem(DOWNLOADING_CHAPTER_ID) || JSON.stringify([])
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

    if (!online) {
      presentToast({
        message: t(
          `Device is offline. Cannot download ${chapter ? "Chapter" : "Lesson"}`
        ),
        color: "danger",
        duration: 3000,
        position: "bottom",
        buttons: [
          {
            text: "Dismiss",
            role: "cancel",
          },
        ],
      });

      setLoading(false);
      return;
    }

    const storeLessonID: string[] = [];

    if (chapter) {
      const lessons: TableTypes<"lesson">[] = await api.getLessonsForChapter(
        chapter.id
      );
      Util.storeLessonIdToLocalStorage(chapter.id, DOWNLOADING_CHAPTER_ID);
      for (const e of lessons) {
        if (e.cocos_lesson_id)
          if (!storedLessonID.includes(e.cocos_lesson_id)) {
            storeLessonID.push(e.cocos_lesson_id);
          }
      }
      await Util.downloadZipBundle(storeLessonID, chapter.id);
    } else {
      if (lessonId) {
        if (!storedLessonID.includes(lessonId)) {
          await Util.downloadZipBundle([lessonId]);
        }
      }
    }
    setShowIcon(false);
    setLoading(false);
    setStoredLessonID([...storedLessonID, ...storeLessonID]);
    if (onDownloadOrDelete) onDownloadOrDelete();
  };

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    if (chapter) {
      const lessons: TableTypes<"lesson">[] = await api.getLessonsForChapter(
        chapter.id
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
        (id) => !storeLessonID.includes(id)
      );
      setStoredLessonID(updatedStoredLessonIDs);
    } else if (lessonId) {
      await Util.deleteDownloadedLesson([lessonId]);
      setShowIcon(true);
      if (onDownloadOrDelete) onDownloadOrDelete();
      // Filter out deleted lesson ID from storedLessonID
      const updatedStoredLessonIDs = storedLessonID.filter(
        (id) => id !== lessonId
      );
      setStoredLessonID(updatedStoredLessonIDs);
    }
    setLoading(false);
  };

  return Capacitor.isNativePlatform() ? (
    <div
      className="download-or-delete-button"
      onClick={(event) => {
        event.stopPropagation();
        handleDownload();
      }}
    >
      {showDialogBox && (
        <DialogBoxButtons
          width={"40vw"}
          height={"30vh"}
          message={t(
            `Do you want to Delete this ${chapter ? "Chapter" : "Lesson"}`
          )}
          showDialogBox={showDialogBox}
          yesText={t("Yes")}
          noText={t("No")}
          handleClose={() => {
            setShowDialogBox(false);
          }}
          onNoButtonClicked={(event) => {
            event.stopPropagation();
            setShowDialogBox(false);
          }}
          onYesButtonClicked={(event) => {
            event.stopPropagation();
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
            event.stopPropagation();
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
