import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InputField from './InputField';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('ionicons/icons', () => ({
  searchOutline: 'searchOutline',
}));

jest.mock('@ionic/react', () => ({
  IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{icon}</span>,
  IonButton: ({ children, onClick, className }: any) => (
    <button data-testid="ion-button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('InputField Component', () => {
  const mockSetInputValue = jest.fn();
  const mockOnEnter = jest.fn();
  const mockToggleInputMethod = jest.fn();
  const mockResetUserNotFound = jest.fn();

  const renderComponent = (props: any = {}) =>
    render(
      <InputField
        useEmail={true}
        inputValue=""
        setInputValue={mockSetInputValue}
        onEnter={mockOnEnter}
        toggleInputMethod={mockToggleInputMethod}
        resetUserNotFound={mockResetUserNotFound}
        {...props}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering tests
  test('renders input field', () => {
    renderComponent();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('renders search icon', () => {
    renderComponent();
    expect(screen.getByTestId('ion-icon')).toBeInTheDocument();
  });

  test('renders toggle button', () => {
    renderComponent();
    expect(screen.getByTestId('ion-button')).toBeInTheDocument();
  });

  test('input type is email when useEmail true', () => {
    renderComponent({ useEmail: true });
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  test('placeholder shows Email when useEmail true', () => {
    renderComponent({ useEmail: true });
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  test('placeholder shows Phone when useEmail false', () => {
    renderComponent({ useEmail: false });
    expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
  });

  test('input reflects inputValue prop', () => {
    renderComponent({ inputValue: 'abc@test.com' });
    expect(screen.getByDisplayValue('abc@test.com')).toBeInTheDocument();
  });

  // Input change tests
  test('calls setInputValue on change', () => {
    renderComponent();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    });
    expect(mockSetInputValue).toHaveBeenCalledWith('hello');
  });

  test('calls resetUserNotFound when input not empty', () => {
    renderComponent();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'data' },
    });
    expect(mockResetUserNotFound).toHaveBeenCalled();
  });

  // Enter key behavior
  test('shows error when Enter pressed with empty input', () => {
    renderComponent({ inputValue: '' });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();
  });

  test('calls onEnter when Enter pressed with value', () => {
    renderComponent({ inputValue: 'value' });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(mockOnEnter).toHaveBeenCalled();
  });

  test('does not call onEnter if only spaces entered', () => {
    renderComponent({ inputValue: '   ' });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(mockOnEnter).not.toHaveBeenCalled();
  });

  // Icon click behavior
  test('shows error when icon clicked with empty input', () => {
    renderComponent({ inputValue: '' });
    fireEvent.click(document.querySelector('.search-icon-container')!);
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();
  });

  test('calls onEnter when icon clicked with value', () => {
    renderComponent({ inputValue: '123' });
    fireEvent.click(document.querySelector('.search-icon-container')!);
    expect(mockOnEnter).toHaveBeenCalled();
  });

  // Toggle input method
  test('calls toggleInputMethod on button click', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('ion-button'));
    expect(mockToggleInputMethod).toHaveBeenCalled();
  });

  test('calls resetUserNotFound when toggling input method', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('ion-button'));
    expect(mockResetUserNotFound).toHaveBeenCalled();
  });

  test('toggle button text changes based on useEmail', () => {
    renderComponent({ useEmail: true });
    expect(screen.getByText('Use phone number instead')).toBeInTheDocument();
  });

  test('toggle button shows alternate text when useEmail false', () => {
    renderComponent({ useEmail: false });
    expect(screen.getByText('Use email instead')).toBeInTheDocument();
  });

  // UI behavior
  test('search icon has disabled class when input empty', () => {
    renderComponent({ inputValue: '' });
    expect(document.querySelector('.search-icon-container')).toHaveClass(
      'disabled-icon',
    );
  });

  test('search icon does not have disabled class when input has value', () => {
    renderComponent({ inputValue: 'abc' });
    expect(document.querySelector('.search-icon-container')).not.toHaveClass(
      'disabled-icon',
    );
  });

  test('error disappears after valid input entered', () => {
    renderComponent({ inputValue: '' });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'data' },
    });

    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
  });

  // Stability tests
  test('component mounts without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  test('component unmounts without crashing', () => {
    const { unmount } = renderComponent();
    expect(() => unmount()).not.toThrow();
  });

  test('multiple Enter presses call onEnter multiple times', () => {
    renderComponent({ inputValue: 'abc' });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(mockOnEnter).toHaveBeenCalledTimes(2);
  });

  test('clicking icon multiple times triggers onEnter multiple times', () => {
    renderComponent({ inputValue: 'abc' });

    const icon = document.querySelector('.search-icon-container')!;
    fireEvent.click(icon);
    fireEvent.click(icon);

    expect(mockOnEnter).toHaveBeenCalledTimes(2);
  });

  test('does not show error initially', () => {
    renderComponent();
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
  });

  test('inputMode is email when useEmail true', () => {
    renderComponent({ useEmail: true });
    expect(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'email');
  });

  test('renders search icon container', () => {
    renderComponent();
    expect(
      document.querySelector('.search-icon-container'),
    ).toBeInTheDocument();
  });

  test('toggle button has correct class', () => {
    renderComponent();
    expect(screen.getByTestId('ion-button')).toHaveClass(
      'inputField-toggle-text',
    );
  });

  test('input has correct class', () => {
    renderComponent();
    expect(screen.getByRole('textbox')).toHaveClass('plain-input');
  });

  test('search bar container exists', () => {
    renderComponent();
    expect(document.querySelector('.custom-search-bar')).toBeInTheDocument();
  });

  test('toggle-text container exists', () => {
    renderComponent();
    expect(document.querySelector('.toggle-text')).toBeInTheDocument();
  });

  test('does not call onEnter before interaction', () => {
    renderComponent({ inputValue: 'abc' });
    expect(mockOnEnter).not.toHaveBeenCalled();
  });

  test('does not call setInputValue before change', () => {
    renderComponent();
    expect(mockSetInputValue).not.toHaveBeenCalled();
  });

  test('resetUserNotFound not called when input cleared to empty', () => {
    renderComponent({ inputValue: 'abc' });

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '' },
    });

    expect(mockResetUserNotFound).not.toHaveBeenCalled();
  });
  test('does not trigger onEnter when non-Enter key pressed', () => {
    renderComponent({ inputValue: 'value' });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'a' });

    expect(mockOnEnter).not.toHaveBeenCalled();
  });

  test('error shows only once even after multiple empty Enter presses', () => {
    renderComponent({ inputValue: '' });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    const errors = screen.getAllByText('Field cannot be empty');
    expect(errors.length).toBe(1);
  });

  test('icon container always renders', () => {
    renderComponent();
    expect(
      document.querySelector('.search-icon-container'),
    ).toBeInTheDocument();
  });

  test('trimmed input with spaces triggers onEnter', () => {
    renderComponent({ inputValue: '  test  ' });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(mockOnEnter).toHaveBeenCalledTimes(1);
  });

  test('toggle click clears error state if previously shown', () => {
    renderComponent({ inputValue: '' });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ion-button'));

    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
  });
});
