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
  { label: NavItems.DASHBOARD, route: PAGES.ADMIN_DASHBOARD, icon: <DashboardIcon /> },
  { label: NavItems.PROGRAMS, route: PAGES.ADMIN_PROGRAMS, icon: <BookIcon /> },
  { label: NavItems.SCHOOLS, route: PAGES.ADMIN_SCHOOLS,  icon: <SchoolIcon /> },
  { label: NavItems.COMPAIGNS, route: PAGES.ADMIN_COMPAIGNS,  icon: <CampaignIcon /> },
  { label: NavItems.USERS, route: PAGES.ADMIN_USERS,  icon: <GroupsIcon /> },
  { label: NavItems.DEVICES, route: PAGES.ADMIN_DEVICES,  icon: <DevicesIcon /> },
  { label: NavItems.RESOURCES, route: PAGES.ADMIN_RESOURCES,  icon: <LibraryBooksIcon /> },
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
            <button className="hamburger-outside" onClick={() => setIsOpen(true)}>
            <MenuIcon />
            </button>
        )}
      <aside className={`nav-sidebar ${isOpen ? 'open' : ''}`}>
        <button className="hamburger-inside" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

          <div className="nav-profile">
            <img src={photo} alt="User" className="nav-avatar" />
            <div className="nav-user-info">
              <h2>{name}</h2>
              <p>{email}</p>
            </div>
          </div>

        <ul className="nav-list">
          {navItems.map(
            (item) =>
               (
                <li key={item.label} className="nav-item">
                  <NavLink
                    to={item.route}
                    activeClassName="active"
                    onClick={() => window.innerWidth <= 768 && setIsOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {isOpen && <span className="nav-label">{item.label}</span>}
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
