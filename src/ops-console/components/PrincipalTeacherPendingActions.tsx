import React from 'react';
import { Button } from '@mui/material';
import { t } from 'i18next';
import { RequestTypes } from '../../common/constants';

const buttonStyle = {
  minWidth: 110,
  fontWeight: 700,
  fontSize: '1.1rem',
  textTransform: 'none',
};

const PrincipalTeacherPendingActions = ({
  editClicked,
  editableRequestType,
  handleApproveClick,
  handleRejectClick,
  isEditing,
  requestType,
  resetEditState,
  selectedGradeId,
}: {
  editClicked: () => void;
  editableRequestType: RequestTypes | '';
  handleApproveClick: () => void;
  handleRejectClick: () => void;
  isEditing: boolean;
  requestType?: RequestTypes | string;
  resetEditState: () => void;
  selectedGradeId: string;
}) => (
  <div className="principal-teacher-pending-action-buttons-row">
    {isEditing ? (
      <Button
        variant="outlined"
        color="error"
        size="large"
        style={buttonStyle}
        onClick={resetEditState}
      >
        {t('Cancel')}
      </Button>
    ) : (
      <>
        <Button
          variant="contained"
          color="primary"
          size="large"
          style={buttonStyle}
          onClick={editClicked}
        >
          {t('Edit')}
        </Button>

        <Button
          variant="contained"
          color="error"
          size="large"
          style={buttonStyle}
          onClick={handleRejectClick}
        >
          {t('Reject')}
        </Button>
      </>
    )}

    <Button
      variant="contained"
      color="success"
      size="large"
      disabled={
        isEditing &&
        ((editableRequestType || requestType) === RequestTypes.TEACHER ||
          (editableRequestType || requestType) === RequestTypes.STUDENT) &&
        !selectedGradeId
      }
      style={buttonStyle}
      onClick={handleApproveClick}
    >
      {t('Approve')}
    </Button>
  </div>
);

export default PrincipalTeacherPendingActions;
