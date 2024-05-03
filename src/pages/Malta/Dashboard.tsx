import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Sidebar from "../../components/malta/Dashboard/Sidebar";
import Dropdowns from "../../components/malta/Dropdowns";
import DashboardStats from "../../components/malta/Dashboard/DashboardStats";
import { t } from "i18next";
import FloatingMenuItems from "../../components/malta/Dashboard/FloatingMenuItems";
import FloatingButton from "../../components/malta/Dashboard/FloatingButton";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [areMenuItemsOpen, setAreMenuItemsOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMenuItems = () => setAreMenuItemsOpen(!areMenuItemsOpen);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const sidebar = document.querySelector(".sidebar") as HTMLElement;
      const menuButton = document.querySelector(".menu-button") as HTMLElement;

      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSidebarOpen]);

  return (
    <>
      <div className="dashboard-container">
        <div className="menu-button" onClick={toggleSidebar}>
          <div className="hamburger-icon">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <Sidebar
          name=""
          email=""
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <Dropdowns />
        <button className="sending-report">{t("Send Report")}</button>
      </div>
      <DashboardStats />
      <FloatingButton onClick={toggleMenuItems} />{" "}
      <FloatingMenuItems isOpen={areMenuItemsOpen} />{" "}
    </>
  );
};

export default Dashboard;
