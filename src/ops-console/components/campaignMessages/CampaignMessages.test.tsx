import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CampaignMessages from './CampaignMessages';
import {
  buildCampaignMessageSavePayload,
  buildCampaignMessagesData,
  CampaignMessageRow,
} from './CampaignMessagesLogic';
import {
  CampaignMessagingResponse,
  CampaignMessagingRow,
} from '../../../services/api/ServiceApi';
import { RoleType } from '../../../interface/modelInterfaces';
import { mockApiHandler } from '../../../tests/__mocks__/serviceConfigMock';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockUseAppSelector = jest.fn();

jest.mock('../../../redux/hooks', () => ({
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector),
}));

type CampaignMessagingApiMock = typeof mockApiHandler & {
  getCampaignMessaging: jest.Mock<
    Promise<CampaignMessagingResponse>,
    [string, { page?: number; pageSize?: number }?]
  >;
  updateCampaignMessaging: jest.Mock<Promise<boolean>, [CampaignMessageRow[]]>;
};

const apiHandler = mockApiHandler as CampaignMessagingApiMock;

const buildMessagingRow = (
  overrides: Partial<CampaignMessagingRow> = {},
): CampaignMessagingRow =>
  ({
    id: 'message-1',
    campaign_id: 'campaign-1',
    message_time: '2099-06-10T15:00:00+00:00',
    poll_time: '2099-06-10T10:00:00+00:00',
    message: 'Class 1 Digital',
    media_link: 'https://drive.example/media',
    poll: {
      question: 'Is this useful?',
      options: ['Yes', 'No'],
    },
    message_status: 'pending',
    poll_status: 'pending',
    is_deleted: false,
    isPersisted: true,
    ...overrides,
  }) as CampaignMessagingRow;

const buildDatedMessagingRow = (
  dayOffset: number,
  overrides: Partial<CampaignMessagingRow> = {},
): CampaignMessagingRow => {
  const day = String(10 + dayOffset).padStart(2, '0');

  return buildMessagingRow({
    id: `message-${dayOffset + 1}`,
    message_time: `2099-06-${day}T15:00:00+00:00`,
    poll_time: `2099-06-${day}T10:00:00+00:00`,
    message: `Class 1 Digital ${dayOffset + 1}`,
    ...overrides,
  });
};

const buildResponse = (
  rows: CampaignMessagingRow[],
): CampaignMessagingResponse => ({
  data: rows,
  total: rows.length,
  page: 1,
  pageSize: 20,
});

describe('CampaignMessages', () => {
  beforeEach(() => {
    mockUseAppSelector.mockImplementation((selector) =>
      selector({
        auth: {
          roles: [RoleType.SUPER_ADMIN],
        },
      }),
    );
    Object.assign(apiHandler, {
      getCampaignMessaging: jest.fn(),
      updateCampaignMessaging: jest.fn(),
    });
  });

  it('fetches campaign messages by campaign id and shows empty state after loading', async () => {
    let resolveResponse: (response: CampaignMessagingResponse) => void = () =>
      undefined;
    apiHandler.getCampaignMessaging.mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );

    render(<CampaignMessages campaignId="campaign-1" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(apiHandler.getCampaignMessaging).toHaveBeenCalledWith('campaign-1', {
      page: 1,
      pageSize: 20,
    });

    resolveResponse(buildResponse([]));

    await waitFor(() => {
      expect(
        screen.getByText('No configured communication days.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders rows returned from the campaign messaging API', async () => {
    apiHandler.getCampaignMessaging.mockResolvedValue(
      buildResponse([buildMessagingRow()]),
    );

    render(
      <CampaignMessages
        campaignId="campaign-1"
        campaignStartDate="2099-06-10"
        campaignEndDate="2099-06-12"
      />,
    );

    expect(await screen.findByText('Class 1 Digital')).toBeInTheDocument();
    expect(screen.getByText('https://drive.example/media')).toBeInTheDocument();
    expect(screen.getByText('Is this useful?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('03:00 PM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('renders all campaign days even when only some rows have messages', async () => {
    apiHandler.getCampaignMessaging.mockResolvedValue(
      buildResponse([buildMessagingRow()]),
    );

    render(
      <CampaignMessages
        campaignId="campaign-1"
        campaignStartDate="2099-06-10"
        campaignEndDate="2099-06-12"
      />,
    );

    expect(await screen.findAllByText('Day 1')).not.toHaveLength(0);
    expect(screen.getAllByText('Day 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Day 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('--').length).toBeGreaterThan(0);
  });

  it('paginates campaign days across the full campaign range', async () => {
    const rows = Array.from({ length: 25 }, (_, index) =>
      buildDatedMessagingRow(index, {
        message: `Message ${index + 1}`,
      }),
    );

    apiHandler.getCampaignMessaging.mockResolvedValue(buildResponse(rows));

    render(
      <CampaignMessages
        campaignId="campaign-1"
        campaignStartDate="2099-06-10"
        campaignEndDate="2099-07-10"
      />,
    );

    expect(await screen.findByText('Message 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Go to next page'));

    expect(await screen.findAllByText('Day 21')).not.toHaveLength(0);
    expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
  });

  it('shows no-change toast and does not update when save is clicked without edits', async () => {
    apiHandler.getCampaignMessaging.mockResolvedValue(
      buildResponse([buildMessagingRow()]),
    );
    apiHandler.updateCampaignMessaging.mockResolvedValue(true);

    render(
      <CampaignMessages
        campaignId="campaign-1"
        campaignStartDate="2099-06-10"
        campaignEndDate="2099-06-12"
      />,
    );

    await screen.findByText('Class 1 Digital');
    fireEvent.click(screen.getByLabelText('Edit global send schedule'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('No changes made.')).toBeInTheDocument();
    expect(apiHandler.updateCampaignMessaging).not.toHaveBeenCalled();
  });

  it('keeps field coordinators in view-only mode', async () => {
    mockUseAppSelector.mockImplementation((selector) =>
      selector({
        auth: {
          roles: [RoleType.FIELD_COORDINATOR],
        },
      }),
    );
    apiHandler.getCampaignMessaging.mockResolvedValue(
      buildResponse([buildMessagingRow()]),
    );

    render(<CampaignMessages campaignId="campaign-1" />);

    expect(await screen.findByText('Class 1 Digital')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Edit global send schedule'),
    ).not.toBeInTheDocument();
  });
});

describe('CampaignMessagesLogic', () => {
  it('builds display data from API rows without inventing missing times', () => {
    const data = buildCampaignMessagesData({
      messages: [
        buildMessagingRow({
          message_time: null,
          poll_time: null,
          message: 'Only message text',
          media_link: null,
          poll: null,
        }),
      ],
    });

    expect(data.messageTime).toBe('--');
    expect(data.pollTime).toBe('--');
    expect(data.rows[0].message).toBe('Only message text');
    expect(data.rows[0].mediaLink).toBe('');
  });

  it('fills in missing timeline days when dates are provided', () => {
    const data = buildCampaignMessagesData(
      {
        messages: [
          buildMessagingRow({
            message_time: '2099-06-10T15:00:00+00:00',
            poll_time: '2099-06-10T10:00:00+00:00',
            message: 'Day 1',
          }),
        ],
      },
      ['2099-06-10', '2099-06-11', '2099-06-12'],
    );

    expect(data.total).toBe(3);
    expect(data.rows).toHaveLength(3);
    expect(data.rows[0].message).toBe('Day 1');
    expect(data.rows[1].message).toBe('');
    expect(data.rows[2].message).toBe('');
  });

  it('skips sunday from the campaign timeline', () => {
    const data = buildCampaignMessagesData(
      {
        messages: [
          buildMessagingRow({
            message_time: '2026-07-10T15:00:00+00:00',
            poll_time: '2026-07-10T10:00:00+00:00',
            message: 'Friday row',
          }),
          buildMessagingRow({
            id: 'message-2',
            message_time: '2026-07-12T15:00:00+00:00',
            poll_time: '2026-07-12T10:00:00+00:00',
            message: 'Sunday row',
          }),
          buildMessagingRow({
            id: 'message-3',
            message_time: '2026-07-13T15:00:00+00:00',
            poll_time: '2026-07-13T10:00:00+00:00',
            message: 'Monday row',
          }),
        ],
      },
      ['2026-07-10', '2026-07-12', '2026-07-13'],
    );

    expect(data.total).toBe(2);
    expect(data.rows).toHaveLength(2);
    expect(data.rows.map((row) => row.scheduledDate)).toEqual([
      '2026-07-10',
      '2026-07-13',
    ]);
    expect(data.rows.map((row) => row.message)).toEqual([
      'Friday row',
      'Monday row',
    ]);
  });

  it('keeps past campaign days read-only and future days editable', () => {
    const data = buildCampaignMessagesData(
      {
        messages: [
          buildMessagingRow({
            message_time: '2000-01-01T15:00:00+00:00',
            poll_time: '2000-01-01T10:00:00+00:00',
            message: 'Past day',
          }),
          buildMessagingRow({
            id: 'message-2',
            message_time: '2099-06-11T15:00:00+00:00',
            poll_time: '2099-06-11T10:00:00+00:00',
            message: 'Future day',
          }),
        ],
      },
      ['2000-01-01', '2099-06-11'],
    );

    expect(data.rows[0].isEditable).toBe(false);
    expect(data.rows[1].isEditable).toBe(true);
  });

  it('locks only the field whose status is non-editable', () => {
    const data = buildCampaignMessagesData(
      {
        messages: [
          buildMessagingRow({
            message_time: '2099-06-10T15:00:00+00:00',
            poll_time: '2099-06-10T10:00:00+00:00',
            message_status: 'sent',
            poll_status: 'pending',
          }),
          buildMessagingRow({
            id: 'message-2',
            message_time: '2099-06-11T15:00:00+00:00',
            poll_time: '2099-06-11T10:00:00+00:00',
            message_status: 'pending',
            poll_status: 'completed',
          }),
        ],
      },
      ['2099-06-10', '2099-06-11'],
    );

    expect(data.rows[0].messageEditable).toBe(false);
    expect(data.rows[0].pollEditable).toBe(true);
    expect(data.rows[0].isEditable).toBe(true);
    expect(data.rows[1].messageEditable).toBe(true);
    expect(data.rows[1].pollEditable).toBe(false);
    expect(data.rows[1].isEditable).toBe(true);
  });

  it('keeps poll editable when message is sent but poll is still pending', () => {
    const data = buildCampaignMessagesData(
      {
        messages: [
          buildMessagingRow({
            message_time: '2099-06-10T15:00:00+00:00',
            poll_time: '2099-06-10T10:00:00+00:00',
            message_status: 'sent',
            poll_status: 'pending',
          }),
        ],
      },
      ['2099-06-10'],
    );

    expect(data.rows[0].messageEditable).toBe(false);
    expect(data.rows[0].pollEditable).toBe(true);
    expect(data.rows[0].isEditable).toBe(true);
  });

  it('keeps today message locked when its status is sent even before the time passes', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-10T06:00:00Z'));

    try {
      const data = buildCampaignMessagesData(
        {
          messages: [
            buildMessagingRow({
              message_time: '2026-07-10T07:00:00+00:00',
              poll_time: '2026-07-10T19:00:00+00:00',
              message_status: 'sent',
              poll_status: 'pending',
            }),
          ],
        },
        ['2026-07-10'],
      );

      expect(data.rows[0].messageEditable).toBe(false);
      expect(data.rows[0].pollEditable).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not create a save payload when only ISO formatting changes', () => {
    const currentRow: CampaignMessageRow = {
      id: 'message-1',
      scheduledDate: '2099-06-10',
      dayLabel: 'Day 1',
      dateLabel: '10 June',
      message: 'Class 1 Digital',
      mediaLink: '',
      messageTimeIso: '2026-06-10T15:00:00+00:00',
      pollTimeIso: '2026-06-10T10:00:00+00:00',
      pollQuestion: 'Is this useful?',
      pollOptions: ['Yes', 'No'],
      messageStatus: 'pending',
      pollStatus: 'pending',
      messageEditable: true,
      pollEditable: true,
      isEditable: true,
      isPersisted: true,
    };
    const nextRow: CampaignMessageRow = {
      ...currentRow,
      messageTimeIso: '2026-06-10T15:00:00.000Z',
      pollTimeIso: '2026-06-10T10:00:00.000Z',
    };

    expect(
      buildCampaignMessageSavePayload('campaign-1', [currentRow], [nextRow]),
    ).toEqual([]);
  });

  it('builds a save payload for changed editable row content', () => {
    const currentRow: CampaignMessageRow = {
      id: 'message-1',
      scheduledDate: '2099-06-10',
      dayLabel: 'Day 1',
      dateLabel: '10 June',
      message: 'Class 1 Digital',
      mediaLink: '',
      messageTimeIso: '2026-06-10T15:00:00+00:00',
      pollTimeIso: '2026-06-10T10:00:00+00:00',
      pollQuestion: 'Is this useful?',
      pollOptions: ['Yes', 'No'],
      messageStatus: 'pending',
      pollStatus: 'pending',
      messageEditable: true,
      pollEditable: true,
      isEditable: true,
      isPersisted: true,
    };
    const nextRow: CampaignMessageRow = {
      ...currentRow,
      message: 'Updated message',
      pollOptions: ['Yes', 'No', 'Maybe', ''],
    };

    expect(
      buildCampaignMessageSavePayload('campaign-1', [currentRow], [nextRow]),
    ).toEqual([
      {
        campaignId: 'campaign-1',
        id: 'message-1',
        message: 'Updated message',
        mediaLink: '',
        messageTime: '2026-06-10T15:00:00+00:00',
        pollTime: '2026-06-10T10:00:00+00:00',
        pollQuestion: 'Is this useful?',
        pollOptions: ['Yes', 'No', 'Maybe'],
        messageStatus: 'pending',
        pollStatus: 'pending',
      },
    ]);
  });
});
