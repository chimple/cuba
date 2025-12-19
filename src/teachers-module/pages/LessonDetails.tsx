import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { ServiceConfig } from "../../services/ServiceConfig";
import Header from "../components/homePage/Header";
import { t } from "i18next";
import "./LessonDetails.css";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SelectIcon from "../components/SelectIcon";
import SelectIconImage from "../../components/displaySubjects/SelectIconImage";
import { AssignmentSource, COCOS, CONTINUE, CocosCourseIdentifier, LIDO, LIVE_QUIZ, PAGES, TableTypes, belowGrade1, grade1 } from "../../common/constants";
import { Util } from "../../utility/util";
import AssigmentCount from "../components/library/AssignmentCount";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
interface LessonDetailsProps { }
const LessonDetails: React.FC<LessonDetailsProps> = ({ }) => {
  const currentSchool = Util.getCurrentSchool();
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const course: TableTypes<"course"> = history.location.state?.[
    "course"
  ] as TableTypes<"course">;
  const lesson: TableTypes<"lesson"> = history.location.state?.[
    "lesson"
  ] as TableTypes<"lesson">;
  const fromCocos: boolean = history.location.state?.[
    "fromCocos"
  ] as boolean;
  const [chapterId, setChapterId] = useState(
    history.location.state?.["chapterId"] as string
  );
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const current_class = Util.getCurrentClass();
  const selectedLesson = history.location.state?.["selectedLesson"];
  const [currentClass, setCurrentClass] = useState<TableTypes<"class"> | null>(null);
  const [selectedLessonMap, setSelectedLessonMap] = useState<Map<string, string>>(new Map(selectedLesson));

  let isGrade1: string | boolean = false;

  const [classSelectedLesson, setClassSelectedLesson] = useState<
    Map<string, Partial<Record<AssignmentSource, string[]>>>
  >(new Map());
  if (
    course &&
    (course.grade_id === grade1 || course.grade_id === belowGrade1)
  ) {
    isGrade1 = true;
  } else if (!course) {
    isGrade1 = "";
  }
  const syncSelectedLesson = async (lesson) => {
    var current_user = await auth.getCurrentUser();
    if (current_user?.id)
      await api.createOrUpdateAssignmentCart(current_user?.id, lesson);
  };
  const COURSE_VALUES_SET = new Set(
    (Object.values(CocosCourseIdentifier) as string[]).map((v) =>
      v.toLowerCase()
    )
  );
  const getCourseIdFromCocosLesson = (
    rawLessonId: string | null,
    subjectCode: string | null
  ): string | null => {
    if (!rawLessonId) {
      return subjectCode;
    }
    const parts = rawLessonId
      .trim()
      .toLowerCase()
      .split(/[^a-z]+/);
    for (const part of parts) {
      if (COURSE_VALUES_SET.has(part)) {
        return part;
      }
    }
    return subjectCode;
  };
  const onPlayClick = async () => {
    // const baseUrl = "https://chimple.cc/microlink/";
    // const queryParams = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
    // const urlToOpen = `${baseUrl}${queryParams}`;

    // try {
    //   await Browser.open({ url: urlToOpen });
    // } catch (error) {
    //   console.error("Error opening in-app browser:", error);
    //   window.open(urlToOpen, '_blank');
    // }
    if (lesson.plugin_type === COCOS) {
      const courseId = getCourseIdFromCocosLesson(
        lesson.cocos_lesson_id,
        lesson.cocos_subject_code
      );
      const parmas = `?courseid=${courseId}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      setTimeout(()=>{
        Util.launchCocosGame();
      },1000)
      history.replace(PAGES.GAME + parmas, {
        url: "chimple-lib/index.html" + parmas,
        lessonId: lesson.cocos_lesson_id,
        courseDocId:
          course?.id,
        course: JSON.stringify(course),
        lesson: JSON.stringify(lesson),
        chapterId: chapterId,
        selectedLesson: selectedLessonMap,
        from: history.location.pathname + `?${CONTINUE}=true`,
      });
    } else if (
      // !!assignment?.id &&
      lesson.plugin_type === LIVE_QUIZ
    ) {
      if (!online) {
        presentToast({
          message: t(`Device is offline`),
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
        return;
      }
      history.replace(
        PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
        {
          courseId: course?.id,
          lesson: JSON.stringify(lesson),
          selectedLesson: selectedLessonMap,
          from: history.location.pathname + `?${CONTINUE}=true`,
        }
      );

    } else if (lesson.plugin_type === LIDO) {
      const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      history.replace(PAGES.LIDO_PLAYER + parmas, {
        lessonId: lesson.cocos_lesson_id,
        courseDocId: course?.id,
        course: JSON.stringify(course!),
        lesson: JSON.stringify(lesson),
        selectedLesson: selectedLessonMap,
        from: history.location.pathname + `?${CONTINUE}=true`,
      });
    }
  };
  useEffect(() => {
    const sync_lesson_data = selectedLessonMap.get(current_class?.id ?? "");
    const parsed = sync_lesson_data ? JSON.parse(sync_lesson_data) : {};
    const class_sync_lesson: Map<string, Partial<Record<AssignmentSource, string[]>>> = new Map();
    Object.entries(parsed).forEach(([chapterId, value]) => {
      if (Array.isArray(value)) {
        // Old format: convert to new format
        class_sync_lesson.set(chapterId, {
          [AssignmentSource.MANUAL]: [...value],
        });
      } else if (typeof value === "object" && value !== null) {
        // New format
        Object.keys(value).forEach((key) => {
          if (key !== AssignmentSource.MANUAL && key !== AssignmentSource.QR_CODE) {
            delete value[key];
          }
        });
        class_sync_lesson.set(chapterId, value);
      }
    });
    setClassSelectedLesson(class_sync_lesson);
  }, []);
  useEffect(() => {
    let _assignmentLength = 0;
    for (const value of classSelectedLesson.values()) {
      const manual = value[AssignmentSource.MANUAL] || [];
      const qr = value[AssignmentSource.QR_CODE] || [];
      _assignmentLength += manual.length + qr.length;
    }
    setAssignmentCount(_assignmentLength);
    init();
  }, [classSelectedLesson]);

  const init = async () => {
    if (fromCocos) {
      if (Capacitor.isNativePlatform()) {
        await ScreenOrientation.lock({ orientation: "portrait" });
      }
      setTimeout(() => {
        Util.killCocosGame();
      }, 1000);

    }

    const current_class = Util.getCurrentClass();
    setCurrentClass(current_class ?? null);
    if (!chapterId && current_class) {
      const fetched = await api.getChapterByLesson(
        lesson.id,
        current_class.id
      );
      if (typeof fetched === "string") {
        setChapterId(fetched);
      }
    }
  };

  const handleButtonClick = () => {
    const classId = current_class?.id ?? "";
    const tmpselectedLesson = new Map(selectedLessonMap);

    const prevDataStr = tmpselectedLesson.get(classId) ?? "{}";
    const parsed = JSON.parse(prevDataStr);

    let updatedChapterData: Record<string, any> = parsed[chapterId] ?? {};

    // Handle old format fallback
    if (Array.isArray(updatedChapterData)) {
      updatedChapterData = { manual: [...updatedChapterData] };
    }

    // Get both manual and qr_code arrays
    const manualArr = updatedChapterData[AssignmentSource.MANUAL] ?? [];
    const qrArr = updatedChapterData[AssignmentSource.QR_CODE] ?? [];
    const isSelected = manualArr.includes(lesson.id) || qrArr.includes(lesson.id);

    if (isSelected) {
      // Remove from both manual and qr_code
      updatedChapterData[AssignmentSource.MANUAL] = manualArr.filter((id: string) => id !== lesson.id);
      updatedChapterData[AssignmentSource.QR_CODE] = qrArr.filter((id: string) => id !== lesson.id);
    } else {
      // Add to manual
      updatedChapterData[AssignmentSource.MANUAL] = [...manualArr, lesson.id];
    }

    // Update the chapter data in main object
    parsed[chapterId] = updatedChapterData;

    // Convert to map for state update
    const updatedClassSelectedLesson = new Map(classSelectedLesson);
    updatedClassSelectedLesson.set(
      chapterId,
      updatedChapterData
    );
    setClassSelectedLesson(updatedClassSelectedLesson);

    // Serialize and store
    tmpselectedLesson.set(classId, JSON.stringify(parsed));
    setSelectedLessonMap(tmpselectedLesson);

    const totalSelectedLesson = JSON.stringify(Object.fromEntries(tmpselectedLesson));
    syncSelectedLesson(totalSelectedLesson);
  };
  return (
    <div className="lesson-details-container">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          course
            ? history.replace(PAGES.SHOW_CHAPTERS, {
              course: course,
              chapterId: chapterId,
            })
            : history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
        }}
        showSchool={true}
        showClass={true}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
      />
      <div className="lesson-details-body">
        <div className="lesson-card-info">
          <div className="lesson-card" onClick={onPlayClick}>
            <div className="play-ion">
              <div className="lesson-info-text">{t("Click to play")}</div>
              <img src="assets/icons/lessonplayEye.svg" alt="View_lesson" />
            </div>
            <div className="lesson-info-image">
              <SelectIconImage
                localSrc={""}
                defaultSrc={"assets/icons/DefaultIcon.png"}
                webSrc={`${lesson.image}`}
              />
            </div>
          </div>
          <div className="lesson-info">
            <div className="lesson-info-text">
              {course ? course.name : ""}{" "}
              {isGrade1 ? `${t("Grade")} ${isGrade1 === true ? "1" : "2"}` : ""}
            </div>
            <div className="lesson-info-text">
              {course && course.name === "ENGLISH"
                ? lesson.name  // don’t translate
                : t(lesson.name ?? "")}  {/* translate */}
            </div>
            <div className="lesson-info-text">
              {" "}
              {lesson.plugin_type === "cocos"
                ? t("Assignment")
                : t("Live Quiz")}
            </div>
            <SelectIcon
              isSelected={
                ([
                  ...(classSelectedLesson.get(chapterId)?.[AssignmentSource.MANUAL] ?? []),
                  ...(classSelectedLesson.get(chapterId)?.[AssignmentSource.QR_CODE] ?? [])
                ].includes(lesson.id) ?? false)
              }
              onClick={handleButtonClick}
            />
          </div>
        </div>
        <div className="learning-outcome-text">{lesson.outcome}</div>
      </div>
      <AssigmentCount
        assignments={assignmentCount}
        onClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 2 });
        }}
      />
    </div>
  );
};

export default LessonDetails;
