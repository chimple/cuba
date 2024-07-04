// src/components/BottomNav.js
import React, { useState, useEffect } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { Home, Person, Settings, WbSunny } from "@mui/icons-material";
import { useHistory, useLocation } from "react-router-dom";
import "./HomePage.css";
import Header from "../../components/homePage/Header";
import Library from "../../components/homePage/library/Library";
import DashBoard from "../../components/homePage/dashBoard/DashBoard";

const HomePage = () => {
  const [tabValue, setTabValue] = useState(0);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
  
  }, );

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };
  const renderComponent = () => {
    switch (tabValue) {
      case 0:
        return <DashBoard />;
      case 1:
        return <Library />;
      case 2:
        return <DashBoard />;
      case 3:
        return <Library />;
      default:
        return <Library />;
    }
  };

  return (
    <div className="home-page-container">
      <Header/>
     <> {renderComponent()}</>
     <div> <BottomNavigation
        value={tabValue}
        onChange={handleChange}
        className="bottom-nav"
        showLabels
      >
        <BottomNavigationAction
          label="Home"
          icon={<Home />}
          className="bottom-nav-action"
        />
        <BottomNavigationAction
          label="Profile"
          icon={<Person />}
          className="bottom-nav-action"
        />
        <BottomNavigationAction
          label="Favorite"
          icon={<Settings />}
          className="bottom-nav-action middle-action"
        />
        <BottomNavigationAction
          label="Settings"
          icon={<Settings />}
          className="bottom-nav-action"
        />
        <BottomNavigationAction
          label=""
          icon={""}
          className="bottom-nav-action"
          disabled
        />
      </BottomNavigation></div>
    </div>
  );
};

export default HomePage;
