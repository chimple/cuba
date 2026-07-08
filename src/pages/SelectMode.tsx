import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { IonPage } from '@ionic/react';
import { t } from 'i18next';
import { FC, useEffect, useMemo, useState } from 'react';
import { GiTeacher } from 'react-icons/gi';
import { IoMdPeople } from 'react-icons/io';
import { useHistory } from 'react-router';
import {
  AVATARS,
  CURRENT_CLASS_NAME,
  CURRENT_SCHOOL_NAME,
  EVENTS,
  LANG,
  LANGUAGE,
  MODES,
  PAGES,
  SELECTED_CLASSES,
  SELECTED_STUDENTS,
  STAGES,
  TableTypes,
  TEACHER_APP_AUTH_METHODS,
  TEACHER_APP_USER_ROLES,
  TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS,
  USER_SELECTION_STAGE,
} from '../common/constants';
import DropDown from '../components/DropDown';
import Loading from '../components/Loading';
import TeacherAuthenticationPopup from '../components/parent/TeacherAuthenticationPopup';
import SelectModeButton from '../components/selectMode/SelectModeButton';
import InlineSvg from '../components/InlineSvg';
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
import type { ServiceApi } from '../services/api/ServiceApi';
import { ServiceConfig } from '../services/ServiceConfig';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import {
  requireTeacherModeAuth,
  TeacherModeAuthResult,
} from '../services/TeacherModeAuth';
import logger from '../utility/logger';
import {
  isAutoUserRole,
  isTeacherAppRole,
  resolveTeacherAppModeForRole,
} from '../utility/roleUtil';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import BrandLogoIcon from './assets/brandLogoIcon.svg?raw';
import LeftArrowIcon from './assets/leftArrowIcon.svg?raw';
import './SelectMode.css';
import { logClassTabClassChanged } from './selectModeAnalytics';

const VISIBLE_CLASS_COUNT = 3;
const CLASS_NAME_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

const getInitialSelectedClass = (
  classes: TableTypes<'class'>[],
  selectedClass?: TableTypes<'class'>,
): TableTypes<'class'> | undefined => {
  if (
    selectedClass &&
    classes.some((classItem) => classItem.id === selectedClass.id)
  ) {
    return selectedClass;
  }

  return classes[0];
};

const sortClassesByName = (
  classes: TableTypes<'class'>[],
): TableTypes<'class'>[] =>
  [...classes].sort((firstClass, secondClass) =>
    CLASS_NAME_COLLATOR.compare(firstClass.name, secondClass.name),
  );

type AutoUserModeLanguageApi = Pick<
  ServiceApi,
  'getLanguageWithId' | 'getSchoolById'
>;

interface SchoolModeOption {
  id: string;
  displayName: string;
  school: TableTypes<'school'>;
  role: RoleType;
}

const SUPPORTED_LANGUAGE_CODES = new Set<string>(Object.values(LANG));

const getLanguageCodeForId = async (
  apiHandler: AutoUserModeLanguageApi,
  languageId: string,
): Promise<string | undefined> => {
  if (SUPPORTED_LANGUAGE_CODES.has(languageId)) {
    return languageId;
  }

  try {
    const language = await apiHandler.getLanguageWithId(languageId);
    return language?.code ?? undefined;
  } catch (error) {
    logger.error('Failed to resolve auto user mode language:', error);
    return undefined;
  }
};

const resolveAutoUserModeLanguageCode = async (
  apiHandler: AutoUserModeLanguageApi,
  currentSchool?: TableTypes<'school'>,
): Promise<string> => {
  const candidateSchool =
    currentSchool ?? schoolUtil.getCurrentSchool() ?? Util.getCurrentSchool();

  if (candidateSchool?.language) {
    const schoolLanguageCode = await getLanguageCodeForId(
      apiHandler,
      candidateSchool.language,
    );

    if (schoolLanguageCode) {
      return schoolLanguageCode;
    }
  }

  if (candidateSchool?.id) {
    try {
      const freshSchool = await apiHandler.getSchoolById(candidateSchool.id);
      if (freshSchool?.language) {
        const freshSchoolLanguageCode = await getLanguageCodeForId(
          apiHandler,
          freshSchool.language,
        );

        if (freshSchoolLanguageCode) {
          return freshSchoolLanguageCode;
        }
      }
    } catch (error) {
      logger.error('Failed to refresh auto user school language:', error);
    }
  }

  const studentLanguageId = Util.getCurrentStudent()?.language_id;
  if (studentLanguageId) {
    const studentLanguageCode = await getLanguageCodeForId(
      apiHandler,
      studentLanguageId,
    );

    if (studentLanguageCode) {
      return studentLanguageCode;
    }
  }

  return LANG.ENGLISH;
};

const applyAutoUserModeLanguage = async (
  apiHandler: AutoUserModeLanguageApi,
  school?: TableTypes<'school'>,
): Promise<void> => {
  const languageCode = await resolveAutoUserModeLanguageCode(
    apiHandler,
    school,
  );
  localStorage.setItem(LANGUAGE, languageCode);
  await i18n.changeLanguage(languageCode);
};

const SelectMode: FC = () => {
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
  const init = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const setTab = urlParams.get('tab');
    const currentMode = await schoolUtil.getCurrMode();
    const isSchoolMode =
      currentMode === MODES.SCHOOL || currentMode === MODES.TEACHER_SCHOOL;
    let restoredSchoolForMode: TableTypes<'school'> | undefined;

    if (!isSchoolMode) {
      await changeLanguage();
    }

    await applyOrientationForMode(currentMode);
    if (currentMode === MODES.TEACHER_HOME) {
      history.replace(PAGES.DISPLAY_STUDENT);
      return;
    }
    if (setTab) {
      if (setTab === STAGES.STUDENT) {
        setStage(STAGES.STUDENT);
        const className = localStorage.getItem(CURRENT_CLASS_NAME);
        if (className) {
          const parsedClass = JSON.parse(className);
          setCurrClass(parsedClass);
          await schoolUtil.setCurrentClass(parsedClass);
          await displayStudents(parsedClass);
        }
      } else if (setTab === STAGES.CLASS) {
        setStage(STAGES.CLASS);
      }
    }
    const selectedClasses = localStorage.getItem(SELECTED_CLASSES);
    if (selectedClasses) {
      const parsedClasses = JSON.parse(
        selectedClasses,
      ) as TableTypes<'class'>[];
      const selectedClassName = localStorage.getItem(CURRENT_CLASS_NAME);
      const savedSelectedClass = selectedClassName
        ? (JSON.parse(selectedClassName) as TableTypes<'class'>)
        : undefined;
      setCurrentClasses(parsedClasses);
      const selectedClass = getInitialSelectedClass(
        parsedClasses,
        savedSelectedClass,
      );
      if (selectedClass) {
        setCurrClass(selectedClass);
        await schoolUtil.setCurrentClass(selectedClass);
        localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(selectedClass));
      }
    }
    const displayStudent = localStorage.getItem(SELECTED_STUDENTS);
    if (displayStudent) {
      setCurrentStudents(JSON.parse(displayStudent));
    }

    if (currentMode === MODES.PARENT) {
      const student = Util.getCurrentStudent();
      if (student) {
        history.replace(PAGES.HOME);
        return;
      }
      history.replace(PAGES.DISPLAY_STUDENT);
      return;
    } else if (
      currentMode === MODES.SCHOOL ||
      currentMode === MODES.TEACHER_SCHOOL
    ) {
      const storedSchool = schoolUtil.getCurrentSchool();
      restoredSchoolForMode = storedSchool;
      if (storedSchool) {
        setCurrentSchool(storedSchool);
      }
      const schoolName = localStorage.getItem(CURRENT_SCHOOL_NAME);
      if (schoolName) {
        setCurrentSchoolName(JSON.parse(schoolName));
      } else if (storedSchool?.name) {
        setCurrentSchoolName(storedSchool.name);
      }
      const className = localStorage.getItem(CURRENT_CLASS_NAME);
      if (className) {
        const parsedClass = JSON.parse(className);
        setCurrClass(parsedClass);
        await schoolUtil.setCurrentClass(parsedClass);
      }
      if ((schoolName || storedSchool) && className) {
        const selectedUser = localStorage.getItem(USER_SELECTION_STAGE);
        if (selectedUser) {
          const parsedClass = JSON.parse(className);
          setCurrClass(parsedClass);
          await schoolUtil.setCurrentClass(parsedClass);
        }
        setStage(STAGES.STUDENT);
      } else {
        setStage(STAGES.MODE);
      }
    } else if (currentMode === MODES.TEACHER) {
      return history.replace(PAGES.DISPLAY_SCHOOLS);
    } else if (currentMode === MODES.OPS_CONSOLE) {
      history.replace(PAGES.SIDEBAR_PAGE);
      return;
    }

    const currUser = await auth.getCurrentUser();
    if (!currUser) return;
    const allSchool = await api.getSchoolsForUser(currUser.id);
    const hasAutoUserRoleFromSchoolEntries = allSchool.some((schoolEntry) =>
      isAutoUserRole(schoolEntry.role),
    );
    // Extract school IDs from schoolList
    const schoolIds = allSchool.map((school) => school.school.id);
    const filteredSchools = await api.getSchoolsWithRoleAutouser(
      schoolIds,
      currUser.id,
    );
    const hasAutoUserRole =
      hasAutoUserRoleFromSchoolEntries || (filteredSchools?.length ?? 0) > 0;
    const restoredSchoolForModeId = restoredSchoolForMode?.id;
    const restoredSchoolRole = restoredSchoolForModeId
      ? allSchool.find((entry) => entry.school.id === restoredSchoolForModeId)
          ?.role
      : undefined;
    if (restoredSchoolRole) {
      setCurrentSchoolRole(restoredSchoolRole);
    }
    if (hasAutoUserRole) {
      logger.info('This user is auto user: true');
      const shouldApplyRestoredAutoUserLanguage = restoredSchoolRole
        ? isAutoUserRole(restoredSchoolRole)
        : true;
      if (isSchoolMode && shouldApplyRestoredAutoUserLanguage) {
        await applyAutoUserModeLanguage(api, restoredSchoolForMode);
      }
    } else if (isSchoolMode) {
      await changeLanguage();
    }
    setIsAutoUser(hasAutoUserRole);
    const filteredSchoolIds = filteredSchools?.map((school) => school.id) || [];
    // Filter allSchool to include only schools that are in filteredSchools
    const matchedSchools = allSchool.filter((entry) =>
      filteredSchoolIds.includes(entry.school.id),
    );

    const teacherRoleEntries = allSchool.filter((entry) =>
      isTeacherAppRole(entry.role),
    );
    const teacherAppSchoolOptions = teacherRoleEntries.map((entry) => ({
      id: entry.school.id,
      displayName: entry.school.name,
      school: entry.school,
      role: entry.role,
    }));
    setTeacherAppSchoolList(teacherAppSchoolOptions);

    const hasStudentsInSchool = async (schoolId: string, userId: string) => {
      try {
        const classes = await api.getClassesForSchool(schoolId, userId);
        if (!classes || classes.length === 0) return false;

        for (const classDoc of classes) {
          const studentsInClass = await api.getStudentsForClass(classDoc.id);
          if (studentsInClass && studentsInClass.length > 0) {
            return true;
          }
        }

        return false;
      } catch (error) {
        logger.error('Error checking school students:', error);
        return false;
      }
    };

    const teacherSchoolsWithStudentsChecks = await Promise.all(
      teacherRoleEntries.map(async (entry) => ({
        entry,
        hasStudents: await hasStudentsInSchool(entry.school.id, currUser.id),
      })),
    );

    const teacherSchoolsWithStudents = teacherSchoolsWithStudentsChecks
      .filter((item) => item.hasStudents)
      .map((item) => item.entry);

    const schoolsForSchoolMode = [...matchedSchools];
    teacherSchoolsWithStudents.forEach((ts) => {
      if (!schoolsForSchoolMode.some((ms) => ms.school.id === ts.school.id)) {
        schoolsForSchoolMode.push(ts);
      }
    });

    // If user is ops or program user
    if (isOpsUser) {
      await applyOrientationForMode(MODES.OPS_CONSOLE);
      schoolUtil.setCurrMode(MODES.OPS_CONSOLE);
      history.replace(PAGES.SIDEBAR_PAGE);
      return;
    } else {
      const students = await api.getParentStudentProfiles();

      if (!allSchool || allSchool.length < 1) {
        await applyOrientationForMode(MODES.PARENT);
        api.currentMode = MODES.PARENT;
        schoolUtil.setCurrMode(MODES.PARENT);
        if (students && students.length === 0) {
          history.replace(PAGES.CREATE_STUDENT);
        } else history.replace(PAGES.DISPLAY_STUDENT);
        return;
      }
      for (let i = 0; i < schoolsForSchoolMode.length; i++) {
        const element = schoolsForSchoolMode[i];
        tempSchoolList.push({
          id: element.school.id,
          displayName: element.school.name,
          school: element.school,
          role: element.role,
        });
      }
      setCurrentUser(currUser);
      setSchoolList(tempSchoolList);
      if (schoolsForSchoolMode.length > 0) {
        const selectedUser = localStorage.getItem(USER_SELECTION_STAGE);
        if (tempSchoolList.length === 1) {
          setCurrentSchool(tempSchoolList[0].school);
          setCurrentSchoolRole(tempSchoolList[0].role);
          if (isAutoUserRole(tempSchoolList[0].role)) {
            await applyAutoUserModeLanguage(api, tempSchoolList[0].school);
          }
          const selectedClass = await displayClasses(
            tempSchoolList[0].school,
            currUser,
          );
          if (selectedUser || selectedClass) {
            setStage(STAGES.STUDENT);
          } else {
            setStage(STAGES.CLASS);
          }
        } else {
          // Multiple schools: check if one is already stored
          const storedSchool = Util.getCurrentSchool();
          const matchingEntry = storedSchool
            ? tempSchoolList.find((s) => s.id === storedSchool.id)
            : undefined;

          if (matchingEntry) {
            setCurrentSchool(matchingEntry.school);
            setCurrentSchoolRole(matchingEntry.role);
            schoolUtil.setCurrentSchool(matchingEntry.school);
            localStorage.setItem(
              CURRENT_SCHOOL_NAME,
              JSON.stringify(matchingEntry.school.name),
            );
            setCurrentSchoolName(matchingEntry.school.name);
            if (isAutoUserRole(matchingEntry.role)) {
              await applyAutoUserModeLanguage(api, matchingEntry.school);
            }
            const selectedClass = await displayClasses(
              matchingEntry.school,
              currUser,
            );
            if (selectedUser || selectedClass) {
              setStage(STAGES.STUDENT);
            } else {
              setStage(STAGES.CLASS);
            }
          } else if (selectedUser) {
            setStage(STAGES.STUDENT);
          } else {
            setStage(STAGES.SCHOOL);
          }
        }
      } else if (allSchool.length === 0) {
        onParentSelect();
      } else if (teacherRoleEntries.length === 1) {
        const fallbackTeacherSchool = teacherRoleEntries[0];
        setCurrentSchool(fallbackTeacherSchool.school);
        setCurrentSchoolRole(fallbackTeacherSchool.role);
        await schoolUtil.setCurrentSchool(fallbackTeacherSchool.school);
        localStorage.setItem(
          CURRENT_SCHOOL_NAME,
          JSON.stringify(fallbackTeacherSchool.school.name),
        );
        setCurrentSchoolName(fallbackTeacherSchool.school.name);
        setStage(STAGES.MODE);
      } else if (teacherRoleEntries.length > 1) {
        await applyOrientationForMode(MODES.TEACHER);
        schoolUtil.setCurrMode(MODES.TEACHER);
        history.replace(PAGES.DISPLAY_SCHOOLS);
        return;
      } else {
        // Teacher logic
        await applyOrientationForMode(MODES.TEACHER);
        schoolUtil.setCurrMode(MODES.TEACHER);
        history.replace(PAGES.DISPLAY_SCHOOLS);
        return;
      }
    }

    setIsLoading(false);
  };

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
  return (
    <IonPage className="select-mode-page">
      {!isLoading && (
        <div>
          <div>
            {stage === STAGES.MODE && (
              <div className="select-mode-main">
                <span className="select-mode-text">
                  {t('How would you like to join?')}
                </span>

                <SelectModeButton
                  text={isAutoUser ? t('School Mode') : t('Parent')}
                  icon={IoMdPeople}
                  onClick={isAutoUser ? onSchoolModeSelect : onParentSelect}
                  id={
                    isAutoUser
                      ? 'select-mode-school-mode-button'
                      : 'select-mode-parent-button'
                  }
                />

                <SelectModeButton
                  text={isAutoUser ? t('Teacher App') : t('Teacher')}
                  icon={GiTeacher}
                  onClick={onTeacherSelect}
                  id="select-mode-teacher-button"
                />
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.SCHOOL && (
              <div className="select-school-main">
                <span className="select-school-text">
                  {t('Choose the School')}
                </span>
                <DropDown
                  placeholder={t('Select the School').toString()}
                  onValueChange={async (selectedSchoolDocId) => {
                    const currSchool = schoolList.find(
                      (element) => element.id === selectedSchoolDocId,
                    )?.school;

                    if (!currSchool) {
                      setIsOkayButtonDisabled(true);
                      return;
                    }
                    const selectedSchoolEntry = schoolList.find(
                      (element) => element.id === selectedSchoolDocId,
                    );
                    setCurrentSchool(currSchool);
                    setCurrentSchoolRole(selectedSchoolEntry?.role);
                    localStorage.setItem(
                      CURRENT_SCHOOL_NAME,
                      JSON.stringify(currSchool.name),
                    );
                    setCurrentSchoolName(currSchool.name);
                    setCurrentSchoolId(currSchool.id);
                    setIsOkayButtonDisabled(false);
                    schoolUtil.setCurrentSchool(currSchool);
                    if (isAutoUserRole(selectedSchoolEntry?.role)) {
                      await applyAutoUserModeLanguage(api, currSchool);
                    }
                  }}
                  optionList={schoolList}
                  width="26vw"
                  currentValue={currentSchoolId}
                />
                <button
                  className={`okay-btn ${
                    isOkayButtonDisabled ? 'okay-btn-disabled' : ''
                  }`}
                  onClick={async function () {
                    // history.replace(PAGES.SELECT_CLASS);
                    const selectedClass = await displayClasses();
                    setStage(selectedClass ? STAGES.STUDENT : STAGES.CLASS);
                    return;
                  }}
                  disabled={isOkayButtonDisabled}
                >
                  {t('Okay')}
                </button>
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.CLASS && (
              <div className="class-main class-main-school-mode">
                <div className="school-mode-header class-header">
                  <div className="school-mode-welcome">
                    <InlineSvg
                      svg={BrandLogoIcon}
                      className="school-mode-brand-logo"
                    />
                    <span>{t('Welcome to Chimple!')}</span>
                  </div>
                  <button
                    type="button"
                    className="school-mode-role-badge"
                    onClick={onTeacherSelect}
                  >
                    <span>{t('Teacher')}</span>
                    <img src="assets/icons/user.png" alt="" />
                  </button>
                </div>
                <div className={classStripClassName}>
                  {shouldShowClassArrows && (
                    <button
                      id="school-mode-prev-class-button"
                      type="button"
                      className={previousClassNavigationClassName}
                      disabled={isPreviousClassNavigationDisabled}
                      onClick={() => onClassNavigation('previous')}
                    >
                      <InlineSvg
                        svg={LeftArrowIcon}
                        className="school-mode-nav-arrow"
                      />
                    </button>
                  )}
                  <div className="school-mode-class-tabs">
                    {visibleClasses?.map((tempClass) => (
                      <button
                        key={tempClass.id}
                        id={`school-mode-class-tab-${tempClass.id}`}
                        type="button"
                        onClick={() => {
                          void onClassSelect(tempClass, true);
                        }}
                        className={`school-mode-class-tab class-avatar ${
                          currClass?.id === tempClass.id
                            ? 'school-mode-class-tab-active'
                            : ''
                        }`}
                      >
                        {tempClass.name}
                      </button>
                    ))}
                  </div>
                  {shouldShowClassArrows && (
                    <button
                      id="school-mode-next-class-button"
                      type="button"
                      className={nextClassNavigationClassName}
                      disabled={isNextClassNavigationDisabled}
                      onClick={() => onClassNavigation('next')}
                    >
                      <InlineSvg
                        svg={LeftArrowIcon}
                        className="school-mode-nav-arrow school-mode-nav-arrow-right"
                      />
                    </button>
                  )}
                </div>
                <div className="school-mode-empty-state">
                  {currentSchool?.name ?? currentSchoolName}
                </div>
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.STUDENT && (
              <div className="class-main class-main-school-mode">
                <div className="school-mode-student-stage">
                  <div className="school-mode-header class-header">
                    <div className="school-mode-welcome">
                      <InlineSvg
                        svg={BrandLogoIcon}
                        className="school-mode-brand-logo"
                      />
                      <span>{t('Welcome to Chimple!')}</span>
                    </div>
                    <button
                      type="button"
                      className="school-mode-role-badge"
                      onClick={onTeacherSelect}
                    >
                      <span>{t('Teacher')}</span>
                      <img src="assets/icons/user.png" alt="" />
                    </button>
                  </div>
                  <div className={classStripClassName}>
                    {shouldShowClassArrows && (
                      <button
                        id="school-mode-prev-class-button"
                        type="button"
                        className={previousClassNavigationClassName}
                        disabled={isPreviousClassNavigationDisabled}
                        onClick={() => onClassNavigation('previous')}
                      >
                        <InlineSvg
                          svg={LeftArrowIcon}
                          className="school-mode-nav-arrow"
                        />
                      </button>
                    )}
                    <div className="school-mode-class-tabs">
                      {visibleClasses?.map((tempClass) => (
                        <button
                          key={tempClass.id}
                          id={`school-mode-class-tab-${tempClass.id}`}
                          type="button"
                          onClick={() => {
                            void onClassSelect(tempClass, false);
                          }}
                          className={`school-mode-class-tab class-avatar ${
                            currClass?.id === tempClass.id
                              ? 'school-mode-class-tab-active'
                              : ''
                          }`}
                        >
                          {tempClass.name}
                        </button>
                      ))}
                    </div>
                    {shouldShowClassArrows && (
                      <button
                        id="school-mode-next-class-button"
                        type="button"
                        className={nextClassNavigationClassName}
                        disabled={isNextClassNavigationDisabled}
                        onClick={() => onClassNavigation('next')}
                      >
                        <InlineSvg
                          svg={LeftArrowIcon}
                          className="school-mode-nav-arrow school-mode-nav-arrow-right"
                        />
                      </button>
                    )}
                  </div>
                  {shouldShowClassArrows && currClass?.name && (
                    <p className="school-mode-class-profile-selection-text">
                      {classProfileSelectionText}
                    </p>
                  )}
                  <div className={studentGridClassName}>
                    {currentStudents?.map((tempStudent) => (
                      <article
                        key={tempStudent.id}
                        className="school-mode-student-card class-avatar"
                      >
                        <img
                          className="class-avatar-img school-mode-student-avatar"
                          src={getStudentAvatarSrc(tempStudent)}
                          alt=""
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = `assets/avatars/${tempStudent?.avatar ?? AVATARS[0]}.png`;
                            if (
                              target.src !==
                                window.location.origin + '/' + fallback &&
                              target.src !== fallback
                            ) {
                              target.src = fallback;
                            }
                          }}
                        />
                        <span className="class-name school-mode-student-name">
                          {tempStudent.name}
                        </span>
                        <div className="play-button-shadow">
                          <button
                            id={`school-mode-play-${tempStudent.id}`}
                            type="button"
                            className="school-mode-play-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStudentSelect(tempStudent);
                            }}
                          >
                            {t('Play')}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Loading isLoading={isLoading} />
      <TeacherAuthenticationPopup
        isOpen={isTeacherAuthPopupOpen}
        sourceEntryPoint={
          TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS.SWITCH_PROFILE_BACK_BUTTON
        }
        onClose={() => setIsTeacherAuthPopupOpen(false)}
        onAuthenticated={async () => {
          setIsTeacherAuthPopupOpen(false);
          Util.logEvent(EVENTS.TEACHER_APP_AUTH_SUCCESS, {
            auth_method_used: TEACHER_APP_AUTH_METHODS.MATH_GATE,
          });
          await continueToTeacherMode();
        }}
      />
    </IonPage>
  );
};

export default SelectMode;
