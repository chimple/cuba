import { SupabaseApiSticker } from './SupabaseApi.sticker';
import { TABLES } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Json } from '../../database';

export interface SupabaseApiWhatsApp {
  [key: string]: any;
}
export class SupabaseApiWhatsApp extends SupabaseApiSticker {
  // Parent WhatsApp Invitation: UDISE school lookup with minimal fields.
  async getParentWhatsappSchoolByUdise(udiseCode: string): Promise<{
    id: string;
    name: string;
    whatsapp_bot_number?: string | null;
  } | null> {
    if (!this.supabase) return null;
    const normalizedUdiseCode = udiseCode.trim();
    const { data, error } = await this.supabase
      .from(TABLES.School)
      .select('id, name, whatsapp_bot_number')
      .eq('is_deleted', false)
      .eq('udise', normalizedUdiseCode)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error in parent WhatsApp school lookup by UDISE:', error);
      throw error;
    }

    return data
      ? {
          id: data.id,
          name: data.name,
          whatsapp_bot_number: data.whatsapp_bot_number,
        }
      : null;
  }

  // Parent WhatsApp Invitation: class lookup with group and invite fields.
  async getParentWhatsappClassesBySchoolId(schoolIds: string[]): Promise<
    {
      id: string;
      name: string;
      group_id?: string | null;
      whatsapp_invite_link?: string | null;
    }[]
  > {
    if (!this.supabase || schoolIds.length === 0) return [];

    const uniqueSchoolIds = Array.from(new Set(schoolIds));
    const { data, error } = await this.supabase
      .from(TABLES.Class)
      .select('id, name, group_id, whatsapp_invite_link')
      .in('school_id', uniqueSchoolIds)
      .eq('is_deleted', false);

    if (error) {
      logger.error(
        'Error in parent WhatsApp class lookup by school IDs:',
        error,
      );
      throw error;
    }

    return (data ?? []).map((classRow) => ({
      id: classRow.id,
      name: classRow.name,
      group_id: classRow.group_id,
      whatsapp_invite_link: classRow.whatsapp_invite_link,
    }));
  }

  // Parent WhatsApp Invitation: parent phone lookup from class_user join.
  async getParentWhatsappParentPhonesByClassId(
    classId: string,
  ): Promise<string[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.ClassUser)
      .select('user:user_id(phone)')
      .eq('class_id', classId)
      .eq('role', RoleType.PARENT)
      .eq('is_deleted', false);

    if (error) {
      logger.error(
        'Error in parent WhatsApp parent phone lookup by class ID:',
        error,
      );
      throw error;
    }

    const phoneSet = new Set<string>();
    (data ?? []).forEach((row: any) => {
      const phone = String(row?.user?.phone ?? '').trim();
      if (phone) {
        phoneSet.add(phone);
      }
    });

    return Array.from(phoneSet);
  }

  async validateWhatsappBotNumber(
    whatsappBotNumber: string,
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }
    try {
      const { data, error } = await this.supabase.functions.invoke(
        'whatsapp-bot-check',
        {
          body: {
            phone: whatsappBotNumber.trim(),
          },
        },
      );
      if (error) {
        return {
          status: 'error',
          errors: [error.message || 'WHATSAPP BOT NUMBER validation failed.'],
        };
      }
      if (data?.working === true) {
        return { status: 'success' };
      }
      const stateInfo =
        data?.wa_state || typeof data?.is_ready === 'boolean'
          ? ` (wa_state: ${data?.wa_state ?? 'unknown'}, is_ready: ${String(
              data?.is_ready,
            )})`
          : '';

      return {
        status: 'error',
        errors: [
          data?.error || `WHATSAPP BOT NUMBER is not active or connected.`,
        ],
      };
    } catch (err) {
      return {
        status: 'error',
        errors: [String(err)],
      };
    }
  }

  async validateWhatsappGroupLink(
    whatsappBotNumber: string,
    whatsappGroupLink: string,
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: 'error',
        errors: ['Supabase client is not initialized'],
      };
    }

    try {
      const { data, error } = await this.supabase.functions.invoke(
        'whatsapp-group-validate',
        {
          body: {
            invite_link: whatsappGroupLink.trim(),
            phone: whatsappBotNumber.trim(),
          },
        },
      );

      if (error) {
        return {
          status: 'error',
          errors: [error.message || 'WHATSAPP GROUP LINK validation failed.'],
        };
      }

      if (data?.valid === true) {
        return { status: 'success' };
      }

      return {
        status: 'error',
        errors: [data?.error || 'Invalid WHATSAPP GROUP LINK.'],
      };
    } catch (err) {
      return {
        status: 'error',
        errors: [String(err)],
      };
    }
  }
  async getWhatsappGroupDetails(groupId: string, bot: string) {
    if (!this.supabase) return [];

    type JsonMap = Record<string, Json | undefined>;
    const getRecord = (
      value: Json | JsonMap | null | undefined,
    ): JsonMap | null =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as JsonMap)
        : null;
    const { data, error } = await this.supabase.functions.invoke(
      'get-whatsapp-group-details-v2',
      {
        body: { groupId, bot },
      },
    );
    logger.info('getWhatsappGroupDetails response', data);
    if (error) {
      throw error;
    }

    const payload = data as Json | JsonMap | null;
    const record = getRecord(payload);

    if (record?.success === false) {
      const details = getRecord(record.details);
      const primaryDetail = String(details?.maytapi ?? '').trim();
      const secondaryDetail = String(details?.periskope ?? '').trim();
      const detailSuffix =
        primaryDetail || secondaryDetail
          ? ` (Primary: ${primaryDetail || 'n/a'} | Secondary: ${
              secondaryDetail || 'n/a'
            })`
          : '';
      throw new Error(
        `${String(record.error ?? 'Failed to fetch WhatsApp group')}${detailSuffix}`,
      );
    }

    return record?.data ?? payload;
  }
  async getParentWhatsappGroupDetails(groupId: string) {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase.rpc(
      'parent_wa_get_group_details',
      {
        p_group_id: groupId,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }
  async getParentWhatsappMsg91SendResult(inviteRows: Json, batchSize: number) {
    if (!this.supabase)
      return {
        successCount: 0,
        failedBatches: [],
      };
    const { data, error } = await this.supabase.rpc(
      'send_parent_whatsapp_msg91_invites',
      {
        p_invite_rows: inviteRows,
        p_batch_size: batchSize,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }
  async getParentWhatsappMsg91ReportRows(startDate: string, endDate: string) {
    if (!this.supabase) {
      return {
        success: true,
        statusCode: 200,
        data: [],
        raw: [],
      };
    }
    const { data, error } = await this.supabase.rpc(
      'fetch_parent_whatsapp_msg91_report',
      {
        p_start_date: startDate,
        p_end_date: endDate,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }
  async uploadParentWhatsappMediaRpc(
    fileB64: string,
    fileName: string,
    mimeType: string,
  ) {
    if (!this.supabase) {
      return {
        success: false,
        statusCode: 500,
        responseText: 'Supabase client is not initialized.',
      };
    }
    const { data, error } = await this.supabase.functions.invoke(
      'upload-parent-whatsapp-media',
      {
        body: {
          fileB64,
          fileName,
          mimeType,
        },
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }
  async sendParentWhatsappTemplateMessageRpc(params: {
    to: string;
    templateName: string;
    templateLang: string;
    messageType: 'utility' | 'marketing';
    mediaId?: string | null;
    mediaType?: 'image' | 'video' | null;
  }) {
    if (!this.supabase) {
      return {
        success: false,
        statusCode: 500,
        responseText: 'Supabase client is not initialized.',
      };
    }
    const { data, error } = await this.supabase.rpc(
      'send_parent_whatsapp_template_message',
      {
        p_to: params.to,
        p_template_name: params.templateName,
        p_template_lang: params.templateLang,
        p_message_type: params.messageType,
        p_media_id: params.mediaId ?? undefined,
        p_media_type: params.mediaType ?? undefined,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }
  async getGroupIdByInvite(invite_link: string, bot: string) {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase.functions.invoke(
      'get-groupId-by-invite-v2',
      {
        body: { invite_link, bot },
      },
    );

    if (error) {
      throw error;
    }
    return data;
  }

  async getPhoneDetailsByBotNum(bot?: string, groupId?: string | null) {
    if (!this.supabase) return [];

    type JsonMap = Record<string, Json | undefined>;
    const getRecord = (
      value: Json | JsonMap | null | undefined,
    ): JsonMap | null =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as JsonMap)
        : null;
    const { data, error } = await this.supabase.functions.invoke(
      'get-phoneDetails-by-botNum-v2',
      {
        body: { bot, groupId },
      },
    );

    if (error) {
      throw error;
    }

    const payload = data as Json | JsonMap | null;
    const record = getRecord(payload);

    if (record?.success === false) {
      throw new Error(
        String(record.error ?? 'Failed to fetch WhatsApp phone details'),
      );
    }

    const parsed = record?.data ?? payload;
    return parsed;
  }
  async updateWhatsAppGroupSettings(
    chatId: string,
    phone: string,
    name: string,
    messagesAdminsOnly?: boolean,
    infoAdminsOnly?: boolean,
    addMembersAdminsOnly?: boolean,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    type JsonMap = Record<string, Json | undefined>;
    const getRecord = (
      value: Json | JsonMap | null | undefined,
    ): JsonMap | null =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as JsonMap)
        : null;
    const { data, error } = await this.supabase.functions.invoke(
      'edit-whatsapp-group-details-v2',
      {
        body: {
          chatId,
          phone,
          name,
          messagesAdminsOnly,
          infoAdminsOnly,
          addMembersAdminsOnly,
        },
      },
    );

    if (error) {
      throw error;
    }

    const payload = data as Json | JsonMap | null;
    const record = getRecord(payload);
    if (record?.success === false) {
      const diagnostics = getRecord(record.diagnostics);
      const winner = String(record.winner ?? '').trim();
      const detailSuffix = diagnostics
        ? ` (${JSON.stringify(diagnostics)})`
        : '';
      throw new Error(
        `${String(record.error ?? 'Failed to update WhatsApp group')}${
          winner ? ` [winner: ${winner}]` : ''
        }${detailSuffix}`,
      );
    }
    return record?.success === true;
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
    if (!this.supabase) return null;

    type JsonMap = Record<string, Json | undefined>;
    const getRecord = (
      value: Json | JsonMap | null | undefined,
    ): JsonMap | null =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as JsonMap)
        : null;
    const getLookupPayload = (payload: Json | JsonMap | null): JsonMap | null =>
      getRecord(getRecord(payload)?.data) ?? getRecord(payload);

    const getGroupIdFromPayload = (payload: Json | JsonMap | null): string => {
      const parsed = getLookupPayload(payload);
      return String(
        parsed?.group_id ?? parsed?.id ?? parsed?.conversation_id ?? '',
      ).trim();
    };

    const getGroupNameFromPayload = (
      payload: Json | JsonMap | null,
    ): string => {
      const parsed = getLookupPayload(payload);
      return String(
        parsed?.group_name ?? parsed?.name ?? parsed?.subject ?? '',
      ).trim();
    };

    const getMembersCountFromPayload = (
      payload: Json | JsonMap | null,
    ): number => {
      const parsed = getLookupPayload(payload);
      const members = parsed?.members;
      const participants = parsed?.participants;

      if (Array.isArray(members)) return members.length;
      if (Array.isArray(participants)) return participants.length;

      const count = Number(
        parsed?.members_count ?? members ?? parsed?.size ?? 0,
      );
      return Number.isFinite(count) ? count : 0;
    };

    const isLookupErrorPayload = (
      payload: Json | JsonMap | null,
      groupId: string,
    ): boolean => {
      const parsed = getLookupPayload(payload);
      return Boolean(
        !groupId ||
        getRecord(payload)?.success === false ||
        parsed?.success === false ||
        getRecord(payload)?.type === 'error' ||
        parsed?.type === 'error',
      );
    };

    const { data, error } = await this.supabase.functions.invoke(
      'get-groupId-by-invite-v2',
      {
        body: {
          invite_link: inviteLink,
          bot,
        },
      },
    );

    const groupId = getGroupIdFromPayload(data);
    if (error || isLookupErrorPayload(data, groupId)) {
      logger.error('Invite lookup failed', error || data);
      return null;
    }

    const { error: updateError } = await this.supabase
      .from(TABLES.Class)
      .update({
        group_id: groupId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', classId);

    if (updateError) {
      logger.error('Failed to update class with group_id', updateError);
      return null;
    }

    return {
      group_id: groupId,
      group_name: getGroupNameFromPayload(data),
      members: getMembersCountFromPayload(data),
    };
  }
}
