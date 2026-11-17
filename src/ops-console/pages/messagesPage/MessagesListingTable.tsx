import React from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import type { CampaignNotificationListItem } from '../../../services/api/ServiceApi';

export type MessageSortKey =
  | 'type'
  | 'label'
  | 'sendDate'
  | 'endDate'
  | 'programManager'
  | 'userType';

type Props = {
  currentPage: number;
  filteredCount: number;
  formattedDate: (value: string | null) => string;
  loading: boolean;
  onOpen: (message: CampaignNotificationListItem) => void;
  onPageChange: (page: number) => void;
  onSort: (key: MessageSortKey) => void;
  pageCount: number;
  pageMessages: CampaignNotificationListItem[];
  sortDirection: 'asc' | 'desc';
  sortKey: MessageSortKey;
};

const columns: Array<[MessageSortKey, string]> = [
  ['type', 'Message Type'],
  ['label', 'Label'],
  ['sendDate', 'Start Date'],
  ['endDate', 'End Date'],
  ['programManager', 'Program Manager'],
  ['userType', 'User Type'],
];

export const MessagesListingTable: React.FC<Props> = ({
  currentPage,
  filteredCount,
  formattedDate,
  loading,
  onOpen,
  onPageChange,
  onSort,
  pageCount,
  pageMessages,
  sortDirection,
  sortKey,
}) => (
  <>
    <TableContainer className="messages-listing__table-wrap">
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map(([key, label]) => (
              <TableCell
                key={key}
                sortDirection={sortKey === key ? sortDirection : false}
              >
                <TableSortLabel
                  id="messages-listing__sort-label"
                  className="messages-listing__sort-label"
                  active={sortKey === key}
                  direction={sortKey === key ? sortDirection : 'asc'}
                  onClick={() => onSort(key)}
                >
                  {label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {pageMessages.map((message) => (
            <TableRow
              key={message.id}
              hover
              tabIndex={0}
              id="messages-listing__row"
              className="messages-listing__row"
              onClick={() => onOpen(message)}
            >
              <TableCell>Notification</TableCell>
              <TableCell>{message.label || '—'}</TableCell>
              <TableCell>{formattedDate(message.sendDate)}</TableCell>
              <TableCell>
                {formattedDate(message.endDate).replace('—', 'NA')}
              </TableCell>
              <TableCell>
                {message.programManagerNames.join(', ') || '—'}
              </TableCell>
              <TableCell>{message.userType || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!loading && filteredCount === 0 ? (
        <Box className="messages-listing__empty">
          <Typography>No messages found</Typography>
          <Typography>Try another search or send a notification.</Typography>
        </Box>
      ) : null}
      {loading ? (
        <Box className="messages-listing__empty">
          <Typography>Loading messages…</Typography>
        </Box>
      ) : null}
    </TableContainer>
    {filteredCount > 10 ? (
      <Box className="messages-listing__pagination">
        <Button
          id="messages-listing__previous-page"
          className="messages-listing__previous-page"
          disabled={currentPage === 1}
          startIcon={<NavigateBefore />}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        {Array.from({ length: pageCount }, (_, index) => index + 1)
          .slice(0, 5)
          .map((item) => (
            <Button
              key={item}
              id="messages-listing__page"
              className="messages-listing__page"
              aria-current={item === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ))}
        <Button
          id="messages-listing__next-page"
          className="messages-listing__next-page"
          disabled={currentPage === pageCount}
          endIcon={<NavigateNext />}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </Box>
    ) : null}
  </>
);
