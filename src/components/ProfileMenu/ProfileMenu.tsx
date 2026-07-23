import { useProfileMenu } from '../../hooks/useProfileMenu';
import './ProfileMenu.css';

const ProfileMenu = (props: Parameters<typeof useProfileMenu>[0]) => {
  const {
    AVATARS,
    HOMEWORK_PATHWAY,
    ParentalLock,
    className,
    hasDetails,
    isClosing,
    isSchoolKidsMode,
    localStorage,
    menuItems,
    onClose,
    onEdit,
    schoolName,
    setIsClosing,
    setShowDialogBox,
    shouldShowStickerBookNotification,
    showDialogBox,
    student,
    t,
    window,
  } = useProfileMenu(props);

  return (
    <div
      className={`profile-menu ${
        isClosing ? 'slide-out-right' : 'slide-in-right'
      }`}
      onAnimationEnd={() => {
        if (isClosing) onClose();
      }}
    >
      <div
        className="profile-menu-header"
        style={{
          background:
            'url("/pathwayAssets/pathwayBackground.svg") no-repeat center/cover',
          borderRadius: '20px 0 0 0',
        }}
      >
        <div
          className="profile-header-content"
          onClick={() => {
            if (!isSchoolKidsMode) onEdit();
          }}
        >
          <div className="profile-image-container">
            <img
              src={
                student?.image ||
                `/assets/avatars/${student?.avatar ?? AVATARS[0]}.png`
              }
              alt="Profile"
              className="profile-avatar-img"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = `/assets/avatars/${student?.avatar ?? AVATARS[0]}.png`;
                if (
                  target.src !== window.location.origin + fallback &&
                  target.src !== fallback
                ) {
                  target.src = fallback;
                }
              }}
            />
          </div>

          <div className="profile-details">
            <span
              className="profile-header-name text-truncate"
              style={{ marginBottom: hasDetails ? '8px' : '60px' }}
            >
              {student?.name ?? 'Profile'}
            </span>

            {className && (
              <div className="profile-sub-info">
                <img
                  src="/assets/icons/classIcon.svg"
                  alt="class"
                  className="info-icon"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <span className="sub-text text-truncate">{className}</span>
              </div>
            )}

            {schoolName && (
              <div className="profile-sub-info">
                <img
                  src="/assets/icons/schoolIcon.svg"
                  alt="school"
                  className="info-icon"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <span className="sub-text text-truncate">{schoolName}</span>
              </div>
            )}
          </div>
        </div>

        <img
          src="/assets/icons/CrossIcon.svg"
          alt="Close"
          className="profile-menu-close-icon"
          onClick={() => setIsClosing(true)}
        />
      </div>

      <div className="profile-menu-list">
        {menuItems.map((item, index) => (
          <div key={index} className="profile-menu-item" onClick={item.onClick}>
            <div className="profile-menu-item-row">
              <img
                src={item.icon}
                alt={item.label}
                className="profile-menu-icon"
              />
              <div className="profile-menu-label-with-dot">
                <span className="profile-menu-label">{t(item.label)}</span>
                {item.label === 'Sticker Book' &&
                  shouldShowStickerBookNotification && (
                    <span
                      className="profile-menu-notification-dot"
                      data-testid="sticker-book-notification-dot"
                    />
                  )}
              </div>
            </div>
            <hr className="profile-menu-horizontal-line" />
          </div>
        ))}
      </div>

      {showDialogBox && (
        <ParentalLock
          showDialogBox={showDialogBox}
          onHandleClose={() => setShowDialogBox(false)}
          onUnlock={() => {
            localStorage.removeItem(HOMEWORK_PATHWAY);
          }}
        />
      )}
    </div>
  );
};

export default ProfileMenu;
