import type { EnumType } from '../../../common/constants';

export type FcQuestion = { id: string; question: string };

export const callOutcomeOptions: {
  value: EnumType<'fc_call_result'>;
  label: string;
}[] = [
  { value: 'call_picked', label: 'Call Attended' },
  { value: 'call_later', label: 'Call Later' },
  { value: 'call_not_reachable', label: 'No Response' },
];

export const engagementTargetOptions: {
  value: EnumType<'fc_engagement_target'>;
  label: string;
}[] = [
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
];
