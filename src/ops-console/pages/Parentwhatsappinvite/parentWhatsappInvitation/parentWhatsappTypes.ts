// Common external API error object propagated to UI and logs.
export type ParentWhatsappApiError = {
  message: string;
  statusCode?: number;
  responseText?: string;
  exceptionMessage?: string;
};

// A single parent invite row generated from UDISE analysis.
export type ParentWhatsappInviteRow = {
  udise: string;
  school: string;
  className: string;
  mobile: string;
  inviteLink: string;
};

// Captures per-group failures during WhatsApp group/member analysis.
export type ParentWhatsappFailedGroupRow = {
  udise: string;
  school: string;
  className: string;
  groupId: string;
  error: string;
  statusCode?: number;
  responseText?: string;
  exceptionMessage?: string;
};

// End-to-end analysis output used by the invite send flow.
export type ParentWhatsappAnalysisResult = {
  processedUdise: string[];
  inviteList: ParentWhatsappInviteRow[];
  failedGroups: ParentWhatsappFailedGroupRow[];
  totalMissing: number;
};

// Details of one failed MSG91 batch send attempt.
export type ParentWhatsappSmsBatchFailure = {
  batchIndex: number;
  recipients: string[];
  inviteRows: ParentWhatsappInviteRow[];
  error: ParentWhatsappApiError;
};

// MSG91 send result summary with success count and failed batches.
export type ParentWhatsappSmsSendResult = {
  successCount: number;
  failedBatches: ParentWhatsappSmsBatchFailure[];
};

// Per-number WhatsApp template send failure details.
export type ParentWhatsappSendFailure = {
  mobile: string;
  error: ParentWhatsappApiError;
};

// Flags showing whether required external endpoints are configured.
export type ParentWhatsappConfigStatus = {
  hasMsg91Send: boolean;
  hasMsg91Report: boolean;
  hasWhatsappMediaUpload: boolean;
  hasWhatsappTemplateSend: boolean;
};

export type ParsedWhatsappGroup = {
  members: Set<string>;
  inviteLink: string | null;
};

export type MaytapiGroupPayload = {
  data?: {
    participants?: unknown[];
    members?: unknown[];
    invite?: string;
    inviteLink?: string;
  };
  participants?: unknown[];
  members?: unknown[];
  invite?: string;
  inviteLink?: string;
};

export type ParsedEndpointResponse = {
  response: Response;
  text: string;
  payload: unknown;
};

export type DirectClassRow = {
  id: string;
  name: string;
  group_id?: string | null;
  whatsapp_invite_link?: string | null;
};

export type ParentWhatsappSchoolRow = {
  id: string;
  name: string;
  whatsapp_bot_number?: string | null;
};
