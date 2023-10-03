import { t } from "i18next";
import { COURSES, HEADER_ICON_CONFIGS, HOMEHEADERLIST } from "../common/constants";
import IconButton from "./IconButton";
import { IonBadge } from "@ionic/react";

const HeaderIcon: React.FC<{
  iconSrc: string;
  headerName: string;
  currentHeader: string;
  headerList: HOMEHEADERLIST;
  pendingAssignmentCount: number | undefined;
  onHeaderIconClick: Function;
}> = ({
  iconSrc,
  headerName,
  currentHeader,
  headerList,
  pendingAssignmentCount,
  onHeaderIconClick,
}) => {
  const isCurrentHeaderActive = currentHeader === headerList;
  let isGrayscale = !isCurrentHeaderActive;

  // Check if it's the profile icon and set isGrayscale accordingly
  if (headerList === HOMEHEADERLIST.PROFILE) {
    isGrayscale = false; // Always show in color for the profile icon
  }
  // if ((headerList === HOMEHEADERLIST.SUGGESTIONS && (HOMEHEADERLIST.FAVOURITES || HOMEHEADERLIST.HISTORY))){
  //   isGrayscale = false;
  // }


  return (
    <div>
      {isCurrentHeaderActive ? (
        <p className="home-header-indicator">&#9679;</p>
      ) : (
        <p className="home-header-indicator">&nbsp;</p>
      )}
      {headerName === HEADER_ICON_CONFIGS.get(HOMEHEADERLIST.ASSIGNMENT)?.displayName && (pendingAssignmentCount != undefined && pendingAssignmentCount > 0) && (
        <div id="homework-notification">
          <IonBadge class="badge-notification">{pendingAssignmentCount}</IonBadge>
        </div>
      )}
      <IconButton
        name={t(headerName)}
        iconSrc={iconSrc}
        onClick={() => {
          if (!isCurrentHeaderActive) {
            onHeaderIconClick(headerList);
          }
        }}
        isGrayscale={isGrayscale}
      />
    </div>
  );
};

export default HeaderIcon;
