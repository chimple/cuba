import React from 'react';
import { Button, CircularProgress, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PAGES, REQUEST_TABS } from '../../common/constants';
import './OpsFlaggedRequestDetails.css';
import OpsFlaggedRequestLeftPanel from './OpsFlaggedRequestLeftPanel';
import OpsFlaggedSchoolPanel from './OpsFlaggedSchoolPanel';
import { useOpsFlaggedRequestDetails } from './useOpsFlaggedRequestDetails';

const OpsFlaggedRequestDetails = () => {
  const { t } = useTranslation();
  const details = useOpsFlaggedRequestDetails();
  const { error, history, id, isLoading, requestDetails } = details;

  const formatDT = (d: string | undefined) =>
    d
      ? new Date(d).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : t('-');

  if (isLoading)
    return (
      <div className="ops-flagged-request-details-centered">
        <CircularProgress />
        <Typography>{t('Loading request details...')}</Typography>
      </div>
    );

  if (error)
    return (
      <div className="ops-flagged-request-details-centered">
        <Typography color="error">{error}</Typography>
        <Button onClick={() => history.goBack()}>{t('Go Back')}</Button>
      </div>
    );

  if (!requestDetails) return null;

  const requestedBy = (requestDetails as any).requestedBy || {};
  const flaggedBy = (requestDetails as any).respondedBy || {};

  return (
    <div className="ops-flagged-request-details-layout">
      <Typography
        variant="h4"
        className="ops-flagged-request-details-page-title"
      >
        {t('Request ID - {{id}}', { id })}
      </Typography>
      <div className="ops-flagged-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="ops-flagged-request-details-link icon-button"
        >
          {t('Requests')}
        </span>
        <span
          className="ops-flagged-request-details-separator"
          aria-hidden="true"
        >
          {' > '}
        </span>
        <span
          onClick={() =>
            history.push({
              pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
              search: `?tab=${REQUEST_TABS.FLAGGED}`,
            })
          }
          className="ops-flagged-request-details-link icon-button"
        >
          {t('Flagged')}
        </span>
        <span
          className="ops-flagged-request-details-separator"
          aria-hidden="true"
        >
          {' > '}
        </span>
        <span className="ops-flagged-request-details-active">
          {t('Request ID - {{id}}', { id })}
        </span>
      </div>
      <Grid
        container
        spacing={3}
        className="ops-flagged-request-details-main-content-row"
        alignItems="flex-start"
      >
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <OpsFlaggedRequestLeftPanel
            classOptions={details.classOptions}
            flaggedBy={flaggedBy}
            formatDT={formatDT}
            isLoadingDropdowns={details.isLoadingDropdowns}
            requestDetails={requestDetails}
            requestedBy={requestedBy}
            requestTypeOptions={details.requestTypeOptions}
            selectedClassId={details.selectedClassId}
            selectedRequestType={details.selectedRequestType}
            selectedSchoolId={details.selectedSchoolId}
            setSelectedClass={details.setSelectedClass}
            setSelectedClassId={details.setSelectedClassId}
            setSelectedRequestType={details.setSelectedRequestType}
            setValidationErrors={details.setValidationErrors}
            validationErrors={details.validationErrors}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <OpsFlaggedSchoolPanel
            classOptions={details.classOptions}
            handleApprove={details.handleApprove}
            handleCancel={details.handleCancel}
            handleSchoolSearch={details.handleSchoolSearch}
            handleSchoolSelect={details.handleSchoolSelect}
            isApproving={details.isApproving}
            isFetchingSchool={details.isFetchingSchool}
            isInitialLoad={details.isInitialLoad}
            isLoading={details.isLoading}
            schoolInputValue={details.schoolInputValue}
            schoolOptions={details.schoolOptions}
            selectedCountry={details.selectedCountry}
            selectedDistrict={details.selectedDistrict}
            selectedSchoolUdise={details.selectedSchoolUdise}
            selectedState={details.selectedState}
            setClassOptions={details.setClassOptions}
            setInitialUdiseSet={details.setInitialUdiseSet}
            setIsInitialLoad={details.setIsInitialLoad}
            setSchoolInputValue={details.setSchoolInputValue}
            setSelectedClass={details.setSelectedClass}
            setSelectedClassId={details.setSelectedClassId}
            setSelectedCountry={details.setSelectedCountry}
            setSelectedDistrict={details.setSelectedDistrict}
            setSelectedSchoolId={details.setSelectedSchoolId}
            setSelectedSchoolName={details.setSelectedSchoolName}
            setSelectedSchoolUdise={details.setSelectedSchoolUdise}
            setSelectedState={details.setSelectedState}
            setValidationErrors={details.setValidationErrors}
            validationErrors={details.validationErrors}
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default OpsFlaggedRequestDetails;
