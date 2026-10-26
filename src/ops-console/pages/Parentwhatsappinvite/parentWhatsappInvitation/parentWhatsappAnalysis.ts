import { ApiHandler } from '../../../../services/api/ApiHandler';
import {
  formatSmsReadyIndianPhone,
  normalizeIndianPhone10,
} from '../../../utils/phoneNormalization';
import {
  buildApiError,
  logParentWhatsappEvent,
  normalizeUdiseCode,
  parseWhatsappGroupDetails,
} from './parentWhatsappHelpers';
import type {
  DirectClassRow,
  ParentWhatsappAnalysisResult,
  ParentWhatsappInviteRow,
  ParentWhatsappSchoolRow,
} from './parentWhatsappTypes';

const fetchParentPhonesForClass = async (
  api: ApiHandler,
  classId: string,
): Promise<Set<string>> => {
  const rawPhones = await api.getParentWhatsappParentPhonesByClassId(classId);
  const parentPhones = new Set<string>();
  rawPhones.forEach((phone) => {
    const normalizedParentPhone = normalizeIndianPhone10(phone);
    if (normalizedParentPhone) {
      parentPhones.add(normalizedParentPhone);
    }
  });

  return parentPhones;
};

const findSchoolByUdise = async (
  api: ApiHandler,
  udiseCode: string,
): Promise<ParentWhatsappSchoolRow | null> => {
  return await api.getParentWhatsappSchoolByUdise(udiseCode);
};

const fetchClassesForSchool = async (
  api: ApiHandler,
  schoolId: string,
): Promise<DirectClassRow[]> => {
  return await api.getParentWhatsappClassesBySchoolId([schoolId]);
};

const fetchWhatsappGroupDetails = async (
  api: ApiHandler,
  groupId: string,
): Promise<unknown> => {
  try {
    return await api.getParentWhatsappGroupDetails(groupId);
  } catch (error) {
    throw buildApiError({
      message: 'Failed to fetch WhatsApp group details.',
      exceptionMessage: error instanceof Error ? error.message : String(error),
      payload: error,
    });
  }
};

export const processParentWhatsappUdiseCodes = async (params: {
  api: ApiHandler;
  udiseCodes: string[];
  limit: number;
}): Promise<ParentWhatsappAnalysisResult> => {
  const { api, udiseCodes, limit } = params;
  const processedUdise: string[] = [];
  const inviteList: ParentWhatsappInviteRow[] = [];
  const failedGroups: ParentWhatsappAnalysisResult['failedGroups'] = [];

  outerLoop: for (const rawUdise of udiseCodes) {
    const udise = normalizeUdiseCode(rawUdise);
    if (!udise) continue;

    const school = await findSchoolByUdise(api, udise);
    if (!school) continue;

    const classes = await fetchClassesForSchool(api, school.id);

    for (const classRow of classes) {
      const groupId = String(classRow.group_id ?? '').trim();

      if (!groupId) {
        continue;
      }

      try {
        const rawGroup = await fetchWhatsappGroupDetails(api, groupId);
        const group = parseWhatsappGroupDetails(rawGroup);
        const inviteLink =
          group.inviteLink ??
          String(classRow.whatsapp_invite_link ?? '').trim();
        const parentPhones = await fetchParentPhonesForClass(api, classRow.id);
        const missingPhones = Array.from(parentPhones).filter(
          (phone) => !group.members.has(phone),
        );

        logParentWhatsappEvent('analysis_class', {
          udise,
          schoolId: school.id,
          schoolName: school.name,
          classId: classRow.id,
          className: classRow.name,
          groupId,
          countParents: parentPhones.size,
          countMembers: group.members.size,
          countMissing: missingPhones.length,
        });

        for (const phone of missingPhones) {
          if (inviteList.length >= limit) {
            processedUdise.push(udise);
            break outerLoop;
          }

          if (!inviteLink) {
            continue;
          }

          const mobile = formatSmsReadyIndianPhone(phone);
          if (!mobile) {
            continue;
          }

          inviteList.push({
            udise,
            school: school.name,
            className: classRow.name,
            mobile,
            inviteLink,
          });
        }
      } catch (error) {
        const apiError =
          error instanceof Error
            ? buildApiError({
                message: error.message,
                exceptionMessage: error.message,
              })
            : buildApiError({
                message: 'Failed to fetch WhatsApp group details.',
              });

        logParentWhatsappEvent('analysis_group_failed', {
          udise,
          schoolId: school.id,
          schoolName: school.name,
          classId: classRow.id,
          className: classRow.name,
          groupId,
          statusCode: apiError.statusCode,
          exceptionMessage: apiError.exceptionMessage,
        });

        failedGroups.push({
          udise,
          school: school.name,
          className: classRow.name,
          groupId,
          error: apiError.message,
          statusCode: apiError.statusCode,
          responseText: apiError.responseText,
          exceptionMessage: apiError.exceptionMessage,
        });
      }
    }

    if (!processedUdise.includes(udise)) {
      processedUdise.push(udise);
    }

    if (inviteList.length >= limit) {
      break;
    }
  }

  return {
    processedUdise,
    inviteList,
    failedGroups,
    totalMissing: inviteList.length,
  };
};
