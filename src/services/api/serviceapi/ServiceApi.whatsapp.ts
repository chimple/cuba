import { Json } from '../../database';

export interface ServiceApiWhatsApp {
  getWhatsappGroupDetails(groupId: string, bot: string): Promise<Json>;

  getParentWhatsappGroupDetails?: (groupId: string) => Promise<Json>;

  getParentWhatsappMsg91SendResult?: (
    inviteRows: Json,
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
