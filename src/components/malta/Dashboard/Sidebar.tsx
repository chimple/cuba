import { t } from "i18next";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { PAGES } from "../../../common/constants";
import ProfileDetails from "../ProfileDetails";
import "./Sidebar.css";
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const history = useHistory();

  const navigateToProfile = () => {
    history.replace(PAGES.ADD_STUDENT);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button onClick={toggleSidebar} className="close-sidebar">
        X
      </button>
      <div className="profile-section" onClick={navigateToProfile}>
        <ProfileDetails imgSrc="" width="auto" height="10vh" />
        <div className="profile-name-in-sidebar">John Doe </div>
        <div className="profile-email-in-sidebar">john.doe@example.com</div>
        <select className="profile-dropdown-in-sidebar">
          <option value="option1">Bharatiya Vidya Mandir</option>
          <option value="option2">Option 2</option>
        </select>
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
