import React, { useState } from "react";
import "./LessonComponent.css"; // Assuming you have some basic styles
import { TableTypes } from "../../../common/constants";
import SelectIconImage from "../../../components/displaySubjects/SelectIconImage";
import SelectIcon from "../SelectIcon";
import { t } from "i18next";

interface LessonComponentProps {
  lesson: TableTypes<"lesson">;
  handleLessonCLick: Function;
  handleSelect: Function;
  isSelcted: boolean;
  isSelButton: boolean;
}

const LessonComponent: React.FC<LessonComponentProps> = ({
  lesson,
  handleLessonCLick,
  handleSelect,
  isSelcted,
  isSelButton,
}) => {
  const [isTicked, setIsTicked] = useState(isSelcted);

  const handleImageClick = () => {
    console.log("Image clicked");
    // Add your image click logic here
  };

  const handleTickClick = () => {
    handleSelect();
    setIsTicked(!isTicked);
  };
  return (
    <div className="lesson-component-container">
      <div className="lesson-type-logo">
        <div className="lesson-type">
          {lesson.plugin_type === "cocos" ? t("Assignment") : t("Live Quiz")}
        </div>
        <div
          className={
            lesson.plugin_type === "cocos" ? "assignment-logo" : "quiz-logo"
          }
        ></div>
      </div>
      <div
        style={{ backgroundColor: "darkorange" }}
        className="image-container"
        onClick={() => {
          handleLessonCLick();
        }}
      >
        <SelectIconImage
          localSrc={`courses/en/icons/en00.webp`}
          defaultSrc={"assets/icons/DefaultIcon.png"}
          webSrc={`${lesson.image}`}
          // imageWidth="100%"
          imageHeight="100%"
          webImageHeight="0px"
        />
      </div>
      <div className="text-container">
        <div className="lesson-details">
          {" "}
          {lesson.name!.length > 15
            ? lesson.name?.substring(0, 15) + "..."
            : lesson.name}
        </div>
        {isSelButton ? (
          <SelectIcon isSelected={isTicked} onClick={handleTickClick} />
        ) : null}
      </div>
    </div>
  );
};

export default LessonComponent;
