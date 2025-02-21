import { PAGES, CONTINUE, COCOS, LIVE_QUIZ } from "../common/constants";
import Lesson from "../models/lesson";
import Course from "../models/course";
import { Util } from "../utility/util";
import { useHistory } from "react-router-dom";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import { t } from "i18next";
import { ApiHandler } from "../services/api/ApiHandler";
import { registerPlugin } from "@capacitor/core";

const PortPlugin = registerPlugin<any>("Port");


export const useHandleLessonClick = () => {
  const history = useHistory(); // ✅ Use the hook at the top level
  

  return async (
    lesson: Lesson | null,
    isUnlocked: boolean,
    currentCourse: Course | undefined,
    online: boolean,
    presentToast: (options: any) => void
  ) => {
    if (!isUnlocked) return;

    const data = await PortPlugin.sendLaunchData();

  

    console.log("LessonCard course:", currentCourse);

    const updatedLesson = await ApiHandler.i.getLessonWithCocosLessonId(data.lessonId);
    const updatedCourse = await ApiHandler.i.getCourseFromLesson(updatedLesson!);

    if (!updatedLesson || !updatedCourse) return;

    if (updatedLesson.pluginType === COCOS) {
      let subjectDocID: string;

      if (typeof updatedLesson.subject === "string") {
        const subjectReference = Util.getReference(updatedLesson.subject);
        subjectDocID = subjectReference.id;
      } else {
        subjectDocID = updatedLesson.subject?.id ?? "";
      }

      const params = `?courseid=${updatedLesson.cocosSubjectCode}&chapterid=${updatedLesson.cocosChapterCode}&lessonid=${updatedLesson.id}`;
      console.log("🚀 ~ Params:", params, Lesson.toJson(updatedLesson));

      history.push(PAGES.GAME + params, {
        url: "chimple-lib/index.html" + params,
        lessonId: updatedLesson.id,
        courseDocId:
          updatedLesson?.assignment?.course?.id ??
          updatedLesson.courseId ??
          updatedCourse?.docId,
        course: JSON.stringify(Course.toJson(updatedCourse)),
        lesson: JSON.stringify(Lesson.toJson(updatedLesson)),
        from: history.location.pathname + `?${CONTINUE}=true`,
      });
    } else if (updatedLesson.assignment?.docId && updatedLesson.pluginType === LIVE_QUIZ) {
      if (!online) {
        presentToast({
          message: t(`Device is offline`),
          color: "danger",
          duration: 3000,
          position: "bottom",
          buttons: [{ text: "Dismiss", role: "cancel" }],
        });
        return;
      }

      history.push(PAGES.LIVE_QUIZ_JOIN + `?assignmentId=${updatedLesson.assignment.docId}`, {
        assignment: JSON.stringify(updatedLesson.assignment),
      });
    }
  };
};

export const sendDataToJava = async (eventName: string, params: any) => {
  try {
    const response = await PortPlugin.sendDataToNative({ 
      eventName, 
      params 
    });
    console.log("Response from Java:", response);
  } catch (error) {
    console.error("Error sending data:", error);
  }
};
