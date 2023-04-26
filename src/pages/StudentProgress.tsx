import { IonCol, IonGrid, IonList, IonPage, IonRow } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import Loading from "../components/Loading";
import "./StudentProgress.css";
import {
  APP_LANG,
  HeaderIconConfig,
  PARENTHEADERLIST,
} from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import StudentProgressHeader from "../components/studentProgress/StudentProgressHeader";

const StudentProgress: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [studentProgressHeaderIconList, setStudentProgressHeaderIconList] =
    useState<HeaderIconConfig[]>([]);
  const [musicFlag, setMusicFlag] = useState<boolean>();
  const [userProfile, setUserProfile] = useState<any[]>([]);
  const [langList, setLangList] = useState<string[]>([]);
  const [langDocIds, setLangDocIds] = useState<Map<string, string>>(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();
  const messageRef = useRef();

  // enum STUDENTPROGRESSHEADERLIST {
  //   ENGLISH = "ENGLISH",
  //   // MATHS = "MATHS",
  //   DIGITAL_SKILLS = "DIGITAL_SKILLS",
  // }

  // var x = "MATHS";
  // STUDENTPROGRESSHEADERLIST[x];

  // [
  //   {
  //     displayName: "English",
  //     iconSrc: "assets/icons/favicon.png",
  //     headerList: STUDENTPROGRESSHEADERLIST.ENGLISH,
  //   },
  //   {
  //     displayName: "Maths",
  //     iconSrc: "/assets/icons/favicon.png",
  //     headerList: STUDENTPROGRESSHEADERLIST.MATHS,
  //   },
  //   {
  //     displayName: "Digital Skills",
  //     iconSrc: "/assets/icons/favicon.png",
  //     headerList: STUDENTPROGRESSHEADERLIST.DIGITAL_SKILLS,
  //   },
  // ];

  useEffect(() => {
    inti();
  }, []);

  async function inti() {
    // const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    // if (currentUser != undefined) {
    //   console.log("User ", currentUser);
    // }

    const STUDENTPROGRESSHEADERLIST: string[] = [
      "English",
      "Maths",
      "Digital_skills",
    ];

    setCurrentHeader(STUDENTPROGRESSHEADERLIST[0]);

    let tempStudentProgressHeaderIconList: HeaderIconConfig[] = [];

    for (let i = 0; i < STUDENTPROGRESSHEADERLIST.length; i++) {
      tempStudentProgressHeaderIconList.push({
        displayName: STUDENTPROGRESSHEADERLIST[i],
        iconSrc: "/assets/icons/favicon.png",
        headerList: STUDENTPROGRESSHEADERLIST[i],
      });
    }
    setStudentProgressHeaderIconList(tempStudentProgressHeaderIconList);
  }

  function onHeaderIconClick(selectedHeader: any) {
    setCurrentHeader(selectedHeader);
  }

  function displayProgressUI(selectedHeader: any) {
    const header = ["Lesson Name", "Chapter Name", "Score", "Time Spent"];
    const data = ["data1", "data2", "data3", "data4"];
    return (
      <div id="student-progress-display-progress">
        <div id="student-progress-display-progress-header">
          <IonRow>
            {header.map((h) => {
              console.log("Dyanamic Parent Header List ", h);
              return (
                <IonCol size="12" size-sm="3">
                  {h}
                </IonCol>
              );
            })}
          </IonRow>
          {header.map((h) => {
            console.log("Dyanamic Parent Header List ", h);
            return (
              <IonRow>
                {/* {d} */}
                {data.map((d) => {
                  console.log(d);
                  return (
                    <IonCol size="12" size-sm="3">
                      {d}
                    </IonCol>
                  );
                })}
              </IonRow>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <IonPage>
      {!isLoading ? (
        <div id="parent-page">
          <StudentProgressHeader
            currentHeader={currentHeader}
            headerIconList={studentProgressHeaderIconList}
            onHeaderIconClick={onHeaderIconClick}
          ></StudentProgressHeader>

          <div>{displayProgressUI(currentHeader)}</div>

          {/* {currentHeader === PARENTHEADERLIST.PROFILE ? (
            <div>{disPlayProgressUI(currentHeader)}</div>
          ) : null} */}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default StudentProgress;
