import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TeacherInfo,
  WHATSAPP_GROUP_STATUS_KEYS,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { normalizePhone10 } from '../../pages/NewUserPageOps';
import type { ClassRow } from './SchoolClass';
import {
  getWhatsappAvailabilityStatus,
  normalizeWhatsappContactFlag,
} from './SchoolTeachers.utils';
import type { TeacherWhatsappGroupStatusKey } from './SchoolTeachers.types';

type UseSchoolTeachersWhatsappProps = {
  api: any;
  bot?: string;
  programScopedClasses: ClassRow[];
};

export const useSchoolTeachersWhatsapp = ({
  api,
  bot,
  programScopedClasses,
}: UseSchoolTeachersWhatsappProps) => {
  const [whatsappMembersByClass, setWhatsappMembersByClass] = useState<
    Map<string, Set<string>>
  >(new Map());

  const classGroupKey = useMemo(() => {
    return programScopedClasses
      .map((row) => `${row?.id ?? ''}:${row?.group_id ?? ''}`)
      .join('|');
  }, [programScopedClasses]);

  const classGroupIdMap = useMemo(() => {
    const map = new Map<string, string>();
    programScopedClasses.forEach((row) => {
      if (row?.id) map.set(row.id, String(row?.group_id ?? '').trim());
    });
    return map;
  }, [programScopedClasses]);

  useEffect(() => {
    let cancelled = false;
    const groupTargets = programScopedClasses.filter(
      (row) => row?.id && row?.group_id && String(row.group_id).trim() !== '',
    );

    if (!bot || !api?.getWhatsappGroupDetails || groupTargets.length === 0) {
      setWhatsappMembersByClass(new Map());
      return;
    }

    (async () => {
      try {
        const results = await Promise.all(
          groupTargets.map(async (row) => {
            try {
              const group = await api.getWhatsappGroupDetails(
                row.group_id as string,
                bot,
              );
              return [row.id as string, group] as const;
            } catch (error) {
              logger.error('Failed to fetch WhatsApp group members:', error);
              return [row.id as string, null] as const;
            }
          }),
        );

        if (cancelled) return;
        const next = new Map<string, Set<string>>();
        results.forEach(([classId, group]) => {
          const parsedGroup =
            typeof group === 'object' && group !== null && !Array.isArray(group)
              ? (group as { members?: string[] })
              : null;
          const members = Array.isArray(parsedGroup?.members)
            ? (parsedGroup?.members ?? [])
            : [];
          const normalizedMembers = new Set<string>(
            members
              .map((member: unknown) => normalizePhone10(String(member)))
              .filter((member): member is string => Boolean(member)),
          );
          next.set(classId, normalizedMembers);
        });
        setWhatsappMembersByClass(next);
      } catch (error) {
        logger.error('Failed to fetch WhatsApp group members:', error);
        if (!cancelled) {
          setWhatsappMembersByClass(new Map());
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, bot, classGroupKey, programScopedClasses]);

  const getGroupIdForClass = useCallback(
    (classId?: string) => {
      if (!classId) return '';
      return String(classGroupIdMap.get(classId) ?? '').trim();
    },
    [classGroupIdMap],
  );

  const isTeacherInWhatsappGroup = useCallback(
    (teacher: TeacherInfo) => {
      const classId = teacher.classWithidname?.id;
      if (!classId) return false;
      const members = whatsappMembersByClass.get(classId);
      if (!members || members.size === 0) return false;
      const phone = normalizePhone10(String(teacher.user?.phone ?? ''));
      return !!phone && members.has(phone);
    },
    [whatsappMembersByClass],
  );

  const getWhatsappGroupStatus = useCallback(
    (teacher: TeacherInfo): TeacherWhatsappGroupStatusKey => {
      const classId = teacher.classWithidname?.id;
      if (!classId) return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
      const waContactRaw =
        (teacher.user as { is_wa_contact?: unknown } | null)?.is_wa_contact ??
        null;
      const groupId = getGroupIdForClass(classId);
      if (!groupId) return getWhatsappAvailabilityStatus(waContactRaw);

      if (isTeacherInWhatsappGroup(teacher)) {
        return WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP;
      }

      const waContact = normalizeWhatsappContactFlag(waContactRaw);
      if (waContact === 'yes') {
        return WHATSAPP_GROUP_STATUS_KEYS.NOT_IN_GROUP;
      }
      if (waContact === 'no') {
        return WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP;
      }
      return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
    },
    [getGroupIdForClass, isTeacherInWhatsappGroup],
  );

  return { getWhatsappGroupStatus };
};
