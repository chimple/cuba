import React, { useEffect } from 'react';
import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupsIcon from '@mui/icons-material/Groups';
import DevicesIcon from '@mui/icons-material/Devices';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import BookIcon from '@mui/icons-material/Book';

export interface User {
  name: string;
  email: string;
  photo: string;
  role: string;
}
interface SidebarProps {
  user: User;
}


const navItems = [
  { label: 'Dashboard', route: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Programs', route: '/programs', icon: <BookIcon /> },
  { label: 'Schools', route: '/schools', icon: <SchoolIcon /> },
  { label: 'Campaigns', route: '/campaigns', icon: <CampaignIcon /> },
  { label: 'Users', route: '/users', icon: <GroupsIcon /> },
  { label: 'Devices', route: '/devices', icon: <DevicesIcon /> },
  { label: 'Resources', route: '/resources', role: 'superadmin', icon: <LibraryBooksIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  return (
    <aside className="nav-sidebar">
      <div className="nav-profile">
        <img src={user.photo} alt="User" className="nav-avatar" />
        <div className="nav-user-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </div>
      <ul className="nav-list">
        {navItems.map((item) =>
          (!item.role || item.role === user.role) && (
            <li key={item.label} className="nav-item">
                <NavLink to={item.route}>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </NavLink>
            </li>
          )
        )}
      </ul>
    </aside>
  );
};

export default Sidebar;
