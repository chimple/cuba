import { t } from "i18next";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { PAGES } from "../../../common/constants";
import ProfileDetails from "../../../chimple-private/components/homePage/library/ProfileDetails";
import "./Sidebar.css";
import CloseIcon from "@mui/icons-material/Close";

interface SidebarProps {
  name: string;
  email: string;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const classOptions = [
  { label: "Bharatiya Vidya Mandir", value: "option1" },
  { label: "2nd Standard", value: "option2" },
];

const Sidebar: React.FC<SidebarProps> = ({
  name,
  email,
  isOpen,
  toggleSidebar,
}) => {
  const history = useHistory();

  const navigateToProfile = () => {
    history.replace(PAGES.TEACHER_PROFILE);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button onClick={toggleSidebar} className="close-sidebar">
        <CloseIcon />
      </button>
      <div className="profile-section" >
        {/* <ProfileDetails imgSrc="" width="10vw" height="10vh"/> */}
        <div className="profile-name-in-sidebar" onClick={navigateToProfile}>{name} </div>
        <div className="profile-email-in-sidebar">{email}</div>
        <select className="profile-dropdown-in-sidebar">
          {classOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
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
