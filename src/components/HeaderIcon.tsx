import { t } from "i18next";
import {
  ACTIVE_HEADER_ICON_CONFIGS,
  DEFAULT_HEADER_ICON_CONFIGS,
  HOMEHEADERLIST,
  HeaderIconConfig,
} from "../common/constants";
import IconButton from "./IconButton";
import { IonBadge } from "@ionic/react";

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

  return (
    <div
      // role="button"
      tabIndex={0}
      aria-label={`${t(headerConfig.displayName)}`}
      aria-hidden="false"
      onClick={() => {
        if (!isCurrentHeaderActive) {
          onHeaderIconClick(headerConfig.headerList);
        }
      }}
    >
      <div aria-hidden="true">
        {isCurrentHeaderActive ? (
          <p className="home-header-indicator">&#9679;</p>
        ) : (
          <p className="home-header-indicator">&nbsp;</p>
        )}
      </div>

      {headerConfig.headerList === HOMEHEADERLIST.ASSIGNMENT &&
        pendingAssignmentCount !== undefined &&
        pendingAssignmentCount > 0 && (
          <div aria-hidden="true" id="homework-notification">
            <IonBadge class="badge-notification">
              {pendingAssignmentCount}
            </IonBadge>
          </div>
        )}
      {headerConfig.headerList == HOMEHEADERLIST.LIVEQUIZ &&
        !!pendingLiveQuizCount &&
        pendingLiveQuizCount > 0 && (
          <div aria-hidden="true" id="homework-notification">
            <IonBadge class="livequiz-badge-notification">
              {pendingLiveQuizCount}
            </IonBadge>
          </div>
        )}
      <div aria-hidden="true">
        <IconButton
          name={t(headerConfig.displayName)}
          iconSrc={
            !isCurrentHeaderActive
              ? headerConfig.iconSrc
              : ACTIVE_HEADER_ICON_CONFIGS.get(headerConfig.headerList)?.iconSrc
          }
        />
      </div>
    </div>
  );
};

export default HeaderIcon;
