import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CampaignCommunicationRow } from './CampaignCommunicationRow';
import { CampaignCommunicationRowState } from './campaignCommunicationUtils';

type RenderRowProps = {
  date?: string;
  index?: number;
  row?: CampaignCommunicationRowState;
  dateLabel?: string;
  getError?: jest.Mock<string | undefined, [string]>;
  onRowChange?: jest.Mock;
  onClearRow?: jest.Mock;
};

const baseRow: CampaignCommunicationRowState = {
  message: '',
  mediaLink: '',
  pollQuestion: '',
  pollOptions: ['', ''],
};

const createRow = (
  overrides: Partial<CampaignCommunicationRowState> = {},
): CampaignCommunicationRowState => ({
  ...baseRow,
  ...overrides,
  pollOptions: overrides.pollOptions ?? baseRow.pollOptions,
});

const renderRow = (props: RenderRowProps = {}) => {
  const getError =
    props.getError ?? jest.fn<string | undefined, [string]>(() => undefined);
  const onRowChange = props.onRowChange ?? jest.fn();
  const onClearRow = props.onClearRow ?? jest.fn();

  const view = render(
    <CampaignCommunicationRow
      date={props.date ?? '2099-05-19'}
      index={props.index ?? 0}
      row={props.row ?? createRow()}
      dateLabel={props.dateLabel ?? '19 May'}
      getError={getError}
      onRowChange={onRowChange}
      onClearRow={onClearRow}
    />,
  );

  return {
    ...view,
    getError,
    onRowChange,
    onClearRow,
  };
};

const expectUpdaterResult = (
  onRowChange: jest.Mock,
  callIndex: number,
  initialRow: CampaignCommunicationRowState,
) => {
  const updater = onRowChange.mock.calls[callIndex][1] as (
    row: CampaignCommunicationRowState,
  ) => CampaignCommunicationRowState;
  return updater(initialRow);
};

const createRowChangeRecorder = (initialRow: CampaignCommunicationRowState) => {
  const appliedRows: CampaignCommunicationRowState[] = [];
  const onRowChange = jest.fn(
    (
      _date: string,
      updater: (
        row: CampaignCommunicationRowState,
      ) => CampaignCommunicationRowState,
    ) => {
      appliedRows.push(updater(initialRow));
    },
  );

  return {
    appliedRows,
    onRowChange,
  };
};

describe('CampaignCommunicationRow', () => {
  it('renders the desktop and mobile day labels for the supplied index', () => {
    renderRow({ index: 0, dateLabel: '19 May' });

    expect(screen.getAllByText('Day 1')).toHaveLength(2);
    expect(screen.getAllByText('19 May')).toHaveLength(2);
  });

  it('renders the next day label for a later index', () => {
    renderRow({ index: 3, dateLabel: '22 May' });

    expect(screen.getAllByText('Day 4')).toHaveLength(2);
    expect(screen.getAllByText('22 May')).toHaveLength(2);
  });

  it('renders the daily message field with the current row value', () => {
    renderRow({
      row: createRow({
        message: 'Complete today’s campaign task.',
      }),
    });

    expect(
      screen.getByDisplayValue('Complete today’s campaign task.'),
    ).toBeInTheDocument();
  });

  it('renders the media link field with the current row value', () => {
    renderRow({
      row: createRow({
        mediaLink: 'https://drive.google.com/file/d/1',
      }),
    });

    expect(
      screen.getByDisplayValue('https://drive.google.com/file/d/1'),
    ).toBeInTheDocument();
  });

  it('renders the poll question field with the current row value', () => {
    renderRow({
      row: createRow({
        pollQuestion: 'Which activity did you complete?',
      }),
    });

    expect(
      screen.getByDisplayValue('Which activity did you complete?'),
    ).toBeInTheDocument();
  });

  it('renders the default first two poll options', () => {
    renderRow({
      row: createRow({
        pollOptions: ['Option A', 'Option B'],
      }),
    });

    expect(screen.getByDisplayValue('Option A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option B')).toBeInTheDocument();
  });

  it('renders additional poll options when they exist', () => {
    renderRow({
      row: createRow({
        pollOptions: ['Option A', 'Option B', 'Option C', 'Option D'],
      }),
    });

    expect(screen.getByDisplayValue('Option A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option C')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option D')).toBeInTheDocument();
  });

  it('renders the static field labels for mobile layout support', () => {
    renderRow();

    expect(screen.getByText('Daily Message')).toBeInTheDocument();
    expect(screen.getByText('Media Link')).toBeInTheDocument();
    expect(screen.getByText('Poll')).toBeInTheDocument();
  });

  it('renders the add option button', () => {
    renderRow();

    expect(screen.getByRole('button', { name: 'Option' })).toBeInTheDocument();
  });

  it('renders the clear button', () => {
    renderRow();

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('calls onClearRow with the row date when clear is clicked', () => {
    const { onClearRow } = renderRow({ date: '2099-05-21' });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onClearRow).toHaveBeenCalledTimes(1);
    expect(onClearRow).toHaveBeenCalledWith('2099-05-21');
  });

  it('calls onRowChange with the row date when the message changes', () => {
    const { onRowChange } = renderRow();

    fireEvent.change(
      screen.getByPlaceholderText('Enter daily campaign message...'),
      {
        target: { value: 'Send reminder to students.' },
      },
    );

    expect(onRowChange).toHaveBeenCalledTimes(1);
    expect(onRowChange).toHaveBeenCalledWith(
      '2099-05-19',
      expect.any(Function),
    );
  });

  it('updates only the message in the generated message updater', () => {
    const initialRow = createRow();
    const recorder = createRowChangeRecorder(initialRow);
    renderRow({ row: initialRow, onRowChange: recorder.onRowChange });

    fireEvent.change(
      screen.getByPlaceholderText('Enter daily campaign message...'),
      {
        target: { value: 'Send reminder to students.' },
      },
    );

    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow).toEqual({
      message: 'Send reminder to students.',
      mediaLink: '',
      pollQuestion: '',
      pollOptions: ['', ''],
    });
  });

  it('calls onRowChange when the media link changes', () => {
    const { onRowChange } = renderRow();

    fireEvent.change(screen.getByPlaceholderText('Paste media drive link...'), {
      target: { value: 'https://example.com/media.png' },
    });

    expect(onRowChange).toHaveBeenCalledTimes(1);
    expect(onRowChange).toHaveBeenCalledWith(
      '2099-05-19',
      expect.any(Function),
    );
  });

  it('updates only the media link in the generated media updater', () => {
    const initialRow = createRow();
    const recorder = createRowChangeRecorder(initialRow);
    renderRow({ row: initialRow, onRowChange: recorder.onRowChange });

    fireEvent.change(screen.getByPlaceholderText('Paste media drive link...'), {
      target: { value: 'https://example.com/media.png' },
    });

    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow).toEqual({
      message: '',
      mediaLink: 'https://example.com/media.png',
      pollQuestion: '',
      pollOptions: ['', ''],
    });
  });

  it('calls onRowChange when the poll question changes', () => {
    const { onRowChange } = renderRow();

    fireEvent.change(screen.getByPlaceholderText('Poll question...'), {
      target: { value: 'Did you finish the assignment?' },
    });

    expect(onRowChange).toHaveBeenCalledTimes(1);
    expect(onRowChange).toHaveBeenCalledWith(
      '2099-05-19',
      expect.any(Function),
    );
  });

  it('updates only the poll question in the generated updater', () => {
    const initialRow = createRow();
    const recorder = createRowChangeRecorder(initialRow);
    renderRow({ row: initialRow, onRowChange: recorder.onRowChange });

    fireEvent.change(screen.getByPlaceholderText('Poll question...'), {
      target: { value: 'Did you finish the assignment?' },
    });

    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow).toEqual({
      message: '',
      mediaLink: '',
      pollQuestion: 'Did you finish the assignment?',
      pollOptions: ['', ''],
    });
  });

  it('calls onRowChange when option 1 changes', () => {
    const { onRowChange } = renderRow();

    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'Yes' },
    });

    expect(onRowChange).toHaveBeenCalledTimes(1);
    expect(onRowChange).toHaveBeenCalledWith(
      '2099-05-19',
      expect.any(Function),
    );
  });

  it('updates only option 1 in the generated updater', () => {
    const initialRow = createRow({ pollOptions: ['', 'No'] });
    const recorder = createRowChangeRecorder(initialRow);
    const { onRowChange } = renderRow({
      row: initialRow,
      onRowChange: recorder.onRowChange,
    });

    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'Yes' },
    });

    expect(onRowChange).toHaveBeenCalledTimes(1);
    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow).toEqual({
      message: '',
      mediaLink: '',
      pollQuestion: '',
      pollOptions: ['Yes', 'No'],
    });
  });

  it('updates only option 2 in the generated updater', () => {
    const initialRow = createRow({ pollOptions: ['Yes', ''] });
    const recorder = createRowChangeRecorder(initialRow);
    const { onRowChange } = renderRow({
      row: initialRow,
      onRowChange: recorder.onRowChange,
    });

    fireEvent.change(screen.getByPlaceholderText('Option 2'), {
      target: { value: 'No' },
    });

    expect(onRowChange).toHaveBeenCalledTimes(1);
    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow).toEqual({
      message: '',
      mediaLink: '',
      pollQuestion: '',
      pollOptions: ['Yes', 'No'],
    });
  });

  it('updates a third option without changing other options', () => {
    const existingRow = createRow({
      pollOptions: ['Yes', 'No', 'Maybe'],
    });
    const recorder = createRowChangeRecorder(existingRow);
    renderRow({ row: existingRow, onRowChange: recorder.onRowChange });

    fireEvent.change(screen.getByPlaceholderText('Option 3'), {
      target: { value: 'Later' },
    });

    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow).toEqual({
      message: '',
      mediaLink: '',
      pollQuestion: '',
      pollOptions: ['Yes', 'No', 'Later'],
    });
  });

  it('updates a fourth option without changing other options', () => {
    const existingRow = createRow({
      pollOptions: ['A', 'B', 'C', 'D'],
    });
    const recorder = createRowChangeRecorder(existingRow);
    renderRow({ row: existingRow, onRowChange: recorder.onRowChange });

    fireEvent.change(screen.getByPlaceholderText('Option 4'), {
      target: { value: 'E' },
    });

    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow).toEqual({
      message: '',
      mediaLink: '',
      pollQuestion: '',
      pollOptions: ['A', 'B', 'C', 'E'],
    });
  });

  it('calls onRowChange when the add option button is clicked', () => {
    const { onRowChange } = renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Option' }));

    expect(onRowChange).toHaveBeenCalledTimes(1);
    expect(onRowChange).toHaveBeenCalledWith(
      '2099-05-19',
      expect.any(Function),
    );
  });

  it('appends an empty option when the add option updater runs', () => {
    const existingRow = createRow({
      pollOptions: ['A', 'B'],
    });
    const { onRowChange } = renderRow({ row: existingRow });

    fireEvent.click(screen.getByRole('button', { name: 'Option' }));

    const updatedRow = expectUpdaterResult(onRowChange, 0, existingRow);
    expect(updatedRow.pollOptions).toEqual(['A', 'B', '']);
  });

  it('renders remove buttons only for options after the first two', () => {
    renderRow({
      row: createRow({
        pollOptions: ['A', 'B', 'C', 'D'],
      }),
    });

    expect(
      screen.queryByRole('button', { name: 'Remove Option 1' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove Option 2' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Option 3' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Option 4' }),
    ).toBeInTheDocument();
  });

  it('does not render remove buttons when only the first two options exist', () => {
    renderRow({
      row: createRow({
        pollOptions: ['A', 'B'],
      }),
    });

    expect(
      screen.queryByRole('button', { name: /Remove Option/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onRowChange when a third option remove button is clicked', () => {
    const { onRowChange } = renderRow({
      row: createRow({
        pollOptions: ['A', 'B', 'C'],
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Option 3' }));

    expect(onRowChange).toHaveBeenCalledTimes(1);
    expect(onRowChange).toHaveBeenCalledWith(
      '2099-05-19',
      expect.any(Function),
    );
  });

  it('removes the third option in the generated updater', () => {
    const existingRow = createRow({
      pollOptions: ['A', 'B', 'C'],
    });
    const { onRowChange } = renderRow({ row: existingRow });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Option 3' }));

    const updatedRow = expectUpdaterResult(onRowChange, 0, existingRow);
    expect(updatedRow.pollOptions).toEqual(['A', 'B']);
  });

  it('removes the fourth option in the generated updater', () => {
    const existingRow = createRow({
      pollOptions: ['A', 'B', 'C', 'D'],
    });
    const { onRowChange } = renderRow({ row: existingRow });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Option 4' }));

    const updatedRow = expectUpdaterResult(onRowChange, 0, existingRow);
    expect(updatedRow.pollOptions).toEqual(['A', 'B', 'C']);
  });

  it('renders media link error text when getError returns a value', () => {
    const getError = jest.fn<string | undefined, [string]>((key) =>
      key === 'rows.2099-05-19.mediaLink'
        ? 'Enter a valid media URL.'
        : undefined,
    );

    renderRow({ getError });

    expect(screen.getByText('Enter a valid media URL.')).toBeInTheDocument();
  });

  it('renders poll question error text when getError returns a value', () => {
    const getError = jest.fn<string | undefined, [string]>((key) =>
      key === 'rows.2099-05-19.pollQuestion'
        ? 'Poll question is required.'
        : undefined,
    );

    renderRow({ getError });

    expect(screen.getByText('Poll question is required.')).toBeInTheDocument();
  });

  it('renders option 1 error text when getError returns a value', () => {
    const getError = jest.fn<string | undefined, [string]>((key) =>
      key === 'rows.2099-05-19.pollOptions.0'
        ? 'Option 1 is required when poll is configured.'
        : undefined,
    );

    renderRow({ getError });

    expect(
      screen.getByText('Option 1 is required when poll is configured.'),
    ).toBeInTheDocument();
  });

  it('renders option 2 error text when getError returns a value', () => {
    const getError = jest.fn<string | undefined, [string]>((key) =>
      key === 'rows.2099-05-19.pollOptions.1'
        ? 'Option 2 is required when poll is configured.'
        : undefined,
    );

    renderRow({ getError });

    expect(
      screen.getByText('Option 2 is required when poll is configured.'),
    ).toBeInTheDocument();
  });

  it('queries getError for all validation paths in the row', () => {
    const { getError } = renderRow({
      row: createRow({
        pollOptions: ['A', 'B', 'C'],
      }),
    });

    expect(getError).toHaveBeenCalledWith('rows.2099-05-19.mediaLink');
    expect(getError).toHaveBeenCalledWith('rows.2099-05-19.pollQuestion');
    expect(getError).toHaveBeenCalledWith('rows.2099-05-19.pollOptions.0');
    expect(getError).toHaveBeenCalledWith('rows.2099-05-19.pollOptions.1');
    expect(getError).toHaveBeenCalledWith('rows.2099-05-19.pollOptions.2');
  });

  it('uses the supplied date key in every row change callback', () => {
    const { onRowChange } = renderRow({ date: '2099-06-01' });

    fireEvent.change(
      screen.getByPlaceholderText('Enter daily campaign message...'),
      {
        target: { value: 'Message value' },
      },
    );
    fireEvent.change(screen.getByPlaceholderText('Paste media drive link...'), {
      target: { value: 'https://example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Poll question...'), {
      target: { value: 'Question value' },
    });

    expect(onRowChange.mock.calls[0][0]).toBe('2099-06-01');
    expect(onRowChange.mock.calls[1][0]).toBe('2099-06-01');
    expect(onRowChange.mock.calls[2][0]).toBe('2099-06-01');
  });

  it('does not call onClearRow before the clear button is clicked', () => {
    const { onClearRow } = renderRow();

    expect(onClearRow).not.toHaveBeenCalled();
  });

  it('does not call onRowChange before user input happens', () => {
    const { onRowChange } = renderRow();

    expect(onRowChange).not.toHaveBeenCalled();
  });

  it('can handle a row with message, media, question, and many options together', () => {
    renderRow({
      row: createRow({
        message: 'Daily reminder',
        mediaLink: 'https://drive.google.com/file/d/123',
        pollQuestion: 'Which task did you finish?',
        pollOptions: ['Reading', 'Writing', 'Math'],
      }),
      index: 5,
      dateLabel: '24 May',
    });

    expect(screen.getAllByText('Day 6')).toHaveLength(2);
    expect(screen.getByDisplayValue('Daily reminder')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://drive.google.com/file/d/123'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Which task did you finish?'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Reading')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Writing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Math')).toBeInTheDocument();
  });

  it('supports editing several fields in sequence and emits separate updater callbacks', () => {
    const { onRowChange } = renderRow();

    fireEvent.change(
      screen.getByPlaceholderText('Enter daily campaign message...'),
      {
        target: { value: 'Message 1' },
      },
    );
    fireEvent.change(screen.getByPlaceholderText('Paste media drive link...'), {
      target: { value: 'https://media.example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Poll question...'), {
      target: { value: 'Question 1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'First answer' },
    });

    expect(onRowChange).toHaveBeenCalledTimes(4);
  });

  it('can append multiple options through repeated add option clicks', () => {
    const { onRowChange } = renderRow({
      row: createRow({
        pollOptions: ['A', 'B'],
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Option' }));
    fireEvent.click(screen.getByRole('button', { name: 'Option' }));

    expect(onRowChange).toHaveBeenCalledTimes(2);
  });

  it('keeps the clear button available when there are many poll options', () => {
    renderRow({
      row: createRow({
        pollOptions: ['A', 'B', 'C', 'D', 'E', 'F'],
      }),
    });

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('renders remove buttons for all added options beyond the first two', () => {
    renderRow({
      row: createRow({
        pollOptions: ['A', 'B', 'C', 'D', 'E'],
      }),
    });

    expect(
      screen.getByRole('button', { name: 'Remove Option 3' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Option 4' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Option 5' }),
    ).toBeInTheDocument();
  });

  it('updates the correct option when many poll options exist', () => {
    const existingRow = createRow({
      pollOptions: ['A', 'B', 'C', 'D', 'E'],
    });
    const recorder = createRowChangeRecorder(existingRow);
    renderRow({ row: existingRow, onRowChange: recorder.onRowChange });

    fireEvent.change(screen.getByPlaceholderText('Option 5'), {
      target: { value: 'Updated E' },
    });

    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow.pollOptions).toEqual(['A', 'B', 'C', 'D', 'Updated E']);
  });

  it('removes the correct option when many poll options exist', () => {
    const existingRow = createRow({
      pollOptions: ['A', 'B', 'C', 'D', 'E'],
    });
    const { onRowChange } = renderRow({ row: existingRow });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Option 5' }));

    const updatedRow = expectUpdaterResult(onRowChange, 0, existingRow);
    expect(updatedRow.pollOptions).toEqual(['A', 'B', 'C', 'D']);
  });

  it('retains other row fields when a remove option updater runs', () => {
    const existingRow = createRow({
      message: 'Daily reminder',
      mediaLink: 'https://example.com',
      pollQuestion: 'Question',
      pollOptions: ['A', 'B', 'C'],
    });
    const { onRowChange } = renderRow({ row: existingRow });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Option 3' }));

    const updatedRow = expectUpdaterResult(onRowChange, 0, existingRow);
    expect(updatedRow.message).toBe('Daily reminder');
    expect(updatedRow.mediaLink).toBe('https://example.com');
    expect(updatedRow.pollQuestion).toBe('Question');
    expect(updatedRow.pollOptions).toEqual(['A', 'B']);
  });

  it('retains other row fields when an add option updater runs', () => {
    const existingRow = createRow({
      message: 'Daily reminder',
      mediaLink: 'https://example.com',
      pollQuestion: 'Question',
      pollOptions: ['A', 'B'],
    });
    const { onRowChange } = renderRow({ row: existingRow });

    fireEvent.click(screen.getByRole('button', { name: 'Option' }));

    const updatedRow = expectUpdaterResult(onRowChange, 0, existingRow);
    expect(updatedRow.message).toBe('Daily reminder');
    expect(updatedRow.mediaLink).toBe('https://example.com');
    expect(updatedRow.pollQuestion).toBe('Question');
    expect(updatedRow.pollOptions).toEqual(['A', 'B', '']);
  });

  it('retains other row fields when an option text updater runs', () => {
    const existingRow = createRow({
      message: 'Daily reminder',
      mediaLink: 'https://example.com',
      pollQuestion: 'Question',
      pollOptions: ['A', 'B', 'C'],
    });
    const recorder = createRowChangeRecorder(existingRow);
    renderRow({ row: existingRow, onRowChange: recorder.onRowChange });

    fireEvent.change(screen.getByPlaceholderText('Option 3'), {
      target: { value: 'Updated C' },
    });

    const updatedRow = recorder.appliedRows[0];
    expect(updatedRow.message).toBe('Daily reminder');
    expect(updatedRow.mediaLink).toBe('https://example.com');
    expect(updatedRow.pollQuestion).toBe('Question');
    expect(updatedRow.pollOptions).toEqual(['A', 'B', 'Updated C']);
  });
});
