import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCheckbox,
} from "@ionic/react";
import { Box } from "@mui/material";
import { t } from "i18next";
import "./ChapterCard.css";

const ChapterCard: React.FC<{
  chapterTitle: string;
  lessons: { lesson: string; title: string }[];
}> = ({ chapterTitle, lessons }) => {
  return (
    <>
      <Box
        sx={{
          width: "100vw",
          maxWidth: "93%",
          borderRadius: 20,
        }}
      >
        <IonCard className="card">
          <IonCardHeader>
            <div style={{ display: "flex" }}>
              <IonCardSubtitle className="card-subtitle">
                {t(chapterTitle)}
              </IonCardSubtitle>
            </div>
          </IonCardHeader>
          <IonCardContent>
            {lessons.map((lesson) => {
              return (
                <div className="recommended-lesson">
                  <IonCheckbox className="checkbox">
                    {t(lesson.title)}
                  </IonCheckbox>
                </div>
              );
            })}
          </IonCardContent>
        </IonCard>
      </Box>
    </>
  );
};
export default ChapterCard;
