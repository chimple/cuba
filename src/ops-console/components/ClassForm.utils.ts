export const normalizeWhatsAppInviteLink = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  const parts = trimmed.split('/');
  const code = parts[parts.length - 1];
  if (!code) return '';
  return `https://chat.whatsapp.com/invite/${code}`;
};

export const extractGroupIdFromInviteResponse = (response: unknown): string => {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return '';
  }
  const inviteResponse = response as {
    data?: { group_id?: string | null };
  };
  const nestedGroupId = inviteResponse.data?.group_id;
  if (typeof nestedGroupId === 'string' && nestedGroupId.trim() !== '') {
    return nestedGroupId.trim();
  }
  return '';
};
