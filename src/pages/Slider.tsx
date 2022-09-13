import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  useIonViewWillEnter,
} from "@ionic/react";
import { useState } from "react";
import CustomSlider from "../components/CustomSlider";
import SubjectDropdown from "../components/SubjectDropdown";

const Slider: React.FC = () => {
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
  };
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState();

  console.log("in slider start");
  useIonViewWillEnter(() => {
    console.log("on slider");
    setDataList(data.en);
  });
  return (
    <IonPage id="slider-page">
      <IonHeader>
        {/* <IonToolbar> */}
          <IonTitle text-center>
            {!isLoading ? (
              <SubjectDropdown
                onChange={(value: any) => {
                  console.log("on change slider ", value);
                  setIsLoading(true);
                  setTimeout(() => {
                    console.log("setting ", value);
                    setSubject(value);
                    setDataList(data[value]);
                    setIsLoading(false);
                  }, 300);
                }}
                value={subject ?? "en"}
              />
            ) : null}
          </IonTitle>
        {/* </IonToolbar> */}
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Inbox</IonTitle>
          </IonToolbar>
        </IonHeader>
        {!isLoading ? <CustomSlider lessonData={dataList} /> : null}
      </IonContent>
    </IonPage>
  );
};
export default Slider;
