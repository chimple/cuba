import { IonContent, IonPage } from '@ionic/react';
import ChimpleLogo from '../components/ChimpleLogo';
import StudentNameBox from '../components/editStudent/StudentNameBox';
import { useEffect, useState } from 'react';
import GenderAndAge from '../components/editStudent/GenderAndAge';
import SelectAvatar from '../components/editStudent/SelectAvatar';
import GradeBoardAndLangDropdown from '../components/editStudent/GradeBoardAndLangDropdown';
import {
  ACTION,
  LANGUAGE,
  EVENTS,
  GENDER,
  PAGES,
  EDIT_STUDENT_STORE,
  TableTypes,
  EDIT_STUDENTS_MAP,
  LATEST_TC_VERSION,
} from '../common/constants';
import Loading from '../components/Loading';
import { useHistory, useLocation } from 'react-router';
import { ServiceConfig } from '../services/ServiceConfig';
import { t } from 'i18next';
import { Util } from '../utility/util';
import NextButton from '../components/common/NextButton';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import BackButton from '../components/common/BackButton';
import i18n from '../i18n';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';
import logger from '../utility/logger';
import { useFeatureValue } from '@growthbook/growthbook-react';

let localStoreData: any = {};

export const useEditStudent = () => {
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
    isEdit ? currentStudent?.name : '',
  );
  const [gender, setGender] = useState<GENDER | undefined>(
    isEdit && currentStudent?.gender
      ? (currentStudent?.gender as GENDER)
      : undefined,
  );
  const [age, setAge] = useState<number | undefined>(
    isEdit
      ? !!currentStudent?.age
        ? currentStudent.age < 4
          ? 4
          : currentStudent.age
        : undefined
      : undefined,
  );
  const [avatar, setAvatar] = useState<string | undefined>(
    isEdit ? (currentStudent?.avatar ?? undefined) : undefined,
  );
  const [board, setBoard] = useState<string | undefined>(
    isEdit ? (currentStudent?.curriculum_id ?? undefined) : undefined,
  );
  const [grade, setGrade] = useState<string | undefined>(
    isEdit ? (currentStudent?.grade_id ?? undefined) : undefined,
  );
  const [language, setLanguage] = useState<string | undefined>(
    isEdit ? (currentStudent?.language_id ?? undefined) : undefined,
  );
  const [boards, setBoards] = useState<TableTypes<'curriculum'>[]>();
  const [grades, setGrades] = useState<TableTypes<'grade'>[]>();
  const [languages, setLanguages] = useState<TableTypes<'language'>[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [checkResults, setCheckResults] = useState<boolean>(false);
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const latestTcVersion = useFeatureValue<number>(LATEST_TC_VERSION, 0);
  const onNextButton = async () => {
    setIsLoading(true);
    const stagesLength = Object.keys(STAGES).length / 2;
    const newStage = stage + 1;
    let _studentName = studentName?.trim();

    const state = history.location.state as any;
    const tmpPath = state?.from ?? PAGES.HOME;

    //Completed all stages
    if (stagesLength === newStage) {
      //Creating Profile for the Student
      localStorage.removeItem(EDIT_STUDENT_STORE);
      let student;
      const currentStudent = Util.getCurrentStudent();
      if (isEdit && !!currentStudent && !!currentStudent.id) {
        student = await api.updateStudent(
          currentStudent,
          _studentName!,
          age ?? currentStudent.age!,
          gender ?? currentStudent.gender!,
          avatar ?? currentStudent.avatar!,
          undefined,
          board ?? currentStudent.curriculum_id!,
          grade ?? currentStudent.grade_id!,
          language ?? currentStudent.language_id!,
        );
        const storedMapStr = sessionStorage.getItem(EDIT_STUDENTS_MAP);
        const studentsMap = storedMapStr ? JSON.parse(storedMapStr) : {};
        studentsMap[student.id] = student;
        sessionStorage.setItem(EDIT_STUDENTS_MAP, JSON.stringify(studentsMap));
        Util.logEvent(EVENTS.USER_PROFILE, {
          user_id: currentStudent.id,
          // user_type: currentStudent.role,
          user_name: studentName!,
          user_gender: currentStudent.gender!,
          user_age: currentStudent.age!,
          phone_number: currentStudent.phone,
          // parent_username: currentStudent.username,
          parent_id: currentStudent.id,
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
          language,
          latestTcVersion,
        );
        const eventParams = {
          user_id: student.id,
          user_type: undefined,
          user_name: student.name!,
          user_gender: student.gender,
          user_age: student.age,
          phone_number: undefined,
          parent_username: undefined,
          parent_id: undefined,
          action_type: ACTION.CREATE,
        };

        Util.logEvent(EVENTS.USER_PROFILE, eventParams);
        //Setting the Current Student
        const langIndex = languages?.findIndex((lang) => lang.id === language);
        await Util.setCurrentStudent(
          student,
          langIndex && languages && languages[langIndex]?.code
            ? (languages[langIndex]?.code ?? undefined)
            : undefined,
          tmpPath === PAGES.HOME ? true : false,
        );
      }

      history.replace(tmpPath);
    } else {
      if (newStage === STAGES.GRADE) {
        const results = await Promise.all([
          api.getAllCurriculums(),
          api.getAllGrades(),
          api.getAllLanguages(),
        ]);
        if (
          results &&
          results[0].length > 0 &&
          results[1].length > 0 &&
          results[2].length > 0
        ) {
          setCheckResults(true);
        }
        setBoards(results[0]);
        localStoreData.boards = results[0];
        setGrades(results[1]);
        localStoreData.grades = results[1];
        setLanguages(results[2]);
        localStoreData.languages = results[2];
      }

      localStoreData.stage = newStage;

      setStage(newStage);
      addDataToLocalStorage();
    }
    setIsLoading(false);
  };
  const isNextButtonEnabled = () => {
    switch (stage) {
      case STAGES.NAME:
        return !!studentName?.trim();
      case STAGES.GENDER_AND_AGE:
        if (
          gender === GENDER.BOY ||
          gender === GENDER.GIRL ||
          gender === GENDER.OTHER
        ) {
          return !!gender && !!age;
        }
        return false;
      case STAGES.AVATAR:
        return !!avatar;
      case STAGES.GRADE:
        if (!!checkResults) {
          return !!grade && !!board && !!language;
        }
        return false;
      default:
        return false;
    }
  };
  const [isInputFocus, setIsInputFocus] = useState(false);

  useEffect(() => {
    (async () => {
      // Check if parent has any student profiles
      const students = await api.getParentStudentProfiles();
      if (!students || students.length === 0) {
        setIsCreatingProfile(true);
        try {
          // Get language id for app language
          const languageCode = localStorage.getItem(LANGUAGE);
          const allLanguages = await api.getAllLanguages();
          const selectedLanguage = allLanguages.find(
            (lang) => lang.code === languageCode,
          );
          // Create auto profile with default/null values
          const student = await api.createAutoProfile(
            selectedLanguage?.id,
            latestTcVersion,
          );
          // Set as current student
          await Util.setCurrentStudent(
            student,
            selectedLanguage?.code ?? undefined,
            true,
          );
          history.replace(PAGES.HOME);
        } catch (err) {
          logger.error('Auto profile creation failed', err);
        } finally {
          setIsCreatingProfile(false);
        }
      }
    })();
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        setIsInputFocus(true);
      });
      Keyboard.addListener('keyboardWillHide', () => {
        setIsInputFocus(false);
      });
    }
    changeLanguage();
    init();
  }, []);

  async function init() {
    const urlParams = new URLSearchParams(location.search);
    if (!!urlParams.get('isReload')) {
      let locData: any = localStorage.getItem(EDIT_STUDENT_STORE);
      if (!!locData) {
        localStoreData = JSON.parse(locData);

        if (!!localStoreData.stage) {
          setStage(localStoreData.stage);
          setStudentName(localStoreData.studentName);

          !!localStoreData.age && setAge(localStoreData.age);
          !!localStoreData.gender && setGender(localStoreData.gender);
          !!localStoreData.avatar && setAvatar(localStoreData.avatar);
          !!localStoreData.boards && setBoards(localStoreData.boards);
          !!localStoreData.grades && setGrades(localStoreData.grades);
          !!localStoreData.languages && setLanguages(localStoreData.languages);
          !!localStoreData.board && setBoard(localStoreData.board);
          !!localStoreData.grade && setGrade(localStoreData.grade);
          !!localStoreData.language && setLanguage(localStoreData.language);
        }
      }
    }
  }

  function addDataToLocalStorage() {
    localStorage.setItem(EDIT_STUDENT_STORE, JSON.stringify(localStoreData));
  }

  async function changeLanguage() {
    const languageDocId = localStorage.getItem(LANGUAGE);
    if (!!languageDocId) await i18n.changeLanguage(languageDocId);
  }

  function handleValueChange(name: string, val: any, stateFunc: Function) {
    stateFunc(val);
    localStoreData[name] = val;
    addDataToLocalStorage();
  }
  return {
    BackButton,
    ChimpleLogo,
    EDIT_STUDENT_STORE,
    GenderAndAge,
    GradeBoardAndLangDropdown,
    IonContent,
    IonPage,
    Loading,
    NextButton,
    PAGES,
    STAGES,
    SelectAvatar,
    StudentNameBox,
    addDataToLocalStorage,
    age,
    avatar,
    board,
    boards,
    gender,
    grade,
    grades,
    handleValueChange,
    history,
    isCreatingProfile,
    isEdit,
    isInputFocus,
    isLoading,
    isNextButtonEnabled,
    language,
    languages,
    localStorage,
    localStoreData,
    onNextButton,
    online,
    presentToast,
    setAge,
    setAvatar,
    setBoard,
    setGender,
    setGrade,
    setLanguage,
    setStage,
    setStudentName,
    stage,
    state,
    studentName,
    t,
  };
};
