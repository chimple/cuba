import React, { useEffect } from "react";
import "./Dashboard.css";
import { useState } from "react";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const sidebar = document.querySelector(".sidebar");
      const menuButton = document.querySelector(".menu-button");

      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target) &&
        menuButton &&
        !menuButton.contains(event.target)
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

        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <button onClick={toggleSidebar} className="close-sidebar">
            X
          </button>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </div>

        <div className="dropdown-container">
          <select className="dropdown">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>

          <select className="dropdown">
            <option value="option1">Option A</option>
            <option value="option2">Option B</option>
            <option value="option3">Option C</option>
          </select>
        </div>
      </div>
      <button className="floating-button">+</button>
    </>
  );
};

export default Dashboard;
