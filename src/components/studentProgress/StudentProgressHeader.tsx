import { useTranslation } from "react-i18next";
import { PAGES } from "../../common/constants";
import "./StudentProgressHeader.css";
import React from "react";
import { useHistory } from "react-router-dom";
import BackButton from "../common/BackButton";
import RectangularIconButton from "../parent/RectangularIconButton";
import Course from "../../models/course";

interface HeaderIconConfig {
  displayName: string;
  iconSrc: string;
  header: any;
  course: Course;
}

const StudentProgressHeader: React.FC<{
  currentHeader: string;
  headerIconList: HeaderIconConfig[];
  onHeaderIconClick: Function;
}> = ({ currentHeader, headerIconList, onHeaderIconClick }) => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <div id="student-progress-header-icons">
      <BackButton
        //iconSize={"8vh"}
        onClicked={() => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("continue")) {
            history.replace(PAGES.PARENT + "?continue=true");
          } else {
            history.replace(PAGES.PARENT);
          }
        }}
      ></BackButton>
      <div id="student-progress-header-middle-icons">
        {headerIconList.map((element) => {
          //   console.log("Dyanamic Parent Header List ", element);
          return (
            <RectangularIconButton
              buttonWidth={18}
              buttonHeight={8}
              iconSrc={element.iconSrc}
              name={element.displayName}
              isButtonEnable={currentHeader === element.header}
              onHeaderIconClick={() => {
                if (currentHeader != element.header) {
                  onHeaderIconClick(element.header);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StudentProgressHeader;
