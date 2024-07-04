import React from 'react';
import './Header.css'
const Header: React.FC = () => {
    return (
        <header className="header">
        <div className="menu-icon"></div>
        <div className="chimple-logo"></div>
        <div className="search-icon">
          <i className="fas fa-search"></i>
        </div>
      </header>
    );
};

export default Header;
