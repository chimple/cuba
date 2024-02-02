import React, { useState, useEffect } from "react";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import "./DownloadChapterAndLesson.css";
import { t } from "i18next";
import DialogBoxButtons from "./parent/DialogBoxButtons​";
import { useIonToast } from "@ionic/react";
import { DOWNLOADED_LESSON_AND_CHAPTER_ID } from "../common/constants";
import { TfiDownload, TfiTrash } from "react-icons/tfi";
import { Capacitor } from "@capacitor/core";
import { Chapter } from "../common/courseConstants";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";

const DownloadLesson: React.FC<{
  lessonID?: string;
  chapters?: Chapter;
  chapterID?: string;
}> = ({ lessonID, chapters, chapterID }) => {
  const [showIcon, setShowIcon] = useState(true);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storedLessonID, setStoredLessonID] = useState<string[]>([]);
  const api = ServiceConfig.getI().apiHandler;
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  useEffect(() => {
    const storedLessonAndChapterIds = Util.getStoredLessonAndChapterIds();

    if (lessonID && storedLessonAndChapterIds.lesson.includes(lessonID)) {
      setShowIcon(false);
    }

    if (chapters && storedLessonAndChapterIds.chapter.includes(chapters.id)) {
      setShowIcon(false);
    }
  }, []);
  async function init() {
    const lesson = Util.updateChapterOrLessonDownloadStatus(chapterID);
    if (!lesson) {
      return;
    }
  }

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);

    if (!online) {
      presentToast({
        message: t(
          `Device is offline. Cannot download ${
            chapters ? "Chapter" : "Lesson"
          }`
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

    if (chapters) {
      if (!storedLessonID.includes(chapters.id)) {
        setStoredLessonID((prevIds) => [...prevIds, chapters.id]);
        const lessons: Lesson[] = await api.getLessonsForChapter(chapters);

        for (const e of lessons) {
          if (!storedLessonID.includes(e.id)) {
            storeLessonID.push(e.id);
          }
        }
        await Util.downloadZipBundle(storeLessonID);
        Util.storeLessonOrChaterIdToLocalStorage(
          chapters.id,
          DOWNLOADED_LESSON_AND_CHAPTER_ID,
          "chapter"
        );
      }
    } else {
      if (lessonID) {
        if (!storedLessonID.includes(lessonID)) {
          await Util.downloadZipBundle([lessonID]);
        }
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
        if (!storedLessonID.includes(e.id)) {
          setShowIcon(true);
        }
      });

      await Util.deleteDownloadedLesson(storeLessonID);
      Util.removeLessonOrChapterIdFromLocalStorage(
        chapters.id,
        DOWNLOADED_LESSON_AND_CHAPTER_ID
      );
    } else if (lessonID) {
      await Util.deleteDownloadedLesson([lessonID]);
      if (!storedLessonID.includes(lessonID)) {
        setShowIcon(true);
      }
    }
    setLoading(false);
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
