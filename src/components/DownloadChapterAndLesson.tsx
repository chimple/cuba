import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadChapterAndLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { TfiDownload, TfiTrash } from "react-icons/tfi";
import { Capacitor } from "@capacitor/core";
import { Chapter } from "../common/courseConstants";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";

const DownloadLesson: React.FC<{
  lessonId?: string;
  chapter?: Chapter;
  downloadButtonLoading?: boolean;
  onDownloadOrDelete?: () => void;
  lessonDownloaded?: string;
}> = ({
  lessonId,
  chapter,
  downloadButtonLoading = false,
  onDownloadOrDelete,
  lessonDownloaded,
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
  }, [downloadButtonLoading, lessonDownloaded]);

  useEffect(() => {
    if (lessonDownloaded) {
      setShowIcon(false);
    }
  }, [lessonDownloaded]);

  async function init() {
    const storedLessonIds = Util.getStoredLessonIds();
    if (lessonId && storedLessonIds.includes(lessonId)) {
      setShowIcon(false);
      downloadButtonLoading = false;
    }
    if (chapter) {
      const isChapterDownloaded = await Util.isChapterDowloaded(chapter);
      setShowIcon(isChapterDownloaded);
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
      const lessons: Lesson[] = await api.getLessonsForChapter(chapter);
      for (const e of lessons) {
        if (!storedLessonID.includes(e.id)) {
          storeLessonID.push(e.id);
        }
      }
      await Util.downloadZipBundle(storeLessonID);
    } else {
      if (lessonId) {
        if (!storedLessonID.includes(lessonId)) {
          await Util.downloadZipBundle([lessonId]);
        }
      }
    }
    setShowIcon(false);
    setLoading(false);
    if (onDownloadOrDelete) onDownloadOrDelete();
  };

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    if (chapter) {
      const lessons: Lesson[] = await api.getLessonsForChapter(chapter);
      const storeLessonID: string[] = [];
      lessons.forEach(async (e) => {
        storeLessonID.push(e.id);
        if (!storedLessonID.includes(e.id)) {
          setShowIcon(true);
        }
        if (onDownloadOrDelete) onDownloadOrDelete();
      });

      await Util.deleteDownloadedLesson(storeLessonID);
    } else if (lessonId) {
      await Util.deleteDownloadedLesson([lessonId]);
      if (!storedLessonID.includes(lessonId)) {
        setShowIcon(true);
      }
      if (onDownloadOrDelete) onDownloadOrDelete();
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
