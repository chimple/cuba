import { useEffect, useState } from 'react';
import { t } from 'i18next';
import { TableTypes } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import type { ApiHandler } from '../../services/api/ApiHandler';
import type { Json } from '../../services/database';
import logger from '../../utility/logger';
import { normalizeIndianPhone10 } from '../utils/phoneNormalization';

type WhatsAppGroupDetails = {
  name?: string;
  members?: string[];
  inviteLink?: string;
};

// Narrow the external group response before reading its optional fields.
const parseWhatsAppGroupDetails = (group: Json): WhatsAppGroupDetails | null =>
  typeof group === 'object' && group !== null && !Array.isArray(group)
    ? (group as WhatsAppGroupDetails)
    : null;

// Count only class contacts found in the group to exclude unrelated participants.
const countMatchingWhatsAppMembers = (
  groupMembers: string[],
  contactPhones: string[],
): number => {
  const normalizedGroupMembers = new Set<string>();
  groupMembers.forEach((member) => {
    const phone = normalizeIndianPhone10(member);
    if (phone) normalizedGroupMembers.add(phone);
  });

  const matchedContactPhones = new Set<string>();
  contactPhones.forEach((contactPhone) => {
    const phone = normalizeIndianPhone10(contactPhone);
    if (phone && normalizedGroupMembers.has(phone)) {
      matchedContactPhones.add(phone);
    }
  });
  return matchedContactPhones.size;
};

const fetchMatchedMemberCount = async (
  api: ApiHandler,
  classId: string,
  groupMembers: string[],
): Promise<number> => {
  // Fetch every parent and teacher phone so the count covers all class contacts.
  const [parentPhones, teachers] = await Promise.all([
    api.getParentWhatsappParentPhonesByClassId(classId),
    api.getTeachersForClass(classId),
  ]);
  const contactPhones = [
    ...parentPhones,
    ...(teachers ?? []).map((teacher) => teacher.phone ?? ''),
  ];
  return countMatchingWhatsAppMembers(groupMembers, contactPhones);
};

export const useWhatsAppInfoCard = ({
  classData,
  schoolData,
  onGroupLinked,
}: {
  classData?: TableTypes<'class'>;
  schoolData?: TableTypes<'school'>;
  onGroupLinked?: (classId: string, groupId: string) => void;
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const groupId = classData?.group_id;
  const bot = schoolData?.whatsapp_bot_number;
  const [groupName, setGroupName] = useState<string | null>(null);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [members, setMembers] = useState<number | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openChangePopup, setOpenChangePopup] = useState(false);
  const [step, setStep] = useState<'confirm' | 'input'>('confirm');
  const [inviteInput, setInviteInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [classDoc, setClassDoc] = useState<TableTypes<'class'>>();
  const [isChangingGroup, setIsChangingGroup] = useState(false);
  const [isDisconnectedGroup, setIsDisconnectedGroup] = useState(false);
  const [isStatusResolved, setIsStatusResolved] = useState(false);
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);

  useEffect(() => {
    let isMounted = true;
    if (!classData?.id) {
      setClassDoc(undefined);
      setGroupName(null);
      setEditedGroupName('');
      setMembers(null);
      setInviteLink(null);
      setIsChangingGroup(true);
      setIsDisconnectedGroup(false);
      setIsStatusResolved(true);
      return;
    }
    const init = async () => {
      if (isMounted) {
        setIsStatusResolved(false);
      }
      try {
        const updatedClass = await api.getClassById(classData.id);
        if (!isMounted) return;

        if (updatedClass) {
          setClassDoc(updatedClass);
        }
        if (!updatedClass?.group_id || !bot) {
          resetPopup();
          setIsChangingGroup(true);
          setIsDisconnectedGroup(false);
          return;
        }
        const group = await api.getWhatsappGroupDetails(
          updatedClass.group_id,
          bot,
        );
        if (!isMounted) return;

        const parsedGroup = parseWhatsAppGroupDetails(group);

        if (parsedGroup === null) {
          setGroupName(null);
          setEditedGroupName('');
          setMembers(null);
          setInviteLink(null);
          setIsChangingGroup(true);
          setIsDisconnectedGroup(true);
          return;
        }

        const groupMembers = Array.isArray(parsedGroup.members)
          ? parsedGroup.members
          : [];
        const matchedMemberCount = await fetchMatchedMemberCount(
          api,
          updatedClass.id,
          groupMembers,
        );
        if (!isMounted) return;

        setGroupName(parsedGroup.name ?? null);
        setEditedGroupName(parsedGroup.name ?? '');
        setMembers(matchedMemberCount);
        setInviteLink(parsedGroup.inviteLink ?? null);
        setIsChangingGroup(false);
        setIsDisconnectedGroup(false);
      } catch (err) {
        logger.error('Failed to fetch data:', err);
        setGroupName(null);
        setEditedGroupName('');
        setMembers(null);
        setInviteLink(null);
        setIsChangingGroup(true);
        setIsDisconnectedGroup(true);
      } finally {
        if (isMounted) {
          setIsStatusResolved(true);
        }
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [api, classData?.id, bot]);

  const handleEdit = () => {
    setEditedGroupName(groupName ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedGroupName(groupName ?? '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    const targetGroupId = classDoc?.group_id ?? groupId ?? '';
    if (!targetGroupId || !bot) return;

    setIsSaving(true);
    setError(null);
    try {
      const success = await api.updateWhatsAppGroupSettings(
        targetGroupId,
        bot,
        editedGroupName,
      );

      if (success) {
        setGroupName(editedGroupName);
        setIsEditing(false);
      }
    } catch (err) {
      logger.error('Failed to update WhatsApp group settings:', err);
      setError(t('Something went wrong. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const normalizeInviteLink = (input: string): string | null => {
    const trimmed = input.trim();
    const regex =
      /^https:\/\/chat\.whatsapp\.com\/(invite\/)?([A-Za-z0-9]{10,})(\?.*)?$/;

    const match = trimmed.match(regex);
    if (!match) return null;

    return `https://chat.whatsapp.com/invite/${match[2]}`;
  };

  const resetPopup = () => {
    setOpenChangePopup(false);
    setStep('confirm');
    setInviteInput('');
    setError(null);
    setLoading(false);
  };

  const handleInviteSubmit = async () => {
    const normalized = normalizeInviteLink(inviteInput);
    if (!normalized) {
      setError(t('Please enter a valid WhatsApp invite link'));
      return;
    }
    if (!bot) return;
    setLoading(true);
    setError(null);

    try {
      const linkedClassId = String(classDoc?.id ?? classData?.id ?? '').trim();
      const result = await api.getWhatsAppGroupByInviteLink(
        normalized,
        bot,
        linkedClassId,
      );
      if (result) {
        // Refresh the linked group because invite lookup returns only a raw count.
        const group = await api.getWhatsappGroupDetails(result.group_id, bot);
        const parsedGroup = parseWhatsAppGroupDetails(group);
        const groupMembers = Array.isArray(parsedGroup?.members)
          ? parsedGroup.members
          : [];
        const matchedMemberCount = linkedClassId
          ? await fetchMatchedMemberCount(api, linkedClassId, groupMembers)
          : 0;
        setGroupName(result.group_name);
        setMembers(matchedMemberCount);
        setInviteLink(normalized);
        setClassDoc((prev) =>
          prev ? { ...prev, group_id: result.group_id } : prev,
        );
        setIsChangingGroup(false);
        setIsDisconnectedGroup(false);
        if (linkedClassId) {
          onGroupLinked?.(linkedClassId, result.group_id);
        }
      } else {
        setError(t('No WhatsApp group found for this invite link'));
        return;
      }
    } catch (err) {
      logger.error(err);
      setError(t('Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const openChangeGroupPopup = () => {
    setStep('confirm');
    setInviteInput('');
    setError(null);
    setOpenChangePopup(true);
  };

  const cancelInviteEntry = () => {
    const hasExistingGroupName = (groupName ?? '').trim().length > 0;
    setIsChangingGroup(!hasExistingGroupName);
    setInviteInput('');
    setError(null);
  };

  return {
    cancelInviteEntry,
    classDoc,
    editedGroupName,
    error,
    groupId,
    groupName,
    handleCancel,
    handleEdit,
    handleInviteSubmit,
    handleSave,
    inviteInput,
    inviteLink,
    isChangingGroup,
    isDisconnectedGroup,
    isEditing,
    isExternalUser,
    isSaving,
    isStatusResolved,
    loading,
    members,
    openChangeGroupPopup,
    openChangePopup,
    resetPopup,
    setEditedGroupName,
    setInviteInput,
    setIsChangingGroup,
    step,
  };
};
