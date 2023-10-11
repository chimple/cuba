import { IonButton, IonContent, IonIcon, IonPage } from "@ionic/react";
import ChimpleLogo from "../components/ChimpleLogo";
import "./EditStudent.css";
import StudentNameBox from "../components/editStudent/StudentNameBox";
import { useEffect, useState } from "react";
import GenderAndAge from "../components/editStudent/GenderAndAge";
import SelectAvatar from "../components/editStudent/SelectAvatar";
import GradeBoardAndLangDropdown from "../components/editStudent/GradeBoardAndLangDropdown";
import {
  ACTION,
  LANGUAGE,
  CURRENT_STUDENT,
  EVENTS,
  GENDER,
  PAGES,
} from "../common/constants";
import { chevronForward } from "ionicons/icons";
import Curriculum from "../models/curriculum";
import Grade from "../models/grade";
import Language from "../models/language";
import Loading from "../components/Loading";
import { useHistory, useLocation } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import { t } from "i18next";
import { Util } from "../utility/util";
import NextButton from "../components/common/NextButton";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import BackButton from "../components/common/BackButton";
import i18n from "../i18n";

const EditStudent = () => {
  const history = useHistory();
  const location = useLocation();
  const state = history.location.state as any;
  const api = ServiceConfig.getI().apiHandler;
  const currentStudent = Util.getCurrentStudent();
  const isEdit = location.pathname === PAGES.EDIT_STUDENT && !!currentStudent;

  enum STAGES {
    NAME,
    GENDER_AND_AGE,
    AVATAR,
    GRADE,
  }
  const [stage, setStage] = useState(STAGES.NAME);
  const [studentName, setStudentName] = useState(
    isEdit ? currentStudent?.name : ""
  );
  const [gender, setGender] = useState<GENDER | undefined>(
    isEdit && currentStudent?.gender
      ? (currentStudent?.gender as GENDER)
      : undefined
  );
  const [age, setAge] = useState<number | undefined>(
    isEdit
      ? !!currentStudent?.age
        ? currentStudent.age < 4
          ? 4
          : currentStudent.age
        : undefined
      : undefined
  );
  const [avatar, setAvatar] = useState<string | undefined>(
    isEdit ? currentStudent?.avatar : undefined
  );
  const [board, setBoard] = useState<string | undefined>(
    isEdit ? currentStudent?.board?.id : undefined
  );
  const [grade, setGrade] = useState<string | undefined>(
    isEdit ? currentStudent?.grade?.id : undefined
  );
  const [language, setLanguage] = useState<string | undefined>(
    isEdit ? currentStudent?.language?.id : undefined
  );
  const [boards, setBoards] = useState<Curriculum[]>();
  const [grades, setGrades] = useState<Grade[]>();
  const [languages, setLanguages] = useState<Language[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onNextButton = async () => {
    setIsLoading(true);
    const stagesLength = Object.keys(STAGES).length / 2;
    const newStage = stage + 1;
    let _studentName = studentName?.trim();
    //Completed all stages
    if (stagesLength === newStage) {
      //Creating Profile for the Student
      let student;
      const currentStudent = await Util.getCurrentStudent();
      if (isEdit && !!currentStudent && !!currentStudent.docId) {
        student = await api.updateStudent(
          currentStudent,
          _studentName!,
          age ?? currentStudent.age!,
          gender ?? currentStudent.gender!,
          avatar ?? currentStudent.avatar!,
          undefined,
          board ?? currentStudent.board?.id!,
          grade ?? currentStudent.grade?.id!,
          language ?? currentStudent.language?.id!
        );
        Util.logEvent(EVENTS.USER_PROFILE, {
          user_id: currentStudent.docId,
          user_type: currentStudent.role,
          user_name: studentName!,
          user_gender: currentStudent.gender!,
          user_age: currentStudent.age!,
          phone_number: currentStudent.username,
          parent_username: currentStudent.username,
          parent_id: currentStudent.uid,
          action_type: ACTION.UPDATE,
        });
      } else {
        student = await api.createProfile(
          _studentName!,
          age,
          gender,
          avatar,
          undefined,
          board,
          grade,
          language
        );
        const eventParams = {
          user_id: student.docId,
          user_type: student.role,
          user_name: student.name!,
          user_gender: student.gender,
          user_age: student.age,
          phone_number: student.username,
          parent_username: student.username,
          parent_id: student.uid,
          action_type: ACTION.CREATE,
        };
        console.log(
          "Util.logEvent(EVENTS.USER_PROFILE, eventParams);",
          EVENTS.USER_PROFILE,
          eventParams
        );

        Util.logEvent(EVENTS.USER_PROFILE, eventParams);
        //Setting the Current Student
        const langIndex = languages?.findIndex(
          (lang) => lang.docId === language
        );
        await Util.setCurrentStudent(
          student,
          langIndex && languages ? languages[langIndex]?.code : undefined,
          false
        );
      }
      console.log(
        "🚀 ~ file: EditStudent.tsx:56 ~ onNextButton ~ student:",
        student
      );

      const state = history.location.state as any;
      history.replace(state?.from ?? PAGES.HOME);
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
        return !!studentName.trim();
      case STAGES.GENDER_AND_AGE:
        if(gender===GENDER.BOY || gender===GENDER.GIRL){
          return !!gender && !!age;
        }
        return false;
      case STAGES.AVATAR:
        return !!avatar;
      case STAGES.GRADE:
        return !!grade && !!board && !!language;
      default:
        return false;
    }
  };
  const [isInputFocus, setIsInputFocus] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", (info) => {
        setIsInputFocus(true);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setIsInputFocus(false);
      });
    }
    changeLanguage();
  }, []);
  async function changeLanguage() {
    const languageDocId = localStorage.getItem(LANGUAGE);
    console.log("This is the lang " + languageDocId);
    if (!!languageDocId) await i18n.changeLanguage(languageDocId);
  }
  return (
    <IonPage id="Edit-student-page">
      <div id="Edit-student-back-button">
        {!isEdit && !state?.showBackButton ? null : (
          <BackButton
            onClicked={() => {
              history.replace(PAGES.DISPLAY_STUDENT);
            }}
          />
        )}
      </div>

      <div id="next-button">
        <NextButton
          disabled={!isNextButtonEnabled()}
          onClicked={onNextButton}
        />
      </div>
      <div
        className={
          "header " + isInputFocus && stage === STAGES.NAME
            ? "scroll-header"
            : ""
        }
      >
        {stage == STAGES.NAME && (
          <ChimpleLogo
            header={t("Welcome to Chimple!")}
            msg={t("").toString()}
          />
        )}

        {stage === STAGES.NAME && (
          <StudentNameBox
            studentName={studentName!}
            onValueChange={setStudentName}
            onEnterDown={isNextButtonEnabled() ? onNextButton : () => {}}
          />
        )}
      </div>
      {stage === STAGES.AVATAR && (
        <>
          <>
            <div id="Edit-student-back-button">
              <BackButton
                onClicked={() => {
                  setStage(STAGES.GENDER_AND_AGE);
                }}
              />
            </div>

            <div id="common-div">
              <ChimpleLogo header={t("")} msg={t("").toString()} />
            </div>
            <div className="avatar-title">
              {t("Choose an avatar for your child")}
            </div>
          </>
        </>
      )}
      <div className="content">
        {stage === STAGES.GENDER_AND_AGE && (
          <>
            <div id="Edit-student-back-button">
              <BackButton
                onClicked={() => {
                  setStage(STAGES.NAME);
                }}
              />
            </div>
            <>
              <>
                <div id="common-div">
                  <ChimpleLogo header={t("")} msg={t("").toString()} />
                </div>
              </>
              <GenderAndAge
                age={age}
                gender={gender}
                onAgeChange={setAge}
                onGenderChange={setGender}
              />
            </>
          </>
        )}
        {stage === STAGES.AVATAR && (
          <SelectAvatar avatar={avatar} onAvatarChange={setAvatar} />
        )}
        {stage === STAGES.GRADE && (
          <>
            <>
              <div id="Edit-student-back-button">
                <BackButton
                  onClicked={() => {
                    setStage(STAGES.AVATAR);
                  }}
                />
              </div>
            </>
            <>
              <>
                <>
                  <div id="common-div">
                    <ChimpleLogo
                      header={t("")}
                      msg={t("Choose your child’s class details").toString()}
                    />
                  </div>
                </>
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
              </>
            </>
          </>
        )}
      </div>
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};
export default EditStudent;
