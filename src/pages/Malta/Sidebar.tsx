import React from "react";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button onClick={toggleSidebar} className="close-sidebar">
        X
      </button>
      <ul>
        <li>
          <button className="sidebar-button">Home</button>
        </li>
        <button className="sidebar-button">Class Code</button>
        <li>
          <button className="sidebar-button">Classroom</button>
        </li>
        <li>
          <button className="sidebar-button">Users</button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
