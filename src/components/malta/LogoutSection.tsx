import React from "react";
import { useHistory } from "react-router-dom";
import { PAGES } from "../../common/constants";

const LogoutSection = () => {
  const history = useHistory();

  const handleLogout = () => {
    history.replace(PAGES.HOME);
  };

  const handleDeleteAccount = () => {
    history.replace(PAGES.HOME);
  };

  return (
    <div className="logout-section">
      <button className="logout-button" onClick={handleLogout}>
        <span>Logout</span>
      </button>
      <button className="delete-account-button" onClick={handleDeleteAccount}>
        <span>Delete Account</span>
      </button>
    </div>
  );
};

export default LogoutSection;
