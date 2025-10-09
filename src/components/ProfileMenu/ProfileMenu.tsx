import { useEffect, useState } from "react";
import "./ProfileMenu.css";
import HeaderIcon from "../HeaderIcon";
import {
  AVATARS,
  CURRENT_MODE,
  HOMEHEADERLIST,
  LANG,
  LANGUAGE,
  LEADERBOARDHEADERLIST,
  MODES,
  PAGES,
  STAGES,
  TableTypes,
} from "../../common/constants";
import { useHistory } from "react-router";
import { Util } from "../../utility/util";
import { AvatarObj } from "../animation/Avatar";
import ParentalLock from "../parent/ParentalLock";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import i18n from "../../i18n";
import auth from "../../models/auth";

// const ProfileMenu: React.FC = ( ) => {
type ProfileMenuProps = {
  onClose: () => void;
};

const ProfileMenu = ({ onClose }: ProfileMenuProps) => {
  const history = useHistory();
  const [student, setStudent] = useState<TableTypes<"user">>();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState(false);

  const currentHeader = HOMEHEADERLIST.PROFILE;
  let menuItems = [
      { icon: "/assets/icons/Ranking.svg", label: "Leaderboard", onClick: () => onLeaderboard() },
      { icon: "/assets/icons/TreasureChest.svg", label: "Rewards", onClick: () => onReward() },
      { icon: "/assets/icons/Pencil.svg", label: "Edit Profile", onClick: () => onEdit() },
      { icon: "/assets/icons/Account.svg", label: "Parents Section", onClick: () => setShowDialogBox(true) },
      { icon: "/assets/icons/UserSwitch1.svg", label: "Switch Profile", onClick: () => onSwichUser() },
    ];

  const menuItemsForRespectMode = [
    { icon: "/assets/icons/Account.svg", label: "Parents Section", onClick: () => setShowDialogBox(true) },
    { icon: "/assets/icons/UserSwitch1.svg", label: "Switch Profile", onClick: () => onSwichUser() },
  ];

  const visibleMenuItems = Util.isRespectMode
    ? menuItemsForRespectMode
    : menuItems;

  useEffect(() => {
    const student = Util.getCurrentStudent();
    setStudent(student);
  }, []);

  const onEdit = async () => {
    if (Util.isRespectMode) return;
    history.replace(PAGES.EDIT_STUDENT, {
      from: history.location.pathname,
    });
  };

  const onLeaderboard = () => {
    if (Util.isRespectMode) return;
    history.replace(PAGES.LEADERBOARD, {
      from: history.location.pathname,
    });
  };

  const onReward = () => {
    if (Util.isRespectMode) return;
    let avatarObj = AvatarObj.getInstance();
    history.replace(
      PAGES.LEADERBOARD +
        `?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${avatarObj.unlockedRewards[0]?.leaderboardRewardList.toLowerCase()}`
    );
  };

  const onSwichUser = async () => {
    Util.setParentLanguagetoLocal();
    history.replace(PAGES.DISPLAY_STUDENT, {
      from: history.location.pathname,
    });
  };

  const currentMode = localStorage.getItem(CURRENT_MODE);

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

   menuItems = allMenuItems
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

  useEffect(() => {
    const student = Util.getCurrentStudent();
    setStudent(student);
  }, []);

  return (
    <div
      className={`profile-menu ${isClosing ? "slide-out-right" : "slide-in-right"}`}
      onAnimationEnd={() => {
        if (isClosing) {
          onClose();
        }
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
          className={`profile-header-content ${
            (student?.name?.length ?? 0) < 12
              ? "profile-header-center"
              : "profile-header-left"
          }`}
          onClick={() => {
            if (!Util.isRespectMode) onEdit();
          }}
        >
          <img
            src={
              student?.image ||
              `/assets/avatars/${student?.avatar ?? AVATARS[0]}.png`
            }
            alt="Profile"
          />
          <span className="profile-header-name">
            {student?.name ?? "Profile"}
          </span>
        </div>
        <img
          src="/assets/icons/CrossIcon.svg"
          alt="Close"
          className="profile-menu-close-icon"
          onClick={() => {
            setIsClosing(true);
          }}
        />
      </div>

      <div className="profile-menu-list">
        {visibleMenuItems.map((item, index) => (
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
      {showDialogBox ? (
        <ParentalLock
          showDialogBox={showDialogBox}
          handleClose={() => {
            setShowDialogBox(true);
          }}
          onHandleClose={() => {
            setShowDialogBox(false);
          }}
        ></ParentalLock>
      ) : null}
    </div>
  );
};

export default ProfileMenu;
