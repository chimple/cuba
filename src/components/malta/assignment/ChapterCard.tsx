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
        <IonCard className="card" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <IonCardHeader placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
            <div style={{ display: "flex" }}>
              <IonCardSubtitle className="card-subtitle" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                {t(chapterTitle)}
              </IonCardSubtitle>
            </div>
          </IonCardHeader>
          <IonCardContent placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
            {lessons.map((lesson) => {
              return (
                <div className="recommended-lesson">
                  <IonCheckbox className="checkbox" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
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
