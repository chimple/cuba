import { IonContent, IonPage } from "@ionic/react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import "./End.css";

export const End: React.FC = () => {
  const history = useHistory();
  console.log("END game", history.location.state);
  const state = history.location.state as any;
  return (
    <IonPage>
      <IonContent className="content">
        <h1>score: {state?.score}</h1>
        <h1>chapterName: {state?.chapterName}</h1>
        <h1>chapterId: {state?.chapterId}</h1>
        <h1>lessonId: {state?.lessonId}</h1>
        <h1>courseName: {state?.courseName}</h1>
        <h1>lessonType: {state?.lessonType}</h1>
        <h1>lessonName: {state?.lessonName}</h1>
        <h1>timeSpent: {state?.timeSpent}</h1>
        <h2>
          Go to
          <Link to="/" replace>
            Home
          </Link>
          Page
        </h2>
      </IonContent>
    </IonPage>
  );
};
