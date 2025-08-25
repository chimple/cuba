import React, { useState, useEffect } from "react";
import "./Header.css";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import MenuIcon from "@mui/icons-material/Menu";
import { useHistory } from "react-router";
import { DrawerOptions, PAGES } from "../../../common/constants";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import SchoolIcon from "@mui/icons-material/School";
import Groups3Icon from "@mui/icons-material/Groups3";
import AccountCircleIcon from "@mui/icons-material/AccountCircle"; // New icon for user profile
import { SvgIconComponent } from "@mui/icons-material";
import { Util } from "../../../utility/util";
import SideMenu from "./SideMenu";
import { t } from "i18next";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

// Updated DrawerOptions to include User Profile
const iconMapping: Record<DrawerOptions, SvgIconComponent> = {
  [DrawerOptions.MANAGE_SCHOOL]: SchoolIcon,
  [DrawerOptions.MANAGE_CLASS]: Groups3Icon,
  [DrawerOptions.USER_PROFILE]: AccountCircleIcon, // Add icon mapping for user profile
};

interface HeaderProps {
  isBackButton: boolean;
  showClass?: boolean;
  showSchool?: boolean;
  className?: string;
  schoolName?: string;
  onButtonClick?: () => void;
  onBackButtonClick?: () => void;
  disableBackButton?: boolean;
  showSideMenu?: boolean;
  customText?: string;
  onSearchChange?: (value: string) => void; // New prop for search input changes
}

const Header: React.FC<HeaderProps> = ({
  isBackButton,
  showClass = false,
  showSchool = false,
  className = "",
  schoolName = "",
  onButtonClick,
  onBackButtonClick,
  disableBackButton = false,
  showSideMenu = false,
  customText = "",
  onSearchChange,
}) => {
  const history = useHistory();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  const navigateToPage = (page: string) => {
    history.replace(page);
    setIsDrawerOpen(false);
  };

  const handleOptionClick = (option: DrawerOptions) => {
    const pageMapping = {
      [DrawerOptions.MANAGE_SCHOOL]: PAGES.MANAGE_SCHOOL,
      [DrawerOptions.MANAGE_CLASS]: PAGES.MANAGE_CLASS,
      [DrawerOptions.USER_PROFILE]: PAGES.USER_PROFILE,
    };
    const selectedPage = pageMapping[option];
    if (selectedPage) {
      navigateToPage(selectedPage);
    }
  };

  const handleBackButtonClick = () => {
    if (disableBackButton) return;
    if (onBackButtonClick) {
      onBackButtonClick();
    } else if (onButtonClick) {
      onButtonClick();
    } else {
      Util.setPathToBackButton(PAGES.HOME_PAGE, history);
    }
  };

  return (
    <header className="header-container">
      <div className="header">
        <div aria-label={String(t("Menu"))} id="header-menu-element">
          {isBackButton ? (
            <KeyboardBackspaceIcon
              aria-label={String(t("Back"))}
              fontSize="large"
              onClick={handleBackButtonClick}
              className={disableBackButton ? "disabled-back-button" : ""}
            />
          ) : showSideMenu ? (
            <SideMenu
              aria-label={t("Menu")}
              handleManageSchoolClick={() => history.replace(PAGES.MANAGE_SCHOOL)}
              handleManageClassClick={() => history.replace(PAGES.MANAGE_CLASS)}
            />
          ) : null}
          {customText ? (
            <div className="header-custom-text">{t(customText)}</div>
          ) : (
            <div className="left-content">
              {showClass && className && (
                <div className="header-class-name">{className}</div>
              )}
              {showSchool && schoolName && (
                <div className="header-school-name">{schoolName}</div>
              )}
            </div>
          )}
        </div>

        <Drawer
          anchor="left"
          open={isDrawerOpen}
          onClose={() => toggleDrawer(false)}
        >
          <Box sx={{ width: 250 }} role="presentation">
            <List>
              {Object.values(DrawerOptions).map((option) => {
                const IconComponent = iconMapping[option];
                return (
                  <ListItem key={option} disablePadding>
                    <ListItemButton onClick={() => handleOptionClick(option)}>
                      <ListItemIcon>
                        <IconComponent />
                      </ListItemIcon>
                      <ListItemText primary={option} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            <Divider />
          </Box>
        </Drawer>

        <div className="search-section">
        {onSearchChange && (
          <div className="header-search-container">
            <SearchOutlinedIcon className="search-icon-inside" />
            <input
              type="text"
              className="header-search-input"
              placeholder={String(t("Search School"))}
              onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
        )}

        <div className="help-icon-container">
          <HelpOutlineOutlinedIcon
          fontSize="large"
          aria-label={String(t("Help"))}
          className="help-icon"
        />
      </div>
    </div>
    </div>
  </header>
  );
};

export default Header;
