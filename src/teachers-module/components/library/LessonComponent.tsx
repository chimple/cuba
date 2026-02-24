import React, { useEffect, useState } from "react";
import "./LessonComponent.css"; // Assuming you have some basic styles
import { COURSES,TableTypes } from "../../../common/constants";
import SelectIconImage from "../../../components/displaySubjects/SelectIconImage";
import SelectIcon from "../SelectIcon";
import { t } from "i18next";

interface LessonComponentProps {
  lesson: TableTypes<"lesson">;
  handleLessonCLick: Function;
  handleSelect: Function;
  isSelcted: boolean;
  isSelButton: boolean;
  courseCode?: String;
  isAssigned?: boolean;
  showAssignedBadge?: boolean;
}

const LessonComponent: React.FC<LessonComponentProps> = ({
  lesson,
  handleLessonCLick,
  handleSelect,
  isSelcted,
  isSelButton,
  courseCode,
  isAssigned = false,
  showAssignedBadge = false,
}) => {
  const [isTicked, setIsTicked] = useState(isSelcted);

  useEffect(() => {
    setIsTicked(isSelcted);
  }, [isSelcted]);

  const handleTickClick = () => {
    handleSelect();
    setIsTicked(!isTicked);
  };
  return (
    <div
      id="lessoncomponent-lesson-component-container"
      className="lessoncomponent-lesson-component-container"
    >
      <div
        id="lessoncomponent-lesson-type-logo"
        className="lessoncomponent-lesson-type-logo"
      >
        <div id="lessoncomponent-lesson-type" className="lessoncomponent-lesson-type">
          {lesson.plugin_type === "cocos" ? t("Assignment") : t("Live Quiz")}
        </div>
        <div
          id={
            lesson.plugin_type === "cocos"
              ? "lessoncomponent-assignment-logo"
              : "lessoncomponent-quiz-logo"
          }
          className={
            lesson.plugin_type === "cocos"
              ? "lessoncomponent-assignment-logo"
              : "lessoncomponent-quiz-logo"
          }
        ></div>
      </div>
      <div
        id="lessoncomponent-image-container"
        className="lessoncomponent-image-container"
        onClick={() => {
          handleLessonCLick();
        }}
      >
        <div id="lessoncomponent-lesson-image" className="lessoncomponent-lesson-image">
          <SelectIconImage
            localSrc={`courses/en/icons/en00.webp`}
            defaultSrc={"assets/icons/DefaultIcon.png"}
            webSrc={`${lesson.image}`}
            // imageWidth="100%"
            imageHeight="100%"
            webImageHeight="0px"
          />
        </div>
        {showAssignedBadge && isAssigned ? (
          <span
            id="lessoncomponent-lesson-assigned-badge"
            className="lessoncomponent-lesson-assigned-badge"
            title={t("Assigned") ?? ""}
            aria-label={t("Assigned") ?? ""}
          >
            <img
              src="/assets/hideassigned.png"
              alt=""
              onError={(event) => {
                event.currentTarget.src = "assets/icons/assignmentSelect.svg";
              }}
            />
          </span>
        ) : null}
      </div>
      <div id="lessoncomponent-text-container" className="lessoncomponent-text-container">
        <div id="lessoncomponent-lesson-details" className="lessoncomponent-lesson-details">
          {courseCode === COURSES.ENGLISH
            ? lesson.name!.length > 15
              ? lesson.name?.substring(0, 15) + "..."
              : lesson.name
            : t(lesson.name ?? "").length > 15
              ? t(lesson.name ?? "").substring(0, 15) + "..."
              : t(lesson.name ?? "")}
        </div>
        {isSelButton ? (
          <SelectIcon isSelected={isTicked} onClick={handleTickClick} />
        ) : null}
      </div>
    </div>
  );
};

export default LessonComponent;
