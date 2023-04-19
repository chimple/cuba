import { IonButton, IonContent, IonIcon, IonPage } from "@ionic/react";
import ChimpleLogo from "../components/ChimpleLogo";
import "./EditStudent.css";
import StudentNameBox from "../components/editStudent/StudentNameBox";
import { useState } from "react";
import GenderAndAge from "../components/editStudent/GenderAndAge";
import SelectAvatar from "../components/editStudent/SelectAvatar";
import GradeBoardAndLangDropdown from "../components/editStudent/GradeBoardAndLangDropdown";
import { AVATARS, GENDER, PAGES } from "../common/constants";
import { chevronForward } from "ionicons/icons";
import Curriculum from "../models/curriculum";
import Grade from "../models/grade";
import Language from "../models/language";
import Loading from "../components/Loading";
import { useHistory } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import { t } from "i18next";

const EditStudent = () => {
  enum STAGES {
    NAME,
    GENDER_AND_AGE,
    AVATAR,
    GRADE,
  }
  const [stage, setStage] = useState(STAGES.NAME);
  const [studentName, setStudentName] = useState("");
  const [gender, setGender] = useState(GENDER.BOY);
  const [age, setAge] = useState(5);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [board, setBoard] = useState<string>();
  const [grade, setGrade] = useState<string>();
  const [language, setLanguage] = useState<string>();
  const [boards, setBoards] = useState<Curriculum[]>();
  const [grades, setGrades] = useState<Grade[]>();
  const [languages, setLanguages] = useState<Language[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const history = useHistory();

  const onNextButton = async () => {
    const api = ServiceConfig.getI().apiHandler;
    setIsLoading(true);
    const stagesLength = Object.keys(STAGES).length / 2;
    const newStage = stage + 1;
    //Completed all stages
    if (stagesLength === newStage) {
      //Creating Profile for the Student
      const student = await api.createProfile(
        studentName,
        age,
        gender,
        avatar,
        undefined,
        board,
        grade,
        language
      );
      console.log(
        "🚀 ~ file: EditStudent.tsx:56 ~ onNextButton ~ student:",
        student
      );
      //Setting the Current Student
      api.currentStudent = student;
      history.replace(PAGES.HOME);
    } else {
      if (newStage === STAGES.GRADE) {
        const results = await Promise.all([
          api.getAllCurriculums(),
          api.getAllGrades(),
          api.getAllLanguages(),
        ]);
        setBoards(results[0]);
        setGrades(results[1]);
        setLanguages(results[2]);
        console.log(
          "🚀 ~ file: EditStudent.tsx:51 ~ isNextButtonEnabled ~ docs:",
          results
        );
      }
      setStage(newStage);
    }
    setIsLoading(false);
  };
  const isNextButtonEnabled = () => {
    switch (stage) {
      case STAGES.NAME:
        return !!studentName;
      case STAGES.GRADE:
        return !!grade && !!board && !!language;
      default:
        return true;
    }
  };

  return (
    <IonPage id="Edit-student-page">
      <IonContent>
        <IonButton
          className="next-button"
          disabled={!isNextButtonEnabled()}
          color="light"
          shape="round"
          onClick={onNextButton}
        >
          {t("Next")}
          <IonIcon slot="end" icon={chevronForward}></IonIcon>
        </IonButton>
        <ChimpleLogo
          header={t("Welcome to Chimple!")}
          msg={t(
            "Please create your child profile"
          )}
        />
        <div className="content">
          {stage === STAGES.NAME && (
            <StudentNameBox
              studentName={studentName}
              onValueChange={setStudentName}
            />
          )}
          {stage === STAGES.GENDER_AND_AGE && (
            <GenderAndAge
              age={age}
              gender={gender}
              onAgeChange={setAge}
              onGenderChange={setGender}
            />
          )}
          {stage === STAGES.AVATAR && (
            <SelectAvatar avatar={avatar} onAvatarChange={setAvatar} />
          )}
          {stage === STAGES.GRADE && (
            <GradeBoardAndLangDropdown
              boards={boards}
              grades={grades}
              languages={languages}
              onBoardChange={setBoard}
              onGradeChange={setGrade}
              onLangChange={setLanguage}
              currentlySelectedBoard={board}
              currentlySelectedGrade={grade}
              currentlySelectedLang={language}
            />
          )}
        </div>
        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};
export default EditStudent;
