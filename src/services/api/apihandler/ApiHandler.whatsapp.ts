import { ApiHandlerFieldActivities } from './ApiHandler.fieldActivities';
import { Json } from '../../database';

export class ApiHandlerWhatsApp extends ApiHandlerFieldActivities {
  async getWhatsappGroupDetails(groupId: string, bot: string) {
    return this.s.getWhatsappGroupDetails(groupId, bot);
  }

  async getParentWhatsappGroupDetails(groupId: string) {
    if (!this.s.getParentWhatsappGroupDetails) {
      throw new Error(
        'Parent WhatsApp group lookup RPC is not implemented in current API service.',
      );
    }
    return await this.s.getParentWhatsappGroupDetails(groupId);
  }

  async getParentWhatsappMsg91SendResult(
    inviteRows: Json,
    languageCode: string,
    batchSize: number,
  ) {
    if (!this.s.getParentWhatsappMsg91SendResult) {
      throw new Error(
        'Parent WhatsApp MSG91 send RPC is not implemented in current API service.',
      );
    }
    return await this.s.getParentWhatsappMsg91SendResult(
      inviteRows,
      languageCode,
      batchSize,
    );
  }

  async getParentWhatsappMsg91ReportRows(startDate: string, endDate: string) {
    if (!this.s.getParentWhatsappMsg91ReportRows) {
      throw new Error(
        'Parent WhatsApp MSG91 report RPC is not implemented in current API service.',
      );
    }
    return await this.s.getParentWhatsappMsg91ReportRows(startDate, endDate);
  }

  async uploadParentWhatsappMediaRpc(
    fileB64: string,
    fileName: string,
    mimeType: string,
  ) {
    if (!this.s.uploadParentWhatsappMediaRpc) {
      throw new Error(
        'Parent WhatsApp media upload RPC is not implemented in current API service.',
      );
    }
    return await this.s.uploadParentWhatsappMediaRpc(
      fileB64,
      fileName,
      mimeType,
    );
  }

  async sendParentWhatsappTemplateMessageRpc(params: {
    to: string;
    templateName: string;
    templateLang: string;
    messageType: 'utility' | 'marketing';
    mediaId?: string | null;
    mediaType?: 'image' | 'video' | null;
  }) {
    if (!this.s.sendParentWhatsappTemplateMessageRpc) {
      throw new Error(
        'Parent WhatsApp template send RPC is not implemented in current API service.',
      );
    }
    return await this.s.sendParentWhatsappTemplateMessageRpc(params);
  }

  async getGroupIdByInvite(invite_link: string, bot: string) {
    return await this.s.getGroupIdByInvite(invite_link, bot);
  }

  getPhoneDetailsByBotNum(bot?: string, groupId?: string | null) {
    return this.s.getPhoneDetailsByBotNum(bot, groupId);
  }

  async updateWhatsAppGroupSettings(
    chatId: string,
    phone: string,
    name: string,
    messagesAdminsOnly?: boolean,
    infoAdminsOnly?: boolean,
    addMembersAdminsOnly?: boolean,
  ): Promise<boolean> {
    return this.s.updateWhatsAppGroupSettings(
      chatId,
      phone,
      name,
      messagesAdminsOnly,
      infoAdminsOnly,
      addMembersAdminsOnly,
    );
  }

  getWhatsAppGroupByInviteLink(
    inviteLink: string,
    bot: string,
    classId: string,
  ): Promise<{ group_id: string; group_name: string; members: number } | null> {
    return this.s.getWhatsAppGroupByInviteLink(inviteLink, bot, classId);
  }
}
