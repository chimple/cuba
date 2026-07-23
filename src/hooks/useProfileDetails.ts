import { useEffect, useState, useRef } from 'react';
import { t } from 'i18next';
import InputWithIcons from '../components/common/InputWithIcons';
import SelectWithIcons from '../components/common/SelectWithIcons';
import { Util } from '../utility/util';
import { useFeatureValue } from '@growthbook/growthbook-react';
import { ServiceConfig } from '../services/ServiceConfig';
import {
  ACTION_TYPES,
  AGE_OPTIONS,
  AVATARS,
  CONTINUE,
  DEFAULT_LANGUAGE_ID_EN,
  EDIT_STUDENTS_MAP,
  EVENTS,
  FORM_MODES,
  GENDER,
  LANGUAGE,
  LATEST_TC_VERSION,
  MODES,
  PAGES,
  PROFILE_DETAILS_GROWTHBOOK_VARIATION,
  TableTypes,
} from '../common/constants';
import { useHistory, useLocation } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '../utility/screenOrientation';
import { initializeFireBase } from '../services/Firebase';
import Loading from '../components/Loading';
import { logProfileClick } from '../analytics/profileClickUtil';
import {
  registerBackButtonHandler,
  reinitializeHardwareBackButton,
} from '../common/backButtonRegistry';
import logger from '../utility/logger';
import {
  getAppPathname,
  getAppSearchParams,
} from '../utility/routerLocation';
import { schoolUtil } from '../utility/schoolUtil';
import {
  updateLocalAttributes,
  useGbContext,
} from '../growthbook/Growthbook';

const getModeFromFeature = (variation: string) => {
  switch (variation) {
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_1:
      return FORM_MODES.ALL_REQUIRED;
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2:
      return FORM_MODES.NAME_REQUIRED;
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_3:
      return FORM_MODES.ALL_OPTIONAL;
    default:
      return FORM_MODES.ALL_REQUIRED;
  }
};

export const useProfileDetails = () => {
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);
  const { setGbUpdated } = useGbContext();

  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [parentHasStudent, setParentHasStudent] = useState<boolean>(false);
  const [className, setClassName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');

  const isCreatingProfileRef = useRef(false);
  const parentHasStudentRef = useRef(false);
  const backRegistrationRef = useRef<(() => void) | null>(null);
  const isNavigatingBackRef = useRef(false);

  // Sync State to Refs
  useEffect(() => {
    isCreatingProfileRef.current = isCreatingProfile;
  }, [isCreatingProfile]);
  useEffect(() => {
    parentHasStudentRef.current = parentHasStudent;
  }, [parentHasStudent]);

  const currentStudent = Util.getCurrentStudent();
  const isEdit =
    location.pathname.startsWith(PAGES.EDIT_STUDENT) && !!currentStudent;

  const variation = useFeatureValue<string>(
    PROFILE_DETAILS_GROWTHBOOK_VARIATION.ONBOARDING,
    PROFILE_DETAILS_GROWTHBOOK_VARIATION.CONTROL,
  );
  const latestTcVersion = useFeatureValue<number>(LATEST_TC_VERSION, 0);
  const mode = getModeFromFeature(variation);
  const randomIndex = Math.floor(Math.random() * AVATARS.length);

  const [fullName, setFullName] = useState(isEdit ? currentStudent?.name : '');
  const [avatar, setAvatar] = useState<string | undefined>(
    isEdit
      ? (currentStudent?.avatar ?? AVATARS[randomIndex])
      : AVATARS[randomIndex],
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
  const [gender, setGender] = useState<GENDER | undefined>(
    isEdit && currentStudent?.gender
      ? (currentStudent?.gender as GENDER)
      : undefined,
  );
  const [languageId, setLanguageId] = useState(
    isEdit ? (currentStudent?.language_id ?? '') : '',
  );
  const [languages, setLanguages] = useState<TableTypes<'language'>[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  const initialValues = useRef({
    fullName: isEdit ? (currentStudent?.name ?? '') : '',
    age: isEdit ? (currentStudent?.age ?? undefined) : undefined,
    gender: isEdit ? (currentStudent?.gender as GENDER) : undefined,
    languageId: isEdit ? (currentStudent?.language_id ?? '') : '',
  });

  useEffect(() => {
    if (isEdit && currentStudent) {
      initialValues.current = {
        fullName: currentStudent?.name ?? '',
        age: currentStudent?.age ?? undefined,
        gender: currentStudent?.gender as GENDER,
        languageId: currentStudent?.language_id ?? '',
      };
    }
  }, [isEdit, currentStudent]);

  useEffect(() => {
    if (!isEdit || !currentStudent?.id) return;
    let isMounted = true;

    const syncStudentLanguageForEdit = async () => {
      try {
        const editedStudentsMapStr = sessionStorage.getItem(EDIT_STUDENTS_MAP);
        const editedStudentsMap = editedStudentsMapStr
          ? (JSON.parse(editedStudentsMapStr) as Record<
              string,
              TableTypes<'user'>
            >)
          : {};
        const mappedStudent = editedStudentsMap[currentStudent.id];
        const studentToApply = mappedStudent ?? currentStudent;
        const initialLanguageIdForEdit = studentToApply.language_id ?? '';

        if (!isMounted) return;

        initialValues.current = {
          ...initialValues.current,
          languageId: initialLanguageIdForEdit,
        };
        setLanguageId(initialLanguageIdForEdit);
        await Util.setCurrentStudent(studentToApply, undefined, true, true);

        if (typeof api.getUserByDocId !== 'function') return;
        const latestStudent = await api.getUserByDocId(currentStudent.id);
        if (!isMounted || !latestStudent) return;

        const resolvedLanguageId = latestStudent.language_id ?? '';
        initialValues.current = {
          ...initialValues.current,
          languageId: resolvedLanguageId,
        };
        setLanguageId(resolvedLanguageId);
        await Util.setCurrentStudent(latestStudent, undefined, true, true);
      } catch (error) {
        logger.error('Failed to sync student language on edit page', error);
      }
    };

    void syncStudentLanguageForEdit();
    return () => {
      isMounted = false;
    };
  }, [api, isEdit, currentStudent?.id]);

  useEffect(() => {
    const initial = initialValues.current;
    if (!initial) {
      setHasChanges(false);
      return;
    }
    const changed =
      fullName !== initial.fullName ||
      age !== initial.age ||
      gender !== initial.gender ||
      languageId !== initial.languageId;
    setHasChanges(changed);
  }, [fullName, age, gender, languageId]);
  useEffect(() => {
    initializeFireBase();
    lockOrientation();
    Util.loadBackgroundImage();

    const loadLanguages = async () => {
      const langs = await api.getAllLanguages();
      const sortedLanguages = [...langs].sort(
        (left, right) => (left.sort_index ?? 0) - (right.sort_index ?? 0),
      );
      setLanguages(sortedLanguages);
    };
    loadLanguages();

    const checkParentStudents = async () => {
      const students = await api.getParentStudentProfiles();
      setParentHasStudent(students.length > 0);
    };
    checkParentStudents();

    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfileData = async () => {
    const { className, schoolName } = await Util.fetchCurrentClassAndSchool();
    setClassName(className);
    setSchoolName(schoolName);
  };

  const normalizeModeBeforeHomeNavigation = async () => {
    try {
      const currMode = await schoolUtil.getCurrMode();
      if (currMode === MODES.TEACHER) {
        await schoolUtil.setCurrMode(MODES.PARENT);
      }
    } catch (error) {
      logger.error('Failed to normalize mode before home navigation:', error);
    }
  };

  const lockOrientation = () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: 'landscape' });
    }
  };

  const withContinueIfNeeded = (base: string) => {
    const url = getAppSearchParams();
    if (!url.has(CONTINUE)) return base;
    return base.includes('?')
      ? `${base}&${CONTINUE}=true`
      : `${base}?${CONTINUE}=true`;
  };

  const executeBackLogic = () => {
    // Check Locks (Refs)
    if (isCreatingProfileRef.current || isNavigatingBackRef.current) {
      return;
    }
    isNavigatingBackRef.current = true;

    try {
      // Determine Mode based on Live Pathname (Not State)
      const currentPath = getAppPathname();
      const isEditMode = currentPath.startsWith(PAGES.EDIT_STUDENT);

      // EDIT MODE Logic
      if (isEditMode) {
        const state = history.location.state as any;
        if (state?.from) {
          history.replace(withContinueIfNeeded(state.from));
        } else if (history.length > 1) {
          history.goBack();
        } else {
          history.replace(withContinueIfNeeded(PAGES.DISPLAY_STUDENT));
        }
        return;
      }

      // CREATE MODE Logic
      const state = history.location.state as any;
      const createFallbackPath = parentHasStudentRef.current
        ? PAGES.DISPLAY_STUDENT
        : PAGES.SELECT_MODE;
      const targetPath = withContinueIfNeeded(
        state?.from ?? createFallbackPath,
      );

      if (targetPath.startsWith(PAGES.DISPLAY_STUDENT)) {
        // Reinitialize hardware back handling only for create -> display students path.
        reinitializeHardwareBackButton();
        const separator = targetPath.includes('?') ? '&' : '?';
        history.replace(`${targetPath}${separator}forceReload=1`);
      } else {
        history.replace(targetPath);
      }
      return;
    } catch (e) {
      logger.error('Back Logic Error', e);
      history.replace(PAGES.DISPLAY_STUDENT);
    } finally {
      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 500);
    }
  };

  useEffect(() => {
    if (backRegistrationRef.current) {
      backRegistrationRef.current();
      backRegistrationRef.current = null;
    }

    backRegistrationRef.current = registerBackButtonHandler(
      () => {
        executeBackLogic();
        return true;
      },
      { path: location.pathname },
    );

    return () => {
      if (backRegistrationRef.current) {
        backRegistrationRef.current();
        backRegistrationRef.current = null;
      }
      setIsCreatingProfile(false);
      isNavigatingBackRef.current = false;
    };
  }, [location.pathname]);

  const isFormComplete =
    mode === FORM_MODES.ALL_REQUIRED
      ? fullName && age && languageId && gender
      : mode === FORM_MODES.NAME_REQUIRED
        ? fullName
        : true;

  const shouldShowSkip = mode === FORM_MODES.ALL_OPTIONAL;

  const isSaveEnabled =
    mode === FORM_MODES.ALL_REQUIRED || mode === FORM_MODES.NAME_REQUIRED
      ? isFormComplete && hasChanges
      : hasChanges;

  const resolveLanguageCodeById = async (
    selectedLanguageId: string,
  ): Promise<string | undefined> => {
    const languageCodeFromList = languages.find(
      (lang) => lang.id === selectedLanguageId,
    )?.code;
    if (languageCodeFromList) return languageCodeFromList;
    if (typeof api.getLanguageWithId !== 'function') return undefined;

    const language = await api.getLanguageWithId(selectedLanguageId);
    return language?.code ?? undefined;
  };

  const handleSave = async () => {
    if (isCreatingProfile) return;
    const state = history.location.state as any;
    const tmpPath = state?.from ?? PAGES.HOME;
    const _studentName = fullName?.trim() ?? '';

    if (isEdit && !!currentStudent && !!currentStudent.id) {
      try {
        setIsCreatingProfile(true);
        const selectedLanguageId = languageId || currentStudent.language_id!;
        const selectedLanguageCode =
          await resolveLanguageCodeById(selectedLanguageId);
        const user = await auth.getCurrentUser();
        const student = await api.updateStudent(
          currentStudent,
          _studentName,
          age ?? currentStudent.age!,
          gender ?? currentStudent.gender!,
          currentStudent.avatar!,
          undefined,
          undefined,
          undefined,
          selectedLanguageId,
        );

        const storedMapStr = sessionStorage.getItem(EDIT_STUDENTS_MAP);
        const studentsMap = storedMapStr ? JSON.parse(storedMapStr) : {};
        studentsMap[student.id] = student;
        sessionStorage.setItem(EDIT_STUDENTS_MAP, JSON.stringify(studentsMap));

        Util.logEvent(EVENTS.PROFILE_UPDATED, {
          user_id: user?.id,
          name: fullName,
          student_id: student.id,
          age,
          gender,
          language_id: languageId,
          variation,
          page_path: getAppPathname(),
          action_type: ACTION_TYPES.PROFILE_UPDATED,
        });

        await Util.setCurrentStudent(student, selectedLanguageCode, true, true);

        history.replace(tmpPath);
        void Util.ensureLidoCommonAudioForStudent(student).catch((error) => {
          logger.error('Error preloading student audio in background:', error);
        });
      } catch (err) {
        logger.error('Error saving profile:', err);
        setIsCreatingProfile(false);
      }
      return;
    }

    try {
      setIsCreatingProfile(true);
      const user = await auth.getCurrentUser();

      const student = await api.createProfile(
        _studentName,
        age,
        gender,
        avatar,
        undefined,
        undefined,
        undefined,
        languageId || DEFAULT_LANGUAGE_ID_EN,
        latestTcVersion,
      );

      Util.logEvent(EVENTS.PROFILE_CREATED, {
        user_id: user?.id,
        name: fullName,
        student_id: student.id,
        age,
        gender,
        language_id: languageId,
        variation,
        page_path: getAppPathname(),
        action_type: ACTION_TYPES.PROFILE_CREATED,
      });

      const resolvedLanguageId = languageId || DEFAULT_LANGUAGE_ID_EN;
      const resolvedLanguageCode =
        await resolveLanguageCodeById(resolvedLanguageId);

      await Util.setCurrentStudent(student, resolvedLanguageCode, true);
      await schoolUtil.setCurrentClass(undefined);
      // A newly created child starts without class linkage, so clear school targeting.
      updateLocalAttributes({
        student_id: student.id,
        age: student.age ?? null,
        grade_id: student.grade_id ?? null,
        school_ids: [],
      });
      setGbUpdated(true);

      await Util.ensureLidoCommonAudioForStudent(student);
      await normalizeModeBeforeHomeNavigation();
      history.replace(PAGES.HOME);
    } catch (err) {
      logger.error('Error saving profile:', err);
      setIsCreatingProfile(false);
    }
  };

  const handleSkip = async () => {
    if (isCreatingProfile) return;

    try {
      setIsCreatingProfile(true);

      if (parentHasStudent) {
        history.replace(PAGES.HOME);
        return;
      }

      const languageCode = localStorage.getItem(LANGUAGE);
      const allLanguages = await api.getAllLanguages();
      const selectedLanguage = allLanguages.find(
        (lang) => lang.code === languageCode,
      );

      const student = await api.createAutoProfile(
        selectedLanguage?.id,
        latestTcVersion,
      );

      await Util.setCurrentStudent(
        student,
        selectedLanguage?.code ?? undefined,
        true,
      );
      await schoolUtil.setCurrentClass(undefined);
      // Auto-created child profiles also start with no school/class association.
      updateLocalAttributes({
        student_id: student.id,
        age: student.age ?? null,
        grade_id: student.grade_id ?? null,
        school_ids: [],
      });
      setGbUpdated(true);

      const user = await auth.getCurrentUser();

      Util.logEvent(EVENTS.PROFILE_CREATED, {
        user_id: user?.id,
        name: fullName,
        variation,
        page_path: getAppPathname(),
        action_type: ACTION_TYPES.PROFILE_CREATED,
      });

      await normalizeModeBeforeHomeNavigation();
      history.replace(PAGES.HOME);
    } catch (err) {
      logger.error('Error skipping profile:', err);
      setIsCreatingProfile(false);
    }
  };

  return {
    AGE_OPTIONS,
    AVATARS,
    GENDER,
    InputWithIcons,
    Loading,
    PAGES,
    SelectWithIcons,
    Util,
    age,
    avatar,
    className,
    currentStudent,
    fullName,
    gender,
    handleSave,
    handleSkip,
    history,
    isCreatingProfile,
    isEdit,
    isSaveEnabled,
    labelRef,
    languageId,
    languages,
    logProfileClick,
    logger,
    parentHasStudent,
    profileRef,
    schoolName,
    setAge,
    setFullName,
    setGender,
    setLanguageId,
    shouldShowSkip,
    t,
  };
};