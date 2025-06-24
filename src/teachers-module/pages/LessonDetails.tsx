import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { ServiceConfig } from "../../services/ServiceConfig";
import Header from "../components/homePage/Header";
import { t } from "i18next";
import "./LessonDetails.css";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SelectIcon from "../components/SelectIcon";
import SelectIconImage from "../../components/displaySubjects/SelectIconImage";
import { PAGES, TableTypes, belowGrade1, grade1 } from "../../common/constants";
import { Util } from "../../utility/util";
import AssigmentCount from "../components/library/AssignmentCount";
interface LessonDetailsProps {}
const LessonDetails: React.FC<LessonDetailsProps> = ({}) => {
  const history = useHistory();
  const course: TableTypes<"course"> = history.location.state?.[
    "course"
  ] as TableTypes<"course">;
  const lesson: TableTypes<"lesson"> = history.location.state?.[
    "lesson"
  ] as TableTypes<"lesson">;
  const [chapterId, setChapterId] = useState(
    history.location.state?.["chapterId"] as string
  );
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const current_class = Util.getCurrentClass();
  const selectedLesson = history.location.state?.["selectedLesson"];

  let isGrade1: string | boolean = false;

  const [classSelectedLesson, setClassSelectedLesson] = useState<
    Map<string, string[]>
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
  const onPlayClick = () => {
    const url = `https://chimple.cc/microlink/?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
    window.open(url);
  };
  useEffect(() => {
    const sync_lesson_data = selectedLesson.get(current_class?.id ?? "");
    const class_sync_lesson: Map<string, string[]> = new Map(
      Object.entries(sync_lesson_data ? JSON.parse(sync_lesson_data) : {})
    );
    setClassSelectedLesson(class_sync_lesson);
  }, []);
  useEffect(() => {
    const _assignmentLength = Array.from(classSelectedLesson.values()).reduce(
      (acc, array) => acc + array.length,
      0
    );
    setAssignmentCount(_assignmentLength);
    init();
  }, [classSelectedLesson]);
  const init = async () => {
    const current_class = Util.getCurrentClass();
    setChapterId(
      chapterId ??
        (await api.getChapterByLesson(lesson.id, current_class?.id ?? ""))
    );
  };

  const handleButtonClick = () => {
    const tmpselectedLesson = new Map(selectedLesson);
    const slctLesson = classSelectedLesson.get(chapterId) ?? [];
    const updatedLesson = slctLesson.includes(lesson.id)
      ? slctLesson.filter((item) => item !== lesson.id)
      : [...slctLesson, lesson.id];
    const updatedSelectedLesson = new Map(classSelectedLesson);
    updatedSelectedLesson.set(chapterId, updatedLesson);
    setClassSelectedLesson(updatedSelectedLesson);
    const _selectedLesson = JSON.stringify(
      Object.fromEntries(updatedSelectedLesson)
    );
    tmpselectedLesson.set(current_class?.id ?? "", _selectedLesson);
    const _totalSelectedLesson = JSON.stringify(
      Object.fromEntries(tmpselectedLesson)
    );
    syncSelectedLesson(_totalSelectedLesson);
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
      />
      <div className="lesson-details-body">
        <div className="lesson-card-info">
          <div className="lesson-card">
            <div className="play-ion" onClick={onPlayClick}>
              <div className="lesson-info-text">{t("Click to play")}</div>
              <RemoveRedEyeOutlinedIcon className="lesson-info-text" />
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
            <div className="lesson-info-text">{lesson.name}</div>
            <div className="lesson-info-text">
              {" "}
              {lesson.plugin_type === "cocos"
                ? t("Assignment")
                : t("Live Quiz")}
            </div>
            <SelectIcon
              isSelected={
                classSelectedLesson.get(chapterId)?.includes(lesson.id) ?? false
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
