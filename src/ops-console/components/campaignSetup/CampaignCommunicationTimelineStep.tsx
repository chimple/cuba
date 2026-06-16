import React, { useMemo } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CampaignCommunicationRow } from './CampaignCommunicationRow';
import { CampaignCommunicationSchedule } from './CampaignCommunicationSchedule';
import {
  buildCommunicationTimelineDates,
  buildTimeOptions,
  createEmptyCommunicationRow,
  formatTimelineDateLabel,
  getCampaignDurationDays,
} from './campaignCommunicationUtils';
import { CampaignCommunicationTimelineStepProps } from './campaignCommunicationTypes';
import { useCampaignReach } from './useCampaignReach';
import './CampaignCommunicationTimelineStep.css';

const CampaignCommunicationTimelineStep: React.FC<
  CampaignCommunicationTimelineStepProps
> = ({
  form,
  assignmentDrafts,
  selectedSchoolIds,
  communicationState,
  communicationValidation,
  showValidation,
  onMessageTimeChange,
  onPollTimeChange,
  onRowChange,
  onClearRow,
}) => {
  const { t } = useTranslation();
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const timelineDates = useMemo(
    () => buildCommunicationTimelineDates(assignmentDrafts),
    [assignmentDrafts],
  );
  const { campaignReach, loadingReach } = useCampaignReach(selectedSchoolIds);

  const getRow = (date: string) =>
    communicationState.rows[date] ?? createEmptyCommunicationRow();

  const rowError = (key: string) =>
    showValidation ? communicationValidation.errors[key] : undefined;

  const validationMessage =
    showValidation && communicationValidation.errors.rows
      ? communicationValidation.errors.rows
      : t('Configure at least one day to continue to the Summary.');
  const campaignDurationDays =
    form.startDate && form.endDate
      ? getCampaignDurationDays(form.startDate, form.endDate)
      : 0;

  return (
    <Box className="campaign-communication-step campaign-setup-section">
      <Box className="campaign-communication-header">
        <Typography
          variant="h6"
          className="campaign-communication-section-title"
        >
          {t('Campaign Communication Timeline')}
        </Typography>
        <Typography className="campaign-communication-helper-text">
          {t(
            'Plan daily campaign communication throughout the campaign duration.',
          )}
        </Typography>
      </Box>

      <Box className="campaign-communication-widgets">
        <Box className="campaign-communication-widget">
          <Typography className="campaign-communication-widget-value">
            <span className="campaign-communication-widget-label">
              {t('Campaign')}:
            </span>{' '}
            {form.startDate && form.endDate ? (
              <>
                <span className="campaign-communication-widget-strong">
                  {form.startDate} → {form.endDate}
                </span>
                <span className="campaign-communication-widget-days">
                  · {t('{{count}} days', { count: campaignDurationDays })}
                </span>
              </>
            ) : (
              <span className="campaign-communication-widget-strong">--</span>
            )}
          </Typography>
        </Box>
        <Box className="campaign-communication-widget">
          {loadingReach ? (
            <Box className="campaign-communication-widget-loading">
              <CircularProgress size={18} />
            </Box>
          ) : (
            <Typography className="campaign-communication-widget-value">
              <span className="campaign-communication-widget-label">
                {t('Campaign Reach')}:
              </span>{' '}
              <span className="campaign-communication-widget-strong">
                {campaignReach.groupCount}
              </span>{' '}
              <span>{t('WhatsApp Groups')}</span>{' '}
              <span className="campaign-communication-widget-arrow">→</span>{' '}
              <span className="campaign-communication-widget-strong">
                {campaignReach.memberCount}
              </span>{' '}
              <span>{t('Members')}</span>
            </Typography>
          )}
        </Box>
      </Box>

      <Alert
        severity="error"
        icon={false}
        className="campaign-communication-validation"
      >
        {validationMessage}
      </Alert>

      <CampaignCommunicationSchedule
        messageTime={communicationState.messageTime}
        pollTime={communicationState.pollTime}
        timeOptions={timeOptions}
        messageTimeError={rowError('messageTime')}
        pollTimeError={rowError('pollTime')}
        onMessageTimeChange={onMessageTimeChange}
        onPollTimeChange={onPollTimeChange}
      />

      <Box className="campaign-communication-table">
        <Box className="campaign-communication-table-head">
          <Box component="span">{t('Date')}</Box>
          <Box component="span">{t('Daily Message')}</Box>
          <Box component="span">{t('Media Link')}</Box>
          <Box component="span">{t('Poll')}</Box>
          <Box
            component="span"
            className="campaign-communication-table-head-empty"
          >
            <span className="campaign-communication-visually-hidden">
              {t('Clear row actions')}
            </span>
          </Box>
        </Box>

        <Box className="campaign-communication-table-body">
          {timelineDates.map((date, index) => (
            <CampaignCommunicationRow
              key={date}
              date={date}
              index={index}
              row={getRow(date)}
              dateLabel={formatTimelineDateLabel(date)}
              getError={rowError}
              onRowChange={onRowChange}
              onClearRow={onClearRow}
            />
          ))}

          {timelineDates.length === 0 && (
            <Box className="campaign-communication-empty-state">
              <Typography>
                {t(
                  'No campaign days are available yet. Complete assignment setup to generate the communication schedule.',
                )}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CampaignCommunicationTimelineStep;
