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

  async function init() {
    const lesson = Util.checkLessonForChapter(lessonData);
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
      if (!isStored(chapters.id, CHAPTER_ID)) {
        const lessons: Lesson[] = await api.getLessonsForChapter(chapters);

        for (const e of lessons) {
          if (!isStored(e.id, LESSON_ID)) {
            storeLessonID.push(e.id);
            await Util.downloadZipBundle([e.id]);
          }
        }

        Util.storeIdToLocalStorage(storeLessonID, LESSON_ID);
        Util.storeIdToLocalStorage(chapters.id, CHAPTER_ID);
      }
    } else {
      if (!isStored(lessonID, LESSON_ID)) {
        await Util.downloadZipBundle([lessonID]);
        Util.storeIdToLocalStorage(lessonID, LESSON_ID);
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
        if (!isStored(e.id, LESSON_ID)) {
          setShowIcon(true);
        }
      });
      Util.removeIdFromLocalStorage(chapters.id, CHAPTER_ID);
      Util.removeIdFromLocalStorage(storeLessonID, LESSON_ID);
    } else if (lessonID) {
      Util.removeIdFromLocalStorage(lessonID, LESSON_ID);
      setShowIcon(false);
      await Util.deleteDownloadedLesson(lessonID);
      if (!isStored(lessonID, LESSON_ID)) {
        setShowIcon(true);
      }
    }
    setLoading(false);
  };
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
  useEffect(() => {
    init();
  }, [handleDownload, handleDelete]);

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
          {" "}
          <TfiTrash className="deleteButton" />
        </div>
      )}
    </div>
  );
};

export default DownloadLesson;
