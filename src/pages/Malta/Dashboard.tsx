import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Sidebar from "./Sidebar";
import Dropdowns from "./Dropdowns";
import DashboardStats from "./DashboardStats";
import { t } from "i18next";
import DashboardTable from "../../components/DashboardTable/DashboardTable";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="menu-button" onClick={toggleSidebar}>
            <div className="hamburger-icon">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Dropdowns />
          <button className="sending-report">{t("Send Report")}</button>
        </div>
        <DashboardStats />
      </div>
      <DashboardTable />
      <button className="floating-button">+</button>
    </>
  );
};

export default Dashboard;
