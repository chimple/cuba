import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { t } from 'i18next';
import i18n from '../i18n';
import {
  CLASS,
  CURRENT_MODE,
  DEFAULT_LANGUAGE_ID_EN,
  EDIT_STUDENTS_MAP,
  LANGUAGE,
  MAX_STUDENTS_ALLOWED,
  MODES,
  PAGES,
  PARENTHEADERLIST,
  SCHOOL,
  SCHOOL_LOGIN,
  TableTypes,
} from '../common/constants';
import { RoleType } from '../interface/modelInterfaces';
import { useAppDispatch } from '../redux/hooks';
import { setUser } from '../redux/slices/auth/authSlice';
import { ServiceConfig } from '../services/ServiceConfig';
import {
  requireTeacherModeAuth,
  TeacherModeAuthResult,
} from '../services/TeacherModeAuth';
import { ClearCacheData } from '../components/parent/DataClear';
import { getAppPathname } from '../utility/routerLocation';
import { schoolUtil } from '../utility/schoolUtil';
import { logAuthDebug } from '../utility/authDebug';
import { Util } from '../utility/util';

export const parentHeaderIconList = [
  { header: 'profile', displayName: 'Profile' },
  { header: 'settings', displayName: 'Settings' },
  { header: 'help', displayName: 'Help' },
  { header: 'faq', displayName: 'FAQ' },
] as const;

export const DEFAULT_PARENT_TAB = parentHeaderIconList[0].header;

export function useParentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<number>();
  const [musicFlag, setMusicFlag] = useState<number>();
  const [userProfile, setUserProfile] = useState<TableTypes<'user'>[]>([]);
  const location = useLocation<{ activeTab?: string }>();
  const [tabIndex, setTabIndex] = useState<string>(DEFAULT_PARENT_TAB);
  const dispatch = useAppDispatch();
  const [langList, setLangList] = useState<
    {
      id: string;
      displayName: string;
    }[]
  >([]);
  const [langDocIds, setLangDocIds] = useState<Map<string, string>>(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [reloadProfiles, setReloadProfiles] = useState<boolean>(false);
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const [currentUser, setCurrentUser] = useState<
    TableTypes<'user'> | undefined
  >();
  const [isTeacherAuthPopupOpen, setIsTeacherAuthPopupOpen] = useState(false);
  const [schools, setSchools] = useState<
    {
      school: TableTypes<'school'>;
      role: RoleType;
    }[]
  >();
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);
  let tempLangList: {
    id: string;
    displayName: string;
  }[] = [];

  const localAppLang = localStorage.getItem(LANGUAGE);
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const [tabs, setTabs] = useState({});
  const localSchool = JSON.parse(localStorage.getItem(SCHOOL)!);
  const localClass = JSON.parse(localStorage.getItem(CLASS)!);

  const normalizeTabValue = (value?: string) => {
    if (!value) {
      return DEFAULT_PARENT_TAB;
    }

    const matchedTab = parentHeaderIconList.find(
      (item) => item.header === value || t(item.header) === value,
    );

    return matchedTab?.header ?? DEFAULT_PARENT_TAB;
  };

  const switchToTeacherMode = () => {
    schoolUtil.setCurrMode(MODES.TEACHER);
    history.replace(PAGES.DISPLAY_SCHOOLS);
  };

  useEffect(() => {
    setIsLoading(true);
    setCurrentHeader(PARENTHEADERLIST.PROFILE);
    setTabIndex(normalizeTabValue(location.state?.activeTab));
    init();
    getStudentProfile();
  }, [reloadProfiles, location]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  async function getStudentProfile() {
    const userProfilePromise: TableTypes<'user'>[] =
      await ServiceConfig.getI().apiHandler.getParentStudentProfiles();
    let finalUser: any[] = [];
    const storedMapStr = sessionStorage.getItem(EDIT_STUDENTS_MAP);
    const mergedStudents = Util.mergeStudentsByUpdatedAt(
      userProfilePromise,
      storedMapStr,
    );
    for (let i = 0; i < MAX_STUDENTS_ALLOWED; i++) {
      finalUser.push(mergedStudents[i]);
    }
    setUserProfile(finalUser);
  }

  async function init(): Promise<void> {
    const parentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (parentUser) {
      setCurrentUser(parentUser);
      const schools = await api.getSchoolsForUser(parentUser.id);
      if (schools && schools.length > 0) {
        setSchools(schools);
      }
      const currMode = await schoolUtil.getCurrMode();
      setStudentMode(currMode);
      const sound = Util.getCurrentSound();
      const music = Util.getCurrentMusic();
      setSoundFlag(sound);
      setMusicFlag(music);

      const allLang = await ServiceConfig.getI().apiHandler.getAllLanguages();
      let tempLangDocIds: Map<string, string> = new Map();
      let keytempLangDocIds: Map<string, string> = new Map();
      if (!allLang || allLang.length == 0) return;
      const sortedLanguages = [...allLang].sort(
        (left, right) => (left.sort_index ?? 0) - (right.sort_index ?? 0),
      );
      for (let i = 0; i < sortedLanguages.length; i++) {
        const element = sortedLanguages[i];

        tempLangList.push({
          id: element.id,
          displayName: element.name,
        });
        tempLangDocIds.set(element.name, element.id);
        keytempLangDocIds.set(element.id, element.name);
      }

      setLangDocIds(tempLangDocIds);
      setLangList(tempLangList);

      const userLangId = parentUser.language_id ?? DEFAULT_LANGUAGE_ID_EN;
      const element =
        allLang.find((obj) => obj.id === userLangId) || allLang[0];

      if (!element) return;

      setCurrentAppLang(element.id);

      if (element.code) {
        await i18n.changeLanguage(element.code);
        localStorage.setItem(LANGUAGE, element.code);
      }

      if (!tabIndex) {
        setTabIndex(DEFAULT_PARENT_TAB);
      }

      setIsLoading(false);
    }
  }

  const handleLanguageSelect = async (
    selectedLangDocId: string,
  ): Promise<void> => {
    const api = ServiceConfig.getI().apiHandler;
    const auth = ServiceConfig.getI().authHandler;
    const allLang = await api.getAllLanguages();
    const langDoc = allLang.find((obj) => obj.id === selectedLangDocId);

    if (!langDoc) return;
    localStorage.setItem(LANGUAGE, langDoc.code ?? '');
    await i18n.changeLanguage(langDoc.code ?? '');
    const currentUser = await auth.getCurrentUser();
    setTabIndex(parentHeaderIconList[1].header);

    if (!currentUser || !currentUser.id) return;
    if (selectedLangDocId) {
      api.updateLanguage(currentUser.id, selectedLangDocId);
    }
    setCurrentAppLang(selectedLangDocId);
    setIsLanguageMenuOpen(false);
    const updatedUserData: TableTypes<'user'> = {
      ...currentUser,
      language_id: selectedLangDocId,
    };
    dispatch(setUser(updatedUserData));
    auth.currentUser = updatedUserData;
  };

  const handleSoundToggle = async () => {
    const soundEnabled = soundFlag === 0;
    const nextEnabled = !soundEnabled;
    const nextFlag = nextEnabled ? 0 : 1;
    setSoundFlag(nextFlag);
    const resolvedCurrentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    Util.setCurrentSound(nextFlag);
    if (resolvedCurrentUser) {
      ServiceConfig.getI().apiHandler.updateSoundFlag(
        resolvedCurrentUser.id,
        nextEnabled,
      );
    }
  };

  const handleMusicToggle = async () => {
    const musicEnabled = musicFlag === 0;
    const nextEnabled = !musicEnabled;
    const nextFlag = nextEnabled ? 0 : 1;
    setMusicFlag(nextFlag);
    const resolvedCurrentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    Util.setCurrentMusic(nextFlag);
    if (resolvedCurrentUser) {
      ServiceConfig.getI().apiHandler.updateMusicFlag(
        resolvedCurrentUser.id,
        nextEnabled,
      );
    }
  };

  const handleTeachersAppClick = async () => {
    if (!currentUser?.name || currentUser.name.trim() === '') {
      history.replace(PAGES.ADD_TEACHER_NAME);
      return;
    }

    const teacherModeAuthResult = await requireTeacherModeAuth();

    if (teacherModeAuthResult === TeacherModeAuthResult.success) {
      switchToTeacherMode();
      return;
    }

    if (teacherModeAuthResult === TeacherModeAuthResult.popupFallbackRequired) {
      setIsTeacherAuthPopupOpen(true);
    }
  };

  const handleTermsClick = () => {
    history.push({
      pathname: PAGES.TERMS_AND_CONDITIONS,
      state: {
        from: getAppPathname(),
        returnLocation: {
          pathname: getAppPathname(),
          state: {
            activeTab: 'settings',
          },
        },
      },
    });
  };

  const handleSignOut = async () => {
    const auth = ServiceConfig.getI().authHandler;
    logAuthDebug('User initiated parent logout.', {
      source: 'Parent.settingUI.handleSignOut',
      reason: 'parent_logout_button',
      from_page: getAppPathname(),
    });
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    localStorage.removeItem(SCHOOL);
    localStorage.removeItem(CLASS);
    localStorage.removeItem(CURRENT_MODE);
    localStorage.removeItem(SCHOOL_LOGIN);
    await ClearCacheData();
    logAuthDebug('Navigating to login after parent logout.', {
      source: 'Parent.settingUI.handleSignOut',
      reason: 'logout_complete_navigate_login',
      from_page: getAppPathname(),
      to_page: PAGES.LOGIN,
    });
    history.replace(PAGES.LOGIN);
    if (Capacitor.isNativePlatform()) {
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    await Browser.open({
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSd0q3StMO49k_MvBQ68F_Ygdytpmxv-vNuF5jqsk6dY-4N0BA/viewform?pli=1',
    });
  };

  const handleChange = (newValue: string) => {
    const normalizedTabValue = normalizeTabValue(newValue);
    const selectedHeader = parentHeaderIconList.find(
      (item) => item.header === normalizedTabValue,
    );
    if (selectedHeader) {
      setCurrentHeader(selectedHeader.header);
    }
    setTabIndex(normalizedTabValue);
  };

  const handleBackButton = () => {
    Util.setPathToBackButton(PAGES.DISPLAY_STUDENT, history);
  };

  useEffect(() => {
    if (!tabIndex && parentHeaderIconList.length > 0) {
      setTabIndex(DEFAULT_PARENT_TAB);
    }
  }, []);

  useEffect(() => {
    const updatedTabs: Record<string, string> = {};
    parentHeaderIconList.forEach((item) => {
      updatedTabs[item.header] = t(item.header);
    });
    setTabs(updatedTabs);
  }, [localAppLang]);

  return {
    currentAppLang,
    currentUser,
    handleBackButton,
    handleChange,
    handleDeleteAccount,
    handleLanguageSelect,
    handleMusicToggle,
    handleSignOut,
    handleSoundToggle,
    handleTeachersAppClick,
    handleTermsClick,
    isLanguageMenuOpen,
    isLoading,
    isTeacherAuthPopupOpen,
    langList,
    languageDropdownRef,
    musicFlag,
    setIsLanguageMenuOpen,
    setIsTeacherAuthPopupOpen,
    setReloadProfiles,
    setShowDeleteAccountDialog,
    setShowSignOutDialog,
    showDeleteAccountDialog,
    showSignOutDialog,
    soundFlag,
    studentMode,
    switchToTeacherMode,
    tabIndex,
    tabs,
    userProfile,
  };
}
