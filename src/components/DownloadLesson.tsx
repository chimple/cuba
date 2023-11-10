import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CHAPTER_ITEM, LESSON_ITEM, SnackbarType } from "../common/constants";

const DownloadLesson: React.FC<{
  lessonID?: any;
  chapters?: any;
  lessonDoc?: Lesson[];
}> = ({ lessonID, chapters, lessonDoc }) => {
  console.log("chaptersss", lessonDoc);
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
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
  };
  const removeFromStorage = (id: string, storageKey: string) => {
    const storedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedItems = storedItems.filter((item: string) => item !== id);
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    console.log("lesson is deleted");
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
  async function checkLessonForChapter() {
    if (lessonDoc) {
      for (const e of lessonDoc) {
        console.log("idsssss", e.id);
        if (!isIdPresentInLocalStorage(e.id, LESSON_ITEM)) {
          removeFromStorage(e.cocosChapterCode!, CHAPTER_ITEM);
          return false;
        }

        storeId(e.cocosChapterCode!, CHAPTER_ITEM);
      }
      return true;
    }
    console.log("sucess2");
    return false;
  }

  const isIdPresentInLocalStorage = (id, storageKey) => {
    const storedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return storedItems.includes(id);
  };

  checkLessonForChapter();

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
    if (!dow) {
      return;
    }
    console.log("deleteLessons", dow);
  }

  // async function checkLesson() {
  //   const dow = await Util.checkDownloadedLessons();
  //   console.log("downloaddata", dow);
  // }

  async function downloadLesson(lesson: string) {
    const lessonId: string = lesson;
    console.log("lessom-id2", lessonID);
    const dow = await Util.downloadZipBundle([lessonId]);

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
  );
};

export default DownloadLesson;
