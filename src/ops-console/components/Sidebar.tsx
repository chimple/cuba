import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupsIcon from '@mui/icons-material/Groups';
import DevicesIcon from '@mui/icons-material/Devices';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import BookIcon from '@mui/icons-material/Book';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './Sidebar.css';
import {
  NavItems,
  PAGES,
  TableTypes,
  SCHOOL,
  MODES,
  CLASS,
  CAMPAIGN_ACCESS_ROLES,
} from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { schoolUtil } from '../../utility/schoolUtil';
import { Util } from '../../utility/util';
import { APIMode, ServiceConfig } from '../../services/ServiceConfig';
import { IonItem } from '@ionic/react';
import CommonToggle from '../../common/CommonToggle';
import { Capacitor } from '@capacitor/core';
import { IoGitPullRequestSharp } from 'react-icons/io5';
import { t } from 'i18next';
import DialogBoxButtons from '../../components/parent/DialogBoxButtons';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { logAuthDebug } from '../../utility/authDebug';
import { getAppPathname } from '../../utility/routerLocation';
import { parsePath } from 'history';
import { hasSidebarAccess, sidebarNavItems } from './Sidebar.config';
interface SidebarProps {
  name: string;
  email: string;
  photo: string;
}

const DEFAULT_PROFILE_IMAGE = '/assets/profile.svg';

const Sidebar: React.FC<SidebarProps> = ({ name, email, photo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [currentUser, setCurrentUser] = useState<
    TableTypes<'user'> | undefined
  >();
  const [schools, setSchools] = useState<
    {
      school: TableTypes<'school'>;
      role: RoleType;
    }[]
  >();
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  /*
  const {
    canAccessUsersPage,
    canAccessModulePage,
    canAccessMessagesPage,
    canAccessCampaignPage,
  } = hasSidebarAccess(userRoles as RoleType[]);
  */
  const { canAccessUsersPage, canAccessModulePage, canAccessCampaignPage } =
    hasSidebarAccess(userRoles as RoleType[]);
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const localSchool = JSON.parse(localStorage.getItem(SCHOOL)!);
  const localClass = JSON.parse(localStorage.getItem(CLASS)!);
  const switchUserToTeacher = async () => {
    if (localSchool && localClass) {
      schoolUtil.setCurrMode(MODES.TEACHER);
      history.replace({
        ...parsePath(PAGES.HOME_PAGE),
        state: { tabValue: 0 },
      });
    } else if (schools && schools.length > 0) {
      if (schools.length === 1) {
        Util.setCurrentSchool(schools[0].school, schools[0].role);
        const tempClasses = await api.getClassesForSchool(
          schools[0].school.id,
          currentUser?.id!,
        );
        if (tempClasses.length > 0) {
          Util.setCurrentClass(tempClasses[0]);
          schoolUtil.setCurrMode(MODES.TEACHER);
          history.replace({
            ...parsePath(PAGES.HOME_PAGE),
            state: { tabValue: 0 },
          });
        }
      } else {
        schoolUtil.setCurrMode(MODES.TEACHER);
        history.replace(PAGES.DISPLAY_SCHOOLS);
      }
    } else {
      schoolUtil.setCurrMode(MODES.TEACHER);
      history.replace(PAGES.DISPLAY_SCHOOLS);
    }
  };

  // Close sidebar when user click on outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-close sidebar on mobile route change
  useEffect(() => {
    setIsOpen(false);
  }, [location?.pathname]);

  useEffect(() => {
    document.body.classList.toggle('ops-sidebar-open', isOpen);
    return () => {
      document.body.classList.remove('ops-sidebar-open');
    };
  }, [isOpen]);

  const onSignOut = async () => {
    const auth = ServiceConfig.getI().authHandler;
    logAuthDebug('User initiated ops console logout.', {
      source: 'OpsSidebar.onSignOut',
      reason: 'ops_logout_button',
    });
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    localStorage.clear();
    const serviceInstance = ServiceConfig.getInstance(APIMode.SQLITE);
    serviceInstance.switchMode(APIMode.SQLITE);
    logAuthDebug('Navigating to login after ops console logout.', {
      source: 'OpsSidebar.onSignOut',
      reason: 'logout_complete_navigate_login',
      from_page: getAppPathname(),
      to_page: PAGES.LOGIN,
    });
    history.replace(PAGES.LOGIN);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };

  return (
    <div className="sidebar-scroll-container">
      {!isOpen && (
        <button
          className="sidebar-hamburger-outside"
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon />
        </button>
      )}

      <aside ref={sidebarRef} className={`nav-sidebar ${isOpen ? 'open' : ''}`}>
        <button
          className="sidebar-hamburger-inside"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className="sidebar-profile-details">
          <img
            src={photo.trim() || DEFAULT_PROFILE_IMAGE}
            alt="User"
            className="sidebar-avatar"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
          <div className="sidebar-user-info">
            <h2>{name}</h2>
            <p>{email}</p>
          </div>
        </div>

        <ul className="sidebar-nav-list">
          {sidebarNavItems.map((item) => {
            if (isExternalUser && item.label !== NavItems.SCHOOLS) return null;
            // Program listing is only available to roles approved for Program page access.
            if (item.label === NavItems.PROGRAMS && !canAccessUsersPage)
              return null;
            if (item.label === NavItems.CAMPAIGNS && !canAccessCampaignPage)
              return null;
            // if (item.label === NavItems.MESSAGES && !canAccessMessagesPage)
            //   return null;
            if (item.label === NavItems.USERS && !canAccessUsersPage)
              return null;
            if (item.label === NavItems.OpsMODULE && !canAccessModulePage)
              return null;

            return (
              <li key={item.label} className="sidebar-item-list">
                <NavLink
                  to={item.route}
                  activeClassName="active"
                  onClick={() => window.innerWidth <= 768 && setIsOpen(false)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {isOpen && (
                    <span className="sidebar-label">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="ops-side-menu-switch-user-toggle">
          <IonItem className="ops-side-menu-ion-item-container">
            <img src="assets/icons/userSwitch.svg" alt="OPS" className="icon" />
            <CommonToggle
              onChange={switchUserToTeacher}
              label="Switch to Teacher's Mode"
            />
          </IonItem>
        </div>
        {isOpen && (
          <div
            className="sidebar-logout-btn"
            onClick={() => setShowDialogBox(true)}
          >
            {t('Logout')}
          </div>
        )}
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
      </aside>
    </div>
  );
};
export default Sidebar;
