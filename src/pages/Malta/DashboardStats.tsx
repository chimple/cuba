import React from "react";
import "./DashboardStats.css";
const DashboardStats: React.FC = () => {
  return (
    <div className="dashboard-stats">
      <div className="dashboard-stat">
        <span className="stat-label">Students:</span>
        <span className="stat-value">22/35</span>
      </div>
      <div className="dashboard-stat">
        <span className="stat-label">Assignments:</span>
        <span className="stat-value">12/30</span>
      </div>
      <div className="dashboard-stat">
        <span className="stat-label">Time Spent:</span>
        <span className="stat-value">120 hours</span>
      </div>
      <div className="dashboard-stat">
        <span className="stat-label">Average Score:</span>
        <span className="stat-value">85%</span>
      </div>
    </div>
  );
};

export default DashboardStats;
