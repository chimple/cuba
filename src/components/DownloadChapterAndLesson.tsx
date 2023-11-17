import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadChapterAndLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CHAPTER_ID, LESSON_ID, SnackbarType } from "../common/constants";
import { Capacitor } from "@capacitor/core";
import { TfiDownload, TfiTrash } from "react-icons/tfi";

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

    if (isStored(lessonID, LESSON_ID)) {
      setShowIcon(false);
    }

    if (chapters && isStored(chapters.id, CHAPTER_ID)) {
      setShowIcon(false);
    }
  }, []);

  const isStored = (
    id: string,
    lessonOrChapterIdStorageKey: string
  ): boolean => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonOrChapterIdStorageKey) || "[]"
    );
    return storedItems.includes(id);
  };

  const storeLessonAndChapterId = (
    id: string | string[],
    lessonOrChapterIdStorageKey: string
  ) => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonOrChapterIdStorageKey) || "[]"
    );
    if (Array.isArray(id)) {
      const updatedItems = [...storedItems, ...id];
      if (updatedItems) {
        localStorage.setItem(
          lessonOrChapterIdStorageKey,
          JSON.stringify(updatedItems)
        );
      } else return;
    } else {
      const updatedItems = [...storedItems, id];
      if (updatedItems) {
        localStorage.setItem(
          lessonOrChapterIdStorageKey,
          JSON.stringify(updatedItems)
        );
      } else return;
    }
  };
  const removeLessonAndChapterId = (
    ids: string | string[],
    lessonOrChapterIdStorageKey: string
  ) => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonOrChapterIdStorageKey) || "[]"
    );
    const updatedItems = storedItems.filter(
      (item: string) => !ids.includes(item)
    );

    if (updatedItems) {
      localStorage.setItem(
        lessonOrChapterIdStorageKey,
        JSON.stringify(updatedItems)
      );
      console.log("Items are deleted");
    } else {
      console.error("Failed to update storage");
    }
  };

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
    } else {
      if (chapters) {
        if (!isStored(chapters.id, CHAPTER_ID)) {
          storeLessonAndChapterId(chapters.id, CHAPTER_ID);
        }
        const lessons: Lesson[] = await api.getLessonsForChapter(chapters);
        const storeLessonID: string[] = [];
        for (const e of lessons) {
          if (!isStored(e.id, LESSON_ID)) {
            storeLessonID.push(e.id);
            await downloadLessonAndChapter(e.id);
          }
        }
        storeLessonAndChapterId(storeLessonID, LESSON_ID);

        setShowIcon(false);
      } else if (lessonID) {
        if (!isStored(lessonID, LESSON_ID)) {
          storeLessonAndChapterId(lessonID, LESSON_ID);
          await downloadLessonAndChapter(lessonID);
        }
        setShowIcon(false);
      }
    }

    setLoading(false);
  };
  async function updateLessonAndChapterStatus() {
    const status = Util.checkLessonForChapter(lessonData);
    if (!status) {
      return;
    } else console.log("Lessons and Chapters status updated");
  }

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);

    if (chapters) {
      removeLessonAndChapterId(chapters.id, CHAPTER_ID);
      deleteLessonsAndChapter(chapters.id);

      const lessons: Lesson[] = await api.getLessonsForChapter(chapters);
      const storeLessonID: string[] = [];
      lessons.forEach(async (e) => {
        storeLessonID.push(e.id);
        await deleteLessonsAndChapter(e.id);
        if (!isStored(e.id, LESSON_ID)) {
          setShowIcon(true);
        }
      });
      removeLessonAndChapterId(storeLessonID, LESSON_ID);
    } else if (lessonID) {
      removeLessonAndChapterId(lessonID, LESSON_ID);
      setShowIcon(false);
      await deleteLessonsAndChapter(lessonID);
      if (!isStored(lessonID, LESSON_ID)) {
        setShowIcon(true);
      }
    }
    setLoading(false);
  };

  async function deleteLessonsAndChapter(lesson: string) {
    const lessonId: string = lesson;
    const dow = await Util.deleteDownloadedLesson(lessonId);
    updateLessonAndChapterStatus();
    if (!dow) {
      return;
    }
    console.log("deleteLessons", dow);
  }

  async function downloadLessonAndChapter(lesson: string) {
    const lessonId: string = lesson;
    const dow = await Util.downloadZipBundle([lessonId]);
    updateLessonAndChapterStatus();
    if (!dow) {
      return;
    }
    console.log("downloaded ", dow);
  }

  const showSnackbar = (message: string, type: SnackbarType) => {
    switch (type) {
      case SnackbarType.Success:
        toast.success(message);
        break;
      case SnackbarType.Error:
        toast.error(message);
        break;
      default:
        toast(message);
    }
  };

  return (
    <div
      className="downloadAndDeleteButton"
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
        <div className="loading-spinner">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      ) : showIcon ? (
        <div className="download">
          <TfiDownload className="downloadButton" />
        </div>
      ) : (
        <div
          className="delete"
          onClick={(event) => {
            event.stopPropagation();
            setShowDialogBox(!showDialogBox);
          }}
        >
          <TfiTrash className="deleteButton" />
        </div>
      )}
    </div>
  );
};

export default DownloadLesson;
