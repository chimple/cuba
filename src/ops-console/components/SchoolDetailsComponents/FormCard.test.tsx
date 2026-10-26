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
  onChange: (value: string, meta?: { country?: { dialCode?: string } }) => void;
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
      onChange={(e) =>
        onChange(e.target.value, { country: { dialCode: '91' } })
      }
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

  it('does not render a placeholder option for edit-mode class selection', () => {
    render(
      <FormCard
        open={true}
        title="Edit Student Details"
        submitLabel="Save Changes"
        fields={[
          {
            name: 'classAndSection',
            label: 'Class And Section',
            kind: 'select',
            required: true,
            suppressPlaceholderOption: true,
            options: [
              { value: 'class-1', label: 'Class A' },
              { value: 'class-2', label: 'Class B' },
            ],
          },
        ]}
        initialValues={{
          classAndSection: 'class-1',
        }}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.queryByText('Select Class And Section'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Class A')).toBeInTheDocument();
  });

  it('requires 10 phone digits excluding the country dial code', async () => {
    const user = userEvent.setup();

    render(
      <FormCard
        open={true}
        title="Edit Student Details"
        submitLabel="Save Changes"
        fields={[
          {
            name: 'phone',
            label: 'Phone Number',
            kind: 'phone',
            required: true,
            nationalPhoneDigits: 10,
          },
        ]}
        initialValues={{ phone: '' }}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const phoneInput = screen.getByLabelText(/Phone Number/i);
    fireEvent.change(phoneInput, { target: { value: '+9112345678' } });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(
      screen.getByText('Phone number must be 10 digits.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(phoneInput, { target: { value: '9198765432' } });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSubmit).toHaveBeenCalledWith({ phone: '9198765432' });
  });
});
