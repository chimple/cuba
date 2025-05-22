import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupsIcon from '@mui/icons-material/Groups';
import DevicesIcon from '@mui/icons-material/Devices';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import BookIcon from '@mui/icons-material/Book';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './Sidebar.css';
import { NavItems, PAGES } from "../../common/constants";

interface SidebarProps {
  name: string;
  email: string;
  photo: string;
}

const navItems = [
  { label: NavItems.DASHBOARD, route: PAGES.SIDEBAR_PAGE+PAGES.ADMIN_DASHBOARD, icon: <DashboardIcon /> },
  { label: NavItems.PROGRAMS, route: PAGES.SIDEBAR_PAGE+PAGES.ADMIN_PROGRAMS, icon: <BookIcon /> },
  { label: NavItems.SCHOOLS, route: PAGES.SIDEBAR_PAGE+PAGES.ADMIN_SCHOOLS,  icon: <SchoolIcon /> },
  { label: NavItems.COMPAIGNS, route: PAGES.SIDEBAR_PAGE+PAGES.ADMIN_COMPAIGNS,  icon: <CampaignIcon /> },
  { label: NavItems.USERS, route: PAGES.SIDEBAR_PAGE+PAGES.ADMIN_USERS,  icon: <GroupsIcon /> },
  { label: NavItems.DEVICES, route: PAGES.SIDEBAR_PAGE+PAGES.ADMIN_DEVICES,  icon: <DevicesIcon /> },
  { label: NavItems.RESOURCES, route: PAGES.SIDEBAR_PAGE+PAGES.ADMIN_RESOURCES,  icon: <LibraryBooksIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({ name, email, photo }) => {

  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Auto-close sidebar on mobile route change
  useEffect(() => {
      setIsOpen(false);
  }, [location?.pathname]);

  return (
    <>
      
        {!isOpen && (
            <button className="sidebar-hamburger-outside" onClick={() => setIsOpen(true)}>
            <MenuIcon />
            </button>
        )}
      <aside className={`nav-sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-hamburger-inside" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

          <div className="sidebar-profile-details">
            <img src={photo} alt="User" className="sidebar-avatar" />
            <div className="sidebar-user-info">
              <h2>{name}</h2>
              <p>{email}</p>
            </div>
          </div>

        <ul className="sidebar-nav-list">
          {navItems.map(
            (item) =>
               (
                <li key={item.label} className="sidebar-item-list">
                  <NavLink
                    to={item.route}
                    activeClassName="active"
                    onClick={() => window.innerWidth <= 768 && setIsOpen(false)}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    {isOpen && <span className="sidebar-label">{item.label}</span>}
                  </NavLink>
                </li>
              )
          )}
        </ul>
      </aside>

    </>
  );
};

export default Sidebar;
