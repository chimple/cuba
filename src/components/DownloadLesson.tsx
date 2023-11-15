import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CHAPTER_ITEM, LESSON_ITEM, SnackbarType } from "../common/constants";
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

    if (isStored(lessonID, LESSON_ITEM)) {
      setShowIcon(false);
    }

    if (chapters && isStored(chapters.id, CHAPTER_ITEM)) {
      setShowIcon(false);
    }
  }, []);

  const isStored = (id: string, storageKey: string): boolean => {
    const storedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return storedItems.includes(id);
  };

  const storeId = (id: string, storageKey: string) => {
    const storedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedItems = [...storedItems, id];
    if (updatedItems) {
      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    } else return;
  };

  const removeFromStorage = (id: string, storageKey: string) => {
    const storedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedItems = storedItems.filter((item: string) => item !== id);
    if (updatedItems) {
      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
      console.log("lesson is deleted");
    } else return;
  };
  const fetchData = async () => {
    if (loading) return;
    setLoading(true);

    if (!online) {
      showSnackbar(
        `Device is offline. Cannot download  ${
          chapters ? "Chapter" : "Lesson"
        }`,
        SnackbarType.Error
      );
      setLoading(false);
    } else {
      if (chapters) {
        if (!isStored(chapters.id, CHAPTER_ITEM)) {
          storeId(chapters.id, CHAPTER_ITEM);
          await downloadLesson(chapters.id);
        }

        const lessons: Lesson[] = await api.getLessonsForChapter(chapters);
        for (const e of lessons) {
          if (!isStored(e.id, LESSON_ITEM)) {
            storeId(e.id, LESSON_ITEM);
            await downloadLesson(e.id);
          }
        }
        setShowIcon(false);
      } else if (lessonID) {
        if (!isStored(lessonID, LESSON_ITEM)) {
          storeId(lessonID, LESSON_ITEM);
          await downloadLesson(lessonID);
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
    } else console.log("Lessons and Chapters status updated ");
  }

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);

    if (chapters) {
      removeFromStorage(chapters.id, CHAPTER_ITEM);
      await deleteLessons(chapters.id);

      const lessons: Lesson[] = await api.getLessonsForChapter(chapters);
      for (const e of lessons) {
        removeFromStorage(e.id, LESSON_ITEM);
        await deleteLessons(e.id);
        if (!isStored(e.id, LESSON_ITEM)) {
          setShowIcon(true);
        }
      }
    } else if (lessonID) {
      removeFromStorage(lessonID, LESSON_ITEM);
      setShowIcon(false);
      await deleteLessons(lessonID);
      if (!isStored(lessonID, LESSON_ITEM)) {
        setShowIcon(true);
      }
    }

    setLoading(false);
  };

  async function deleteLessons(lesson: string) {
    const lessonId: string = lesson;
    const dow = await Util.deleteDownloadedLesson(lessonId);
    updateLessonAndChapterStatus();
    if (!dow) {
      return;
    }
    console.log("deleteLessons", dow);
  }

  async function downloadLesson(lesson: string) {
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

  return Capacitor.isNativePlatform() ? (
    <div
      className="downloadButton"
      style={{
        cursor: "pointer",
      }}
      onClick={(event) => {
        event.stopPropagation();
        fetchData();
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
          <img src="assets/icons/download.svg" alt="Download Icon" />
        </div>
      ) : (
        <div
          className="delete"
          onClick={(event) => {
            event.stopPropagation();
            setShowDialogBox(!showDialogBox);
          }}
        >
          <img src="assets/icons/delete.svg" alt="Delete Icon" />
        </div>
      )}
    </div>
  ) : null;
};

export default DownloadLesson;
