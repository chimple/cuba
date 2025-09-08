import { PAGES, CONTINUE, COCOS, LIVE_QUIZ } from "../common/constants";
import Lesson from "../models/lesson";
import Course from "../models/course";
import { Util } from "../utility/util";
import { useHistory } from "react-router-dom";
import { registerPlugin } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";

const PortPlugin = registerPlugin<any>("Port");

export const useHandleLessonClick = (customHistory) => {
  const history = useHistory();


  return async (
    lesson: Lesson | null,
    isUnlocked: boolean,
    currentCourse: Course | undefined,
    online: boolean,
  ) => {
    if (!isUnlocked) return;

    const data = await PortPlugin.sendLaunchData();
    const api = ServiceConfig.getI().apiHandler;

    console.log("LessonCard course:", JSON.stringify(data));

    if (true) {
      const lesson = await api.getLesson(data.lessonId);
      console.log("lesson object --> ", JSON.stringify(lesson, null, 2));
      if (!lesson) {
        console.error("Lesson not found");
        return;
      }
      let coursesForLesson: any[] = [];
      try {
        if (lesson.id) {
          coursesForLesson = await api.getCoursesFromLesson(lesson.id);
        }
      } catch (error) {
        console.error("Failed to fetch courses for lesson:", error);
      }
      const resolvedCourseId = coursesForLesson.length > 0 ? coursesForLesson[0].id : lesson.cocos_subject_code;

      const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      Util.isDeepLink = true;

        customHistory.push(PAGES.GAME + params, {
          url: "chimple-lib/index.html" + params,
          lessonId: lesson?.cocos_lesson_id,
          courseDocId: lesson?.subject_id,
          from: customHistory.location.pathname + `?${CONTINUE}=true`,
        });

      console.log("LessonCard course:", JSON.stringify(lesson));

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