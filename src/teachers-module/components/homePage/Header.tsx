import { useHeader } from '../../hooks/useHeader';
import './Header.css';

const Header = (props: Parameters<typeof useHeader>[0]) => {
  const {
    Box,
    Divider,
    Drawer,
    DrawerOptions,
    IoShareSocialSharp,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    PAGES,
    SearchOutlinedIcon,
    SideMenu,
    className,
    customText,
    customTextClassName,
    disableBackButton,
    handleBackButtonClick,
    handleOptionClick,
    history,
    iconMapping,
    isBackButton,
    isDrawerOpen,
    isStreakRewardPulseActive,
    isTeacherOfSelectedClass,
    onInfoClick,
    onSearchChange,
    onSearchIconClick,
    onShareClick,
    schoolName,
    showClass,
    showInfoButton,
    showSchool,
    showSearchIcon,
    showSideMenu,
    showStreakButton,
    streakButtonRef,
    t,
    toggleDrawer,
  } = useHeader(props);

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

          {showStreakButton && isTeacherOfSelectedClass && (
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

          {showInfoButton && onInfoClick && (
            <button
              type="button"
              className="header-info-icon-button"
              onClick={onInfoClick}
              aria-label={String(t('Information'))}
            >
              <img
                src="/assets/icons/infoIcon.svg"
                alt=""
                className="header-info-icon"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
