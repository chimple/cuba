import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SchoolFieldCoordinators from './SchoolFieldCoordinatorsCard';
import EditSchoolFieldCoordinatorsDialog from './EditSchoolFieldCoordinatorsDialog';

jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('../../../utility/logger', () => ({ error: jest.fn() }));
const mockApi = {
  getSchoolById: jest.fn(),
  getSchoolFieldCoordinators: jest.fn(),
  getFieldCoordinatorsByProgram: jest.fn(),
  updateSchoolFieldCoordinators: jest.fn(),
  updateProgramFieldCoordinators: jest.fn(),
};
jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: { getI: () => ({ apiHandler: mockApi }) },
}));
const fcA = { id: 'a', name: 'FC A', email: 'a@example.com' };
const fcB = { id: 'b', name: 'FC B', phone: '1234567890' };

it('ignores an old school response after switching to another school', async () => {
  let finishOldRequest!: (users: (typeof fcA)[]) => void;
  mockApi.getSchoolFieldCoordinators
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finishOldRequest = resolve;
      }),
    )
    .mockResolvedValueOnce([fcB]);
  const { rerender } = render(
    <SchoolFieldCoordinators schoolId="school-1" canEdit={false} />,
  );
  rerender(<SchoolFieldCoordinators schoolId="school-2" canEdit={false} />);
  expect(await screen.findByText('FC B')).toBeInTheDocument();
  await act(async () => {
    finishOldRequest([fcA]);
  });
  expect(screen.queryByText('FC A')).not.toBeInTheDocument();
  expect(screen.getByText('FC B')).toBeInTheDocument();
});

beforeEach(() => {
  mockApi.getSchoolFieldCoordinators.mockResolvedValue([fcA]);
  mockApi.getFieldCoordinatorsByProgram.mockResolvedValue({ data: [fcA, fcB] });
  mockApi.updateSchoolFieldCoordinators.mockResolvedValue(undefined);
});

it('shows an empty state without edit access for read-only users', async () => {
  mockApi.getSchoolFieldCoordinators.mockResolvedValue([]);
  render(
    <SchoolFieldCoordinators
      schoolId="school-1"
      programId="program-1"
      canEdit={false}
    />,
  );
  expect(
    await screen.findByText('No Field Coordinators assigned'),
  ).toBeInTheDocument();
  expect(screen.queryByAltText('editIcon')).not.toBeInTheDocument();
  expect(mockApi.getFieldCoordinatorsByProgram).not.toHaveBeenCalled();
});

it('displays only assigned FCs, preselects them, saves school changes and refreshes the card', async () => {
  const user = userEvent.setup();
  mockApi.getSchoolFieldCoordinators
    .mockResolvedValueOnce([fcA])
    .mockResolvedValueOnce([fcA])
    .mockResolvedValueOnce([fcB]);
  render(
    <SchoolFieldCoordinators
      schoolId="school-1"
      programId="program-1"
      canEdit
    />,
  );
  expect(await screen.findByText('FC A')).toBeInTheDocument();
  expect(screen.queryByText('FC B')).not.toBeInTheDocument();
  await user.click(screen.getByAltText('editIcon'));
  const dialog = screen.getByRole('dialog', {
    name: 'Edit Field Coordinators',
  });
  await user.click(
    await within(dialog).findByRole('combobox', { name: 'Field Coordinators' }),
  );
  const listbox = screen.getByRole('listbox');
  expect(
    within(within(listbox).getByRole('option', { name: /FC A/ })).getByRole(
      'checkbox',
    ),
  ).toBeChecked();
  expect(
    within(within(listbox).getByRole('option', { name: /FC B/ })).getByRole(
      'checkbox',
    ),
  ).not.toBeChecked();
  await user.click(within(listbox).getByRole('option', { name: /FC B/ }));
  await user.click(within(listbox).getByRole('option', { name: /FC A/ }));
  await user.click(within(dialog).getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(mockApi.getFieldCoordinatorsByProgram).toHaveBeenCalledWith(
    'program-1',
  );
  expect(mockApi.updateSchoolFieldCoordinators).toHaveBeenCalledWith(
    'school-1',
    ['b'],
  );
  expect(mockApi.getSchoolById).not.toHaveBeenCalled();
  expect(mockApi.updateProgramFieldCoordinators).not.toHaveBeenCalled();
  expect(screen.getByText('FC B')).toBeInTheDocument();
  expect(screen.queryByText('FC A')).not.toBeInTheDocument();
});

it('discards unsaved choices on cancel and reloads assignments when reopened', async () => {
  const user = userEvent.setup();
  render(
    <SchoolFieldCoordinators
      schoolId="school-1"
      programId="program-1"
      canEdit
    />,
  );
  await user.click(await screen.findByAltText('editIcon'));
  await user.click(
    await screen.findByRole('combobox', { name: 'Field Coordinators' }),
  );
  await user.click(screen.getByRole('option', { name: /FC B/ }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(mockApi.updateSchoolFieldCoordinators).not.toHaveBeenCalled();
  await user.click(screen.getByAltText('editIcon'));
  const dialog = screen.getByRole('dialog');
  expect(await within(dialog).findByText('FC A')).toBeInTheDocument();
  expect(within(dialog).queryByText('FC B')).not.toBeInTheDocument();
});

it('allows removing every school FC', async () => {
  const user = userEvent.setup();
  const onSaved = jest.fn().mockResolvedValue(undefined);
  render(
    <EditSchoolFieldCoordinatorsDialog
      open
      schoolId="school-1"
      programId="program-1"
      onSaved={onSaved}
      onClose={jest.fn()}
    />,
  );
  await user.click(
    await screen.findByRole('combobox', { name: 'Field Coordinators' }),
  );
  await user.click(screen.getByRole('option', { name: /FC A/ }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(mockApi.updateSchoolFieldCoordinators).toHaveBeenCalledWith(
    'school-1',
    [],
  );
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it('blocks saving when assignments fail to load', async () => {
  mockApi.getSchoolFieldCoordinators.mockRejectedValue(new Error('offline'));
  render(
    <EditSchoolFieldCoordinatorsDialog
      open
      schoolId="school-1"
      programId="program-1"
      onSaved={jest.fn()}
      onClose={jest.fn()}
    />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load Field Coordinators',
  );
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(mockApi.updateSchoolFieldCoordinators).not.toHaveBeenCalled();
});

it('keeps the dialog open and requires a reload after a failed or partial update', async () => {
  const user = userEvent.setup();
  const onClose = jest.fn();
  mockApi.updateSchoolFieldCoordinators.mockRejectedValue(
    new Error('update failed'),
  );
  render(
    <EditSchoolFieldCoordinatorsDialog
      open
      schoolId="school-1"
      programId="program-1"
      onSaved={jest.fn()}
      onClose={onClose}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Some changes may have been saved',
  );
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(onClose).not.toHaveBeenCalled();
});

it('never offers an obsolete school assignment as a program option and requires explicit removal', async () => {
  const user = userEvent.setup();
  mockApi.getSchoolFieldCoordinators.mockResolvedValue([
    { id: 'old', name: 'Former FC' },
  ]);
  render(
    <EditSchoolFieldCoordinatorsDialog
      open
      schoolId="school-1"
      programId="program-1"
      onSaved={jest.fn()}
      onClose={jest.fn()}
    />,
  );
  await user.click(
    await screen.findByRole('combobox', { name: 'Field Coordinators' }),
  );
  expect(
    screen.queryByRole('option', { name: /Former FC/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Former FC' }));
  await user.keyboard('{Delete}');
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
});
