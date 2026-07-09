import SchoolIcon from '@mui/icons-material/School';
import { t } from 'i18next';
import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  IconType,
  PAGES,
  SchoolWithRole,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { RootState } from '../../../redux/store';
import { schoolUtil } from '../../../utility/schoolUtil';
import './DetailList.css';
import { parsePath } from 'history';

interface DetailListProps {
  type: IconType;
  school?: TableTypes<'school'>;
  data: SchoolWithRole[] | TableTypes<'class'>[];
}

const DetailList: React.FC<DetailListProps> = ({ type, school, data }) => {
  const history = useHistory();
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const isTeacherSchoolMode = schoolUtil.isTeacherSchoolMode();

  if (data.length === 0) {
    return (
      <div className="no-school-available">{t('School is not Available')}</div>
    );
  }

  const handleItemClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace({
        ...parsePath(PAGES.SCHOOL_PROFILE),
        state: {
          school: item.school,
          role: item.role,
        },
      });
    } else {
      history.replace({
        ...parsePath(PAGES.CLASS_PROFILE),
        state: { school, classDoc: item },
      });
    }
  };

  const handleUserIconClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace({
        ...parsePath(PAGES.SCHOOL_USERS),
        state: {
          school: item.school,
          role: item.role,
        },
      });
    } else {
      history.replace({ ...parsePath(PAGES.CLASS_USERS), state: item });
    }
  };

  const handleSubjectIconClick = (item: any) => {
    if (type === IconType.SCHOOL) {
      history.replace({
        ...parsePath(PAGES.SUBJECTS_PAGE),
        state: { schoolId: item.school.id },
      });
    } else {
      history.replace({
        ...parsePath(PAGES.SUBJECTS_PAGE),
        state: { classId: item.id },
      });
    }
  };

  return (
    <div className="main-list">
      {data.map((item) => {
        const name =
          type === IconType.SCHOOL
            ? (item as SchoolWithRole).school.name
            : (item as TableTypes<'class'>).name;

        const id =
          type === IconType.SCHOOL
            ? (item as SchoolWithRole).school.id
            : (item as TableTypes<'class'>).id;

        return (
          <div key={id}>
            <div className="detail-container">
              <div
                className={`detail-section ${
                  isExternalUser
                    ? 'detail-section-disabled'
                    : 'detail-section-clickable'
                }`}
                onClick={
                  isExternalUser ? undefined : () => handleItemClick(item)
                }
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
                {!isExternalUser && !isTeacherSchoolMode && (
                  <img
                    src="assets/icons/subjectUserIcon.svg"
                    alt="User_Subject"
                    onClick={() => handleSubjectIconClick(item)}
                    className="class-subjects-icon"
                  />
                )}
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
