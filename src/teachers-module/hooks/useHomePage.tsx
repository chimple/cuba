import { App } from '@capacitor/app';
import {
  Capacitor,
  PluginListenerHandle,
  registerPlugin,
} from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { toPng } from 'html-to-image';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { RoleType } from '../../../src/interface/modelInterfaces';
import {
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  LANGUAGE,
  PAGES,
  STATUS,
  TABLEDROPDOWN,
  TABLESORTBY,
  TableTypes,
} from '../../common/constants';
import {
  updateLocalAttributes,
  useGbContext,
} from '../../growthbook/Growthbook';
import { useAppSelector } from '../../redux/hooks';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { RootState } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { schoolUtil } from '../../utility/schoolUtil';
import { Util } from '../../utility/util';
import AssignmentQrUnavailableAlert from '../components/homePage/assignment/AssignmentQrUnavailableAlert';
import ClassSummaryInfoPopup from '../components/homePage/ClassSummaryInfoPopup';
import Header from '../components/homePage/Header';
import { format, subDays } from 'date-fns';
import { parsePath } from 'history';

export const useHomePage = () => {
  const history = useHistory();
  const location = useLocation<{
    tabValue?: number;
    isAssignments?: boolean;
    selectedType?: TABLEDROPDOWN;
    sortType?: TABLESORTBY;
    startDate?: Date;
    endDate?: Date;
  }>();
  const isTeacherSchoolMode = schoolUtil.isTeacherSchoolMode();
  // 1) Safely grab tabValue (default to 0)
  const initialTab =
    isTeacherSchoolMode && location.state?.tabValue === 2
      ? 0
      : (location.state?.tabValue ?? 0);
  const [tabValue, setTabValue] = useState<number>(initialTab);
  const [showAssignOptionsScreen, setShowAssignOptionsScreen] = useState(true);
  const [autoStartScan, setAutoStartScan] = useState(false);
  const [showUnavailableQrAlert, setShowUnavailableQrAlert] = useState(false);
  const [isHomeInfoOpen, setIsHomeInfoOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<TableTypes<'class'> | null>(
    null,
  );
  const currentSchool = Util.getCurrentSchool();
  const [refresh, setRefresh] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [renderKey, setRenderKey] = useState(0);
  const PortPlugin = registerPlugin<any>('Port');
  const { setGbUpdated } = useGbContext();
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const { isOpsUser } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  useEffect(() => {
    init();

    const handleClassChange = () => {
      init();
      setRefresh((prev) => !prev);
    };
    window.addEventListener(CLASS_OR_SCHOOL_CHANGE_EVENT, handleClassChange);

    let listener: PluginListenerHandle | null = null;

    const setupListener = async () => {
      listener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          setRenderKey((prev) => prev + 1);
        }
      });
    };
    setupListener();

    return () => {
      window.removeEventListener(
        CLASS_OR_SCHOOL_CHANGE_EVENT,
        handleClassChange,
      );
      listener?.remove();
    };
  }, [currentSchool, currentClass]);
  const fetchClassDetails = async () => {
    try {
      const tempClass = Util.getCurrentClass();
      setCurrentClass(tempClass ?? null);
      updateLocalAttributes({
        teacher_class_id: tempClass?.id,
        teacher_school_id: currentSchool?.id,
        teacher_school_state: currentSchool?.group1,
        teacher_school_district: currentSchool?.group2,
        teacher_school_block: currentSchool?.group3,
      });
      setGbUpdated(true);
    } catch (error) {
      logger.error('Failed to load class details', error);
    }
  };
  const init = async () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: 'portrait' });
    }
    const currentUser = await auth.getCurrentUser();
    const languageCode = localStorage.getItem(LANGUAGE);
    await Util.updateUserLanguage(languageCode!);

    const existingRequest = await api.getExistingSchoolRequest(
      currentUser?.id as string,
    );
    if (existingRequest && existingRequest.request_status === STATUS.REQUESTED)
      history.replace(PAGES.POST_SUCCESS);
    await Util.handleClassAndSubjects(
      currentSchool?.id!,
      currentUser?.id!,
      history,
      PAGES.HOME_PAGE,
    );
    await fetchClassDetails();
  };
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (isTeacherSchoolMode && newValue === 2) {
      return;
    }
    // preserve whatever state you need when switching
    setShowAssignOptionsScreen(true);
    setTabValue(newValue);
  };
  const showUnavailableQr = () => {
    setTabValue(2);
    setShowUnavailableQrAlert(true);
  };
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };
  const handleShare = async () => {
    if (tabValue !== 3) return;
    const el = document.querySelector(
      '.Reports-Table-capture-report-table',
    ) as HTMLElement | null;
    if (!el) return;
    const prevMargin = el.style.marginTop;
    el.style.marginTop = '0px';
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        backgroundColor: 'white',
      });
      const fileName = `report-screenshot-${Date.now()}.png`;
      if (!Capacitor.isNativePlatform()) {
        const file = dataURLtoFile(dataUrl, fileName);
        await Util.sendContentToAndroidOrWebShare(
          'Report screenshot attached.',
          'Report Screenshot',
          undefined,
          [file],
        );
      } else {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });
        const fileUri = savedFile.uri.replace('file://', '');
        await PortPlugin.shareContentWithAndroidShare({
          text: 'Report screenshot attached.',
          title: 'Report Screenshot',
          url: '',
          imageFile: { name: fileName, path: fileUri },
        });
      }
    } catch (err) {
      logger.error('Failed to capture or share screenshot.', err);
    } finally {
      el.style.marginTop = prevMargin;
    }
  };
  const handleLibraryBack = () => {
    setShowAssignOptionsScreen(true);
    setTabValue(2);
    history.replace({ ...parsePath(PAGES.HOME_PAGE), state: { tabValue: 2 } });
  };
  const isLibraryTab = tabValue === 1;
  const footerTabValue = tabValue === 1 ? 2 : tabValue;
  const today = new Date();
  const oneWeekBack = subDays(today, 6);
  const classSummaryDateRangeLabel = `${format(oneWeekBack, 'dd/MM')} - ${format(today, 'dd/MM')}`;
  return {
    AssignmentQrUnavailableAlert,
    BottomNavigation,
    BottomNavigationAction,
    ClassSummaryInfoPopup,
    Header,
    PAGES,
    autoStartScan,
    classSummaryDateRangeLabel,
    currentClass,
    currentSchool,
    footerTabValue,
    handleChange,
    handleLibraryBack,
    handleShare,
    history,
    isExternalUser,
    isHomeInfoOpen,
    isLibraryTab,
    isOpsUser,
    isTeacherSchoolMode,
    reportState: location.state,
    renderKey,
    setAutoStartScan,
    setIsHomeInfoOpen,
    setShowAssignOptionsScreen,
    setShowUnavailableQrAlert,
    setTabValue,
    showAssignOptionsScreen,
    showUnavailableQrAlert,
    showUnavailableQr,
    t,
    tabValue,
  };
};
