import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import { t } from 'i18next';
import {
  CURRENT_MODE,
  MODES,
  PAGES,
  SchoolWithRole,
} from '../../common/constants';
import Header from '../components/homePage/Header';
import EditSchoolSection from '../components/schoolComponent/EditSchoolSection';
import { IonButton, IonPage } from '@ionic/react';
import { RoleType } from '../../interface/modelInterfaces';
import { Util } from '../../utility/util';
import ProfileDetails from '../components/library/ProfileDetails';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Capacitor } from '@capacitor/core';
import { schoolUtil } from '../../utility/schoolUtil';
import { useOnlineOfflineErrorMessageHandler } from '../../common/onlineOfflineErrorMessageHandler';
import logger from '../../utility/logger';
import { logAuthDebug } from '../../utility/authDebug';
import { getAppPathname } from '../../utility/routerLocation';
import { parsePath } from 'history';
interface LocationState {
  school?: SchoolWithRole['school'];
  role?: RoleType;
  origin?: string;
}
export const useReqEditSchool = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { school, role, origin } = (location.state as LocationState) || {};
  const { presentToast } = useOnlineOfflineErrorMessageHandler();
  const [isRequestSent, setIsRequestSent] = useState(false);
  const prevOrigin = origin ?? null;
  const isEditMode: boolean = location.pathname === PAGES.REQ_EDIT_SCHOOL;

  const [schoolData, setSchoolData] = useState({
    name: '',
    state: '',
    district: '',
    city: '',
    image: '',
    UDISE_ID: '',
  });
  const [initialSchoolData, setInitialSchoolData] = useState(schoolData);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigationState = Util.getNavigationState();
  const [showDialogBox, setShowDialogBox] = useState(false);

  const checkRequestStatus = async () => {
    const api = ServiceConfig.getI().apiHandler;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const existingRequest = await api.getExistingSchoolRequest(
      _currentUser?.id as string,
    );
    setIsRequestSent(!!existingRequest);
  };
  useEffect(() => {
    checkRequestStatus();
  }, []);
  useEffect(() => {
    const isFormChanged =
      JSON.stringify(schoolData) !== JSON.stringify(initialSchoolData);
    const isFormValid = schoolData.name.trim();
    setIsButtonDisabled(!isFormChanged || !isFormValid);
  }, [schoolData, initialSchoolData]);

  const handleNameChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, name: value }));
  };

  const handleStateChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, state: value }));
  };

  const handleDistrictChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, district: value }));
  };

  const handleCityChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, city: value }));
  };
  const handleUDISE_IDChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, UDISE_ID: value }));
  };

  const onBackButtonClick = () => {
    history.replace({
      ...parsePath(
        prevOrigin === PAGES.DISPLAY_SCHOOLS
          ? PAGES.DISPLAY_SCHOOLS
          : isEditMode && !navigationState
            ? PAGES.SCHOOL_PROFILE
            : PAGES.MANAGE_SCHOOL,
      ),
      state: {
        school: school,
        role: role,
      },
    });
  };

  const [profilePic, setProfilePic] = useState<File | null>(null);

  const handleProfilePicChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    // Create an image object
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      setProfilePic(file);
    };
  };

  const onSignOut = async () => {
    const auth = ServiceConfig.getI().authHandler;
    logAuthDebug('User initiated teacher school-request logout.', {
      source: 'ReqEditSchool.onSignOut',
      reason: 'teacher_logout_button',
    });
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    localStorage.removeItem(CURRENT_MODE);
    logAuthDebug('Navigating to login after teacher school-request logout.', {
      source: 'ReqEditSchool.onSignOut',
      reason: 'logout_complete_navigate_login',
      from_page: getAppPathname(),
      to_page: PAGES.LOGIN,
    });
    history.replace(PAGES.LOGIN);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };

  const handleSendRequest = async () => {
    setIsSaving(true);
    try {
      if (
        schoolData.name === '' ||
        schoolData.state === '' ||
        schoolData.district === '' ||
        schoolData.city === ''
      ) {
        presentToast({
          message: t(`Please fill all the required fields.`),
          color: 'dark',
          duration: 3000,
          position: 'bottom',
          buttons: [
            {
              text: 'Dismiss',
              role: 'cancel',
            },
          ],
        });
        return;
      }
      const api = ServiceConfig.getI().apiHandler;
      const res = await api.requestNewSchool(
        schoolData.name.trim(),
        schoolData.state.trim(),
        schoolData.district.trim(),
        schoolData.city.trim(),
        profilePic,
        schoolData.UDISE_ID.trim(),
      );
      setIsRequestSent(true);
    } catch (error) {
      logger.error('Failed to send request:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const switchUser = async () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  useEffect(() => {
    const isFormChanged =
      JSON.stringify(schoolData) !== JSON.stringify(initialSchoolData) ||
      profilePic !== null;
    const isFormValid = schoolData.name.trim() || profilePic !== null;
    setIsButtonDisabled(!isFormChanged || !isFormValid);
  }, [schoolData, initialSchoolData, profilePic]);
  return {
    Box,
    EditSchoolSection,
    Header,
    IonButton,
    IonPage,
    ProfileDetails,
    URL,
    handleCityChange,
    handleDistrictChange,
    handleNameChange,
    handleProfilePicChange,
    handleSendRequest,
    handleStateChange,
    handleUDISE_IDChange,
    isButtonDisabled,
    isEditMode,
    isRequestSent,
    isSaving,
    onBackButtonClick,
    prevOrigin,
    profilePic,
    school,
    schoolData,
    t,
  };
};
