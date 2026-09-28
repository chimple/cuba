import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProgramFieldCoordinatorsDialog from './EditProgramFieldCoordinatorsDialog';

const mockApi = {
  getManagersAndCoordinators: jest.fn(),
  getFieldCoordinatorsByProgram: jest.fn(),
  updateProgramFieldCoordinators: jest.fn(),
};

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({ apiHandler: mockApi }),
  },
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

describe('EditProgramFieldCoordinatorsDialog', () => {
  it('preselects assigned FCs and saves added FCs', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const fcA = { id: 'fc-a', name: 'FC A', email: null, phone: null };
    const fcB = { id: 'fc-b', name: 'FC B', email: null, phone: null };

    mockApi.getManagersAndCoordinators.mockResolvedValue({
      data: [
        { user: fcA, role: 'field_coordinator' },
        { user: fcB, role: 'field_coordinator' },
      ],
      totalCount: 2,
    });
    mockApi.getFieldCoordinatorsByProgram.mockResolvedValue({
      data: [fcA],
    });
    mockApi.updateProgramFieldCoordinators.mockResolvedValue(true);

    render(
      <EditProgramFieldCoordinatorsDialog
        open
        programId="program-1"
        onClose={onClose}
      />,
    );

    const input = await screen.findByRole('combobox', {
      name: 'Field Coordinators',
    });
    expect(screen.getByText('FC A')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();

    await user.click(input);
    let listbox = await screen.findByRole('listbox');
    expect(listbox).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
    const assignedOption = within(listbox).getByText('FC A').closest('li');
    expect(assignedOption).not.toBeNull();
    expect(within(assignedOption!).getByRole('checkbox')).toBeChecked();

    const backdrop = document.querySelector('.MuiBackdrop-root') as HTMLElement;
    await user.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );

    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(input);

    listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('FC B'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockApi.updateProgramFieldCoordinators).toHaveBeenCalledWith(
      'program-1',
      ['fc-a', 'fc-b'],
    );
    expect(onClose).toHaveBeenCalled();
  });
});

test('loads more on dropdown scroll and keeps an assigned coordinator first', async () => {
  const user = userEvent.setup();
  const assigned = { id: 'assigned', name: 'Z Assigned' };
  const firstPage = Array.from({ length: 20 }, (_, index) => ({
    user: { id: `fc-${index}`, name: `Coordinator ${index}` },
    role: 'field_coordinator',
  }));
  mockApi.getManagersAndCoordinators
    .mockResolvedValueOnce({ data: firstPage, totalCount: 21 })
    .mockResolvedValueOnce({
      data: [
        {
          user: { id: 'last', name: 'Last Coordinator' },
          role: 'field_coordinator',
        },
      ],
      totalCount: 21,
    });
  mockApi.getFieldCoordinatorsByProgram.mockResolvedValue({ data: [assigned] });
  mockApi.updateProgramFieldCoordinators.mockResolvedValue(true);
  render(
    <EditProgramFieldCoordinatorsDialog
      open
      programId="program-1"
      onClose={jest.fn()}
    />,
  );
  await user.click(
    await screen.findByRole('combobox', { name: 'Field Coordinators' }),
  );
  const listbox = await screen.findByRole('listbox');
  await waitFor(() =>
    expect(within(listbox).getAllByRole('option')).toHaveLength(21),
  );
  expect(within(listbox).getAllByRole('option')[0]).toHaveTextContent(
    'Z Assigned',
  );
  Object.defineProperties(listbox, {
    scrollHeight: { configurable: true, value: 800 },
    clientHeight: { configurable: true, value: 256 },
  });
  fireEvent.scroll(listbox, { target: { scrollTop: 544 } });
  await user.click(await within(listbox).findByText('Last Coordinator'));
  expect(within(listbox).getAllByRole('option')[1]).toHaveTextContent(
    'Last Coordinator',
  );
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(mockApi.updateProgramFieldCoordinators).toHaveBeenCalledWith(
    'program-1',
    ['assigned', 'last'],
  );
});

test('does not allow saving when the assigned coordinators fail to load', async () => {
  mockApi.getFieldCoordinatorsByProgram.mockRejectedValue(new Error('offline'));
  mockApi.getManagersAndCoordinators.mockResolvedValue({
    data: [],
    totalCount: 0,
  });
  render(
    <EditProgramFieldCoordinatorsDialog
      open
      programId="program-1"
      onClose={jest.fn()}
    />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load Field Coordinators',
  );
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(mockApi.updateProgramFieldCoordinators).not.toHaveBeenCalled();
});
