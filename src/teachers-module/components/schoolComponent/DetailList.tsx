import React from "react";
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

interface DetailListProps {
  type: IconType;
  school?: TableTypes<"school">;
  data: SchoolWithRole[] | TableTypes<"class">[];
}

const DetailList: React.FC<DetailListProps> = ({ type, school, data }) => {
  const history = useHistory();

  if (data.length === 0) {
    return (
      <div className="no-school-available">{t("School is not Available")}</div>
    );
  }

  const handleItemClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace(PAGES.SCHOOL_PROFILE, {
        school: item.school,
        role: item.role,
      });
    } else {
      history.replace(PAGES.CLASS_PROFILE, { school, classDoc: item });
    }
  };

  const handleUserIconClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace(PAGES.SCHOOL_USERS, {
        school: item.school,
        role: item.role,
      });
    } else {
      history.replace(PAGES.CLASS_USERS, item);
    }
  };

  const handleSubjectIconClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace(PAGES.SUBJECTS_PAGE, { schoolId: item.school.id });
    } else {
      history.replace(PAGES.SUBJECTS_PAGE, { classId: item.id });
    }
  };

  return (
    <div className="main-list">
      {data.map((item) => {
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
            <div className="detail-container">
              <div
                className="detail-section"
                onClick={() => handleItemClick(item)}
              >
                {type === IconType.SCHOOL && (
                  <SchoolIcon className="list-icon" />
                )}
                <span className="detail-school-name">{name}</span>
              </div>

              <div className="class-icons">
                <img
                  src="assets/icons/schoolUserIcon.svg"
                  alt="User_Icon"
                  onClick={() => handleUserIconClick(item)}
                  className="class-user-icon"
                />
                <img
                  src="assets/icons/subjectUserIcon.svg"
                  alt="User_Subject"
                  onClick={() => handleSubjectIconClick(item)}
                  className="class-subjects-icon"
                />
              </div>
            </div>
            <hr className="detail-horizontal-line" />
          </div>
        );
      })}
    </div>
  );
};

export default DetailList;