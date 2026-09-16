import { IonPage } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react';
import {
  Redirect,
  useParams,
  useRouteMatch,
  useHistory,
  useLocation,
} from 'react-router-dom';
import {
  CAMPAIGN_ACCESS_ROLES,
  PAGES,
  TableTypes,
} from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { clearAllSchoolHeaderCache } from '../../services/offline/offlineCache';
import Sidebar from '../components/Sidebar';
import ProgramConnectedSchoolPage from './ProgramConnectedSchoolPageOps';
import ProgramDetailsPage from './ProgramDetailsPage';
import SchoolDetailsPage from './SchoolDetailsPage';
import CampaignsOverview from '../components/campaignsOverview/CampaignsOverview';
import { CampaignsOverviewApiResponse } from '../components/campaignsOverview/CampaignsOverviewLogic';
import './SidebarPage.css';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { SidebarRoutes } from './SidebarRoutes';

const SchoolDetailsRoute: React.FC = () => {
  const { school_id } = useParams<{ school_id: string }>();
  return <SchoolDetailsPage id={school_id} />;
};

const ProgramDetailsRoute: React.FC = () => {
  const { program_id } = useParams<{ program_id: string }>();
  return <ProgramDetailsPage id={program_id} />;
};

const ProgramConnectedSchoolRoute: React.FC = () => {
  const { program_id } = useParams<{ program_id: string }>();
  return <ProgramConnectedSchoolPage id={program_id} />;
};

type CampaignOverviewRouteState = {
  campaignOverviewData?: CampaignsOverviewApiResponse;
  returnTo?: {
    pathname: string;
    search?: string;
  };
};

const CampaignOverviewRoute: React.FC = () => {
  const history = useHistory();
  const location = useLocation<CampaignOverviewRouteState>();
  const campaignOverviewData = location.state?.campaignOverviewData;
  const returnTo = location.state?.returnTo;

  const handleOpenCampaignListing = () => {
    history.replace({
      pathname:
        returnTo?.pathname || `${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS}`,
      search: returnTo?.search || '',
    });
  };

  if (!campaignOverviewData) {
    return <Redirect to={`${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS}`} />;
  }

  return (
    <CampaignsOverview
      campaignOverviewData={campaignOverviewData}
      onBackClick={handleOpenCampaignListing}
      onBreadcrumbClick={(_, index) => {
        if (index === 0) {
          handleOpenCampaignListing();
        }
      }}
    />
  );
};

const SidebarPage: React.FC = () => {
  const { path } = useRouteMatch();
  const history = useHistory();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<TableTypes<'user'> | null>(
    null,
  );

  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const canAccessProgramPage = userRoles.some((role) =>
    [
      RoleType.SUPER_ADMIN,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
    ].includes(role as RoleType),
  );
  const canCreateProgram = userRoles.some((role) =>
    [RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR].includes(
      role as RoleType,
    ),
  );
  const canAccessCampaignPage = userRoles.some((role) =>
    CAMPAIGN_ACCESS_ROLES.includes(role as RoleType),
  );
  const canAccessMessagesPage = userRoles.some((role) =>
    [
      RoleType.SUPER_ADMIN,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
    ].includes(role as RoleType),
  );
  const canAccessCoordinatorPages = userRoles.includes(
    RoleType.FIELD_COORDINATOR,
  );
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (canAccessProgramPage && !isExternalUser) return;

    const schoolListPath = `${path}${PAGES.SCHOOL_LIST}`;
    const schoolDetailsPrefix = `${path}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/`;
    const activitiesPath = `${schoolListPath}${PAGES.ACTIVITIES_PAGE}`;
    const schoolActivitiesPath = `${activitiesPath}${PAGES.SCHOOL_ACTIVITIES}`;
    const campaignsPath = `${path}${PAGES.ADMIN_CAMPAIGNS}`;
    const campaignDetailsPrefix = `${campaignsPath}/`;
    const messagesPath = `${path}${PAGES.MESSAGES}`;
    const campaignCreatePath = `${path}${PAGES.ADMIN_CAMPAIGNS_NEW}`;
    const requestListPath = `${path}${PAGES.REQUEST_LIST}`;
    const requestDetailsPrefix = `${requestListPath}/`;
    const devicesPath = `${path}${PAGES.ADMIN_DEVICES}`;
    const resourcesPath = `${path}${PAGES.ADMIN_RESOURCES}`;
    const dashboardPath = `${path}${PAGES.ADMIN_DASHBOARD}`;
    const isAllowedPath =
      location.pathname === schoolListPath ||
      location.pathname.startsWith(schoolDetailsPrefix) ||
      (canAccessCampaignPage &&
        (location.pathname === campaignsPath ||
          location.pathname === campaignCreatePath ||
          location.pathname.startsWith(campaignDetailsPrefix))) ||
      (canAccessMessagesPage && location.pathname === messagesPath) ||
      (canAccessCoordinatorPages &&
        (location.pathname === requestListPath ||
          location.pathname.startsWith(requestDetailsPrefix) ||
          location.pathname === devicesPath ||
          location.pathname === resourcesPath ||
          location.pathname === dashboardPath ||
          location.pathname === activitiesPath ||
          location.pathname === schoolActivitiesPath));

    if (!isAllowedPath) {
      history.replace(schoolListPath);
    }
  }, [
    canAccessCampaignPage,
    canAccessMessagesPage,
    canAccessProgramPage,
    canAccessCoordinatorPages,
    history,
    isExternalUser,
    location.pathname,
    path,
  ]);

  useEffect(() => {
    const schoolListPath = `${path}${PAGES.SCHOOL_LIST}`;
    const previousPath = previousPathRef.current;
    const wasInSchoolList = previousPath.startsWith(schoolListPath);
    const isInSchoolList = location.pathname.startsWith(schoolListPath);

    previousPathRef.current = location.pathname;

    if (wasInSchoolList && !isInSchoolList) {
      void clearAllSchoolHeaderCache();
    }
  }, [location.pathname, path]);

  const fetchData = async () => {
    try {
      const user = await ServiceConfig.getI()?.authHandler.getCurrentUser();
      if (!user) {
        logger.error('No user is logged in.');
        return;
      }

      setCurrentUser(user);
    } catch (error) {
      logger.error('Error fetching user data:', error);
    }
  };

  const preserveSelectedText = (event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      event.stopPropagation();
    }
  };

  return (
    <IonPage>
      <div className="sidebarpage-rightSide" onClick={preserveSelectedText}>
        <Sidebar
          name={currentUser?.name || ''}
          email={currentUser?.email || ''}
          photo={currentUser?.image || ''}
        />
        <div className="sidebarpage-render">
          {' '}
          <SidebarRoutes
            CampaignOverviewRoute={CampaignOverviewRoute}
            ProgramConnectedSchoolRoute={ProgramConnectedSchoolRoute}
            ProgramDetailsRoute={ProgramDetailsRoute}
            SchoolDetailsRoute={SchoolDetailsRoute}
            canAccessCampaignPage={canAccessCampaignPage}
            canAccessMessagesPage={canAccessMessagesPage}
            canAccessProgramPage={canAccessProgramPage}
            canCreateProgram={canCreateProgram}
            path={path}
          />
        </div>
      </div>
    </IonPage>
  );
};

export default SidebarPage;
