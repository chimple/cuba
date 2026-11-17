import type React from 'react';
import type { PushNotificationDraft } from '../pushNotificationCompose/PushNotificationComposeComponents';

export const createImageChangeHandler =
  (
    setImageFile: React.Dispatch<React.SetStateAction<File | null>>,
    setDraft: React.Dispatch<React.SetStateAction<PushNotificationDraft>>,
  ) =>
  (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const imageUrl = URL.createObjectURL(file);
    setDraft((current) => {
      if (current.imageUrl) URL.revokeObjectURL(current.imageUrl);
      return { ...current, imageUrl, imageName: file.name };
    });
  };
