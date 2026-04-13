import React, { useState, useEffect, useRef, useMemo } from 'react';
import { IonMenu, IonItem } from '@ionic/react';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { Util } from '../../../utility/util';
import {
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  CURRENT_MODE,
  MODES,
  OPS_ROLES,
  PAGES,
} from '../../../common/constants';
import ProfileSection from './ProfileDetail';
import SchoolSection from './SchoolSection';
import ClassSection from './ClassSection';
import './SideMenu.css';
import { RoleType } from '../../../interface/modelInterfaces';
import { useHistory } from 'react-router';
import { schoolUtil } from '../../../utility/schoolUtil';
import CommonToggle from '../../../common/CommonToggle';
import { Capacitor } from '@capacitor/core';
import DialogBoxButtons from '../../../components/parent/DialogBoxButtons​';
import { t } from 'i18next';
import {
  updateLocalAttributes,
  useGbContext,
} from '../../../growthbook/Growthbook';
import { ClearCacheData } from '../../../components/parent/DataClear';
import { registerBackButtonHandler } from '../../../common/backButtonRegistry';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import logger from '../../../utility/logger';
import { logAuthDebug } from '../../../utility/authDebug';

const SideMenu: React.FC<{
  handleManageSchoolClick: () => void;
  handleManageClassClick: () => void;
}> = ({ handleManageSchoolClick, handleManageClassClick }) => {
  const menuRef = useRef<HTMLIonMenuElement>(null);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [schoolData, setSchoolData] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [classData, setClassData] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [schoolRoles, setSchoolRoles] = useState<
    { schoolId: string; role: RoleType }[]
  >([]);

  const [classCode, setClassCode] = useState<number>();
  const [currentSchoolDetail, setsetcurrentSchoolDetail] = useState<{
    id: string | number;
    name: string;
  }>({ id: '', name: '' });
  const [currentClassDetail, setcurrentClassDetail] = useState<{
    id: string | number;
    name: string;
  }>({ id: '', name: '' });
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const history = useHistory();
  const { setGbUpdated } = useGbContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [schoolSearchResetToken, setSchoolSearchResetToken] = useState(0);
  const { roles, isOpsUser } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const isAuthorizedForOpsMode = useMemo(() => {
    const hasOpsRole = OPS_ROLES.some((role) => roles.includes(role));
    return isOpsUser || hasOpsRole;
  }, [isOpsUser, roles]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const unregister = registerBackButtonHandler(() => {
      menuRef.current?.close();
      return true;
    });
    return () => unregister();
  }, [isMenuOpen]);

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener(CLASS_OR_SCHOOL_CHANGE_EVENT, handler);
    return () => {
      window.removeEventListener(CLASS_OR_SCHOOL_CHANGE_EVENT, handler);
    };
  }, []);

  const api = ServiceConfig.getI()?.apiHandler;
  const fetchData = async () => {
    try {
      const currentUser =
        await ServiceConfig.getI()?.authHandler.getCurrentUser();
      if (!currentUser) {
        logger.error('No user is logged in.');
        return;
      }
      setFullName(currentUser.name || '');
      setEmail(currentUser.email || currentUser.phone || '');
      setCurrentUserId(currentUser.id);
      let teacher_class_ids: string[] = [];
      const schoolList: any = [];
      const roleMap: Record<string, RoleType> = {};

      const tempSchool = Util.getCurrentSchool();
      if (tempSchool) {
        setsetcurrentSchoolDetail({ id: tempSchool.id, name: tempSchool.name });

        const updatedClass = Util.getCurrentClass();

        // Fetch classes for the current school
        const classes = await api.getClassesForSchool(
          tempSchool.id,
          currentUser.id,
        );
        teacher_class_ids = classes.map((item) => item.id);
        const classMap = classes.map((classItem: any) => ({
          id: classItem.id,
          name: classItem.name,
        }));
        const patchedList = updatedClass
          ? classMap.map((c) => (c.id === updatedClass.id ? updatedClass : c))
          : classMap;
        setClassData(patchedList);

        if (!updatedClass) {
          return;
        }

        setCurrentClassId(updatedClass.id);
        setcurrentClassDetail({
          id: updatedClass.id,
          name: updatedClass.name,
        });
        const classCode = await getClassCodeById(updatedClass?.id!);
        setClassCode(classCode);
      }

      const allSchools = await api.getSchoolsForUser(currentUser.id, {
        page: 1,
        page_size: 20,
      });

      if (allSchools && allSchools.length > 0) {
        const schoolMap = allSchools.map(({ school }: any) => ({
          id: school.id,
          name: school.name,
        }));
        setSchoolData(schoolMap);

        const roles = allSchools.map(({ school, role }: any) => ({
          schoolId: school.id,
          role,
        }));
        roles.forEach((obj) => {
          schoolList.push(obj.schoolId);
          roleMap[`${obj.schoolId}_role`] = obj.role;
        });
        const teacher_school_and_classes = {
          teacher_school_list: schoolList,
          roleMap,
          teacher_class_ids,
        };
        updateLocalAttributes(teacher_school_and_classes);
        setGbUpdated(true);
        setSchoolRoles(roles);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
    }
  };
  const switchUser = async () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    setTimeout(() => {
      Util.killCocosGame();
    }, 1000);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  const getClassCodeById = async (class_id: string) => {
    if (class_id) {
      const classCode = await api.getClassCodeById(class_id);
      return classCode;
    }
    return;
  };

  const handleSchoolSelect = async ({
    id,
    name,
    role,
  }: { id?: string | number; name?: string; role?: RoleType } = {}) => {
    try {
      if (!id) {
        logger.warn('Invalid ID or no ID provided for school selection');
        return;
      }
      const school = await api.getSchoolById(String(id));
      if (!school?.id) {
        logger.warn('School not found');
        return;
      }
      const schoolRole =
        role || schoolRoles.find((item) => item.schoolId === id)?.role;
      if (!schoolRole) {
        return;
      }
      Util.setCurrentSchool(school, schoolRole);

      setsetcurrentSchoolDetail({
        id: school.id,
        name: name || school.name,
      });
      const classes = await api.getClassesForSchool(school.id, currentUserId);
      if (!classes || classes.length === 0) {
        logger.warn('No classes found for the selected school');
        Util.setCurrentClass(null);
        setCurrentClassId('');
        setcurrentClassDetail({ id: '', name: '' });
        setClassCode(undefined);
        setClassData([]);
        Util.dispatchClassOrSchoolChangeEvent();
        return;
      }
      const firstClass = classes[0];
      Util.setCurrentClass(firstClass);
      const classMap = classes.map((classItem: any) => ({
        id: classItem.id,
        name: classItem.name,
      }));
      setClassData(classMap);
      // Auto-select the first class if available
      setCurrentClassId(firstClass.id);
      setcurrentClassDetail({
        id: firstClass.id,
        name: firstClass.name,
      });
      const classCode = await getClassCodeById(firstClass.id);
      setClassCode(classCode);
      Util.dispatchClassOrSchoolChangeEvent();
    } catch (error) {
      logger.error('Error handling school selection:', error);
    }
  };

  const handleClassSelect = async ({
    id,
    name,
  }: { id?: string | number; name?: string } = {}) => {
    try {
      if (!id || id === currentClassId) {
        logger.warn('Invalid ID or duplicate selection');
        return;
      }

      const classIdStr = String(id).trim();
      if (!classIdStr) {
        logger.warn('Class ID is empty after conversion');
        return;
      }

      const currentClass = await api.getClassById(classIdStr);
      if (!currentClass || !currentClass.id) {
        logger.warn('Class not found or invalid response');
        return;
      }

      Util.setCurrentClass(currentClass);

      if (!currentClass.id) {
        logger.warn('Missing class ID after setting current class');
        return;
      }

      setCurrentClassId(currentClass.id);
      setcurrentClassDetail({
        id: currentClass.id,
        name: name || currentClass.name,
      });

      const classCode = await getClassCodeById(currentClass.id);
      if (classCode !== undefined && classCode !== null) {
        setClassCode(classCode);
      } else {
        setClassCode(undefined);
        logger.warn('Class code is null or undefined');
      }

      Util.dispatchClassOrSchoolChangeEvent();
    } catch (error) {
      logger.error('Error handling class selection:', error);
    }
  };

  const [showDialogBox, setShowDialogBox] = useState(false);

  const onSignOut = async () => {
    const auth = ServiceConfig.getI().authHandler;
    logAuthDebug('User initiated teacher side-menu logout.', {
      source: 'TeacherSideMenu.onSignOut',
      reason: 'teacher_logout_button',
    });
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    localStorage.removeItem(CURRENT_MODE);
    await ClearCacheData();
    logAuthDebug('Navigating to login after teacher side-menu logout.', {
      source: 'TeacherSideMenu.onSignOut',
      reason: 'logout_complete_navigate_login',
      from_page: window.location.pathname,
      to_page: PAGES.LOGIN,
    });
    history.replace(PAGES.LOGIN);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };

  return (
    <>
      <IonMenu
        ref={menuRef}
        aria-label={String(t('Menu'))}
        contentId="main-content"
        id="main-container"
        onIonDidOpen={() => setIsMenuOpen(true)}
        onIonDidClose={() => {
          setIsMenuOpen(false);
          setSchoolSearchResetToken((prev) => prev + 1);
        }}
      >
        <div aria-label={String(t('Menu'))} className="side-menu-container">
          <ProfileSection fullName={fullName} email={email} />
          <div className="side-menu-body">
            <SchoolSection
              schoolData={schoolData}
              currentSchoolDetail={currentSchoolDetail}
              handleSchoolSelect={handleSchoolSelect}
              handleManageSchoolClick={handleManageSchoolClick}
              resetTrigger={schoolSearchResetToken}
            />
            <ClassSection
              classData={classData}
              currentClassDetail={currentClassDetail}
              currentClassId={currentClassId}
              classCode={classCode}
              handleClassSelect={handleClassSelect}
              handleManageClassClick={handleManageClassClick}
              setClassCode={setClassCode}
            />
          </div>
          <div className="side-menu-switch-user-toggle">
            <IonItem className="side-menu-ion-item-container">
              <img
                src="assets/icons/userSwitch.svg"
                alt="SCHOOL"
                className="icon"
              />
              <CommonToggle
                onChange={switchUser}
                label="Switch to Child's Mode"
              />
            </IonItem>
          </div>
          {isAuthorizedForOpsMode && (
            <div className="side-menu-switch-user-toggle">
              <IonItem className="side-menu-ion-item-container">
                <img
                  src="assets/icons/userSwitch.svg"
                  alt="OPS"
                  className="icon"
                />
                <CommonToggle
                  onChange={() => Util.switchToOpsUser(history)}
                  label={t('switch to ops mode') as string}
                />
              </IonItem>
            </div>
          )}
          <div
            className="teacher-logout-btn"
            onClick={() => setShowDialogBox(true)}
          >
            {t('Logout')}
          </div>

          {/* Logout Confirmation Dialog */}
          <DialogBoxButtons
            width="100%"
            height="20%"
            message={t('Are you sure you want to logout?')}
            showDialogBox={showDialogBox}
            yesText={t('Cancel')}
            noText={t('Logout')}
            handleClose={() => setShowDialogBox(false)}
            onYesButtonClicked={() => setShowDialogBox(false)}
            onNoButtonClicked={onSignOut}
          />
        </div>
      </IonMenu>

      <img
        src="assets/icons/hamburgerMenu.svg"
        alt={String(t('Menu'))}
        id="menu-button"
        className="sidemenu-hamburger"
        onClick={() => menuRef.current?.open()}
      />
    </>
  );
};

export default SideMenu;
