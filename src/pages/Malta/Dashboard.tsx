import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Sidebar from "./Sidebar";
import Dropdowns from "./Dropdowns"; // Import the Dropdowns component
import DashboardStats from "./DashboardStats";

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
      <div className="dashboard-container">
        <div className="menu-button" onClick={toggleSidebar}>
          <div className="hamburger-icon">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Dropdowns /> {/* Use the Dropdowns component */}
        <button className="sending-report">Send Report</button>
      </div>
      <DashboardStats />
      <button className="floating-button">+</button>
    </>
  );
};

export default Dashboard;
