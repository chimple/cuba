import React, { useEffect, useState } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { Typography, Paper, Grid, Divider, Button } from '@mui/material';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  DEFAULT_PAGE_SIZE,
  PAGES,
  REQUEST_TABS,
  TableTypes,
} from '../../common/constants';
import './OpsRejectedRequestDetails.css';
import { useTranslation } from 'react-i18next';

const StudentRejectedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation();

  type RequestDetails = {
    school?: {
      name?: string;
      udise?: string;
      country?: string;
      group1?: string;
      group2?: string;
      group3?: string;
    };
    rejectedBy?: { name?: string };
    respondedBy?: { name?: string };
    requestedBy?: { name?: string; phone?: string; email?: string };
    request_id?: string | null;
    request_type?: string | null;
    created_at?: string;
    updated_at?: string;
    rejected_reason_type?: string | null;
    rejected_reason_description?: string | null;
  };

  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestDetails(state.request);
        } else {
          const rejectedRequests = await api.getOpsRequests(
            'rejected',
            1,
            DEFAULT_PAGE_SIZE,
          );
          const req = rejectedRequests?.data?.find(
            (
              r: TableTypes<'ops_requests'> | Record<string, unknown>,
            ): r is TableTypes<'ops_requests'> =>
              'request_id' in r &&
              typeof r.request_id === 'string' &&
              r.request_id === id,
          );
          if (req) setRequestDetails(req);
          else setError(t('Request not found'));
        }
      } catch (e) {
        setError(t('Failed to load request details. Please try again.'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequestDetails();
  }, [id, api, location.state, t]);

  if (isLoading)
    return (
      <div className="ops-rejected-request-details-centered">
        <Typography>{t('Loading request details...')}</Typography>{' '}
      </div>
    );
  if (error)
    return (
      <div className="ops-rejected-request-details-centered">
        <Typography color="error">{error}</Typography>
        <Button onClick={() => history.goBack()}>{t('Go Back')}</Button>{' '}
      </div>
    );
  if (!requestDetails) return null;

  const formatDT = (d: string | undefined) =>
    d
      ? new Date(d).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : t('-');

  const school = requestDetails.school || {};
  const rejectedBy = requestDetails.respondedBy || {};
  const requestedBy = requestDetails.requestedBy || {};

  return (
    <div className="ops-rejected-request-details-layout">
      <Typography
        variant="h4"
        className="ops-rejected-request-details-page-title"
      >
        {t('Requests')}{' '}
      </Typography>
      <div className="ops-rejected-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="ops-rejected-request-details-link icon-button"
        >
          {t('Requests')}
        </span>
        <span
          className="ops-rejected-request-details-separator"
          aria-hidden="true"
        >
          {' > '}
        </span>

        <span
          onClick={() =>
            history.push({
              pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
              search: `?tab=${REQUEST_TABS.REJECTED}`,
            })
          }
          className="ops-rejected-request-details-link icon-button"
        >
          {t('Rejected')}
        </span>
        <span
          className="ops-rejected-request-details-separator"
          aria-hidden="true"
        >
          {' > '}
        </span>

        <span className="ops-rejected-request-details-active">
          {t('Request ID - {{id}}', { id })}{' '}
        </span>
      </div>

      <Grid
        container
        spacing={3}
        className="ops-rejected-request-details-main-content-row"
        alignItems="flex-start"
      >
        {' '}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Paper className="ops-rejected-request-details-details-card">
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title"
            >
              {t('Request ID - {{id}}', { id })}{' '}
            </Typography>
            <Divider className="ops-rejected-request-details-divider-margin" />{' '}
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t('School Name')} <div>{school.name || t('-')}</div>{' '}
              </div>
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t('School ID (UDISE)')}{' '}
                <div>{school.udise || t('-')}</div>{' '}
              </div>
            </div>
            <Divider className="ops-rejected-request-details-divider-margin" />{' '}
            <div className="ops-rejected-request-details-field-row">
              {' '}
              <div className="ops-rejected-request-details-field-stack ops-rejected-request-details-field-stack-margin">
                <div className="ops-rejected-request-details-label">
                  {t('District')}
                </div>{' '}
                <div>{school.group2 || t('-')}</div>{' '}
              </div>
              <div className="ops-rejected-request-details-field-stack">
                <div className="ops-rejected-request-details-label">
                  {t('State')}
                </div>{' '}
                <div>{school.group1 || t('-')}</div>{' '}
              </div>
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t('Country')}
              </div>{' '}
              <div>{school.country || t('-')}</div>{' '}
            </div>
            <Divider className="ops-rejected-request-details-divider-margin" />{' '}
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title"
            >
              {t('Request Details')}{' '}
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <div className="ops-rejected-request-details-label-sm">
                  {t('Request For:')}{' '}
                  <div>{requestDetails.request_type || t('-')} </div>
                </div>{' '}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <div className="ops-rejected-request-details-label-sm">
                  {t('Requested On:')}{' '}
                  <div>{formatDT(requestDetails.created_at)}</div>
                </div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>{' '}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper className="ops-rejected-request-details-rejection-card ops-rejected-request-details-details-card">
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title ops-rejected-request-details-rejection-title"
            >
              {t('Rejection Details')}{' '}
            </Typography>
            <Divider className="ops-rejected-request-details-divider-margin" />{' '}
            <div className="ops-rejected-request-details-label-row"></div>
            <div className="ops-rejected-request-details-label-row">
              <span className="ops-rejected-request-details-label-reject">
                {t('Rejected By:')}
              </span>{' '}
              <span>{rejectedBy.name || t('-')}</span>{' '}
            </div>
            <div className="ops-rejected-request-details-label-row">
              <span className="ops-rejected-request-details-label-reject">
                {t('Rejected On:')}
              </span>{' '}
              <span>{formatDT(requestDetails.updated_at)}</span>
            </div>
            <Divider className="ops-rejected-request-details-divider-margin" />
            <div className="ops-rejected-request-details-label-row">
              <span className="ops-rejected-request-details-label-reject">
                {t('Message to Admin:')}
              </span>
            </div>
            <div className="ops-rejected-request-details-message-box">
              {requestDetails.rejected_reason_description?.trim()}
            </div>
          </Paper>
          <Paper className="ops-rejected-request-details-details-card">
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title"
            >
              {t('Request From')}{' '}
            </Typography>
            <Divider className="ops-rejected-request-details-divider-margin" />{' '}
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t('Name :')}
              </div>{' '}
              <div>{requestedBy.name || t('N/A')}</div>{' '}
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t('Phone Number :')}
              </div>{' '}
              <div>{requestedBy.phone || t('N/A')}</div>{' '}
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t('Email ID:')}
              </div>{' '}
              <div>{requestedBy.email || t('N/A')}</div>{' '}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default StudentRejectedRequestDetails;
