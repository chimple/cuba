import {
  CURRENT_CLASS_NAME,
  CURRENT_SCHOOL_NAME,
  MODES,
  PAGES,
  SELECTED_CLASSES,
  SELECTED_STUDENTS,
  STAGES,
  TableTypes,
  USER_SELECTION_STAGE,
} from '../common/constants';
import { isAutoUserRole, isTeacherAppRole } from '../utility/roleUtil';
import { getAppSearchParams } from '../utility/routerLocation';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import logger from '../utility/logger';
import { getInitialSelectedClass } from './SelectMode.helpers';
export const initializeSelectMode = async (ctx: any) => {
  const {
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
  } = ctx;
  const urlParams = getAppSearchParams();
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
    const parsedClasses = JSON.parse(selectedClasses) as TableTypes<'class'>[];
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
  const hasAutoUserRoleFromSchoolEntries = allSchool.some((schoolEntry: any) =>
    isAutoUserRole(schoolEntry.role),
  );
  // Extract school IDs from schoolList
  const schoolIds = allSchool.map((school: any) => school.school.id);
  const filteredSchools = await api.getSchoolsWithRoleAutouser(
    schoolIds,
    currUser.id,
  );
  const hasAutoUserRole =
    hasAutoUserRoleFromSchoolEntries || (filteredSchools?.length ?? 0) > 0;
  const restoredSchoolForModeId = restoredSchoolForMode?.id;
  const restoredSchoolRole = restoredSchoolForModeId
    ? allSchool.find(
        (entry: any) => entry.school.id === restoredSchoolForModeId,
      )?.role
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
  const filteredSchoolIds =
    filteredSchools?.map((school: any) => school.id) || [];
  // Filter allSchool to include only schools that are in filteredSchools
  const matchedSchools = allSchool.filter((entry: any) =>
    filteredSchoolIds.includes(entry.school.id),
  );

  const teacherRoleEntries = allSchool.filter((entry: any) =>
    isTeacherAppRole(entry.role),
  );
  const teacherAppSchoolOptions = teacherRoleEntries.map((entry: any) => ({
    id: entry.school.id,
    displayName: entry.school.name,
    school: entry.school,
    role: entry.role,
  }));
  setTeacherAppSchoolList(teacherAppSchoolOptions);

  const shouldSuppressTeacherAutoEntry =
    currentMode === MODES.TEACHER_SCHOOL &&
    (location.state?.fromKidsAppLocationSchool === true ||
      location.state?.fromSchoolModeSwitchProfile === true);
  const shouldAutoEnterTeacherApp =
    teacherRoleEntries.length > 0 && !shouldSuppressTeacherAutoEntry;
  const shouldUseEmptySchoolFallback = !shouldSuppressTeacherAutoEntry;

  if (shouldAutoEnterTeacherApp) {
    await applyOrientationForMode(MODES.TEACHER);
    schoolUtil.setCurrMode(MODES.TEACHER);

    const currentTeacherUser = await auth.getCurrentUser();
    if (!currentTeacherUser?.name || currentTeacherUser.name.trim() === '') {
      history.replace(PAGES.ADD_TEACHER_NAME);
      return;
    }

    if (teacherRoleEntries.length === 1) {
      history.replace(PAGES.HOME_PAGE);
      return;
    }

    history.replace(PAGES.DISPLAY_SCHOOLS);
    return;
  }

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
    teacherRoleEntries.map(async (entry: any) => ({
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
          ? tempSchoolList.find((s: any) => s.id === storedSchool.id)
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
    } else if (shouldAutoEnterTeacherApp && teacherRoleEntries.length === 1) {
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
    } else if (shouldAutoEnterTeacherApp && teacherRoleEntries.length > 1) {
      await applyOrientationForMode(MODES.TEACHER);
      schoolUtil.setCurrMode(MODES.TEACHER);
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    } else if (shouldUseEmptySchoolFallback) {
      // Teacher logic
      await applyOrientationForMode(MODES.TEACHER);
      schoolUtil.setCurrMode(MODES.TEACHER);
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }
  }

  setIsLoading(false);
};
