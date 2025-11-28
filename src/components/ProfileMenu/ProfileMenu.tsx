import { useEffect, useState } from "react";
import "./ProfileMenu.css";
import {
  AVATARS,
  CURRENT_MODE,
  HOMEHEADERLIST,
  HOMEWORK_PATHWAY,
  LEADERBOARDHEADERLIST,
  MODES,
  PAGES,
  TableTypes,
} from "../../common/constants";
import { useHistory } from "react-router";
import { Util } from "../../utility/util";
import { AvatarObj } from "../animation/Avatar";
import ParentalLock from "../parent/ParentalLock";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";

type ProfileMenuProps = {
  onClose: () => void;
};

const ProfileMenu = ({ onClose }: ProfileMenuProps) => {
  const history = useHistory();
  const [student, setStudent] = useState<TableTypes<"user">>();
  const [className, setClassName] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState(false);

  const currentMode = localStorage.getItem(CURRENT_MODE);

  useEffect(() => {
    loadProfileData();
  }, []);
  const loadProfileData = async () => {
    setStudent(Util.getCurrentStudent());
    const { className, schoolName } = await Util.fetchCurrentClassAndSchool();
    setClassName(className);
    setSchoolName(schoolName);
  };

  const onEdit = async () => {
    history.replace(PAGES.EDIT_STUDENT, { from: history.location.pathname });
  };

  const onLeaderboard = () => {
    history.replace(PAGES.LEADERBOARD, { from: history.location.pathname });
  };

  const onReward = () => {
    let avatarObj = AvatarObj.getInstance();
    history.replace(
      PAGES.LEADERBOARD +
        `?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${avatarObj.unlockedRewards[0]?.leaderboardRewardList.toLowerCase()}`
    );
  };

  const onSwichUser = async () => {
    Util.setParentLanguagetoLocal();
    Util.setCurrentStudent(null);
    sessionStorage.removeItem(HOMEWORK_PATHWAY);
    history.replace(PAGES.DISPLAY_STUDENT, { from: history.location.pathname });
  };

  const allMenuItems = [
    {
      icon: "/assets/icons/Ranking.svg",
      label: "Leaderboard",
      onClick: onLeaderboard,
    },
    {
      icon: "/assets/icons/TreasureChest.svg",
      label: "Rewards",
      onClick: onReward,
    },
    {
      icon: "/assets/icons/Pencil.svg",
      label: "Edit Profile",
      onClick: onEdit,
    },
    {
      icon: "/assets/icons/Account.svg",
      label: "Parents Section",
      onClick: () => setShowDialogBox(true),
    },
    {
      icon: "/assets/icons/UserSwitch1.svg",
      label: "Switch Profile",
      onClick: onSwichUser,
    },
  ];

  const HIDE_IN_SCHOOL = new Set(["Parents Section", "Edit Profile"]);

  const menuItems = allMenuItems
    .filter(
      (item) =>
        !(currentMode === MODES.SCHOOL && HIDE_IN_SCHOOL.has(item.label))
    )
    .map((item) =>
      currentMode === MODES.SCHOOL && item.label === "Switch Profile"
        ? {
            ...item,
            onClick: () =>
              history.replace(PAGES.SELECT_MODE, {
                from: history.location.pathname,
              }),
          }
        : item
    );
  const hasDetails = !!(className || schoolName);

  return (
    <div
      className={`profile-menu ${
        isClosing ? "slide-out-right" : "slide-in-right"
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
          borderRadius: "20px 0 0 0",
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
            <span className="profile-header-name text-truncate"
            style={{ marginBottom: hasDetails ? "8px" : "60px" }} 
            >
              {student?.name ?? "Profile"}
            </span>

            {className && (
              <div className="profile-sub-info">
                <img
                  src="/assets/icons/classIcon.svg"
                  alt="class"
                  className="info-icon"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span className="sub-text text-truncate">{className}</span>
              </div>
            )}

            {schoolName && (
              <div className="profile-sub-info">
                <img
                  src="/assets/icons/scholarIcon.svg"
                  alt="school"
                  className="info-icon"
                  onError={(e) => (e.currentTarget.style.display = "none")}
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
              <span className="profile-menu-label">{t(item.label)}</span>
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
        />
      )}
    </div>
  );
};

export default ProfileMenu;
