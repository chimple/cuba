import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormCard, { FieldConfig } from './FormCard';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

type MockPhoneInputProps = {
  defaultCountry?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  disableCountryGuess?: boolean;
};

jest.mock('react-international-phone', () => ({
  PhoneInput: ({
    value,
    onChange,
    disabled,
    className,
    inputClassName,
    inputProps,
  }: MockPhoneInputProps) => (
    <input
      data-testid="mock-phone-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${className ?? ''} ${inputClassName ?? ''}`.trim()}
      {...inputProps}
    />
  ),
}));

describe('FormCard', () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();

  const baseFields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Teacher Name',
      kind: 'text',
      required: true,
      column: 2,
      disabled: true,
    },
    {
      name: 'class',
      label: 'Class Section',
      kind: 'select',
      column: 0,
      multi: true,
      options: [
        { value: 'class-1', label: 'Class A' },
        { value: 'class-2', label: 'Class B' },
      ],
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      kind: 'phone',
      column: 2,
      disabled: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when open is false', () => {
    render(
      <FormCard
        open={false}
        title="Edit Teacher Details"
        submitLabel="Save Changes"
        fields={baseFields}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByText('Edit Teacher Details')).not.toBeInTheDocument();
  });

  it('renders disabled fields and closes from cancel action', async () => {
    const user = userEvent.setup();

    render(
      <FormCard
        open={true}
        title="Edit Teacher Details"
        submitLabel="Save Changes"
        fields={baseFields}
        initialValues={{
          name: 'Gourav',
          class: 'class-1',
          phoneNumber: '9110667875',
        }}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const teacherNameInput = screen.getByLabelText(/Teacher Name/i);
    const phoneInput = screen.getByLabelText(/Phone Number/i);

    expect(teacherNameInput).toBeDisabled();
    expect(phoneInput).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps save disabled until edit mode form values change', async () => {
    const user = userEvent.setup();

    render(
      <FormCard
        open={true}
        title="Edit Teacher Details"
        submitLabel="Save Changes"
        fields={baseFields}
        initialValues={{
          name: 'Gourav',
          class: 'class-1',
          phoneNumber: '9110667875',
        }}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByText('Class A'));
    fireEvent.mouseDown(screen.getByText('Class B'));

    expect(saveButton).not.toBeDisabled();
  });

  it('submits normalized multi-select value after class selection changes', async () => {
    const user = userEvent.setup();

    render(
      <FormCard
        open={true}
        title="Edit Teacher Details"
        submitLabel="Save Changes"
        fields={baseFields}
        initialValues={{
          name: 'Gourav',
          class: 'class-1',
          phoneNumber: '9110667875',
        }}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByText('Class A'));
    fireEvent.mouseDown(screen.getByText('Class B'));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        class: 'class-1,class-2',
        name: 'Gourav',
      }),
    );
  });
});
