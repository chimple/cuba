import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { type CampaignRewardsDraftPayload } from '../../hooks/campaignSetupFormHelpers';
import { CampaignMessagingRowPayload } from './campaignCommunicationUtils';
import { CampaignReachSummary } from './campaignCommunicationTypes';
import { RANK_LABELS } from './constants';
import { ReviewCard, ReviewRow } from './CampaignReviewComponents';

type RewardsCardProps = {
  campaignRewards: CampaignRewardsDraftPayload | null;
  editStep: number;
  emptyValue: string;
  formatRewardThreshold: (value: number, usesLessonCriteria: boolean) => string;
  getRewardTypeLabel: (value: string) => string;
  onEditStep: (step: number) => void;
  rewardType: string;
  usesLessonCriteria: boolean;
};

type CommunicationCardProps = {
  campaignReach: CampaignReachSummary;
  configuredCommunicationDayCount: number;
  editStep: number;
  emptyValue: string;
  formatDate: (value: string) => string;
  messageTime: string;
  messagingRows: CampaignMessagingRowPayload[];
  onEditStep: (step: number) => void;
  pollTime: string;
  totalDays: number;
};

export const CampaignReviewRewardsCard = ({
  campaignRewards,
  editStep,
  emptyValue,
  formatRewardThreshold,
  getRewardTypeLabel,
  onEditStep,
  rewardType,
  usesLessonCriteria,
}: RewardsCardProps) => {
  const { t } = useTranslation();
  return (
    <ReviewCard title="Rewards" editStep={editStep} onEditStep={onEditStep}>
      <ReviewRow label="Reward Type" value={getRewardTypeLabel(rewardType)} />
      <Box className="campaign-review-reward-list">
        {(campaignRewards?.rules ?? []).map((rule) => (
          <Box key={rule.rank} className="campaign-review-reward-item">
            <Typography className="campaign-review-reward-rank-label">
              {t(RANK_LABELS[rule.rank])}
            </Typography>
            <Box
              className={`campaign-review-rank-badge campaign-review-rank-${rule.rank}`}
            >
              {t(RANK_LABELS[rule.rank])}
            </Box>
            <Box className="campaign-review-reward-copy">
              <Typography className="campaign-review-reward-name">
                <span className="campaign-review-reward-threshold-text">
                  {t('Threshold')}:{' '}
                  {formatRewardThreshold(rule.min, usesLessonCriteria)}
                </span>{' '}
                <span className="campaign-review-reward-separator">Â·</span>{' '}
                {rule.reward || emptyValue}
              </Typography>
              <Typography className="campaign-review-reward-threshold">
                {t('Threshold')}:{' '}
                {formatRewardThreshold(rule.min, usesLessonCriteria)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </ReviewCard>
  );
};

export const CampaignReviewCommunicationCard = ({
  campaignReach,
  configuredCommunicationDayCount,
  editStep,
  emptyValue,
  formatDate,
  messageTime,
  messagingRows,
  onEditStep,
  pollTime,
  totalDays,
}: CommunicationCardProps) => {
  const { t } = useTranslation();
  const visibleMessagingRows = messagingRows.slice(0, 3);
  const hiddenMessagingDayCount =
    messagingRows.length - visibleMessagingRows.length;

  return (
    <ReviewCard
      title="Communication"
      editStep={editStep}
      onEditStep={onEditStep}
      className="campaign-review-communication-card"
    >
      <Box className="campaign-review-reach">
        <Typography className="campaign-review-subheading">
          {t('Campaign Reach')}
        </Typography>
        <Box className="campaign-review-reach-values">
          <Typography className="campaign-review-reach-value">
            <strong>{campaignReach.groupCount}</strong> {t('Groups')}
          </Typography>
          <Typography className="campaign-review-reach-value">
            <strong>{campaignReach.memberCount}</strong> {t('Members')}
          </Typography>
        </Box>
      </Box>
      <ReviewRow label="Total Days" value={totalDays || 0} />
      <ReviewRow
        label="Days Configured"
        value={`${configuredCommunicationDayCount} / ${totalDays || 0}`}
      />
      <ReviewRow label="Message Time" value={messageTime || emptyValue} />
      <ReviewRow label="Poll Time" value={pollTime || emptyValue} />
      <Typography className="campaign-review-subheading campaign-review-message-heading">
        {t('Configured Messages')}
      </Typography>
      <Box className="campaign-review-message-list">
        {visibleMessagingRows.map((row, index) => (
          <Box key={row.scheduled_date} className="campaign-review-message">
            <Box className="campaign-review-message-header">
              <Typography className="campaign-review-message-day">
                {t('Day {{day}}', { day: index + 1 })}
              </Typography>
              <span className="campaign-review-reward-separator">Â·</span>{' '}
              <Typography className="campaign-review-message-date">
                {formatDate(row.scheduled_date)}
              </Typography>
            </Box>
            {row.message && (
              <Typography className="campaign-review-message-line">
                <strong>
                  {t('Message')}
                  <span className="campaign-review-label-colon">:</span>
                </strong>{' '}
                <span>{row.message}</span>
              </Typography>
            )}
            {row.media_link && (
              <Typography className="campaign-review-message-line">
                <strong>
                  {t('Media Link')}
                  <span className="campaign-review-label-colon">:</span>
                </strong>{' '}
                <span>{row.media_link}</span>
              </Typography>
            )}
            {row.poll && (
              <Typography className="campaign-review-message-line">
                <strong>
                  {t('Poll')}
                  <span className="campaign-review-label-colon">:</span>
                </strong>{' '}
                <span>
                  {row.poll.question} ({row.poll.options.length} {t('options')})
                </span>
              </Typography>
            )}
          </Box>
        ))}
        {hiddenMessagingDayCount > 0 && (
          <Typography className="campaign-review-message-overflow">
            {t('...and {{count}} more days configured.', {
              count: hiddenMessagingDayCount,
            })}
          </Typography>
        )}
        {messagingRows.length === 0 && (
          <Typography className="campaign-review-empty">
            {t('No configured communication days.')}
          </Typography>
        )}
      </Box>
    </ReviewCard>
  );
};
