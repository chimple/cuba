import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  CampaignAudienceSummary,
  CampaignOption,
  CampaignSchoolOption,
} from '../../../services/api/ServiceApi';
import {
  type CampaignRewardsDraftPayload,
  usesLessonRewardCriteria,
} from '../../hooks/campaignSetupFormHelpers';
import { REWARD_TYPE_OPTIONS, TARGET_TYPE_LABEL_BY_VALUE } from './constants';
import {
  CampaignAssignmentDraft,
  frequencyLabels,
  GradeAssignmentConfig,
} from './campaignAssignmentUtils';
import {
  type CampaignMessagingRowPayload,
  getCampaignDurationDays,
} from './campaignCommunicationUtils';
import { CampaignReachSummary } from './campaignCommunicationTypes';
import { CampaignSetupFormState } from './types';
import { ReviewCard, ReviewRow } from './CampaignReviewComponents';
import { CAMPAIGN_OBJECTIVE } from '../../../common/constants';
import {
  CampaignReviewCommunicationCard,
  CampaignReviewRewardsCard,
} from './CampaignReviewCards';
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
  applicableMessageDayCount: number;
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
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const formatList = (values: string[]) =>
  values.length > 0 ? values.join(', ') : emptyValue;

const formatGradesWithStudentCounts = (
  grades: CampaignOption[],
  audienceSummary: CampaignAudienceSummary,
) =>
  grades.length > 0
    ? grades.map((grade, index) => {
        const summary = audienceSummary.grades.find(
          (item) => item.gradeId === grade.id,
        );
        return (
          <React.Fragment key={grade.id}>
            {index > 0 && ', '}
            {grade.name} (
            <strong className="campaign-review-count">
              {summary?.studentCount ?? 0}
            </strong>
            )
          </React.Fragment>
        );
      })
    : emptyValue;

const getRewardTypeLabel = (value: CampaignSetupFormState['rewardType']) =>
  REWARD_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
  emptyValue;

const getObjectiveLabel = (form: CampaignSetupFormState) => {
  if (form.objective === CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY) {
    return 'Homepage Learning Pathway Campaign';
  }
  if (!form.targetType) return 'Homework Campaign';
  return `Homework Campaign (${TARGET_TYPE_LABEL_BY_VALUE.get(form.targetType) || form.targetType})`;
};

const formatRewardThreshold = (value: number, usesLessonCriteria: boolean) =>
  `${value}${usesLessonCriteria ? '' : '%'}`;

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

  const usesLessonCriteria = usesLessonRewardCriteria(reviewData.form);
  const isHomepageLearningPathwayCampaign =
    reviewData.form.objective === CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY;

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
        <ReviewRow
          label="Grades"
          value={formatGradesWithStudentCounts(
            reviewData.selectedGrades,
            reviewData.audienceSummary,
          )}
        />
      </ReviewCard>

      {!isHomepageLearningPathwayCampaign && (
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
                  {t('Subjects')}: {formatList(assignment.subjects)}
                </Typography>
                <Typography className="campaign-review-assignment-detail">
                  {t('Lessons')}: {assignment.lessonCount} · {t('Frequency')}:{' '}
                  {t(frequencyLabels[assignment.frequency])}
                </Typography>
              </Box>
            ))}
          </Box>
        </ReviewCard>
      )}
      <CampaignReviewRewardsCard
        campaignRewards={reviewData.campaignRewards}
        editStep={2}
        emptyValue={emptyValue}
        formatRewardThreshold={formatRewardThreshold}
        getRewardTypeLabel={(value) =>
          getRewardTypeLabel(value as CampaignSetupFormState['rewardType'])
        }
        onEditStep={onEditStep}
        rewardType={reviewData.form.rewardType}
        usesLessonCriteria={usesLessonCriteria}
      />
      <CampaignReviewCommunicationCard
        applicableMessageDayCount={reviewData.applicableMessageDayCount}
        campaignReach={reviewData.campaignReach}
        configuredCommunicationDayCount={
          reviewData.configuredCommunicationDayCount
        }
        editStep={3}
        emptyValue={emptyValue}
        formatDate={formatDate}
        messageTime={reviewData.messageTime}
        messagingRows={reviewData.messagingRows}
        onEditStep={onEditStep}
        pollTime={reviewData.pollTime}
        totalDays={totalDays}
      />
    </Box>
  );
};
