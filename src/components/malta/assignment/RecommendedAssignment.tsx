import { t } from "i18next";
import "./RecommendedAssignment.css";
import React from "react";
import ChapterCard from "./ChapterCard";
import SelectAll from "./SelectAll";

const RecommendedAssignment: React.FC<{
  infoText: string;
}> = ({ infoText }) => {
  const num = [1, 2, 3, 4, 5];
  return (
    <div className="display-card">
      <div className="recommended-text">{t(infoText)}</div>
      <div className="select-all">
        <SelectAll />
      </div>
      <div className="recommended-content">
        {num.map(() => {
          return (
            <div className="recommended-card">
              <div className="recommended-subject-header">
                {t("SubjectName")}
              </div>
              <ChapterCard
                chapterTitle={"chapter Title"}
                lessons={[
                  { lesson: "lesson1", title: "lesson1" },
                  { lesson: "lesson2", title: "lesson2" },
                ]}
              ></ChapterCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RecommendedAssignment;
