export type {
  ParentWhatsappAnalysisResult,
  ParentWhatsappApiError,
  ParentWhatsappConfigStatus,
  ParentWhatsappFailedGroupRow,
  ParentWhatsappInviteRow,
  ParentWhatsappSendFailure,
  ParentWhatsappSmsBatchFailure,
  ParentWhatsappSmsSendResult,
} from './parentWhatsappInvitation/parentWhatsappTypes';

export {
  fetchParentWhatsappMsg91Report,
  sendParentWhatsappMsg91Invites,
} from './parentWhatsappInvitation/parentWhatsappMsg91';
export { processParentWhatsappUdiseCodes } from './parentWhatsappInvitation/parentWhatsappAnalysis';
export {
  sendParentWhatsappTemplateMessage,
  uploadParentWhatsappMedia,
} from './parentWhatsappInvitation/parentWhatsappMessages';

export const getParentWhatsappConfigStatus = () => ({
  hasMsg91Send: true,
  hasMsg91Report: true,
  hasWhatsappMediaUpload: true,
  hasWhatsappTemplateSend: true,
});
