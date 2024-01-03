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
  onHeaderIconClick: Function;
}> = ({
  headerConfig,
  currentHeader,
  pendingAssignmentCount,
  onHeaderIconClick,
}) => {
  const isCurrentHeaderActive = currentHeader === headerConfig.headerList;

  return (
    <div>
      {isCurrentHeaderActive ? (
        <p className="home-header-indicator">&#9679;</p>
      ) : (
        <p className="home-header-indicator">&nbsp;</p>
      )}
      {headerConfig.headerList === HOMEHEADERLIST.ASSIGNMENT &&
        pendingAssignmentCount !== undefined &&
        pendingAssignmentCount > 0 && (
          <div id="homework-notification">
            <IonBadge class="badge-notification">
              {pendingAssignmentCount}
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
