import React from 'react';
import ClassSummary from './ClassSummary';
import {WbSunny } from "@mui/icons-material";
import './DashBoard.css'

const DashBoard: React.FC = ({ }) => {
    return (
        <main className="main-content">
        <div className="user-details">
          <div className="user-info">
            <p className="user-name">Dear Jyothi,</p>
            <p className="welcome-message">Welcome to Chimple</p>
          </div>
          <div className="weather-info">
            <div className="weather-icon">
              <WbSunny style={{ marginRight: "5px" }} />
              <span>28 Degrees</span>
            </div>
            <div className="date">
              <span>23rd February</span>
            </div>
          </div>
        </div>
        <main className="sub-content">
          <ClassSummary/>
        </main>
      </main>
    );
};

export default DashBoard;
