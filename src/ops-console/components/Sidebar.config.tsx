import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupsIcon from '@mui/icons-material/Groups';
import DevicesIcon from '@mui/icons-material/Devices';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import BookIcon from '@mui/icons-material/Book';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { IoGitPullRequestSharp } from 'react-icons/io5';
import { CAMPAIGN_ACCESS_ROLES, NavItems, PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';

export const sidebarNavItems = [
  {
    label: NavItems.DASHBOARD,
    route: PAGES.SIDEBAR_PAGE + PAGES.ADMIN_DASHBOARD,
    icon: <DashboardIcon />,
  },
  {
    label: NavItems.PROGRAMS,
    route: PAGES.SIDEBAR_PAGE + PAGES.PROGRAM_PAGE,
    icon: <BookIcon />,
  },
  {
    label: NavItems.SCHOOLS,
    route: PAGES.SIDEBAR_PAGE + PAGES.SCHOOL_LIST,
    icon: <SchoolIcon />,
  },
  {
    label: NavItems.CAMPAIGNS,
    route: PAGES.SIDEBAR_PAGE + PAGES.ADMIN_CAMPAIGNS,
    icon: <CampaignIcon />,
  },
  /*
  {
    label: NavItems.MESSAGES,
    route: PAGES.SIDEBAR_PAGE + PAGES.MESSAGES,
    icon: (
      <img
        src="/assets/icons/Message.svg"
        alt=""
        aria-hidden="true"
        className="sidebar-nav-icon-image"
      />
    ),
  },
  */
  {
    label: NavItems.REQUESTS,
    route: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
    icon: <IoGitPullRequestSharp />,
  },
  {
    label: NavItems.OpsMODULE,
    route: PAGES.SIDEBAR_PAGE + PAGES.OPS_MODULE_PAGE,
    icon: <ViewModuleIcon />,
  },
  {
    label: NavItems.USERS,
    route: PAGES.SIDEBAR_PAGE + PAGES.ADMIN_USERS,
    icon: <GroupsIcon />,
  },
  {
    label: NavItems.DEVICES,
    route: PAGES.SIDEBAR_PAGE + PAGES.ADMIN_DEVICES,
    icon: <DevicesIcon />,
  },
  {
    label: NavItems.RESOURCES,
    route: PAGES.SIDEBAR_PAGE + PAGES.ADMIN_RESOURCES,
    icon: <LibraryBooksIcon />,
  },
] as const;

export const hasSidebarAccess = (roles: RoleType[]) => ({
  canAccessUsersPage: roles.some((role) =>
    [
      RoleType.SUPER_ADMIN,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
    ].includes(role),
  ),
  canAccessModulePage: roles.some((role) =>
    [RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR].includes(role),
  ),
  /*
  canAccessMessagesPage: roles.some((role) =>
    [
      RoleType.SUPER_ADMIN,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
    ].includes(role),
  ),
  */
  canAccessCampaignPage: roles.some((role) =>
    CAMPAIGN_ACCESS_ROLES.includes(role),
  ),
});
