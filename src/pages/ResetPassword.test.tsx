import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import path from 'path';
import ResetPassword from './ResetPassword';
import { PAGES } from '../common/constants';
import logger from '../utility/logger';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../utility/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({
      push: mockHistoryPush,
    }),
    useLocation: () => ({
      search: '',
      pathname: '/reset-password',
    }),
  };
});

jest.mock('ionicons/icons', () => ({
  eye: 'eye',
  eyeOff: 'eyeOff',
}));

jest.mock('@ionic/react', () => ({
  IonButton: ({ children, onClick, className, id }: any) => (
    <button type="button" onClick={onClick} className={className} id={id}>
      {children}
    </button>
  ),
  IonInput: ({ type, value, placeholder, className, onIonChange }: any) => (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onIonChange?.({ detail: { value: e.target.value } })}
    />
  ),
  IonIcon: ({ icon, onClick, className }: any) => (
    <button
      type="button"
      data-testid={`icon-${String(icon)}`}
      className={className}
      onClick={onClick}
    >
      {String(icon)}
    </button>
  ),
}));

const mockAuthHandler = {
  updateUser: jest.fn(),
};

jest.mock('../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      authHandler: mockAuthHandler,
    }),
  },
}));

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAuthHandler.updateUser.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not redirect when updateUser returns a falsy value', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockAuthHandler.updateUser.mockResolvedValue(false);

    render(<ResetPassword />);

    await user.type(
      screen.getByPlaceholderText('Enter new password'),
      'secure1',
    );

    await user.type(screen.getByPlaceholderText('Confirm password'), 'secure1');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: 'secure1',
      });
    });

    expect(
      screen.queryByText('Password reset successful. Redirecting to login...'),
    ).not.toBeInTheDocument();

    expect(mockHistoryPush).not.toHaveBeenCalled();

    expect(logger.error).toHaveBeenCalledWith('error in updating user....', {});
  });

  it('keeps the reset password CSS eye icon positioning contract', () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), 'src/pages/ResetPassword.css'),
      'utf8',
    );

    expect(css).toMatch(
      /\.reset-password-eye-icon\s*\{[\s\S]*position:\s*absolute;/,
    );
    expect(css).toMatch(/\.reset-password-eye-icon\s*\{[\s\S]*right:\s*10px;/);
  });

  it('keeps the reset password button CSS contract', () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), 'src/pages/ResetPassword.css'),
      'utf8',
    );

    expect(css).toMatch(
      /#reset-password-button-inner\s*\{[\s\S]*display:\s*flex;/,
    );
    expect(css).toMatch(
      /#reset-password-button-inner\s*\{[\s\S]*--background:\s*#cfec91;/,
    );
  });

  it('keeps the reset password CSS layout contract', () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), 'src/pages/ResetPassword.css'),
      'utf8',
    );

    expect(css).toMatch(
      /\.reset-password-main-div\s*\{[\s\S]*display:\s*flex;/,
    );
    expect(css).toMatch(
      /\.reset-password-field-div\s*\{[\s\S]*position:\s*relative;/,
    );
  });
});
