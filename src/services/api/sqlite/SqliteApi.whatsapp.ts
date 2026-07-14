import { Json } from '../../database';
import { SqliteApiSticker } from './SqliteApi.sticker';

export interface SqliteApiWhatsApp {
  [key: string]: any;
}
export class SqliteApiWhatsApp extends SqliteApiSticker {
  // Parent WhatsApp Invitation: exact UDISE school lookup with minimal fields.
  async getParentWhatsappSchoolByUdise(udiseCode: string): Promise<{
    id: string;
    name: string;
    whatsapp_bot_number?: string | null;
  } | null> {
    if (!this._serverApi.getParentWhatsappSchoolByUdise) {
      throw new Error(
        'Parent WhatsApp school lookup is not implemented in Supabase API.',
      );
    }
    return await this._serverApi.getParentWhatsappSchoolByUdise(udiseCode);
  }
  // Parent WhatsApp Invitation: class lookup with group/invite fields.
  async getParentWhatsappClassesBySchoolId(schoolId: string): Promise<
    {
      id: string;
      name: string;
      group_id?: string | null;
      whatsapp_invite_link?: string | null;
    }[]
  > {
    if (!this._serverApi.getParentWhatsappClassesBySchoolId) {
      throw new Error(
        'Parent WhatsApp class lookup is not implemented in Supabase API.',
      );
    }
    return await this._serverApi.getParentWhatsappClassesBySchoolId(schoolId);
  }

  // Parent WhatsApp Invitation: parent phones from class_user -> user join.
  async getParentWhatsappParentPhonesByClassId(
    classId: string,
  ): Promise<string[]> {
    if (!this._serverApi.getParentWhatsappParentPhonesByClassId) {
      throw new Error(
        'Parent WhatsApp parent phone lookup is not implemented in Supabase API.',
      );
    }
    return await this._serverApi.getParentWhatsappParentPhonesByClassId(
      classId,
    );
  }
  async validateWhatsappBotNumber(
    whatsappBotNumber: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const response =
      await this._serverApi.validateWhatsappBotNumber(whatsappBotNumber);
    if (response.status === 'error') {
      return {
        status: 'error',
        errors: response.errors || ['Invalid WHATSAPP BOT NUMBER'],
      };
    }
    return { status: 'success' };
  }
  async validateWhatsappGroupLink(
    whatsappBotNumber: string,
    whatsappGroupLink: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const response = await this._serverApi.validateWhatsappGroupLink(
      whatsappBotNumber,
      whatsappGroupLink,
    );
    if (response.status === 'error') {
      return {
        status: 'error',
        errors: response.errors || ['Invalid WHATSAPP GROUP LINK'],
      };
    }
    return { status: 'success' };
  }
  async getWhatsappGroupDetails(groupId: string, bot: string) {
    return this._serverApi.getWhatsappGroupDetails(groupId, bot);
  }
  async getParentWhatsappGroupDetails(groupId: string) {
    return this._serverApi.getParentWhatsappGroupDetails
      ? await this._serverApi.getParentWhatsappGroupDetails(groupId)
      : [];
  }
  async getParentWhatsappMsg91SendResult(inviteRows: Json, batchSize: number) {
    return this._serverApi.getParentWhatsappMsg91SendResult
      ? await this._serverApi.getParentWhatsappMsg91SendResult(
          inviteRows,
          batchSize,
        )
      : {
          successCount: 0,
          failedBatches: [],
        };
  }
  async getParentWhatsappMsg91ReportRows(startDate: string, endDate: string) {
    return this._serverApi.getParentWhatsappMsg91ReportRows
      ? await this._serverApi.getParentWhatsappMsg91ReportRows(
          startDate,
          endDate,
        )
      : {
          success: true,
          statusCode: 200,
          data: [],
          raw: [],
        };
  }
  async uploadParentWhatsappMediaRpc(
    fileB64: string,
    fileName: string,
    mimeType: string,
  ) {
    return this._serverApi.uploadParentWhatsappMediaRpc
      ? await this._serverApi.uploadParentWhatsappMediaRpc(
          fileB64,
          fileName,
          mimeType,
        )
      : {
          success: false,
          statusCode: 500,
          responseText: 'Parent WhatsApp media upload RPC not implemented.',
        };
  }
  async sendParentWhatsappTemplateMessageRpc(params: {
    to: string;
    templateName: string;
    templateLang: string;
    messageType: 'utility' | 'marketing';
    mediaId?: string | null;
    mediaType?: 'image' | 'video' | null;
  }) {
    return this._serverApi.sendParentWhatsappTemplateMessageRpc
      ? await this._serverApi.sendParentWhatsappTemplateMessageRpc(params)
      : {
          success: false,
          statusCode: 500,
          responseText: 'Parent WhatsApp template send RPC not implemented.',
        };
  }
  async getGroupIdByInvite(invite_link: string, bot: string) {
    return await this._serverApi.getGroupIdByInvite(invite_link, bot);
  }
  getPhoneDetailsByBotNum(bot?: string, groupId?: string | null) {
    return this._serverApi.getPhoneDetailsByBotNum(bot, groupId);
  }
  async updateWhatsAppGroupSettings(
    chatId: string,
    phone: string,
    name: string,
    messagesAdminsOnly?: boolean,
    infoAdminsOnly?: boolean,
    addMembersAdminsOnly?: boolean,
  ): Promise<boolean> {
    return await this._serverApi.updateWhatsAppGroupSettings(
      chatId,
      phone,
      name,
      messagesAdminsOnly,
      infoAdminsOnly,
      addMembersAdminsOnly,
    );
  }
  async getWhatsAppGroupByInviteLink(
    inviteLink: string,
    bot: string,
    classId: string,
  ): Promise<{
    group_id: string;
    group_name: string;
    members: number;
  } | null> {
    return await this._serverApi.getWhatsAppGroupByInviteLink(
      inviteLink,
      bot,
      classId,
    );
  }
}
