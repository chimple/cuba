import { PAGES, CONTINUE, COCOS, LIVE_QUIZ } from "../common/constants";
import Lesson from "../models/lesson";
import Course from "../models/course";
import { Util } from "../utility/util";
import { useHistory } from "react-router-dom";
import { registerPlugin } from "@capacitor/core";

const PortPlugin = registerPlugin<any>("Port");


export const useHandleLessonClick = () => {
  const history = useHistory();
  

  return async (
    lesson: Lesson | null,
    isUnlocked: boolean,
    currentCourse: Course | undefined,
    online: boolean,
  ) => {
    if (!isUnlocked) return;

    const data = await PortPlugin.sendLaunchData();

    console.log("LessonCard course:", JSON.stringify(data));
  
    if (true) {
      let subjectDocID: string;

      const params = `?courseid=${data.courseId}&chapterid=${data.chapterId}&lessonid=${data.lessonId}`;
      Util.isDeepLink = true;

        history.push(PAGES.GAME + params, {
          url: "chimple-lib/index.html" + params,
          lessonId: data.lessonId,
          courseDocId: data.courseId,
          from: history.location.pathname + `?${CONTINUE}=true`,
        });

      console.log("LessonCard course:", JSON.stringify(history));

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
