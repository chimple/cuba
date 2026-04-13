import { useEffect, useState } from 'react';
import './ProfileMenu.css';
import {
  AVATARS,
  CURRENT_MODE,
  CURRENT_PATHWAY_MODE,
  ENABLE_STICKER_BOOK,
  EVENTS,
  HOMEWORK_PATHWAY,
  LEADERBOARDHEADERLIST,
  MODES,
  PAGES,
  STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
  TableTypes,
  CURRENT_STUDENT_CHANGED_EVENT,
} from '../../common/constants';
import { useHistory } from 'react-router';
import { Util } from '../../utility/util';
import { AvatarObj } from '../animation/Avatar';
import ParentalLock from '../parent/ParentalLock';
import { t } from 'i18next';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  updateLocalAttributes,
  useGbContext,
  setCachedGrowthBookFeatureValue,
} from '../../growthbook/Growthbook';
import { schoolUtil } from '../../utility/schoolUtil';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import logger from '../../utility/logger';

type ProfileMenuProps = {
  onClose: () => void;
};

const ProfileMenu = ({ onClose }: ProfileMenuProps) => {
  const history = useHistory();
  const [student, setStudent] = useState<TableTypes<'user'>>();
  const [className, setClassName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasUnseenStickers, setHasUnseenStickers] = useState<boolean>(false);
  const { setGbUpdated } = useGbContext();
  const api = ServiceConfig.getI().apiHandler;
  const liveIsStickerBookEnabled = useFeatureIsOn(ENABLE_STICKER_BOOK);
  const liveIsStickerBookNotificationDotEnabled = useFeatureIsOn(
    STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
  );
  const growthbookFeatureValues = useAppSelector(
    (state: RootState) => state.growthbook.featureValues,
  );
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isStickerBookEnabled = isOffline
    ? ((growthbookFeatureValues?.[ENABLE_STICKER_BOOK] as boolean) ??
      liveIsStickerBookEnabled)
    : liveIsStickerBookEnabled;
  const isStickerBookNotificationDotEnabled = isOffline
    ? ((growthbookFeatureValues?.[
        STICKER_BOOK_NOTIFICATION_DOT_ENABLED
      ] as boolean) ?? liveIsStickerBookNotificationDotEnabled)
    : liveIsStickerBookNotificationDotEnabled;

  const currentMode = localStorage.getItem(CURRENT_MODE);
  const shouldShowStickerBookNotification =
    hasUnseenStickers && isStickerBookNotificationDotEnabled;

  useEffect(() => {
    setCachedGrowthBookFeatureValue(
      ENABLE_STICKER_BOOK,
      liveIsStickerBookEnabled,
    );
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
      liveIsStickerBookNotificationDotEnabled,
    );
  }, [liveIsStickerBookEnabled, liveIsStickerBookNotificationDotEnabled]);

  useEffect(() => {
    loadProfileData();

    const handleStudentChange = (e: Event) => {
      const customEvent = e as CustomEvent<TableTypes<'user'> | null>;
      if (customEvent.detail) {
        setStudent(customEvent.detail);
      }
    };

    window.addEventListener(CURRENT_STUDENT_CHANGED_EVENT, handleStudentChange);
    return () => {
      window.removeEventListener(
        CURRENT_STUDENT_CHANGED_EVENT,
        handleStudentChange,
      );
    };
  }, []);
  const loadProfileData = async () => {
    try {
      const currentStudent = Util.getCurrentStudent();
      setStudent(currentStudent);
      const { className, schoolName } = await Util.fetchCurrentClassAndSchool();
      setClassName(className);
      setSchoolName(schoolName);

      if (currentStudent?.id) {
        const userStickers = await api.getUserSticker(currentStudent.id);
        const hasUnseen = userStickers.some((s) => !s.is_seen);
        setHasUnseenStickers(hasUnseen);
      }
    } catch (error) {
      logger.error('Failed to load profile data:', error);
    }
  };
  const onEdit = () => {
    history.replace(PAGES.EDIT_STUDENT, { from: history.location.pathname });
  };

  const onLeaderboard = () => {
    history.push(PAGES.LEADERBOARD, { from: history.location.pathname });
  };

  const onStickerBook = async () => {
    Util.logEvent(EVENTS.STICKER_BOOK_MENU_TAP, {
      user_id: student?.id,
      source: 'profile_menu',
    });
    if (hasUnseenStickers) {
      setHasUnseenStickers(false);
    }
    history.push(PAGES.STICKER_BOOK, { from: history.location.pathname });
  };

  const onReward = () => {
    let avatarObj = AvatarObj.getInstance();
    history.push(
      PAGES.LEADERBOARD +
        `?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${avatarObj.unlockedRewards[0]?.leaderboardRewardList.toLowerCase()}`,
    );
  };

  const onSwichUser = async () => {
    Util.setParentLanguagetoLocal();
    Util.setCurrentStudent(null);
    schoolUtil.setCurrentClass(undefined);
    localStorage.removeItem(CURRENT_PATHWAY_MODE);
    localStorage.removeItem(HOMEWORK_PATHWAY);
    // Also tell GrowthBook attributes are now cleared (or set to parent-level)
    updateLocalAttributes({
      student_id: null,
    });

    setGbUpdated(true); // cause consumers to re-evaluate
    history.replace(PAGES.DISPLAY_STUDENT, { from: history.location.pathname });
  };

  const allMenuItems = [
    {
      icon: '/assets/icons/StickerBook.svg',
      label: 'Sticker Book',
      onClick: onStickerBook,
    },
    {
      icon: '/assets/icons/Ranking.svg',
      label: 'Leaderboard',
      onClick: onLeaderboard,
    },
    {
      icon: '/assets/icons/TreasureChest.svg',
      label: 'Rewards',
      onClick: onReward,
    },
    {
      icon: '/assets/icons/Pencil.svg',
      label: 'Edit Profile',
      onClick: onEdit,
    },
    {
      icon: '/assets/icons/Account.svg',
      label: 'Parents Section',
      onClick: () => setShowDialogBox(true),
    },
    {
      icon: '/assets/icons/UserSwitch1.svg',
      label: 'Switch Profile',
      onClick: onSwichUser,
    },
  ];

  const HIDE_IN_SCHOOL = new Set(['Parents Section', 'Edit Profile']);

  const menuItems = allMenuItems
    .filter((item) =>
      item.label === 'Sticker Book' ? isStickerBookEnabled : true,
    )
    .filter(
      (item) =>
        !(currentMode === MODES.SCHOOL && HIDE_IN_SCHOOL.has(item.label)),
    )
    .map((item) =>
      currentMode === MODES.SCHOOL && item.label === 'Switch Profile'
        ? {
            ...item,
            onClick: () =>
              history.replace(PAGES.SELECT_MODE, {
                from: history.location.pathname,
              }),
          }
        : item,
    );
  const hasDetails = !!(className || schoolName);

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
            if (currentMode !== MODES.SCHOOL) onEdit();
          }}
        >
          {/* Profile Image with fixed gap */}
          <div className="profile-image-container">
            <img
              src={
                student?.image ||
                `/assets/avatars/${student?.avatar ?? AVATARS[0]}.png`
              }
              alt="Profile"
              className="profile-avatar-img"
            />
          </div>

          {/* Details Section */}
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
          handleClose={() => setShowDialogBox(true)}
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
