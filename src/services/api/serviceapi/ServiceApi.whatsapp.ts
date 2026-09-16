import { Json } from '../../database';

export type WhatsappIntegrationStatusRow = {
  school_id: string;
  school_name: string;
  group_id: string | null;
  periskope_connected: boolean;
  maytapi_connected: boolean;
};

export type WhatsappIntegrationStatusResponse = {
  data: WhatsappIntegrationStatusRow[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export type WhatsappIntegrationStatusParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export interface ServiceApiWhatsApp {
  getWhatsappGroupDetails(groupId: string, bot: string): Promise<Json>;

  getWhatsappIntegrationStatus(
    params?: WhatsappIntegrationStatusParams,
  ): Promise<WhatsappIntegrationStatusResponse>;

  getParentWhatsappGroupDetails?: (groupId: string) => Promise<Json>;

  getParentWhatsappMsg91SendResult?: (
    inviteRows: Json,
    languageCode: string,
    batchSize: number,
  ) => Promise<Json>;

  getParentWhatsappMsg91ReportRows?: (
    startDate: string,
    endDate: string,
  ) => Promise<Json>;

  uploadParentWhatsappMediaRpc?: (
    fileB64: string,
    fileName: string,
    mimeType: string,
  ) => Promise<Json>;

  sendParentWhatsappTemplateMessageRpc?: (params: {
    to: string;
    templateName: string;
    templateLang: string;
    messageType: 'utility' | 'marketing';
    mediaId?: string | null;
    mediaType?: 'image' | 'video' | null;
  }) => Promise<Json>;

  getGroupIdByInvite(invite_link: string, bot: string): Promise<Json>;

  getPhoneDetailsByBotNum(bot?: string, groupId?: string | null): Promise<Json>;

  updateWhatsAppGroupSettings(
    chatId: string,
    phone: string,
    name: string,
    messagesAdminsOnly?: boolean,
    infoAdminsOnly?: boolean,
    addMembersAdminsOnly?: boolean,
  ): Promise<boolean>;

  getWhatsAppGroupByInviteLink(
    inviteLink: string,
    bot: string,
    classId: string,
  ): Promise<{
    group_id: string;
    group_name: string;
    members: number;
  } | null>;
}
