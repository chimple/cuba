import { CampaignAssignmentDraft } from './campaignAssignmentUtils';
import {
  CampaignCommunicationRowState,
  CampaignCommunicationState,
  CampaignCommunicationValidation,
} from './campaignCommunicationUtils';
import { CampaignSetupFormState } from './types';

export type CampaignCommunicationTimelineStepProps = {
  form: CampaignSetupFormState;
  assignmentDrafts: CampaignAssignmentDraft[];
  selectedSchoolIds: string[];
  communicationState: CampaignCommunicationState;
  communicationValidation: CampaignCommunicationValidation;
  showValidation: boolean;
  onMessageTimeChange: (value: string) => void;
  onPollTimeChange: (value: string) => void;
  onRowChange: (
    date: string,
    updater: (
      row: CampaignCommunicationRowState,
    ) => CampaignCommunicationRowState,
  ) => void;
  onClearRow: (date: string) => void;
};

export type CampaignReachSummary = {
  groupCount: number;
  memberCount: number;
};
