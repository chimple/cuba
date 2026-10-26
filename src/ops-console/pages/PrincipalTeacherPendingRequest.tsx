import { Typography, Paper, Grid, Divider } from '@mui/material';
import { RequestTypes } from '../../common/constants';
import './PrincipalTeacherPendingRequest.css';
import OpsCustomDropdown from '../components/OpsCustomDropdown';
import { OpsUtil } from '../OpsUtility/OpsUtil';
import { t } from 'i18next';
import RejectRequestPopup from '../components/SchoolRequestComponents/RejectRequestPopup';
import PrincipalTeacherPendingHeader from '../components/PrincipalTeacherPendingHeader';
import PrincipalTeacherPendingActions from '../components/PrincipalTeacherPendingActions';
import { usePrincipalTeacherPendingRequest } from '../hooks/usePrincipalTeacherPendingRequest';

const PrincipalTeacherPendingRequest = () => {
  const {
    currentUserId,
    editClicked,
    editableRequestType,
    gradeOptions,
    handleApproveClick,
    handleRejectClick,
    history,
    id,
    isEditing,
    loading,
    requestData,
    resetEditState,
    roleOptions,
    selectedGradeId,
    setEditableRequestType,
    setSelectedGradeId,
    setShowRejectPopup,
    showRejectPopup,
  } = usePrincipalTeacherPendingRequest();
  if (loading || !requestData)
    return (
      <div className="centered">
        <Typography>Loading...</Typography>
      </div>
    );

  const { school = {}, requestedBy = {}, request_type } = requestData;

  const fullRequestClassName =
    requestData.classInfo?.name || `${requestData.classInfo?.standard || ''}`;

  const { grade: parsedGrade, section: parsedSection } =
    OpsUtil.parseClassName(fullRequestClassName);
  return (
    <div className="principal-teacher-pending-details-layout">
      <PrincipalTeacherPendingHeader
        history={history}
        id={id}
        isEditing={isEditing}
        resetEditState={resetEditState}
      />
      <Grid
        container
        spacing={3}
        className="principal-teacher-pending-main-content-row"
        alignItems="flex-start"
      >
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t('Request From')}
            </Typography>
            <Divider />
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t('Name')}
              </span>
              <span>{requestedBy.name || '-'}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t('Phone Number')}
              </span>{' '}
              <span>{requestedBy.phone || '-'}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t('Email ID')}
              </span>{' '}
              <span>{requestedBy.email || '-'}</span>
            </div>
          </Paper>

          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t('Request Details')}
            </Typography>
            <Divider />
            {isEditing ? (
              <>
                <div className="principal-teacher-pending-first-pending-row">
                  <span>{t('Request Type')}</span>
                  <span>
                    <OpsCustomDropdown
                      value={editableRequestType}
                      placeholder={'Request Type'}
                      options={roleOptions}
                      onChange={(val) => {
                        setEditableRequestType(val as RequestTypes);
                        if (val === RequestTypes.PRINCIPAL) {
                          setSelectedGradeId('');
                        }
                      }}
                    />
                  </span>
                </div>

                {(editableRequestType === RequestTypes.TEACHER ||
                  editableRequestType === RequestTypes.STUDENT) && (
                  <div className="principal-teacher-pending-first-pending-row">
                    <span className="principal-teacher-pending-first-pending-row-title">
                      {t('Grade')}
                    </span>
                    <span>
                      <OpsCustomDropdown
                        placeholder={'Select Grade'}
                        value={selectedGradeId}
                        options={gradeOptions}
                        onChange={(val: string) => {
                          setSelectedGradeId(val);
                        }}
                      />
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="principal-teacher-pending-first-pending-row">
                  <span className="principal-teacher-pending-first-pending-row-title">
                    {t('Role')}
                  </span>
                  <span>{request_type || '-'}</span>
                </div>

                {(request_type === RequestTypes.TEACHER ||
                  request_type === RequestTypes.STUDENT) && (
                  <div className="principal-teacher-pending-first-pending-row">
                    <span className="principal-teacher-pending-first-pending-row-title">
                      {t('Grade')}
                    </span>
                    <span>
                      {parsedGrade > 0 ? parsedGrade : '-'}
                      {parsedSection ? parsedSection : ''}
                    </span>
                  </div>
                )}
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t('School Details')}
            </Typography>
            <Divider />
            <div className="principal-teacher-pending-row">
              <span>{t('School Name')}</span> <span>{school.name || '-'}</span>
            </div>
            <div className="principal-teacher-pending-row">
              <span>{t('School ID (UDISE)')}</span>{' '}
              <span>{school.udise || '-'}</span>
            </div>
            <Divider style={{ margin: '1vw 0' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'principal-teacher-pending-space-between',
              }}
            >
              <div
                className="principal-teacher-pending-field-stack"
                style={{ flex: 1, marginRight: '1rem' }}
              >
                <div className="principal-teacher-pending-label">
                  {t('District')}
                </div>
                <div>{school.group2 || 'N/A'}</div>
              </div>
              <div
                className="principal-teacher-pending-field-stack"
                style={{ flex: 1 }}
              >
                <div className="principal-teacher-pending-label">
                  {t('State')}
                </div>
                <div>{school.group1 || 'N/A'}</div>
              </div>
            </div>
            <div className="principal-teacher-pending-field-stack">
              <div className="principal-teacher-pending-label">
                {t('Country')}
              </div>
              <div>{school.country || 'N/A'}</div>
            </div>
          </Paper>
          <PrincipalTeacherPendingActions
            editClicked={editClicked}
            editableRequestType={editableRequestType}
            handleApproveClick={handleApproveClick}
            handleRejectClick={handleRejectClick}
            isEditing={isEditing}
            requestType={requestData?.request_type}
            resetEditState={resetEditState}
            selectedGradeId={selectedGradeId}
          />
        </Grid>
      </Grid>

      {showRejectPopup && (
        <RejectRequestPopup
          requestData={{
            ...requestData,
            type: requestData.request_type,
            respondedBy: { id: currentUserId },
          }}
          onClose={() => setShowRejectPopup(false)}
        />
      )}
    </div>
  );
};

export default PrincipalTeacherPendingRequest;
