// src/components/schoolComponent/DetailListHeader.tsx
import React from 'react';
import { t } from 'i18next';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { RootState } from '../../../redux/store';
import { schoolUtil } from '../../../utility/schoolUtil';
import './DetailList.css';

const DetailListHeader: React.FC = () => {
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const isTeacherSchoolMode = schoolUtil.isTeacherSchoolMode();
  const shouldShowSubjects = !isExternalUser && !isTeacherSchoolMode;

  return (
    <div className="detail-list__header">
      <div />
      <div className="detail-list__icon-container">
        <div
          className={`detail-list-header-row ${shouldShowSubjects ? '' : 'no-subjects'}`}
        >
          <span className="detail-list-header-empty"></span>
          <span className="detail-list-header-users">{t('Users')}</span>
          {shouldShowSubjects && (
            <span className="detail-list-header-subjects">{t('Subjects')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailListHeader;
