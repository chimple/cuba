import { t } from "i18next";
import { COURSES, HEADER_ICON_CONFIGS, HOMEHEADERLIST } from "../common/constants";
import IconButton from "./IconButton";
import "./IconButton.css";
import React from "react";
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

    return (
      <div>
        {currentHeader == headerList ? (
          <p className="home-header-indicator">&#9679;</p>
        ) : (
          <p className="home-header-indicator">&nbsp;</p>
        )}
        {
          headerName == HEADER_ICON_CONFIGS.get(HOMEHEADERLIST.ASSIGNMENT)?.displayName && (pendingAssignmentCount != undefined && pendingAssignmentCount > 0) &&
          <div id="homework-notification">
            <IonBadge class="badge-notification">
              {
                pendingAssignmentCount
              }
            </IonBadge>
          </div>
        }
        <IconButton
          name={t(headerName)}
          iconSrc={iconSrc}
          onClick={() => {
            if (currentHeader != headerList) {
              onHeaderIconClick(headerList);
            }
          }}
        ></IconButton>
      </div>
    );
  };
export default HeaderIcon;
