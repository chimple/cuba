import React from 'react';
import { Redirect, Switch } from 'react-router-dom';
import { PAGES } from '../../common/constants';
import ProtectedRoute from '../../ProtectedRoute';
import NewProgram from '../components/NewProgram';
import ParentWhatsappInvitationPage from '../pages/Parentwhatsappinvite/ParentWhatsappInvitationPage';
import ActivitiesPage from './ActivitiesPage';
import AddSchoolPage from './AddSchoolPage';
import CampaignListingPage from './CampaignListingPage';
import CampaignSetupPage from './CampaignSetupPage';
import MigrateSchoolsPage from './MigrateSchoolsPage';
import NewUserPage from './NewUserPageOps';
import OpsApprovedRequestDetails from './OpsApprovedRequestDetails';
import OpsFlaggedRequestDetails from './OpsFlaggedRequestDetails';
import OpsModulePage from './OpsModulePage';
import OpsRejectedRequestDetails from './OpsRejectedRequestDetails';
import PrincipalTeacherPendingRequest from './PrincipalTeacherPendingRequest';
import ProgramsPage from './ProgramPage';
import RequestList from './RequestList';
import SchoolActivities from './SchoolActivities';
import SchoolApprovedRequest from './SchoolApprovedRequest';
import SchoolPendingRequest from './SchoolPendingRequest';
import SchoolRejectedRequest from './SchoolRejectedRequest';
import SchoolFormPage from './SchoolFormPage';
import SchoolList from './SchoolList';
import StudentPendingRequest from './StudentPendingRequest';
import UserDetailsPage from './UserDetailsPage';
import UsersPage from './UsersPage';

type SidebarRoutesProps = {
  CampaignOverviewRoute: React.FC;
  ProgramConnectedSchoolRoute: React.FC;
  ProgramDetailsRoute: React.FC;
  SchoolDetailsRoute: React.FC;
  canAccessCampaignPage: boolean;
  canAccessProgramPage: boolean;
  canCreateProgram: boolean;
  path: string;
};

export const SidebarRoutes = ({
  CampaignOverviewRoute,
  ProgramConnectedSchoolRoute,
  ProgramDetailsRoute,
  SchoolDetailsRoute,
  canAccessCampaignPage,
  canAccessProgramPage,
  canCreateProgram,
  path,
}: SidebarRoutesProps) => (
  <Switch>
    <ProtectedRoute exact path={path}>
      <Redirect
        to={`${path + (canAccessProgramPage ? PAGES.PROGRAM_PAGE : PAGES.SCHOOL_LIST)}`}
      />
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.PROGRAM_PAGE}`} exact>
      <ProgramsPage />
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.SCHOOL_LIST}`} exact>
      <SchoolList />
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.ADMIN_CAMPAIGNS_NEW}`} exact>
      {canAccessCampaignPage ? (
        <CampaignSetupPage />
      ) : (
        <Redirect to={`${path}${PAGES.PROGRAM_PAGE}`} />
      )}
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.ADMIN_CAMPAIGNS}/:campaignId`} exact>
      {canAccessCampaignPage ? (
        <CampaignOverviewRoute />
      ) : (
        <Redirect to={`${path}${PAGES.PROGRAM_PAGE}`} />
      )}
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.ADMIN_CAMPAIGNS}`} exact>
      {canAccessCampaignPage ? (
        <CampaignListingPage />
      ) : (
        <Redirect to={`${path}${PAGES.PROGRAM_PAGE}`} />
      )}
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.REQUEST_LIST}`} exact>
      <RequestList />
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.OPS_MODULE_PAGE}`} exact>
      <OpsModulePage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.OPS_MODULE_PAGE}${PAGES.PARENT_WHATSAPP_INVITATION}`}
      exact
    >
      <ParentWhatsappInvitationPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_PENDING_REQUEST}/:id`}
      exact
    >
      <SchoolPendingRequest />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_APPROVED_REQUEST}/:id`}
      exact
    >
      <SchoolApprovedRequest />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_REJECTED_REQUEST}/:id`}
      exact
    >
      <SchoolRejectedRequest />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_PENDING_REQUEST}${PAGES.SCHOOL_FORM_PAGE}/:id`}
      exact
    >
      <SchoolFormPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.STUDENT_PENDING_REQUEST}/:id`}
      exact
    >
      <StudentPendingRequest />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.OPS_APPROVED_REQUEST}/:id`}
      exact
    >
      <OpsApprovedRequestDetails />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.OPS_REJECTED_REQUEST}/:id`}
      exact
    >
      <OpsRejectedRequestDetails />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.OPS_REJECTED_FLAGGED}/:id`}
      exact
    >
      <OpsFlaggedRequestDetails />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.REQUEST_LIST}${PAGES.PRINCIPAL_TEACHER_PENDING_REQUEST}/:id`}
      exact
    >
      <PrincipalTeacherPendingRequest />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/:school_id`}
      exact
    >
      <SchoolDetailsRoute />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}/:program_id`}
      exact
    >
      <ProgramDetailsRoute />
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.NEW_PROGRAM}`} exact>
      {canCreateProgram ? (
        <NewProgram />
      ) : (
        <Redirect to={`${path}${PAGES.PROGRAM_PAGE}`} />
      )}
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.USERS}`} exact>
      <UsersPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}${PAGES.PROGRAM_CONNECTED_SCHOOL_LIST_PAGE_OPS}/:program_id`}
      exact
    >
      <ProgramConnectedSchoolRoute />
    </ProtectedRoute>
    <ProtectedRoute path={`${path}${PAGES.USERS}${PAGES.NEW_USERS_OPS}`} exact>
      <NewUserPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.ADMIN_USERS}${PAGES.USER_DETAILS}`}
      exact
    >
      <UserDetailsPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`}
      exact
    >
      <AddSchoolPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.SCHOOL_LIST}${PAGES.MIGRATE_SCHOOLS_PAGE}`}
      exact
    >
      <MigrateSchoolsPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}`}
      exact
    >
      <ActivitiesPage />
    </ProtectedRoute>
    <ProtectedRoute
      path={`${path}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}${PAGES.SCHOOL_ACTIVITIES}`}
      exact
    >
      <SchoolActivities />
    </ProtectedRoute>
  </Switch>
);
