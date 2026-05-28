import React, { useState, useEffect, useCallback } from 'react';
import './Header.css';
import { useHistory } from 'react-router';
import { DrawerOptions, PAGES } from '../../../common/constants';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SchoolIcon from '@mui/icons-material/School';
import Groups3Icon from '@mui/icons-material/Groups3';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // New icon for user profile
import { SvgIconComponent } from '@mui/icons-material';
import { Util } from '../../../utility/util';
import SideMenu from './SideMenu';
import { t } from 'i18next';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { IoShareSocialSharp } from 'react-icons/io5';
import { registerBackButtonHandler } from '../../../common/backButtonRegistry';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import {
  registerStreakRectResolver,
  registerStreakRewardPulseHandler,
} from '../../../common/streakRewardBridge';

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
  customTextClassName?: string;
  onSearchChange?: (value: string) => void; // New prop for search input changes
  showSearchIcon?: boolean;
  onSearchIconClick?: () => void;
  onShareClick?: () => void;
  showStreakButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isBackButton,
  showClass = false,
  showSchool = false,
  className = '',
  schoolName = '',
  onButtonClick,
  onBackButtonClick,
  disableBackButton = false,
  showSideMenu = false,
  customText = '',
  customTextClassName = '',
  onSearchChange,
  showSearchIcon = false,
  onSearchIconClick,
  onShareClick,
  showStreakButton = true,
}) => {
  const history = useHistory();
  const roleMap = useAppSelector(
    (state: RootState) =>
      state.growthbook.attributes?.roleMap as
        | Record<string, string>
        | undefined,
  );
  const currentSchoolId = Util.getCurrentSchool()?.id;
  const currentSchoolRole = currentSchoolId
    ? roleMap?.[`${currentSchoolId}_role`]
    : undefined;
  const isTeacher =
    (currentSchoolRole ?? '').toLowerCase() === RoleType.TEACHER;
  const FLAME_PULSE_DURATION_MS = 1000;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStreakRewardPulseActive, setIsStreakRewardPulseActive] =
    useState(false);
  const streakButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const streakPulseTimeoutRef = React.useRef<number | null>(null);

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

  const handleBackButtonClick = useCallback(() => {
    if (disableBackButton) {
      return;
    }

    // If drawer is open, close it first
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return;
    }

    if (onBackButtonClick) {
      onBackButtonClick();
    } else if (onButtonClick) {
      onButtonClick();
    } else {
      Util.setPathToBackButton(PAGES.HOME_PAGE, history);
    }
  }, [
    disableBackButton,
    onBackButtonClick,
    onButtonClick,
    history,
    isDrawerOpen,
  ]);

  const handleBackRef = React.useRef<() => void>(() => {});

  useEffect(() => {
    handleBackRef.current = handleBackButtonClick;
  }, [handleBackButtonClick]);

  useEffect(() => {
    if (!isBackButton || disableBackButton) {
      return;
    }

    const unregister = registerBackButtonHandler(() => {
      return handleBackRef.current();
    });
    return unregister;
  }, [isBackButton, disableBackButton]);

  useEffect(() => {
    registerStreakRectResolver(() => {
      return streakButtonRef.current?.getBoundingClientRect() ?? null;
    });

    return () => {
      registerStreakRectResolver(null);
    };
  }, []);

  useEffect(() => {
    const triggerStreakPulse = () => {
      setIsStreakRewardPulseActive(false);
      window.requestAnimationFrame(() => {
        setIsStreakRewardPulseActive(true);
      });

      if (streakPulseTimeoutRef.current) {
        window.clearTimeout(streakPulseTimeoutRef.current);
      }

      streakPulseTimeoutRef.current = window.setTimeout(() => {
        setIsStreakRewardPulseActive(false);
      }, FLAME_PULSE_DURATION_MS);
    };

    registerStreakRewardPulseHandler(triggerStreakPulse);

    return () => {
      registerStreakRewardPulseHandler(null);
      if (streakPulseTimeoutRef.current) {
        window.clearTimeout(streakPulseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="header-container">
      <div className="header">
        <div aria-label={String(t('Menu'))} id="header-menu-element">
          {isBackButton ? (
            <img
              src="assets/icons/HeaderBackBtn.svg"
              alt={String(t('Back'))}
              onClick={handleBackButtonClick}
              className={disableBackButton ? 'disabled-back-button' : ''}
              id="header-back-button"
            />
          ) : showSideMenu ? (
            <SideMenu
              aria-label={t('Menu')}
              handleManageSchoolClick={() =>
                history.replace(PAGES.MANAGE_SCHOOL)
              }
              handleManageClassClick={() => history.replace(PAGES.MANAGE_CLASS)}
            />
          ) : null}
          {customText ? (
            <div className={customTextClassName || 'header-custom-text'}>
              {t(customText)}
            </div>
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

        <div className="header-actions-container">
          <div className="search-section">
            {onShareClick && (
              <button
                onClick={onShareClick}
                id="header-share-icon-button"
                className="header-share-icon-button"
                type="button"
                aria-label={String(t('Share'))}
              >
                <IoShareSocialSharp size={28} color="white" />
              </button>
            )}
            {showSearchIcon && (
              <button
                type="button"
                className="header-search-icon-button"
                aria-label={String(t('Search'))}
                onClick={onSearchIconClick}
              >
                <SearchOutlinedIcon className="header-search-action-icon" />
              </button>
            )}
            {onSearchChange && (
              <div className="header-search-container">
                <SearchOutlinedIcon
                  id="header-search-icon-inside"
                  className="header-search-icon-inside"
                />
                <input
                  type="text"
                  className="header-search-input"
                  placeholder={String(t('Search School'))}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            )}
          </div>

          {showStreakButton && isTeacher && (
            <button
              ref={streakButtonRef}
              type="button"
              id="header-streak-button"
              className={`streak-container ${
                isStreakRewardPulseActive
                  ? 'streak-container--reward-pulse'
                  : ''
              }`.trim()}
              onClick={() => history.push(PAGES.STREAK_PAGE)}
              aria-label={String(t('My Streak'))}
            >
              <img
                id="header-streak-icon"
                src="assets/icons/streakIcon.png"
                className={`streak-icon ${
                  isStreakRewardPulseActive ? 'streak-icon--reward-pulse' : ''
                }`.trim()}
                alt={String(t('Streak'))}
              />
            </button>
          )}

          <div className="help-icon-container">
            <img
              src="assets/icons/helpIcon.svg"
              alt={String(t('Menu'))}
              className="help-icon"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
