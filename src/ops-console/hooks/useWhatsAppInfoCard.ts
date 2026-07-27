import { useEffect, useState } from 'react';
import { t } from 'i18next';
import { TableTypes } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

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

        const parsedGroup =
          typeof group === 'object' && group !== null && !Array.isArray(group)
            ? (group as {
                name?: string;
                members?: string[];
                inviteLink?: string;
              })
            : null;

        if (parsedGroup === null) {
          setGroupName(null);
          setEditedGroupName('');
          setMembers(null);
          setInviteLink(null);
          setIsChangingGroup(true);
          setIsDisconnectedGroup(true);
          return;
        }

        const parsedMembers = Array.isArray(parsedGroup?.members)
          ? (parsedGroup?.members ?? [])
          : [];

        setGroupName(parsedGroup?.name ?? null);
        setEditedGroupName(parsedGroup?.name ?? '');
        setMembers(parsedMembers.length);
        setInviteLink(parsedGroup?.inviteLink ?? null);
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
        setGroupName(result.group_name);
        setMembers(result.members);
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
