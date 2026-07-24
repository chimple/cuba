import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import {
  AVATARS,
  CURRENT_CLASS_NAME,
  CURRENT_SCHOOL_NAME,
  EVENTS,
  LANGUAGE,
  MODES,
  PAGES,
  SELECTED_CLASSES,
  STAGES,
  TableTypes,
  TEACHER_APP_AUTH_METHODS,
  TEACHER_APP_USER_ROLES,
  USER_SELECTION_STAGE,
} from '../common/constants';
import i18n from '../i18n';
import { RoleType } from '../interface/modelInterfaces';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  AuthState,
  setAuthUser,
  setIsOpsUser,
  setRoles,
  setUser,
} from '../redux/slices/auth/authSlice';
import { RootState } from '../redux/store';
import { ServiceConfig } from '../services/ServiceConfig';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import {
  requireTeacherModeAuth,
  TeacherModeAuthResult,
} from '../services/TeacherModeAuth';
import logger from '../utility/logger';
import {
  isAutoUserRole,
  resolveTeacherAppModeForRole,
} from '../utility/roleUtil';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import { logClassTabClassChanged } from './selectModeAnalytics';
import { getInitialSelectedClass } from './SelectMode.helpers';
import { initializeSelectMode } from './SelectMode.init';
import { applyAutoUserModeLanguage } from './SelectMode.language';

const VISIBLE_CLASS_COUNT = 3;
const CLASS_NAME_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

const sortClassesByName = (
  classes: TableTypes<'class'>[],
): TableTypes<'class'>[] =>
  [...classes].sort((firstClass, secondClass) =>
    CLASS_NAME_COLLATOR.compare(firstClass.name, secondClass.name),
  );

interface SchoolModeOption {
  id: string;
  displayName: string;
  school: TableTypes<'school'>;
  role: RoleType;
}

interface SelectModeLocationState {
  fromKidsAppLocationSchool?: boolean;
  fromSchoolModeSwitchProfile?: boolean;
}

export const useSelectModeController = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [schoolList, setSchoolList] = useState<SchoolModeOption[]>([]);
  const [teacherAppSchoolList, setTeacherAppSchoolList] = useState<
    SchoolModeOption[]
  >([]);
  const [currentSchoolName, setCurrentSchoolName] = useState<string>();
  const [currentSchool, setCurrentSchool] = useState<TableTypes<'school'>>();
  const [currentSchoolId, setCurrentSchoolId] = useState<string>();
  const [currentSchoolRole, setCurrentSchoolRole] = useState<RoleType>();
  const [currentUser, setCurrentUser] = useState<TableTypes<'user'>>();
  const [currentClasses, setCurrentClasses] = useState<TableTypes<'class'>[]>();
  const [currentStudents, setCurrentStudents] =
    useState<TableTypes<'user'>[]>();
  const [currClass, setCurrClass] = useState<TableTypes<'class'>>();
  const [classWindowStartIndex, setClassWindowStartIndex] = useState(0);
  const [isTeacherAuthPopupOpen, setIsTeacherAuthPopupOpen] = useState(false);
  const [isAutoUser, setIsAutoUser] = useState<boolean>(false);
  const tempSchoolList: SchoolModeOption[] = [];
  useEffect(() => {
    Util.loadBackgroundImage();
    restoreAuth();
    init();
    return () => {
      setIsLoading(false);
    };
  }, []);
  // const api = FirebaseApi.getInstance();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();
  const location = useLocation<SelectModeLocationState | undefined>();
  const { setGbUpdated } = useGbContext();
  const [stage, setStage] = useState(STAGES.MODE);
  const [isOkayButtonDisabled, setIsOkayButtonDisabled] = useState(true);
  const dispatch = useAppDispatch();
  const {
    authUser,
    user: reduxUser,
    isOpsUser,
    roles,
  } = useAppSelector((state: RootState) => state.auth as AuthState);
  const sortedCurrentClasses = useMemo<TableTypes<'class'>[]>(
    () => sortClassesByName(currentClasses ?? []),
    [currentClasses],
  );
  useEffect(() => {
    if (currClass && stage === STAGES.STUDENT) {
      displayStudents(currClass);
    }
  }, [currClass, stage]);
  useEffect(() => {
    if (!currClass?.id) {
      return;
    }
    const classIndex = sortedCurrentClasses.findIndex(
      (classItem) => classItem.id === currClass.id,
    );
    if (classIndex >= 0) {
      const maxStartIndex = Math.max(
        0,
        sortedCurrentClasses.length - VISIBLE_CLASS_COUNT,
      );
      setClassWindowStartIndex((currentStartIndex) => {
        const visibleEndIndex = currentStartIndex + VISIBLE_CLASS_COUNT - 1;

        if (classIndex < currentStartIndex) {
          return classIndex;
        }

        if (classIndex > visibleEndIndex) {
          return Math.min(classIndex - VISIBLE_CLASS_COUNT + 1, maxStartIndex);
        }

        return currentStartIndex;
      });
    }
    window.requestAnimationFrame(() => {
      document
        .getElementById(`school-mode-class-tab-${currClass.id}`)
        ?.scrollIntoView?.({
          block: 'nearest',
          inline: 'nearest',
          behavior: 'smooth',
        });
    });
  }, [currClass?.id, sortedCurrentClasses, stage]);
  const applyOrientationForMode = async (mode?: string) => {
    if (!mode || !Capacitor.isNativePlatform()) return;

    if (
      mode === MODES.PARENT ||
      mode === MODES.SCHOOL ||
      mode === MODES.TEACHER_HOME ||
      mode === MODES.TEACHER_SCHOOL
    ) {
      await ScreenOrientation.lock({ orientation: 'landscape' });
      return;
    }

    if (mode === MODES.TEACHER) {
      await ScreenOrientation.lock({ orientation: 'portrait' });
      return;
    }

    if (mode === MODES.OPS_CONSOLE) {
      await ScreenOrientation.unlock();
    }
  };
  const init = () =>
    initializeSelectMode({
      api,
      applyAutoUserModeLanguage,
      applyOrientationForMode,
      auth,
      changeLanguage,
      currentUser,
      displayClasses,
      displayStudents,
      history,
      isOpsUser,
      location,
      onParentSelect,
      setCurrentClasses,
      setCurrentSchool,
      setCurrentSchoolName,
      setCurrentSchoolRole,
      setCurrentStudents,
      setCurrentUser,
      setCurrClass,
      setIsAutoUser,
      setIsLoading,
      setSchoolList,
      setStage,
      setTeacherAppSchoolList,
      tempSchoolList,
    });
  const setUserRoles = async (userId: string) => {
    try {
      if (roles.length > 0) return; // If roles are already set in Redux, skip fetching again
      const userRoles = await api.getUserSpecialRoles(userId);

      if (userRoles.length > 0) {
        dispatch(setRoles(userRoles));
      }
    } catch (e) {
      logger.error('Error fetching user roles:', e);
    }
  };
  const restoreAuth = async () => {
    if (!reduxUser?.id) {
      const user = await auth.getCurrentUser();
      if (!user) return;
      dispatch(setUser(user));

      if (!authUser || !authUser.id) {
        const { data } = await ServiceConfig.getI().authHandler.getUser();
        dispatch(setAuthUser(data.user));
      }
      const isOps = await api.isSplUser();
      dispatch(setIsOpsUser(isOps));
      await setUserRoles(user.id); // Fetch and set user roles in Redux
    }
  };
  async function changeLanguage() {
    const languageDocId = localStorage.getItem(LANGUAGE);
    if (!!languageDocId) await i18n.changeLanguage(languageDocId);
  }
  const onParentSelect = async () => {
    await applyOrientationForMode(MODES.PARENT);
    api.currentMode = MODES.PARENT;
    const students = await api.getParentStudentProfiles();
    if (students && students.length === 0) {
      history.replace(PAGES.CREATE_STUDENT);
    } else history.replace(PAGES.DISPLAY_STUDENT);
    schoolUtil.setCurrMode(MODES.PARENT);
    // setStage(STAGES.MODE);
  };
  const getCurrentSchoolRoleFromFreshOptions = (): RoleType | undefined =>
    currentSchoolRole ??
    schoolList.find((schoolOption) => schoolOption.id === currentSchool?.id)
      ?.role ??
    teacherAppSchoolList.find(
      (schoolOption) => schoolOption.id === currentSchool?.id,
    )?.role;
  const getSelectedSchoolRole = (): RoleType | undefined =>
    getCurrentSchoolRoleFromFreshOptions() ?? teacherAppSchoolList[0]?.role;
  const getSelectedTeacherAppSchool = (): TableTypes<'school'> | undefined => {
    if (currentSchool && getCurrentSchoolRoleFromFreshOptions()) {
      return currentSchool;
    }

    return teacherAppSchoolList[0]?.school ?? currentSchool;
  };
  const shouldUseAutoUserForSelectedSchool = (): boolean => {
    const selectedSchoolRole = getSelectedSchoolRole();
    return selectedSchoolRole ? isAutoUserRole(selectedSchoolRole) : isAutoUser;
  };

  const onSchoolModeSelect = async (): Promise<void> => {
    await applyOrientationForMode(MODES.SCHOOL);
    api.currentMode = MODES.SCHOOL;
    await schoolUtil.setCurrMode(MODES.SCHOOL);

    if (currentSchool) {
      if (shouldUseAutoUserForSelectedSchool()) {
        await applyAutoUserModeLanguage(api, currentSchool);
      }
      const selectedClass = await displayClasses(currentSchool, currentUser);
      setStage(selectedClass ? STAGES.STUDENT : STAGES.CLASS);
      return;
    }

    if (schoolList.length === 1 && currentUser) {
      const selectedSchool = schoolList[0].school;
      setCurrentSchool(selectedSchool);
      setCurrentSchoolRole(schoolList[0].role);
      schoolUtil.setCurrentSchool(selectedSchool);
      localStorage.setItem(
        CURRENT_SCHOOL_NAME,
        JSON.stringify(selectedSchool.name),
      );
      setCurrentSchoolName(selectedSchool.name);
      if (isAutoUserRole(schoolList[0].role)) {
        await applyAutoUserModeLanguage(api, selectedSchool);
      }
      const selectedClass = await displayClasses(selectedSchool, currentUser);
      setStage(selectedClass ? STAGES.STUDENT : STAGES.CLASS);
      return;
    }

    setStage(STAGES.SCHOOL);
  };

  const continueToTeacherMode = async () => {
    const selectedSchoolRole = getSelectedSchoolRole();
    const selectedTeacherAppSchool = getSelectedTeacherAppSchool();
    const shouldUseAutoUserPermissions = shouldUseAutoUserForSelectedSchool();
    const teacherMode = resolveTeacherAppModeForRole(
      selectedSchoolRole,
      isAutoUser,
    );
    await applyOrientationForMode(teacherMode);
    if (selectedTeacherAppSchool) {
      if (selectedSchoolRole) {
        await Util.setCurrentSchool(
          selectedTeacherAppSchool,
          selectedSchoolRole,
        );
      }
      await schoolUtil.setCurrentSchool(selectedTeacherAppSchool);
    }
    if (currClass) {
      await schoolUtil.setCurrentClass(currClass);
    }
    if (shouldUseAutoUserPermissions) {
      await applyAutoUserModeLanguage(api, selectedTeacherAppSchool);
    }
    api.currentMode = teacherMode;
    schoolUtil.setCurrMode(teacherMode);
    setStage(STAGES.TEACHER);
    history.replace(PAGES.HOME_PAGE);
  };

  const onTeacherSelect = async () => {
    const teacherModeAuthResult = await requireTeacherModeAuth();
    const shouldLogAutoUser = shouldUseAutoUserForSelectedSchool();

    if (teacherModeAuthResult === TeacherModeAuthResult.success) {
      if (shouldLogAutoUser) {
        Util.logEvent(EVENTS.TEACHER_APP_ENTRY_CLICKED, {
          user_role: TEACHER_APP_USER_ROLES.AUTO_USER,
          auth_method_attempted: TEACHER_APP_AUTH_METHODS.BIOMETRIC,
        });
      }
      Util.logEvent(EVENTS.TEACHER_APP_AUTH_SUCCESS, {
        auth_method_used: TEACHER_APP_AUTH_METHODS.BIOMETRIC,
      });
      await continueToTeacherMode();
      return;
    }

    if (teacherModeAuthResult === TeacherModeAuthResult.popupFallbackRequired) {
      if (shouldLogAutoUser) {
        Util.logEvent(EVENTS.TEACHER_APP_ENTRY_CLICKED, {
          user_role: TEACHER_APP_USER_ROLES.AUTO_USER,
          auth_method_attempted: TEACHER_APP_AUTH_METHODS.MATH_GATE,
        });
      }
      setIsTeacherAuthPopupOpen(true);
      return;
    }

    if (shouldLogAutoUser) {
      Util.logEvent(EVENTS.TEACHER_APP_ENTRY_CLICKED, {
        user_role: TEACHER_APP_USER_ROLES.AUTO_USER,
        auth_method_attempted: TEACHER_APP_AUTH_METHODS.BIOMETRIC,
      });
    }
  };

  const displayClasses = async (
    school?: TableTypes<'school'>,
    user?: TableTypes<'user'>,
  ): Promise<TableTypes<'class'> | undefined> => {
    const activeSchool = currentSchool ?? school;
    const activeUser = currentUser ?? user;
    if (!activeSchool || !activeUser) {
      return undefined;
    }
    try {
      const element = await api.getClassesForSchool(
        activeSchool.id,
        activeUser.id,
      );
      if (!element || element.length === 0) {
        return undefined;
      }
      setCurrentClasses(element);
      const savedSelectedClassValue = localStorage.getItem(CURRENT_CLASS_NAME);
      const savedSelectedClass = savedSelectedClassValue
        ? (JSON.parse(savedSelectedClassValue) as TableTypes<'class'>)
        : undefined;
      const selectedClass = getInitialSelectedClass(
        element,
        currClass ?? savedSelectedClass,
      );
      if (selectedClass) {
        setCurrClass(selectedClass);
        await schoolUtil.setCurrentClass(selectedClass);
        localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(selectedClass));
      }
      localStorage.setItem(SELECTED_CLASSES, JSON.stringify(element));
      return selectedClass;
    } catch (error) {
      logger.error('Error fetching classes:', error);
      return undefined;
    }
  };
  const displayStudents = async (curClass: TableTypes<'class'>) => {
    // if(!currClass) return;
    const element = await api.getStudentsForClass(curClass.id);
    if (!element) return;
    setCurrentStudents(element);
    // localStorage.setItem(SELECTED_STUDENTS, JSON.stringify(element));
    return;
  };
  const onStudentClick = async (student: TableTypes<'user'>) => {
    await Util.ensureLidoCommonAudioForStudent(student);
    await Util.setCurrentStudent(student, undefined, true);
    const resolvedSchoolIds = currClass?.school_id ? [currClass.school_id] : [];
    // School mode selection should target only the selected class's school.
    updateLocalAttributes({
      student_id: student.id,
      age: student.age ?? null,
      grade_id: student.grade_id ?? null,
      school_ids: resolvedSchoolIds,
    });
    setGbUpdated(true);
    history.replace(PAGES.HOME);
  };
  const onClassSelect = async (
    selectedClass: TableTypes<'class'>,
    shouldMoveToStudentStage: boolean,
  ) => {
    const previousClass = currClass;
    schoolUtil.setCurrentClass(selectedClass);
    setCurrClass(selectedClass);
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(selectedClass));
    await logClassTabClassChanged(selectedClass, previousClass, stage);
    await displayStudents(selectedClass);
    if (shouldMoveToStudentStage) {
      setStage(STAGES.STUDENT);
    }
  };
  const onClassNavigation = (direction: 'previous' | 'next'): void => {
    if (sortedCurrentClasses.length === 0) {
      return;
    }

    if (
      (direction === 'previous' && isPreviousClassNavigationDisabled) ||
      (direction === 'next' && isNextClassNavigationDisabled)
    ) {
      return;
    }

    const nextWindowStartIndex =
      direction === 'previous'
        ? Math.max(0, classWindowStartIndex - 1)
        : Math.min(maxClassWindowStartIndex, classWindowStartIndex + 1);
    setClassWindowStartIndex(nextWindowStartIndex);
  };
  const getStudentAvatarSrc = (student: TableTypes<'user'>): string => {
    if (student.image) {
      return student.image;
    }
    return `assets/avatars/${student.avatar ?? AVATARS[randomValue()]}.png`;
  };
  const handleStudentSelect = (student: TableTypes<'user'>) => {
    localStorage.setItem(USER_SELECTION_STAGE, 'true');
    void onStudentClick(student);
  };
  function randomValue() {
    let random = Math.floor(Math.random() * 37);
    return random;
  }
  const maxClassWindowStartIndex = Math.max(
    0,
    sortedCurrentClasses.length - VISIBLE_CLASS_COUNT,
  );
  const shouldShowClassArrows =
    sortedCurrentClasses.length > VISIBLE_CLASS_COUNT;
  const isPreviousClassNavigationDisabled = classWindowStartIndex <= 0;
  const isNextClassNavigationDisabled =
    classWindowStartIndex >= maxClassWindowStartIndex;
  const visibleClasses = shouldShowClassArrows
    ? sortedCurrentClasses.slice(
        classWindowStartIndex,
        classWindowStartIndex + VISIBLE_CLASS_COUNT,
      )
    : sortedCurrentClasses;
  const classProfileSelectionText = currClass?.name
    ? t("{{className}} - Select the child's profile", {
        className: currClass.name,
      })
    : '';
  const classStripClassName = `school-mode-class-strip ${
    shouldShowClassArrows ? '' : 'school-mode-class-strip-static'
  }`;
  const previousClassNavigationClassName = `school-mode-nav-button ${
    isPreviousClassNavigationDisabled ? '' : 'school-mode-nav-button-active'
  }`;
  const nextClassNavigationClassName = `school-mode-nav-button ${
    isNextClassNavigationDisabled ? '' : 'school-mode-nav-button-active'
  }`;
  const studentGridClassName = `class-container school-mode-students-grid ${
    currentStudents?.length === 1 ? 'school-mode-students-grid-single' : ''
  } ${currentStudents?.length === 2 ? 'school-mode-students-grid-pair' : ''}`;
  return {
    api,
    applyAutoUserModeLanguage,
    classProfileSelectionText,
    classStripClassName,
    continueToTeacherMode,
    currClass,
    currentSchool,
    currentSchoolId,
    currentSchoolName,
    currentStudents,
    displayClasses,
    getStudentAvatarSrc,
    handleStudentSelect,
    isAutoUser,
    isLoading,
    isNextClassNavigationDisabled,
    isOkayButtonDisabled,
    isPreviousClassNavigationDisabled,
    isTeacherAuthPopupOpen,
    nextClassNavigationClassName,
    onClassNavigation,
    onClassSelect,
    onParentSelect,
    onSchoolModeSelect,
    onTeacherSelect,
    previousClassNavigationClassName,
    schoolList,
    setCurrentSchool,
    setCurrentSchoolId,
    setCurrentSchoolName,
    setCurrentSchoolRole,
    setIsOkayButtonDisabled,
    setIsTeacherAuthPopupOpen,
    setStage,
    shouldShowClassArrows,
    stage,
    studentGridClassName,
    visibleClasses,
  };
};
