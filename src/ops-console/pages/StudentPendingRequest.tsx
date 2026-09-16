import React from 'react';
import { Typography, Paper, Grid, Divider, Button } from '@mui/material';
import { PAGES } from '../../common/constants';
import './StudentPendingRequest.css';
import { useTranslation } from 'react-i18next';
import { OpsUtil } from '../OpsUtility/OpsUtil';
import RejectRequestPopup from '../components/SchoolRequestComponents/RejectRequestPopup';
import StudentPendingStudentsTable from '../components/StudentPendingStudentsTable';
import { useStudentPendingRequestDetails } from '../hooks/useStudentPendingRequestDetails';

const StudentPendingRequestDetails = () => {
  const { t } = useTranslation();
  const {
    currentPage,
    displayedStudents,
    filteredTotalStudents,
    handleConfirmApprove,
    handlePageChange,
    handleRadioChange,
    history,
    id,
    loading,
    pageSize,
    requestData,
    searchTerm,
    selectedStudent,
    setSearchTerm,
    setShowRejectPopup,
    showRejectPopup,
    studentDetails,
  } = useStudentPendingRequestDetails();

  const handleRemoveClick = () => {
    setShowRejectPopup(true);
  };
  const formatFirstLetterUpper = (value?: string) => {
    const trimmed = (value ?? '').toString().trim();
    if (!trimmed) return t('N/A');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  if (loading || !requestData)
    return (
      <div className="student-pending-request-details-centered">
        <Typography>{t('Loading...')}</Typography>
      </div>
    );

  const { school = {}, requestedBy = {}, request_type } = requestData;
  const fullRequestClassName =
    requestData.classInfo?.name || `${requestData.classInfo?.standard || ''}`;

  const { grade: parsedGrade, section: parsedSection } =
    OpsUtil.parseClassName(fullRequestClassName);

  const navBreadcrumbs = (
    <div className="student-pending-request-details-breadcrumbs">
      <span
        onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
        className="student-pending-request-details-link icon-button"
      >
        {t('Pending')}
      </span>
      <span
        className="student-pending-request-details-separator"
        aria-hidden="true"
      >
        {' > '}
      </span>
      <span className="student-pending-request-details-active">
        {t(`Request ID - ${id}`)}
      </span>
    </div>
  );

  return (
    <>
      <div className="student-pending-request-details-layout">
        <Typography
          variant="h4"
          className="student-pending-request-details-page-title"
        >
          {t(`Request ID - ${id}`)}
        </Typography>
        {navBreadcrumbs}

        <Grid
          container
          spacing={3}
          className="student-pending-request-details-main-content-row"
          alignItems="flex-start"
        >
          {/* Left Side Cards */}
          <Grid size={{ xs: 12, md: 5, lg: 4.5 }}>
            <Paper
              className="student-pending-request-details-card"
              elevation={0}
            >
              <Typography
                variant="subtitle1"
                className="student-pending-request-details-section-title"
              >
                {t('Request From')}
              </Typography>
              <Divider />
              <div className="student-pending-request-details-row">
                <span>{t('Name')}</span>{' '}
                <span>{requestedBy.name || t('N/A')}</span>
              </div>
              <div className="student-pending-request-details-row">
                <span>{t('Gender')}</span>{' '}
                <span>{formatFirstLetterUpper(requestedBy.gender)}</span>
              </div>
              <div className="student-pending-request-details-row">
                <span>{t('Phone Number')}</span>{' '}
                <span>{studentDetails?.parents?.[0]?.phone || t('N/A')}</span>
              </div>
              <div className="student-pending-request-details-row">
                <span>{t('Email ID')}</span>{' '}
                <span>{studentDetails?.parents?.[0]?.email || t('N/A')}</span>
              </div>
            </Paper>

            <Paper
              className="student-pending-request-details-card"
              elevation={0}
            >
              <Typography
                variant="subtitle1"
                className="student-pending-request-details-section-title"
              >
                {t('Request Details')}
              </Typography>
              <Divider />
              <div className="student-pending-request-details-row">
                <span>{t('Role')}</span>{' '}
                <span>{formatFirstLetterUpper(request_type)}</span>
              </div>
              <div className="student-pending-request-details-row">
                <span>{t('Grade')}</span>{' '}
                <span>{parsedGrade > 0 ? parsedGrade : t('N/A')}</span>
              </div>
              <div className="student-pending-request-details-row">
                <span>{t('Class Section')}</span>{' '}
                <span>{parsedSection || t('N/A')}</span>
              </div>
            </Paper>

            <Paper
              className="student-pending-request-details-card"
              elevation={0}
            >
              <Typography
                variant="subtitle1"
                className="student-pending-request-details-section-title"
              >
                {t('School Details')}
              </Typography>
              <Divider className="student-pending-request-details-divider-margin" />
              <div className="student-pending-request-details-row">
                <span>{t('School Name')}</span>{' '}
                <span>{school.name || t('N/A')}</span>
              </div>
              <div className="student-pending-request-details-row">
                <span>{t('School ID (UDISE)')}</span>{' '}
                <span>{school.udise || t('N/A')}</span>
              </div>
              <Divider className="student-pending-request-details-divider-margin student-pending-request-details-divider-spacing" />
              <div className="student-pending-request-details-field-row">
                <div className="student-pending-request-details-field-stack student-pending-request-details-field-stack-margin student-pending-request-details-divider-spacing">
                  <div className="student-pending-request-details-label">
                    {t('Block')}
                  </div>
                  <div>{school.group3 || t('N/A')}</div>
                </div>
                <div className="student-pending-request-details-field-stack student-pending-request-details-divider-spacing">
                  <div className="student-pending-request-details-label">
                    {t('State')}
                  </div>
                  <div>{school.group1 || t('N/A')}</div>
                </div>
              </div>
              <div className="student-pending-request-details-field-stack">
                <div className="student-pending-request-details-label">
                  {t('District')}
                </div>
                <div>{school.group2 || t('N/A')}</div>
              </div>
            </Paper>
            <div className="student-pending-request-details-action-buttons-row">
              <Button
                variant="contained"
                color="error"
                size="large"
                className="student-pending-request-details-remove-button"
                onClick={handleRemoveClick}
              >
                {t('Remove')}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                className="student-pending-request-details-approve-button"
                onClick={handleConfirmApprove}
                disabled={loading || !requestData?.id}
              >
                {selectedStudent ? t('Merge & Approve') : t('Approve')}
              </Button>
            </div>
          </Grid>

          {/* Right Side Table */}
          <Grid size={{ xs: 12, md: 7, lg: 7.5 }}>
            <StudentPendingStudentsTable
              currentPage={currentPage}
              displayedStudents={displayedStudents}
              filteredTotalStudents={filteredTotalStudents}
              formatFirstLetterUpper={formatFirstLetterUpper}
              handlePageChange={handlePageChange}
              handleRadioChange={handleRadioChange}
              pageSize={pageSize}
              parsedGrade={parsedGrade}
              parsedSection={parsedSection}
              searchTerm={searchTerm}
              selectedStudent={selectedStudent}
              setSearchTerm={setSearchTerm}
            />
          </Grid>
        </Grid>
      </div>
      {showRejectPopup && (
        <RejectRequestPopup
          requestData={{
            ...requestData,
            school: requestData?.school || {},
          }}
          onClose={() => setShowRejectPopup(false)}
        />
      )}
    </>
  );
};

export default StudentPendingRequestDetails;
