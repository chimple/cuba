import { t } from "i18next";
import "./RecommendedAssignment.css";
import { Box } from "@mui/material";
import React from "react";
import SubjectCard from "./ChapterCard";
import SelectAll from "./SelectAll";

const RecommendedAssignment: React.FC<{
  infoText: string;
}> = ({ infoText }) => {
  const subjects = [
    {
      chapters: [
        {
          lessons: [
            { lesson: "lesson1", title: "lesson" },
            { lesson: "lesson2", title: "lesson" },
          ],
          title: "chapterName",
        },
        {
          lessons: [
            { lesson: "lesson1", title: "lesson" },
            { lesson: "lesson2", title: "lesson" },
          ],
          title: "chapterName",
        },
      ],
      title: "SubjectName",
    },
    {
      chapters: [
        {
          lessons: [
            { lesson: "lesson1", title: "lesson" },
            { lesson: "lesson2", title: "lesson" },
          ],
          title: "chapterName",
        },
        {
          lessons: [
            { lesson: "lesson1", title: "lesson" },
            { lesson: "lesson2", title: "lesson" },
          ],
          title: "chapterName",
        },
      ],
      title: "SubjectName",
    },
  ];

  return (
    //render .map()
    <div className="display-card">
      <div className="recommended-text">{t(infoText)}</div>
      <div className="select-all">
        <SelectAll />
      </div>
      <div className="recommended-content">
        {subjects.map((data) => {
          return (
            <div className="recommended-card">
              <div className="recommended-subject-header">{t(data.title)}</div>
              {data.chapters.map((chapter) => {
                return (
                  <SubjectCard
                    chapterTitle={chapter.title}
                    lessons={chapter.lessons}
                  ></SubjectCard>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RecommendedAssignment;
