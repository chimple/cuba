import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadChapterAndLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { Toast } from "@capacitor/toast";
import {
  DOWNLOADED_LESSON_AND_CHAPTER_ID,
  SnackbarType,
} from "../common/constants";
import { TfiDownload, TfiTrash } from "react-icons/tfi";
import { Capacitor } from "@capacitor/core";

const DownloadLesson: React.FC<{
  lessonID?: any;
  chapters?: any;
  lessonData?: any;
}> = ({ lessonID, chapters, lessonData }) => {
  console.log("chaptersss", lessonData);
  const [showIcon, setShowIcon] = useState(true);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    setOnline(navigator.onLine);
    function handleOnlineEvent() {
      setOnline(true);
    }

    function handleOfflineEvent() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnlineEvent);
    window.addEventListener("offline", handleOfflineEvent);

    if (isStored(lessonID, DOWNLOADED_LESSON_AND_CHAPTER_ID)) {
      setShowIcon(false);
    }

    if (chapters && isStored(chapters.id, DOWNLOADED_LESSON_AND_CHAPTER_ID)) {
      setShowIcon(false);
    }
  }, []);

  const isStored = (
    id: string,
    lessonAndChapterIdStorageKey: string
  ): boolean => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonAndChapterIdStorageKey) ||
        JSON.stringify({ lesson: [], chapter: [] })
    );

    return storedItems.lesson.includes(id) || storedItems.chapter.includes(id);
  };

  async function init() {
    const lesson = Util.updateChapterOrLessonDownloadStatus(lessonData);
    if (!lesson) {
      return;
    }
  }

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);

    if (!online) {
      showSnackbar(
        t(
          `Device is offline. Cannot download ${
            chapters ? "Chapter" : "Lesson"
          }`
        ),
        SnackbarType.Error
      );
      setLoading(false);
      return;
    }

    const storeLessonID: string[] = [];

    if (chapters) {
      if (!isStored(chapters.id, DOWNLOADED_LESSON_AND_CHAPTER_ID)) {
        const lessons: Lesson[] = await api.getLessonsForChapter(chapters);

        for (const e of lessons) {
          if (!isStored(e.id, DOWNLOADED_LESSON_AND_CHAPTER_ID)) {
            storeLessonID.push(e.id);
            await Util.downloadZipBundle([e.id]);
          }
        }

        Util.storeIdToLocalStorage(
          storeLessonID,
          DOWNLOADED_LESSON_AND_CHAPTER_ID,
          "lesson"
        );
        Util.storeIdToLocalStorage(
          chapters.id,
          DOWNLOADED_LESSON_AND_CHAPTER_ID,
          "chapter"
        );
      }
    } else {
      if (!isStored(lessonID, DOWNLOADED_LESSON_AND_CHAPTER_ID)) {
        await Util.downloadZipBundle([lessonID]);
        Util.storeIdToLocalStorage(
          lessonID,
          DOWNLOADED_LESSON_AND_CHAPTER_ID,
          "lesson"
        );
      }
    }
    setShowIcon(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    if (chapters) {
      const lessons: Lesson[] = await api.getLessonsForChapter(chapters);
      const storeLessonID: string[] = [];
      lessons.forEach(async (e) => {
        storeLessonID.push(e.id);
        await Util.deleteDownloadedLesson(e.id);
        if (!isStored(e.id, DOWNLOADED_LESSON_AND_CHAPTER_ID)) {
          setShowIcon(true);
        }
      });
      Util.removeIdFromLocalStorage(
        chapters.id,
        DOWNLOADED_LESSON_AND_CHAPTER_ID
      );
      Util.removeIdFromLocalStorage(
        storeLessonID,
        DOWNLOADED_LESSON_AND_CHAPTER_ID
      );
    } else if (lessonID) {
      await Util.deleteDownloadedLesson(lessonID);
      Util.removeIdFromLocalStorage(lessonID, DOWNLOADED_LESSON_AND_CHAPTER_ID);
      if (!isStored(lessonID, DOWNLOADED_LESSON_AND_CHAPTER_ID)) {
        setShowIcon(true);
      }
    }
    setLoading(false);
  };

  const showSnackbar = (message: string, type: SnackbarType) => {
    switch (type) {
      case SnackbarType.Success:
        Toast.show({
          text: message,
          duration: "short",
          position: "bottom",
        });
        break;
      case SnackbarType.Error:
        Toast.show({
          text: message,
          duration: "long",
          position: "bottom",
        });
        break;
      default:
        Toast.show({
          text: message,
          duration: "long",
          position: "bottom",
        });
    }
  };

  useEffect(() => {
    init();
  }, [handleDownload, handleDelete]);

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
            `Do you want to Delete this ${chapters ? "Chapter" : "Lesson"}`
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
