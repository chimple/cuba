import { t } from "i18next";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import ProfileDetails from "./ProfileDetails";
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const history = useHistory();

  const navigateToProfile = () => {
    history.replace(PAGES.TEACHER_PROFILE);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button onClick={toggleSidebar} className="close-sidebar">
        X
      </button>
      <div className="profile-section" onClick={navigateToProfile}>
        <ProfileDetails />
        <hr className="horizontal-line" />
      </div>
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
