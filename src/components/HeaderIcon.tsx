import { t } from "i18next";
import { COURSES, HOMEHEADERLIST } from "../common/constants";
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
    // if(pendingAssignmentCount != undefined && pendingAssignmentCount > 0)
    return (
      <div>
        {currentHeader == headerList ? (
          <p className="home-header-indicator">&#9679;</p>
        ) : (
          <p className="home-header-indicator">&nbsp;</p>
        )}
        {
          headerName == "Home work" && (pendingAssignmentCount != undefined && pendingAssignmentCount > 0) &&
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
