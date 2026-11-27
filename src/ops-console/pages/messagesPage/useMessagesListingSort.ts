import { useState } from 'react';
import type { MessageSortKey } from './MessagesListingTable';

export const useMessagesListingSort = () => {
  const [sortKey, setSortKey] = useState<MessageSortKey>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: MessageSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return { sortDirection, sortKey, toggleSort };
};
