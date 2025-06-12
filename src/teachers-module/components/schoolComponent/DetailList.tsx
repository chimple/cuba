import React from "react";
import { ListItemIcon, ListItemText } from "@mui/material";
import { useHistory } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";
import {
  IconType,
  PAGES,
  SchoolWithRole,
  TableTypes,
} from "../../../common/constants";
import { t } from "i18next";
import "./DetailList.css";
import { Groups3 } from "@mui/icons-material";
import { Util } from "../../../utility/util";

interface DetailListProps {
  type: IconType;
  school?: TableTypes<"school">;
  data: SchoolWithRole[] | TableTypes<"class">[];
}

const DetailList: React.FC<DetailListProps> = ({ type, school, data }) => {
  const history = useHistory();

  // If there is no school data after filtering, show a message
  if (data.length === 0) {
    return <div className="no-school-available">{t("School is not Available")}</div>;
  }

  const handleItemClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace(PAGES.SCHOOL_PROFILE, {
        school: item.school,
        role: item.role,
      });
    } else if (type === IconType.CLASS) {
      history.replace(PAGES.CLASS_PROFILE, { school: school, classDoc: item });
    }
  };

  const handleUserIconClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace(PAGES.SCHOOL_USERS, {
        school: item.school,
        role: item.role,
      });
    } else if (type === IconType.CLASS) {
      history.replace(PAGES.CLASS_USERS, item);
    }
  };

  const handleSubjectIconClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      const schoolId = item.school.id;
      history.replace(`${PAGES.SUBJECTS_PAGE}`, { schoolId: schoolId });
    } else if (type === IconType.CLASS) {
      const classId = item.id;
      history.replace(`${PAGES.SUBJECTS_PAGE}`, { classId: classId });
    }
  };

  return (
    <div className="detail-list-div">
      <div className="detail-list__header">
        <div></div>
        <div className="detail-list__icon-container">
          <div>{t("Users")}</div>
          <div>{t("Subjects")}</div>
        </div>
      </div>

      <div className="main-list">
        <div>
          {data.map((item) => {
            const icon = type === IconType.SCHOOL && <SchoolIcon />;
            const name =
              type === IconType.SCHOOL
                ? (item as SchoolWithRole).school.name
                : (item as TableTypes<"class">).name;
            const id =
              type === IconType.SCHOOL
                ? (item as SchoolWithRole).school.id
                : (item as TableTypes<"class">).id;

            return (
              <div key={id}>
                <div
                  className="detail-container"
                >
                  <div className="detail-section"
                    onClick={() => handleItemClick(item)}
                  >
                    {type === IconType.SCHOOL && (
                      <img src="assets/icons/scholarIcon.svg" alt="" className="list-icon" />
                    )}
                    <span className="detail-school-name">{name}</span>
                  </div>
                  <div className="class-icons">
                      <img src="assets/icons/schoolUserIcon.svg" alt="User_Icon" onClick={() => handleUserIconClick(item)} className="class-user-icon" />
                      
                      <img src="assets/icons/subjectUserIcon.svg" alt="User_Subject"className="class-subjects-icon" onClick={() => handleSubjectIconClick(item)} />
                    </div>
                  </div>
                <hr className="horizontal-line" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DetailList;
