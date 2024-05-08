import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Sidebar from "../../components/malta/Dashboard/Sidebar";
import Dropdowns from "../../components/malta/Dropdowns";
import DashboardStats from "../../components/malta/Dashboard/DashboardStats";
import { t } from "i18next";
import DashboardTable from "../../components/DashboardTable/DashboardTable";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [areMenuItemsOpen, setAreMenuItemsOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMenuItems = () => setAreMenuItemsOpen(!areMenuItemsOpen);
  const studentData = {
    "Frank1": {
      "Math": null,
      "Science": 80,
      "History": 45,
      "English": 98,
      "Art": 32,
      "Physical Education": 80,
      "Computer Science": 14,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Grace1": {
      "Math": 90,
      "Science": 12,
      "History": 78,
      "English": 24,
      "Art": 62,
      "Physical Education": 15,
      "Computer Science": 98,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Alice1": {
      "Math": null,
      "Science": 90,
      "History": 67,
      "English": null,
      "Art": 12,
      "Physical Education": 82,
      "Computer Science": 78,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Bob1": {
      "Math": 78,
      "Science": null,
      "History": 72,
      "English": 90,
      "Art": null,
      "Physical Education": 30,
      "Computer Science": 86,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
  
    "Alice1q": {
      "Math": null,
      "Science": 90,
      "History": 67,
      "English": null,
      "Art": 12,
      "Physical Education": 82,
      "Computer Science": 78, 
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },

    "Frank2": {
      "Math": null,
      "Science": 80,
      "History": 45,
      "English": 98,
      "Art": 32,
      "Physical Education": 80,
      "Computer Science": 14,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Grace2": {
      "Math": 90,
      "Science": 12,
      "History": 78,
      "English": 24,
      "Art": 62,
      "Physical Education": 15,
      "Computer Science": 98,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Alice2": {
      "Math": null,
      "Science": 90,
      "History": 67,
      "English": null,
      "Art": 12,
      "Physical Education": 82,
      "Computer Science": 78,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Bob2": {
      "Math": 78,
      "Science": null,
      "History": 72,
      "English": 90,
      "Art": null,
      "Physical Education": 30,
      "Computer Science": 86,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
  
    "Alice3": {
      "Math": null,
      "Science": 90,
      "History": 67,
      "English": null,
      "Art": 12,
      "Physical Education": 82,
      "Computer Science": 78, 
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },

    "Frank5": {
      "Math": null,
      "Science": 80,
      "History": 45,
      "English": 98,
      "Art": 32,
      "Physical Education": 80,
      "Computer Science": 14,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Grace5": {
      "Math": 90,
      "Science": 12,
      "History": 78,
      "English": 24,
      "Art": 62,
      "Physical Education": 15,
      "Computer Science": 98,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Alice1w": {
      "Math": null,
      "Science": 90,
      "History": 67,
      "English": null,
      "Art": 12,
      "Physical Education": 82,
      "Computer Science": 78,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
    "Bob1q": {
      "Math": 78,
      "Science": null,
      "History": 72,
      "English": 90,
      "Art": null,
      "Physical Education": 30,
      "Computer Science": 86,
      "History1": 67,
      "English1": null,
      "Art1": 12,
      "Physical Education1": 82,
      "Computer Science1": 78
    },
  
  };


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
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} name={""} email={""} />
          <Dropdowns />
          <button className="sending-report">{t("Send Report")}</button>
        </div>
        <DashboardStats />
      </div>
      <DashboardTable studentsData={studentData} headerData={['a','b','c','d','e','f','g']}/>
      <button className="floating-button">+</button>
    </>
  );
};

export default Dashboard;
