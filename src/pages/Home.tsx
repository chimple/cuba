import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  useIonViewWillEnter,
} from "@ionic/react";
import { useState } from "react";
import { Route } from "react-router";
import CustomSlider from "../components/CustomSlider";
import SubjectDropdown from "../components/SubjectDropdown";
import "./Home.css";

const Home: React.FC = () => {
  const data: any = {
    en: [
      {
        name: "English Pre-Quiz",
        lessonid: "en_PreQuiz",
        chapterid: "en_quiz",
        courseid: "en",
      },
      {
        name: "Alphabet A",
        lessonid: "en0000",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "Alphabet B",
        lessonid: "en0001",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "Alphabet C",
        lessonid: "en0002",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "English Pre-Quiz",
        lessonid: "en_PreQuiz",
        chapterid: "en_quiz",
        courseid: "en",
      },
      {
        name: "Alphabet A",
        lessonid: "en0000",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "Alphabet B",
        lessonid: "en0001",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "Alphabet C",
        lessonid: "en0002",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "English Pre-Quiz",
        lessonid: "en_PreQuiz",
        chapterid: "en_quiz",
        courseid: "en",
      },
      {
        name: "Alphabet A",
        lessonid: "en0000",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "Alphabet B",
        lessonid: "en0001",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "Alphabet C",
        lessonid: "en0002",
        chapterid: "en00",
        courseid: "en",
      },
    ],
    hi: [
      {
        name: "प्रश्नोत्तरी",
        lessonid: "hi_PreQuiz",
        chapterid: "hi_quiz",
        courseid: "hi",
      },
      {
        name: "अ",
        lessonid: "hi0000",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "आ",
        lessonid: "hi0001",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "इ ",
        lessonid: "hi0002",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "ई ",
        lessonid: "hi0003",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "उ ",
        lessonid: "hi0004",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "ऊ ",
        lessonid: "hi0005",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "ऋ",
        lessonid: "hi0006",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "प्रश्नोत्तरी",
        lessonid: "hi_PreQuiz",
        chapterid: "hi_quiz",
        courseid: "hi",
      },
      {
        name: "अ",
        lessonid: "hi0000",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "आ",
        lessonid: "hi0001",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "इ ",
        lessonid: "hi0002",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "ई ",
        lessonid: "hi0003",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "उ ",
        lessonid: "hi0004",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "ऊ ",
        lessonid: "hi0005",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "ऋ",
        lessonid: "hi0006",
        chapterid: "hi00",
        courseid: "hi",
      },
    ],
    assignments: [
      {
        name: "प्रश्नोत्तरी",
        lessonid: "hi_PreQuiz",
        chapterid: "hi_quiz",
        courseid: "hi",
      },
      {
        name: "Assignments Pre-Quiz",
        lessonid: "en_PreQuiz",
        chapterid: "en_quiz",
        courseid: "en",
      },
      {
        name: "इ ",
        lessonid: "hi0002",
        chapterid: "hi00",
        courseid: "hi",
      },
      {
        name: "Alphabet C",
        lessonid: "en0002",
        chapterid: "en00",
        courseid: "en",
      },
      {
        name: "English Pre-Quiz",
        lessonid: "en_PreQuiz",
        chapterid: "en_quiz",
        courseid: "en",
      },
    ],
  };

  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState();
  const [assignmentsButtonFlag, setAssignmentsButtonFlag] = useState(false);
  const [assignmentsCount, setAssignmentsCount] = useState(0);

  console.log("in Home start");
  useIonViewWillEnter(() => {
    console.log("on Home");
    setDataList(data.en);
    setAssignmentsCount(0);
  });
  return (
    <IonPage id="home-page">
      <IonHeader id={"home-header"}>
        <button
          type="button"
          className="home-page-buttons"
          id="Feature-button"
          onClick={() => {
            console.log("Feature button clicked");
          }}
        >
          Feature
        </button>
        <button
          type="button"
          className="home-page-buttons"
          id="language-button"
          onClick={() => {
            console.log("Language button clicked");
          }}
        >
          Language
        </button>
        <button
          type="button"
          className="home-page-buttons"
          id="math-button"
          onClick={() => {
            console.log("Math button clicked");
          }}
        >
          Math
        </button>
        <button
          type="button"
          className="home-page-buttons"
          id="other-button"
          onClick={() => {
            console.log("other button clicked");
          }}
        >
          other
        </button>
        <button
          type="button"
          className="home-page-buttons"
          id="school-button"
          onClick={() => {
            console.log("school button clicked");
            setAssignmentsButtonFlag(true);
          }}
        >
          school
        </button>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Inbox</IonTitle>
          </IonToolbar>
        </IonHeader>
        {assignmentsButtonFlag ? (
          <div>
            <button
              type="button"
              className="home-page-buttons"
              id="assignment-button"
              onClick={() => {
                setDataList(data.assignments);
                setAssignmentsCount(data.assignments.length);
                console.log(
                  "Assignments flag",
                  assignmentsCount,
                  data.assignments.length
                );
              }}
            >
              Assignments {assignmentsCount != 0 ? assignmentsCount : ""}
            </button>
            <button
              type="button"
              className="home-page-buttons"
              id="leaderboard-button"
              onClick={() => {
                console.log("Leaderboard Clicked");
                setDataList([]);
              }}
            >
              LeaderBoard
            </button>
          </div>
        ) : null}
        {/* {!isLoading ? <CustomSlider lessonData={dataList} /> : null} */}
      </IonContent>
    </IonPage>
  );
};
export default Home;
