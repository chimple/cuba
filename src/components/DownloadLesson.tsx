import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DownloadLesson: React.FC<{
  lessonID?: any;
  chapters?: any;
  lessonDoc?: any;
}> = ({ lessonID, chapters, lessonDoc }) => {
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

    if (isStored(lessonID, "lessonItems")) {
      setShowIcon(false);
    }

    if (chapters && isStored(chapters.id, "chapterItems")) {
      setShowIcon(false);
    }
  }, [lessonID, chapters]);

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

    setTimeout(async () => {
      if (!online) {
        showSnackbar(
          `Device is offline. Cannot download  ${
            chapters ? "Chapter" : "Lesson"
          }`,
          "error"
        );
        setLoading(false);
      } else {
        if (chapters) {
          if (!isStored(chapters.id, "chapterItems")) {
            storeId(chapters.id, "chapterItems");
            await downloadLesson(chapters.id);
          }

          const lessons: Lesson[] = await api.getLessonsForChapter(chapters);
          for (const e of lessons) {
            if (!isStored(e.id, "lessonItems")) {
              storeId(e.id, "lessonItems");
              await downloadLesson(e.id);
            }
          }
          setShowIcon(false);
        } else if (lessonID) {
          if (!isStored(lessonID, "lessonItems")) {
            storeId(lessonID, "lessonItems");
            await downloadLesson(lessonID);
          }
          setShowIcon(false);
        }
      }

      setLoading(false);
    }, 3000);
  };

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    setTimeout(async () => {
      if (chapters) {
        removeFromStorage(chapters.id, "chapterItems");
        await deleteLessons(chapters.id);

        const lessons: Lesson[] = await api.getLessonsForChapter(chapters);
        for (const e of lessons) {
          removeFromStorage(e.id, "lessonItems");
          await deleteLessons(e.id);
          if (!isStored(e.id, "lessonItems")) {
            setShowIcon(true);
          }
        }
      } else if (lessonID) {
        removeFromStorage(lessonID, "lessonItems");
        setShowIcon(false);
        await deleteLessons(lessonID);
        if (!isStored(lessonID, "lessonItems")) {
          setShowIcon(true);
        }
      }

      setLoading(false);
    }, 2000);
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

  const showSnackbar = (message, type) => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
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
