import { useCallback, useEffect, useState } from 'react';
import type { CampaignNotificationListItem } from '../../../services/api/ServiceApi';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';

export const useMessagesListingData = () => {
  const [messages, setMessages] = useState<CampaignNotificationListItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const loadMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      setMessages(
        await ServiceConfig.getI().apiHandler.getCampaignNotifications(),
      );
    } catch (error) {
      logger.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);
  useEffect(() => {
    let active = true;
    setLoadingLabels(true);
    void ServiceConfig.getI()
      .apiHandler.getCampaignNotificationLabels()
      .then((labels) => active && setLabelOptions(labels))
      .catch(() => active && setLabelOptions([]))
      .finally(() => active && setLoadingLabels(false));
    return () => {
      active = false;
    };
  }, []);
  return {
    labelOptions,
    loadingLabels,
    loadMessages,
    messages,
    messagesLoading,
  };
};
