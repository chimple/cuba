import { t } from "i18next";
import {
  ACTIVE_HEADER_ICON_CONFIGS,
  DEFAULT_HEADER_ICON_CONFIGS,
  HOMEHEADERLIST,
  HeaderIconConfig,
} from "../common/constants";
import IconButton from "./IconButton";
import { IonBadge } from "@ionic/react";
import { useFeatureIsOn } from "@growthbook/growthbook-react";

const HeaderIcon: React.FC<{
  headerConfig: any;
  currentHeader: string;
  pendingAssignmentCount: number | undefined;
  pendingLiveQuizCount: number | undefined;
  onHeaderIconClick: Function;
}> = ({
  headerConfig,
  currentHeader,
  pendingAssignmentCount,
  pendingLiveQuizCount,
  onHeaderIconClick,
}) => {
  const isCurrentHeaderActive = currentHeader === headerConfig.headerList;
  const isHomeworkNotificationIconOn = useFeatureIsOn("homework_notification_icon");

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* <div className="home-header-indicator">
      {isCurrentHeaderActive ? (
        <p>&#9679;</p>
      ) : (
        <p>&nbsp;</p>
      )}
      </div> */}
      {headerConfig.headerList === HOMEHEADERLIST.ASSIGNMENT &&
        pendingAssignmentCount !== undefined &&
        pendingAssignmentCount > 0 && (
    <div id="homework-notification">
      {isHomeworkNotificationIconOn ? (
        // Show number badge
        <IonBadge class="badge-notification">
          {pendingAssignmentCount}
        </IonBadge>
      ) : (
        // Show image icon
        <img
          src="/assets/icons/BellNotifyIcon.svg"
          alt="Homework Notification"
          className="headericon-bell-notification"
        />
      )}
    </div>
  )}
      {headerConfig.headerList == HOMEHEADERLIST.LIVEQUIZ &&
        !!pendingLiveQuizCount &&
        pendingLiveQuizCount > 0 && (
          <div id="homework-notification">
            <IonBadge class="livequiz-badge-notification">
              {pendingLiveQuizCount}
            </IonBadge>
          </div>
        )}
      <IconButton
        name={t(headerConfig.displayName)}
        iconSrc={
          !isCurrentHeaderActive
            ? headerConfig.iconSrc
            : ACTIVE_HEADER_ICON_CONFIGS.get(headerConfig.headerList)?.iconSrc
        }
        onClick={() => {
          if (!isCurrentHeaderActive) {
            onHeaderIconClick(headerConfig.headerList);
          }
        }}
      />
    </div>
  );
};

export default HeaderIcon;
