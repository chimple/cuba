import React, { useMemo, useState } from 'react';
import {
  Add,
  ArrowDropDown,
  FilterAltOutlined,
  Search,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import type { CampaignNotificationListItem } from '../../../services/api/ServiceApi';
import {
  type MessageSortKey,
  MessagesListingTable,
} from './MessagesListingTable';
import './MessagesListing.css';

type Props = {
  messages: CampaignNotificationListItem[];
  loading: boolean;
  onCreate: () => void;
  onOpen: (message: CampaignNotificationListItem) => void;
};

type SortKey = MessageSortKey;

type SchoolModel = 'at_school' | 'at_home' | 'hybrid';

const schoolModelValues = (value: unknown): SchoolModel[] => {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? (() => {
          const trimmed = value.trim();
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return trimmed.split(',');
          }
        })()
      : [];

  return Array.from(
    new Set(
      values
        .map((item) =>
          String(item)
            .trim()
            .replace(/^\[|\]$/g, '')
            .replace(/^['"]|['"]$/g, '')
            .replace(/[\s-]+/g, '_')
            .toLowerCase(),
        )
        .filter(
          (item): item is SchoolModel =>
            item === 'at_school' || item === 'at_home' || item === 'hybrid',
        ),
    ),
  );
};

export const schoolModelLabel = (value: string | null) => {
  const labels: Record<SchoolModel, string> = {
    at_school: 'At School',
    at_home: 'At Home',
    hybrid: 'Hybrid',
  };
  const models = schoolModelValues(value);
  return models.length
    ? models.map((model) => labels[model]).join(', ')
    : value || 'Not specified';
};
export const formattedDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T00:00:00`))
    : '—';
const PAGE_SIZE = 10;
export const isScheduled = (message: CampaignNotificationListItem) =>
  Boolean(
    message.sendDate &&
    new Date(`${message.sendDate}T${message.sendTime || '00:00'}`) > new Date(),
  );

export const MessagesListing: React.FC<Props> = ({
  messages,
  loading,
  onCreate,
  onOpen,
}) => {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState('All School Models');
  const [sortKey, setSortKey] = useState<SortKey>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [userType, setUserType] = useState('');
  const [page, setPage] = useState(1);
  const models = ['All School Models', 'At School', 'At Home', 'Hybrid'];

  const visibleMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return messages
      .filter((message) =>
        model === 'All School Models'
          ? true
          : schoolModelValues(message.schoolModel).includes(
              model.replace(/\s+/g, '_').toLowerCase() as SchoolModel,
            ),
      )
      .filter((message) => {
        if (!normalizedQuery) return true;
        return [
          message.label,
          message.message,
          message.programName,
          message.schoolModel,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => {
        const valueFor = (message: CampaignNotificationListItem) => {
          if (sortKey === 'type') return 'notification';
          if (sortKey === 'label') return message.label;
          if (sortKey === 'programManager')
            return message.programManagerNames.join(', ');
          return message[sortKey] || '';
        };
        const leftValue = String(valueFor(left)).toLowerCase();
        const rightValue = String(valueFor(right)).toLowerCase();
        const result = leftValue.localeCompare(rightValue);
        return sortDirection === 'asc' ? result : -result;
      });
  }, [messages, model, query, sortDirection, sortKey]);

  const filteredMessages = visibleMessages.filter(
    (message) => !userType || message.userType?.toLowerCase() === userType,
  );
  const pageCount = Math.max(1, Math.ceil(filteredMessages.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageMessages = filteredMessages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key)
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <main className="messages-listing" aria-labelledby="messages-listing-title">
      <Box className="messages-listing__header">
        <Box>
          <Typography id="messages-listing-title" component="h1">
            Messages
          </Typography>
        </Box>
      </Box>

      <Box
        className="messages-listing__tabs"
        role="tablist"
        aria-label="School models"
      >
        {models.map((item) => (
          <Button
            key={item}
            id="messages-listing__tab"
            role="tab"
            aria-selected={model === item}
            className="messages-listing__tab"
            onClick={() => {
              setModel(item);
              setPage(1);
            }}
          >
            {item}
          </Button>
        ))}
      </Box>

      <Box className="messages-listing__toolbar">
        <Button
          id="messages-listing__actions-primary"
          className="messages-listing__actions-primary"
          endIcon={<ArrowDropDown />}
          onClick={(event) => setActionsAnchor(event.currentTarget)}
        >
          Actions
        </Button>
        <Menu
          anchorEl={actionsAnchor}
          open={Boolean(actionsAnchor)}
          onClose={() => setActionsAnchor(null)}
          slotProps={{
            paper: { className: 'messages-listing__actions-menu' },
          }}
        >
          <MenuItem
            id="messages-listing__send-notification"
            className="messages-listing__send-notification"
            onClick={() => {
              setActionsAnchor(null);
              onCreate();
            }}
          >
            <Add fontSize="small" /> Send Notification
          </MenuItem>
        </Menu>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          size="small"
          className="messages-listing__search"
          InputProps={{ startAdornment: <Search fontSize="small" /> }}
        />
        <Button
          id="messages-listing__actions-button"
          className="messages-listing__actions-button"
          startIcon={<FilterAltOutlined fontSize="small" />}
          onClick={(event) => setFilterAnchor(event.currentTarget)}
        >
          Filter
        </Button>
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          {[
            { label: 'All user types', value: '' },
            { label: 'Student', value: 'student' },
            { label: 'Teacher', value: 'teacher' },
            { label: 'Principal', value: 'principal' },
          ].map((item) => (
            <MenuItem
              key={item.value}
              id="messages-listing__filter-option"
              className="messages-listing__filter-option"
              selected={userType === item.value}
              onClick={() => {
                setUserType(item.value);
                setPage(1);
                setFilterAnchor(null);
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <MessagesListingTable
        currentPage={currentPage}
        filteredCount={filteredMessages.length}
        formattedDate={formattedDate}
        loading={loading}
        onOpen={onOpen}
        onPageChange={setPage}
        onSort={toggleSort}
        pageCount={pageCount}
        pageMessages={pageMessages}
        sortDirection={sortDirection}
        sortKey={sortKey}
      />
    </main>
  );
};
