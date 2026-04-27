import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const SchoolListExportButton = require('./SchoolListExportButton').default;

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

describe('SchoolListExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the export label when not exporting', () => {
    render(
      <SchoolListExportButton
        disabled={false}
        isExporting={false}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('shows the exporting label while export is in progress', () => {
    render(
      <SchoolListExportButton
        disabled={true}
        isExporting={true}
        onClick={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Exporting...' }),
    ).toBeInTheDocument();
  });

  it('disables the button when disabled is true', () => {
    render(
      <SchoolListExportButton
        disabled={true}
        isExporting={false}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('calls onClick when the button is pressed', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <SchoolListExportButton
        disabled={false}
        isExporting={false}
        onClick={handleClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows the exporting label even if disabled while export is in progress', () => {
    render(
      <SchoolListExportButton
        disabled={true}
        isExporting={true}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Exporting...' })).toBeDisabled();
  });

  it('keeps the same button id and styling hooks for the toolbar layout', () => {
    render(
      <SchoolListExportButton
        disabled={false}
        isExporting={false}
        onClick={jest.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Export' });

    expect(button).toHaveAttribute('id', 'school-list-export-button');
    expect(button).toHaveClass(
      'school-list-actions-button',
      'school-list-export-button',
    );
  });
});
