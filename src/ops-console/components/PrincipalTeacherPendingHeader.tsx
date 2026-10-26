import React from 'react';
import { IconButton } from '@mui/material';
import { BsFillBellFill } from 'react-icons/bs';
import { t } from 'i18next';
import { PAGES } from '../../common/constants';

const PrincipalTeacherPendingHeader = ({
  history,
  id,
  isEditing,
  resetEditState,
}: {
  history: any;
  id: string;
  isEditing: boolean;
  resetEditState: () => void;
}) => (
  <>
    <div className="principal-teacher-pending-page-header">
      <div className="principal-teacher-pending-page-title">
        {t('Request ID - ')} {id}
      </div>
      <div className="principal-teacher-pending-page-icon">
        <IconButton sx={{ color: 'black' }}>
          <BsFillBellFill />
        </IconButton>
      </div>
    </div>
    <div className="principal-teacher-pending-breadcrumbs">
      <span
        onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
        className="principal-teacher-pending-link"
      >
        {t('Pending')}
      </span>

      <span> &gt; </span>

      <span
        onClick={() => {
          if (isEditing) {
            resetEditState();
          }
        }}
        className={
          isEditing
            ? 'principal-teacher-pending-link'
            : 'principal-teacher-pending-active'
        }
      >
        {t('Request ID - ')} {id}
      </span>

      {isEditing && (
        <>
          <span> &gt; </span>
          <span className="principal-teacher-pending-active">{t('Edit')}</span>
        </>
      )}
    </div>
  </>
);

export default PrincipalTeacherPendingHeader;
