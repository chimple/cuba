import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  CampaignAudienceSummary,
  CampaignOption,
  CampaignSchoolOption,
} from '../../../services/api/ServiceApi';
import type { CampaignRewardsDraftPayload } from '../../hooks/campaignSetupFormHelpers';
import {
  RANK_LABELS,
  REWARD_TYPE_OPTIONS,
  TARGET_TYPE_LABEL_BY_VALUE,
} from './constants';
import {
  CampaignAssignmentDraft,
  frequencyLabels,
  GradeAssignmentConfig,
} from './campaignAssignmentUtils';
import {
  CampaignMessagingRowPayload,
  getCampaignDurationDays,
} from './campaignCommunicationUtils';
import { CampaignReachSummary } from './campaignCommunicationTypes';
import { CampaignSetupFormState } from './types';
import { ReviewCard, ReviewRow } from './CampaignReviewComponents';
import './CampaignReviewStep.css';

export type CampaignReviewData = {
  form: CampaignSetupFormState;
  managerName: string;
  programName: string;
  selectedBlocks: string[];
  selectedSchools: CampaignSchoolOption[];
  selectedGrades: CampaignOption[];
  audienceSummary: CampaignAudienceSummary;
  assignmentDrafts: CampaignAssignmentDraft[];
  assignmentConfigs: Record<string, GradeAssignmentConfig>;
  campaignRewards: CampaignRewardsDraftPayload | null;
  campaignReach: CampaignReachSummary;
  messageTime: string;
  pollTime: string;
  configuredCommunicationDayCount: number;
  messagingRows: CampaignMessagingRowPayload[];
};

type CampaignReviewStepProps = {
  reviewData: CampaignReviewData;
  onEditStep: (step: number) => void;
};

const emptyValue = '--';

const formatDate = (value: string) => {
  if (!value) return emptyValue;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatShortDate = (value: string) => {
  if (!value) return emptyValue;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const formatList = (values: string[]) =>
  values.length > 0 ? values.join(', ') : emptyValue;

const getRewardTypeLabel = (value: CampaignSetupFormState['rewardType']) =>
  REWARD_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
  emptyValue;

const getObjectiveLabel = (form: CampaignSetupFormState) => {
  if (form.objective === 'homepage_learning_pathway_campaign') {
    return 'Homepage Learning Pathway Campaign';
  }
  if (!form.targetType) return 'Homework Campaign';
  return `Homework Campaign (${TARGET_TYPE_LABEL_BY_VALUE.get(form.targetType) || form.targetType})`;
};

export const CampaignReviewStep: React.FC<CampaignReviewStepProps> = ({
  reviewData,
  onEditStep,
}) => {
  const { t } = useTranslation();
  const totalDays = getCampaignDurationDays(
    reviewData.form.startDate,
    reviewData.form.endDate,
  );

  const assignmentsByGrade = useMemo(
    () =>
      reviewData.selectedGrades.map((grade) => {
        const drafts = reviewData.assignmentDrafts.filter(
          (draft) => draft.gradeId === grade.id,
        );
        const subjects = Array.from(
          new Set(drafts.map((draft) => draft.subjectName).filter(Boolean)),
        );
        const frequency =
          reviewData.assignmentConfigs[grade.id]?.frequency || 'daily';

        return {
          grade,
          lessonCount: drafts.length,
          subjects,
          frequency,
        };
      }),
    [
      reviewData.assignmentConfigs,
      reviewData.assignmentDrafts,
      reviewData.selectedGrades,
    ],
  );

  const warningMessages = assignmentsByGrade
    .filter((assignment) => assignment.lessonCount > 0)
    .filter((assignment) => totalDays > 0 && assignment.lessonCount < totalDays)
    .map((assignment) =>
      t(
        'Lesson coverage for {{gradeName}} ({{lessonCount}}) may not cover campaign duration ({{totalDays}} days).',
        {
          gradeName: assignment.grade.name,
          lessonCount: assignment.lessonCount,
          totalDays,
        },
      ),
    );

  const gradesWithStudents = reviewData.selectedGrades.map((grade) => {
    const summary = reviewData.audienceSummary.grades.find(
      (item) => item.gradeId === grade.id,
    );
    return `${grade.name} (${summary?.studentCount ?? 0})`;
  });

  return (
    <Box className="campaign-review-step">
      {warningMessages.length > 0 && (
        <Box className="campaign-review-warnings">
          {warningMessages.map((message) => (
            <Box key={message} className="campaign-review-warning">
              <span aria-hidden="true">⚠️</span>
              <Typography>{message}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Typography variant="h6" className="campaign-review-heading">
        {t('Campaign Summary')}
      </Typography>

      <ReviewCard
        title="Campaign Overview"
        editStep={0}
        onEditStep={onEditStep}
      >
        <ReviewRow
          label="Campaign Name"
          value={reviewData.form.campaignName || emptyValue}
        />
        <ReviewRow
          label="Objective"
          value={getObjectiveLabel(reviewData.form)}
        />
        <ReviewRow
          label="Manager"
          value={reviewData.managerName || emptyValue}
        />
        <ReviewRow
          label="Duration"
          value={`${formatDate(reviewData.form.startDate)} -> ${formatDate(
            reviewData.form.endDate,
          )} (${totalDays || 0} days)`}
        />
      </ReviewCard>

      <ReviewCard title="Target Audience" editStep={0} onEditStep={onEditStep}>
        <ReviewRow
          label="Program"
          value={reviewData.programName || emptyValue}
        />
        <ReviewRow
          label="Blocks"
          value={formatList(reviewData.selectedBlocks)}
        />
        <ReviewRow
          label="Schools"
          value={
            reviewData.selectedSchools.length > 0
              ? `${reviewData.selectedSchools.length} schools`
              : emptyValue
          }
        />
        <ReviewRow label="Grades" value={formatList(gradesWithStudents)} />
      </ReviewCard>

      <ReviewCard title="Assignments" editStep={1} onEditStep={onEditStep}>
        <Box className="campaign-review-assignment-list">
          {assignmentsByGrade.map((assignment) => (
            <Box
              key={assignment.grade.id}
              className="campaign-review-assignment-item"
            >
              <Typography className="campaign-review-assignment-grade">
                {assignment.grade.name}
              </Typography>
              <Typography className="campaign-review-assignment-detail">
                {t('Subjects')}: {formatList(assignment.subjects)} -{' '}
                {t('Lessons')}: {assignment.lessonCount} - {t('Frequency')}:{' '}
                {t(frequencyLabels[assignment.frequency])}
              </Typography>
            </Box>
          ))}
        </Box>
      </ReviewCard>

      <ReviewCard title="Rewards" editStep={2} onEditStep={onEditStep}>
        <ReviewRow
          label="Reward Type"
          value={getRewardTypeLabel(reviewData.form.rewardType)}
        />
        {(reviewData.campaignRewards?.rules ?? []).map((rule) => (
          <ReviewRow
            key={rule.rank}
            label={RANK_LABELS[rule.rank]}
            value={`${t('Threshold')}: ${rule.min} - ${rule.reward}`}
          />
        ))}
      </ReviewCard>

      <ReviewCard title="Communication" editStep={3} onEditStep={onEditStep}>
        <Box className="campaign-review-reach">
          <Typography className="campaign-review-subheading">
            {t('Campaign Reach')}
          </Typography>
          <Typography className="campaign-review-reach-value">
            <strong>{reviewData.campaignReach.groupCount}</strong> {t('Groups')}{' '}
            / <strong>{reviewData.campaignReach.memberCount}</strong>{' '}
            {t('Members')}
          </Typography>
        </Box>
        <ReviewRow label="Total Days" value={totalDays || 0} />
        <ReviewRow
          label="Days Configured"
          value={`${reviewData.configuredCommunicationDayCount} / ${totalDays || 0}`}
        />
        <ReviewRow
          label="Message Time"
          value={reviewData.messageTime || emptyValue}
        />
        <ReviewRow
          label="Poll Time"
          value={reviewData.pollTime || emptyValue}
        />

        <Typography className="campaign-review-subheading campaign-review-message-heading">
          {t('Sample Configured Days')}
        </Typography>
        <Box className="campaign-review-message-list">
          {reviewData.messagingRows.map((row, index) => (
            <Box key={row.scheduled_date} className="campaign-review-message">
              <Typography className="campaign-review-message-date">
                {t('Day {{day}}', { day: index + 1 })} -{' '}
                {formatShortDate(row.scheduled_date)}
              </Typography>
              {row.message && (
                <Typography className="campaign-review-message-line">
                  {row.message}
                </Typography>
              )}
              {row.media_link && (
                <Typography className="campaign-review-message-line">
                  {row.media_link}
                </Typography>
              )}
              {row.poll && (
                <Typography className="campaign-review-message-line">
                  {row.poll.question} ({row.poll.options.length} {t('options')})
                </Typography>
              )}
            </Box>
          ))}
          {reviewData.messagingRows.length === 0 && (
            <Typography className="campaign-review-empty">
              {t('No configured communication days.')}
            </Typography>
          )}
        </Box>
      </ReviewCard>
    </Box>
  );
};
