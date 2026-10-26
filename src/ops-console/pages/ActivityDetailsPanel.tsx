import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Drawer,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import { PERFORMANCE_UI, PerformanceLevel } from '../../common/constants';
import { OpsUtil } from '../OpsUtility/OpsUtil';
import { t } from 'i18next';
import { FcActivity } from '../../interface/modelInterfaces';
import MediaDisplay, { MediaItem } from '../components/MediaDisplay';
import logger from '../../utility/logger';
import { DetailSection, InfoRow } from './ActivityDetailsPrimitives';

interface Props {
  activity: FcActivity;
  onClose: () => void;
}

const CALL_STATUS_LABEL: Record<string, string> = {
  call_picked: t('Call Attended'),
  call_later: t('Call Later'),
  call_not_reachable: t('No Response'),
};

const isValidText = (value?: string) => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed !== '' && trimmed !== '--';
};

const FcActivityDetailsPanel: React.FC<Props> = ({ activity, onClose }) => {
  if (!activity) return null;

  const { raw, user, classInfo } = activity;

  const perf = PERFORMANCE_UI[raw.support_level as PerformanceLevel];

  const contactType =
    raw.contact_target.charAt(0).toUpperCase() + raw.contact_target.slice(1);

  const callOutcome =
    CALL_STATUS_LABEL[raw.call_status] || raw.call_status || '--';

  let questionAnswerPairs: Record<string, string> = {};

  try {
    questionAnswerPairs =
      typeof raw.question_response === 'string'
        ? JSON.parse(raw.question_response)
        : raw.question_response || {};
  } catch (error) {
    questionAnswerPairs = {};
  }

  const otherComments = raw.comment || '--';
  let mediaItems: MediaItem[] = [];

  if (raw.media_links) {
    try {
      const links: string[] =
        typeof raw.media_links === 'string' ? JSON.parse(raw.media_links) : [];

      mediaItems = links.map((url) => ({
        url,
        type: url
          .toLowerCase()
          .match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|mpg|mpeg|3gp|m4v)$/i)
          ? 'video'
          : 'image',
      }));
    } catch (err) {
      logger.error('Invalid media_links JSON', err);
      mediaItems = [];
    }
  }

  return (
    <Drawer
      anchor="right"
      open={true}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 520,
          p: 3,
          bgcolor: '#ffffff',
        },
      }}
    >
      {/* HEADER */}
      <Box
        id="fc-header"
        data-testid="fc-header"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h6" fontWeight={600}>
          {t('Details')}
        </Typography>

        <IconButton
          id="fc-close-btn"
          data-testid="fc-close-btn"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* TOP INFO CARD */}
      <Paper
        id="fc-top-info-card"
        data-testid="fc-top-info-card"
        elevation={0}
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          pt: 1.5,
          pb: 0.3,
          px: 1.5,
          mb: 4,
          bgcolor: '#ffffff',
        }}
      >
        <Box display="flex" justifyContent="space-between">
          {/* LEFT */}
          <Box>
            <InfoRow
              id="fc-name"
              label={t('Name')}
              value={user?.name ?? '--'}
            />
            <InfoRow
              id="fc-grade"
              label={t('Grade')}
              value={classInfo?.name ?? '--'}
            />
            <InfoRow
              id="fc-contact-type"
              label={t('Contact Type')}
              value={contactType}
            />
          </Box>

          {/* RIGHT */}
          <Box textAlign="right">
            <InfoRow
              id="fc-profile-status"
              label={t('Profile Status')}
              value={
                <Chip
                  label={perf?.label ? t(perf.label) : t('NA')}
                  size="small"
                  sx={{
                    bgcolor: perf?.bgColor,
                    color: perf?.textColor,
                    fontWeight: 600,
                  }}
                />
              }
            />

            <InfoRow
              id="fc-time"
              label={t('Time')}
              value={OpsUtil.formatTimeToIST(raw.created_at)}
            />

            <InfoRow
              id="fc-tech-issues"
              label={t('Tech Issues')}
              value={
                raw.tech_issues_reported ? (
                  <Chip
                    label={t('Yes')}
                    size="small"
                    sx={{
                      bgcolor: '#fff3cd',
                      color: '#b26a00',
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  '--'
                )
              }
            />
          </Box>
        </Box>
      </Paper>

      {/* SECTIONS */}
      <DetailSection
        id="fc-call-outcome"
        label={t('Call Outcome')}
        text={callOutcome}
      />

      {Object.entries(questionAnswerPairs).map(([question, answer], index) => (
        <DetailSection
          key={index}
          id={`fc-question-${index}`}
          label={question}
          text={answer}
        />
      ))}

      <DetailSection
        id="fc-other-comments"
        label={t('Any other questions or comments?')}
        text={otherComments}
      />

      {raw.tech_issues_reported === true &&
        isValidText(raw.tech_issue_comment) && (
          <DetailSection
            id="fc-tech-issue-reported"
            label={t('Tech Issue Reported')}
            text={raw.tech_issue_comment ?? ''}
          />
        )}

      <MediaDisplay
        id="fc-media"
        label={t('Attached Media')}
        media={mediaItems}
      />
    </Drawer>
  );
};

export default FcActivityDetailsPanel;
