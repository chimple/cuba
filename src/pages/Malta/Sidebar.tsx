import { t } from "i18next";
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
          <button className="sidebar-button">{t("Home")}</button>
        </li>
        <button className="sidebar-button">{t("Class Code")}</button>
        <li>
          <button className="sidebar-button">{t("Classroom")}</button>
        </li>
        <li>
          <button className="sidebar-button">{t("Users")}</button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
