import { t } from "i18next";
import "./RecommendedAssignment.css";
import { Box } from "@mui/material";
import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCheckbox,
} from "@ionic/react";

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
        <IonCheckbox labelPlacement="start">{t("Select All")}</IonCheckbox>
      </div>
      <div className="recommended-content">
        {subjects.map((data) => {
          return (
            <div className="recommended-card">
              <div className="recommended-subject-header">{t(data.title)}</div>
              {data.chapters.map((chapter) => {
                return (
                  <Box
                    sx={{
                      width: "100vw",
                      maxWidth: "93%",
                      borderRadius: 20,
                    }}
                  >
                    <IonCard>
                      <IonCardHeader>
                        <div style={{ display: "flex" }}>
                          <IonCardSubtitle>{t(chapter.title)}</IonCardSubtitle>
                        </div>
                      </IonCardHeader>
                      <IonCardContent>
                        {chapter.lessons.map((lesson) => {
                          return (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                padding: "2px",
                              }}
                            >
                              <IonCheckbox
                                justify="space-between"
                                color={"white"}
                              >
                                {t(lesson.title)}
                              </IonCheckbox>
                            </div>
                          );
                        })}
                      </IonCardContent>
                    </IonCard>
                  </Box>
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
