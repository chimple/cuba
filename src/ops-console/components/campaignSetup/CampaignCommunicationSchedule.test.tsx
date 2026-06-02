import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CampaignCommunicationSchedule } from './CampaignCommunicationSchedule';

type RenderScheduleProps = {
  messageTime?: string;
  pollTime?: string;
  timeOptions?: string[];
  messageTimeError?: string;
  pollTimeError?: string;
  onMessageTimeChange?: jest.Mock;
  onPollTimeChange?: jest.Mock;
};

const defaultTimeOptions = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
];

const renderSchedule = (props: RenderScheduleProps = {}) => {
  const onMessageTimeChange = props.onMessageTimeChange ?? jest.fn();
  const onPollTimeChange = props.onPollTimeChange ?? jest.fn();

  const view = render(
    <CampaignCommunicationSchedule
      messageTime={props.messageTime ?? ''}
      pollTime={props.pollTime ?? ''}
      timeOptions={props.timeOptions ?? defaultTimeOptions}
      messageTimeError={props.messageTimeError}
      pollTimeError={props.pollTimeError}
      onMessageTimeChange={onMessageTimeChange}
      onPollTimeChange={onPollTimeChange}
    />,
  );

  return {
    ...view,
    onMessageTimeChange,
    onPollTimeChange,
  };
};

const openMessageTimeMenu = async () => {
  fireEvent.mouseDown(screen.getByLabelText('Message Time'));
  await screen.findByRole('listbox');
};

const openPollTimeMenu = async () => {
  fireEvent.mouseDown(screen.getByLabelText('Poll Time'));
  await screen.findByRole('listbox');
};

describe('CampaignCommunicationSchedule', () => {
  it('renders the schedule heading text and helper note content', () => {
    renderSchedule();

    expect(screen.getByText('Global Send Schedule')).toBeInTheDocument();
    expect(
      screen.getAllByText('Applied globally across all campaign days.'),
    ).toHaveLength(2);
  });

  it('renders both time fields with accessible labels', () => {
    renderSchedule();

    expect(screen.getByLabelText('Message Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Poll Time')).toBeInTheDocument();
  });

  it('renders all supplied message time options when the message select is opened', async () => {
    renderSchedule();

    await openMessageTimeMenu();

    for (const option of defaultTimeOptions) {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    }
  });

  it('renders all supplied poll time options when the poll select is opened', async () => {
    renderSchedule();

    await openPollTimeMenu();

    for (const option of defaultTimeOptions) {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    }
  });

  it('uses the provided message time value', () => {
    renderSchedule({ messageTime: '09:00 AM' });

    const messageSelect = screen.getByLabelText('Message Time');
    expect(messageSelect).toHaveTextContent('09:00 AM');
  });

  it('uses the provided poll time value', () => {
    renderSchedule({ pollTime: '06:00 PM' });

    const pollSelect = screen.getByLabelText('Poll Time');
    expect(pollSelect).toHaveTextContent('06:00 PM');
  });

  it('calls onMessageTimeChange with the selected option value', async () => {
    const { onMessageTimeChange } = renderSchedule();

    await openMessageTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '09:30 AM' }));

    expect(onMessageTimeChange).toHaveBeenCalledTimes(1);
    expect(onMessageTimeChange).toHaveBeenCalledWith('09:30 AM');
  });

  it('calls onPollTimeChange with the selected option value', async () => {
    const { onPollTimeChange } = renderSchedule();

    await openPollTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '05:30 PM' }));

    expect(onPollTimeChange).toHaveBeenCalledTimes(1);
    expect(onPollTimeChange).toHaveBeenCalledWith('05:30 PM');
  });

  it('renders message time validation text when provided', () => {
    renderSchedule({ messageTimeError: 'Message time is required.' });

    expect(screen.getByText('Message time is required.')).toBeInTheDocument();
  });

  it('renders poll time validation text when provided', () => {
    renderSchedule({ pollTimeError: 'Poll time is required.' });

    expect(screen.getByText('Poll time is required.')).toBeInTheDocument();
  });

  it('renders both validation messages together when both are provided', () => {
    renderSchedule({
      messageTimeError: 'Message time is required.',
      pollTimeError: 'Poll time is required.',
    });

    expect(screen.getByText('Message time is required.')).toBeInTheDocument();
    expect(screen.getByText('Poll time is required.')).toBeInTheDocument();
  });

  it('does not render helper error text when no validation messages are provided', () => {
    renderSchedule();

    expect(
      screen.queryByText('Message time is required.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Poll time is required.'),
    ).not.toBeInTheDocument();
  });

  it('supports a custom time option list for message selection', async () => {
    renderSchedule({
      timeOptions: ['07:15 AM', '11:45 AM', '03:15 PM'],
    });

    await openMessageTimeMenu();

    expect(
      screen.getByRole('option', { name: '07:15 AM' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: '11:45 AM' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: '03:15 PM' }),
    ).toBeInTheDocument();
  });

  it('supports a custom time option list for poll selection', async () => {
    renderSchedule({
      timeOptions: ['07:15 AM', '11:45 AM', '03:15 PM'],
    });

    await openPollTimeMenu();

    expect(
      screen.getByRole('option', { name: '07:15 AM' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: '11:45 AM' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: '03:15 PM' }),
    ).toBeInTheDocument();
  });

  it('preserves an already selected message value when rerendered with a new poll value', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime="08:00 AM"
        pollTime=""
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    rerender(
      <CampaignCommunicationSchedule
        messageTime="08:00 AM"
        pollTime="06:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Message Time')).toHaveTextContent('08:00 AM');
    expect(screen.getByLabelText('Poll Time')).toHaveTextContent('06:00 PM');
  });

  it('preserves an already selected poll value when rerendered with a new message value', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime="05:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    rerender(
      <CampaignCommunicationSchedule
        messageTime="09:00 AM"
        pollTime="05:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Message Time')).toHaveTextContent('09:00 AM');
    expect(screen.getByLabelText('Poll Time')).toHaveTextContent('05:00 PM');
  });

  it('updates the displayed message value after rerender', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime="08:00 AM"
        pollTime="05:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    rerender(
      <CampaignCommunicationSchedule
        messageTime="10:00 AM"
        pollTime="05:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Message Time')).toHaveTextContent('10:00 AM');
  });

  it('updates the displayed poll value after rerender', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime="08:00 AM"
        pollTime="05:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    rerender(
      <CampaignCommunicationSchedule
        messageTime="08:00 AM"
        pollTime="06:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Poll Time')).toHaveTextContent('06:00 PM');
  });

  it('updates the message validation text after rerender', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime=""
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(
      screen.queryByText('Message time is required.'),
    ).not.toBeInTheDocument();

    rerender(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime=""
        timeOptions={defaultTimeOptions}
        messageTimeError="Message time is required."
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Message time is required.')).toBeInTheDocument();
  });

  it('updates the poll validation text after rerender', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime=""
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(
      screen.queryByText('Poll time is required.'),
    ).not.toBeInTheDocument();

    rerender(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime=""
        timeOptions={defaultTimeOptions}
        pollTimeError="Poll time is required."
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Poll time is required.')).toBeInTheDocument();
  });

  it('removes the message validation text after rerender when the error clears', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime=""
        timeOptions={defaultTimeOptions}
        messageTimeError="Message time is required."
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Message time is required.')).toBeInTheDocument();

    rerender(
      <CampaignCommunicationSchedule
        messageTime="09:00 AM"
        pollTime=""
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(
      screen.queryByText('Message time is required.'),
    ).not.toBeInTheDocument();
  });

  it('removes the poll validation text after rerender when the error clears', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime=""
        timeOptions={defaultTimeOptions}
        pollTimeError="Poll time is required."
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Poll time is required.')).toBeInTheDocument();

    rerender(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime="05:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(
      screen.queryByText('Poll time is required.'),
    ).not.toBeInTheDocument();
  });

  it('does not call the message callback before a selection is made', () => {
    const { onMessageTimeChange } = renderSchedule();

    expect(onMessageTimeChange).not.toHaveBeenCalled();
  });

  it('does not call the poll callback before a selection is made', () => {
    const { onPollTimeChange } = renderSchedule();

    expect(onPollTimeChange).not.toHaveBeenCalled();
  });

  it('opens the message menu multiple times without losing options', async () => {
    renderSchedule();

    await openMessageTimeMenu();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    await openMessageTimeMenu();

    expect(
      screen.getByRole('option', { name: '08:00 AM' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: '06:00 PM' }),
    ).toBeInTheDocument();
  });

  it('opens the poll menu multiple times without losing options', async () => {
    renderSchedule();

    await openPollTimeMenu();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    await openPollTimeMenu();

    expect(
      screen.getByRole('option', { name: '08:00 AM' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: '06:00 PM' }),
    ).toBeInTheDocument();
  });

  it('renders duplicate note text for desktop and mobile note placements', () => {
    renderSchedule();

    const notes = screen.getAllByText(
      'Applied globally across all campaign days.',
    );
    expect(notes).toHaveLength(2);
  });

  it('allows selecting the earliest available message time option', async () => {
    const { onMessageTimeChange } = renderSchedule();

    await openMessageTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '08:00 AM' }));

    expect(onMessageTimeChange).toHaveBeenCalledWith('08:00 AM');
  });

  it('allows selecting the latest available message time option', async () => {
    const { onMessageTimeChange } = renderSchedule();

    await openMessageTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '06:00 PM' }));

    expect(onMessageTimeChange).toHaveBeenCalledWith('06:00 PM');
  });

  it('allows selecting the earliest available poll time option', async () => {
    const { onPollTimeChange } = renderSchedule();

    await openPollTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '08:00 AM' }));

    expect(onPollTimeChange).toHaveBeenCalledWith('08:00 AM');
  });

  it('allows selecting the latest available poll time option', async () => {
    const { onPollTimeChange } = renderSchedule();

    await openPollTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '06:00 PM' }));

    expect(onPollTimeChange).toHaveBeenCalledWith('06:00 PM');
  });

  it('supports empty time option arrays without crashing', async () => {
    renderSchedule({ timeOptions: [] });

    await openMessageTimeMenu();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('supports empty time option arrays in the poll select without crashing', async () => {
    renderSchedule({ timeOptions: [] });

    fireEvent.keyDown(screen.getByLabelText('Message Time'), {
      key: 'Escape',
    });
    await openPollTimeMenu();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('keeps callback wiring isolated between message and poll changes', async () => {
    const { onMessageTimeChange, onPollTimeChange } = renderSchedule();

    await openMessageTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '09:00 AM' }));

    expect(onMessageTimeChange).toHaveBeenCalledTimes(1);
    expect(onPollTimeChange).not.toHaveBeenCalled();
  });

  it('keeps callback wiring isolated between poll and message changes', async () => {
    const { onMessageTimeChange, onPollTimeChange } = renderSchedule();

    await openPollTimeMenu();
    fireEvent.click(screen.getByRole('option', { name: '05:00 PM' }));

    expect(onPollTimeChange).toHaveBeenCalledTimes(1);
    expect(onMessageTimeChange).not.toHaveBeenCalled();
  });

  it('shows both selected values together when both are supplied', () => {
    renderSchedule({
      messageTime: '09:00 AM',
      pollTime: '06:00 PM',
    });

    expect(screen.getByLabelText('Message Time')).toHaveTextContent('09:00 AM');
    expect(screen.getByLabelText('Poll Time')).toHaveTextContent('06:00 PM');
  });

  it('keeps the title visible when values and errors are both present', () => {
    renderSchedule({
      messageTime: '09:00 AM',
      pollTime: '06:00 PM',
      messageTimeError: 'Message time is required.',
      pollTimeError: 'Poll time is required.',
    });

    expect(screen.getByText('Global Send Schedule')).toBeInTheDocument();
    expect(screen.getByText('Message time is required.')).toBeInTheDocument();
    expect(screen.getByText('Poll time is required.')).toBeInTheDocument();
  });

  it('renders stable field labels regardless of selected values', () => {
    renderSchedule({
      messageTime: '08:30 AM',
      pollTime: '05:30 PM',
    });

    expect(screen.getByText('Message Time')).toBeInTheDocument();
    expect(screen.getByText('Poll Time')).toBeInTheDocument();
  });

  it('accepts a long time option list and renders each supplied option', async () => {
    const longTimeOptions = [
      '12:00 AM',
      '12:30 AM',
      '01:00 AM',
      '01:30 AM',
      '02:00 AM',
      '02:30 AM',
      '03:00 AM',
      '03:30 AM',
      '04:00 AM',
      '04:30 AM',
      '11:30 PM',
    ];

    renderSchedule({ timeOptions: longTimeOptions });
    await openMessageTimeMenu();

    for (const option of longTimeOptions) {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    }
  });

  it('can switch from one message option to another across rerenders', async () => {
    const onMessageTimeChange = jest.fn();
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime="08:00 AM"
        pollTime=""
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={onMessageTimeChange}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Message Time')).toHaveTextContent('08:00 AM');

    rerender(
      <CampaignCommunicationSchedule
        messageTime="09:30 AM"
        pollTime=""
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={onMessageTimeChange}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Message Time')).toHaveTextContent('09:30 AM');
  });

  it('can switch from one poll option to another across rerenders', () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime="05:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Poll Time')).toHaveTextContent('05:00 PM');

    rerender(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime="06:00 PM"
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Poll Time')).toHaveTextContent('06:00 PM');
  });

  it('continues to render after many sequential rerenders', async () => {
    const { rerender } = render(
      <CampaignCommunicationSchedule
        messageTime=""
        pollTime=""
        timeOptions={defaultTimeOptions}
        onMessageTimeChange={jest.fn()}
        onPollTimeChange={jest.fn()}
      />,
    );

    const sequentialValues = [
      ['08:00 AM', '05:00 PM'],
      ['08:30 AM', '05:30 PM'],
      ['09:00 AM', '06:00 PM'],
      ['09:30 AM', '05:00 PM'],
    ] as const;

    sequentialValues.forEach(([messageTime, pollTime]) => {
      rerender(
        <CampaignCommunicationSchedule
          messageTime={messageTime}
          pollTime={pollTime}
          timeOptions={defaultTimeOptions}
          onMessageTimeChange={jest.fn()}
          onPollTimeChange={jest.fn()}
        />,
      );
    });

    expect(screen.getByLabelText('Message Time')).toHaveTextContent('09:30 AM');
    expect(screen.getByLabelText('Poll Time')).toHaveTextContent('05:00 PM');

    await openMessageTimeMenu();
    expect(
      screen.getByRole('option', { name: '09:30 AM' }),
    ).toBeInTheDocument();
  });

  it('keeps the schedule visible while waiting for later assertions', async () => {
    renderSchedule({
      messageTime: '09:00 AM',
      pollTime: '05:00 PM',
    });

    await screen.findByText('Global Send Schedule');
    await waitFor(() =>
      expect(screen.getByLabelText('Message Time')).toHaveTextContent(
        '09:00 AM',
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Poll Time')).toHaveTextContent('05:00 PM'),
    );
  });
});
