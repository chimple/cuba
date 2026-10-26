import { FC, useEffect, useMemo, useState, useRef } from 'react';
import { useHistory, useLocation } from 'react-router';
import {
  PAGES,
  TableTypes,
  MODES,
  USER_SELECTION_STAGE,
  LANGUAGE,
  OPS_ROLES,
  STATUS,
} from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { t } from 'i18next';
import Header from '../components/homePage/Header';
import { IonFabButton, IonIcon, IonPage } from '@ionic/react';
import { PiUserSwitchFill } from 'react-icons/pi';
import CommonToggle from '../../common/CommonToggle';
import { schoolUtil } from '../../utility/schoolUtil';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';
import { addOutline } from 'ionicons/icons';
import { RoleType } from '../../interface/modelInterfaces';
import Loading from '../../components/Loading';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';
import { parsePath } from 'history';

interface SchoolWithRole {
  school: TableTypes<'school'>;
  role: RoleType;
}
const PAGE_SIZE = 20;

export const useDisplaySchools = () => {
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [schoolList, setSchoolList] = useState<SchoolWithRole[]>([]);
  const [user, setUser] = useState<TableTypes<'user'>>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const { roles = [], isOpsUser } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const isAuthorizedForOpsMode = useMemo(() => {
    const hasOpsRole = OPS_ROLES.some((role) => roles.includes(role));
    return isOpsUser || hasOpsRole;
  }, [isOpsUser, roles]);

  const checkSchoolRequest = async () => {
    const api = ServiceConfig.getI().apiHandler;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const existingRequest = await api.getExistingSchoolRequest(
      _currentUser?.id as string,
    );
    if (existingRequest) {
      history.replace(PAGES.POST_SUCCESS);
    }
  };

  useEffect(() => {
    (async () => {
      const mode = await schoolUtil.getCurrMode();
      const done = JSON.parse(
        localStorage.getItem(USER_SELECTION_STAGE) ?? 'false',
      );
      if (
        mode === MODES.TEACHER &&
        done &&
        location.pathname !== PAGES.HOME_PAGE &&
        Util.getCurrentSchool()
      ) {
        history.replace(PAGES.HOME_PAGE);
      }
    })();
  }, [location.pathname, history]);

  useEffect(() => {
    lockOrientation();
    initData();
  }, []);

  const lockOrientation = () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: 'portrait' });
    }
  };

  const fetchSchools = async (pageNo: number, userId: string) => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
    }
    const result = await api.getSchoolsForUser(userId, {
      page: pageNo,
      page_size: PAGE_SIZE,
    });
    if (pageNo === 1 && result.length === 0) {
      // Logic handled in initData for first load
      return result;
    }
    if (result.length < PAGE_SIZE) setHasMore(false);
    setSchoolList((prev) => (pageNo === 1 ? result : [...prev, ...result]));
    setLoading(false);
    return result;
  };

  const initData = async () => {
    setLoading(true);
    const currentUser = await auth.getCurrentUser();
    const languageCode = localStorage.getItem(LANGUAGE);
    if (!currentUser?.name || currentUser.name.trim() === '') {
      history.replace(PAGES.ADD_TEACHER_NAME);
    }
    if (!currentUser) return;
    setUser(currentUser);
    try {
      await Util.updateUserLanguage(languageCode ?? 'en');
    } catch (error) {
      logger.error('Failed to update user language on init:', error);
    }
    setPage(1);
    setHasMore(true);

    // If user already has both school & class chosen and app is in Teacher mode, go Home
    const mode = await schoolUtil.getCurrMode();
    const done = JSON.parse(
      localStorage.getItem(USER_SELECTION_STAGE) ?? 'false',
    );
    const preSelectedSchool = Util.getCurrentSchool();
    if (
      mode === MODES.TEACHER &&
      done &&
      preSelectedSchool &&
      location.pathname !== PAGES.HOME_PAGE
    ) {
      history.replace(PAGES.HOME_PAGE);
      setLoading(false);
      return;
    }
    // Previously selected school? Respect it

    if (preSelectedSchool) {
      const role = await api.getUserRoleForSchool(
        currentUser.id,
        preSelectedSchool.id,
      );
      if (role) {
        await selectSchool({ school: preSelectedSchool, role });
        return;
      }
    }

    // Fresh fetch and decide
    const firstPage = await fetchSchools(1, currentUser.id);
    if (!firstPage || firstPage.length === 0) {
      // If a request was already sent, go to Post Success; else go to Request School page
      const _currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      const existingRequest = await api.getExistingSchoolRequest(
        _currentUser?.id as string,
      );

      if (
        existingRequest?.request_status === STATUS.REQUESTED ||
        existingRequest?.request_status === STATUS.FLAGGED
      ) {
        history.replace({
          ...parsePath(PAGES.POST_SUCCESS),
          state: { tabValue: 0 },
        });
      } else if (existingRequest?.request_status === STATUS.REJECTED) {
        history.replace({
          ...parsePath(PAGES.SEARCH_SCHOOL),
          state: { tabValue: 0 },
        });
      } else if (existingRequest?.request_status === STATUS.APPROVED) {
        // If approved but school not in list, go to Search School to avoid flicker/loop
        history.replace({
          ...parsePath(PAGES.SEARCH_SCHOOL),
          state: { tabValue: 0 },
        });
      } else {
        history.replace({
          ...parsePath(PAGES.SEARCH_SCHOOL),
          state: {
            origin: PAGES.DISPLAY_SCHOOLS,
          },
        });
      }
      setLoading(false);
      return;
    }

    if (firstPage.length === 1) {
      await selectSchool(firstPage[0]); // auto-select the only school ? Home
      return;
    }
    // Else: multiple schools ? stay on DisplaySchools and let the user choose
    setLoading(false);
  };
  // infinite scroll listener with debounce and robust guard
  const prevSchoolListLength = useRef<number>(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasMore) return;
    let debounceTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (loading) return;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
          setPage((p) => p + 1);
        }
      }, 150);
    };
    el.addEventListener('scroll', handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [loading, hasMore]);

  // fetch next page if page++
  useEffect(() => {
    if (!user || page === 1) return;
    fetchSchools(page, user.id);
  }, [page, user]);

  // Restore scroll position only when new schools are appended and hasMore is true
  useEffect(() => {
    if (
      page > 1 &&
      scrollRef.current &&
      schoolList.length > prevSchoolListLength.current &&
      hasMore
    ) {
      setTimeout(() => {
        scrollRef.current!.scrollTop = scrollPositionRef.current;
      }, 0);
    }
    prevSchoolListLength.current = schoolList.length;
  }, [schoolList, hasMore]);

  // helper: get classes
  const getClasses = async (schoolId: string, userId: string) => {
    const classes = await api.getClassesForSchool(schoolId, userId);
    return classes.length ? classes : [];
  };

  const switchUser = () => {
    history.replace(PAGES.KIDS_APP_LOCATION);
    setLoading(false);
  };

  async function selectSchool(school: SchoolWithRole) {
    Util.setCurrentSchool(school.school, school.role);
    const currentUser = user || (await auth.getCurrentUser());
    if (!currentUser) return;
    await Util.handleClassAndSubjects(
      school.school.id,
      currentUser?.id,
      history,
      PAGES.DISPLAY_SCHOOLS,
    );
    localStorage.setItem(USER_SELECTION_STAGE, JSON.stringify(true));
    const tempClass = Util.getCurrentClass();
    if (tempClass) {
      history.replace({
        ...parsePath(PAGES.HOME_PAGE),
        state: { tabValue: 0 },
      });
    } else {
      const classes = await getClasses(school.school.id, currentUser?.id);
      if (classes.length > 0) {
        Util.setCurrentClass(classes[0]);
        history.replace({
          ...parsePath(PAGES.HOME_PAGE),
          state: { tabValue: 0 },
        });
      }
    }
    void Util.validateCurrentSchoolContext();
    setLoading(false);
  }
  return {
    CommonToggle,
    Header,
    IonFabButton,
    IonIcon,
    IonPage,
    Loading,
    PAGES,
    PiUserSwitchFill,
    Util,
    addOutline,
    hasMore,
    history,
    isAuthorizedForOpsMode,
    loading,
    parsePath,
    schoolList,
    scrollRef,
    selectSchool,
    switchUser,
    t,
  };
};
