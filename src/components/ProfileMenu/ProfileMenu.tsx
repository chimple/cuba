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
  const menuItems = [
      { icon: "/assets/icons/Ranking.svg", label: "Leaderboard", onClick: () => onLeaderboard() },
      { icon: "/assets/icons/TreasureChest.svg", label: "Rewards", onClick: () => onReward() },
      { icon: "/assets/icons/Pencil.svg", label: "Edit Profile", onClick: () => onEdit() },
      { icon: "/assets/icons/Account.svg", label: "Parents Section", onClick: () => setShowDialogBox(true) },
      { icon: "/assets/icons/UserSwitch1.svg", label: "Switch Profile", onClick: () => onSwichUser() },
    ];
  useEffect(() => {
    const student = Util.getCurrentStudent();
    setStudent(student);
  }, []);

  const onEdit = async () => {
    history.replace(PAGES.EDIT_STUDENT, {
      from: history.location.pathname,
    });
  };

  const onLeaderboard = () => {
    history.replace(PAGES.LEADERBOARD, {
      from: history.location.pathname,
    });
  };
  const onReward = () => {
    let avatarObj = AvatarObj.getInstance();
    history.replace(
      PAGES.LEADERBOARD +
        `?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${avatarObj.unlockedRewards[0]?.leaderboardRewardList.toLowerCase()}`
    );
  };

  const onSwichUser=async () => {
    Util.setParentLanguagetoLocal();
    history.replace(PAGES.DISPLAY_STUDENT, {
      from: history.location.pathname,
    });
  };

  return (
    <div
      className={`profile-menu ${isClosing ? "slide-out-right" : "slide-in-right"}`}
      onAnimationEnd={() => {
        if (isClosing) {
          onClose();           //call parent only after animation finished
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
        <div className="profile-header-content" onClick={() => onEdit()}>
          <HeaderIcon
            headerConfig={{
              displayName: student?.name ?? "Profile",
              iconSrc:
                student?.image ||
                `/assets/avatars/${student?.avatar ?? AVATARS[0]}.png`,
              headerList: HOMEHEADERLIST.HOME,
            }}
            currentHeader={currentHeader}
            pendingAssignmentCount={0}
            pendingLiveQuizCount={0}
            onHeaderIconClick={() => {}}
          />
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
