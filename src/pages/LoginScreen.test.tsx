import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Toast } from '@capacitor/toast';
import { createTestStore, renderWithProviders } from '../tests/test-utils';

import LoginScreen from './LoginScreen';
import { ServiceConfig } from '../services/ServiceConfig';
import { LANGUAGE, LOGIN_TYPES, MODES, PAGES } from '../common/constants';
import { RoleType } from '../interface/modelInterfaces';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';

const mockHistoryReplace = jest.fn();
const mockPresentToast = jest.fn();
const mockSetGbUpdated = jest.fn();
const mockUpdateLocalAttributes = jest.fn();
const mockSetCurrMode = jest.fn();
const mockLogEvent = jest.fn();
let mockCurrentLanguage = 'en';
const mockTranslations: Record<string, Record<string, string>> = {
  en: {
    'Verify Your Number': 'Verify Your Number',
    'Device is offline. Login requires an internet connection':
      'Device is offline. Login requires an internet connection',
    'Kindly wait for 1 minute and then try logging in again.':
      'Kindly wait for 1 minute and then try logging in again.',
  },
  hi: {
    'Verify Your Number': '[hi] Verify Your Number',
    'Device is offline. Login requires an internet connection':
      '[hi] Device is offline. Login requires an internet connection',
    'Kindly wait for 1 minute and then try logging in again.':
      '[hi] Kindly wait for 1 minute and then try logging in again.',
  },
};
const mockTranslate = (key: string, options?: Record<string, unknown>) => {
  let text = mockTranslations[mockCurrentLanguage]?.[key] ?? key;
  if (options) {
    Object.entries(options).forEach(([name, value]) => {
      text = text.replace(`{{${name}}}`, String(value));
    });
  }
  return text;
};
const mockChangeLanguage = jest.fn(async (lang: string) => {
  mockCurrentLanguage = lang;
});

const mockPortPlugin = {
  requestPermission: jest.fn().mockResolvedValue({}),
  numberRetrieve: jest.fn().mockResolvedValue({ number: '' }),
  otpRetrieve: jest.fn().mockResolvedValue({ otp: '' }),
};

const mockAuthHandler = {
  isUserLoggedIn: jest.fn(),
  getCurrentUser: jest.fn(),
  generateOtp: jest.fn(),
  proceedWithVerificationCode: jest.fn(),
  resendOtpMsg91: jest.fn(),
  googleSign: jest.fn(),
  loginWithEmailAndPassword: jest.fn(),
  signInWithEmail: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({ replace: mockHistoryReplace }),
}));

jest.mock('i18next', () => ({
  t: (key: string, options?: Record<string, unknown>) =>
    mockTranslate(key, options),
}));

jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: (lang: string) => mockChangeLanguage(lang),
  },
}));

jest.mock('../common/onlineOfflineErrorMessageHandler', () => ({
  useOnlineOfflineErrorMessageHandler: jest.fn(),
}));

jest.mock('../growthbook/Growthbook', () => ({
  useGbContext: () => ({ setGbUpdated: mockSetGbUpdated }),
  updateLocalAttributes: (attributes: unknown) =>
    mockUpdateLocalAttributes(attributes),
}));

jest.mock('../utility/schoolUtil', () => ({
  schoolUtil: { setCurrMode: (mode: unknown) => mockSetCurrMode(mode) },
}));

jest.mock('../utility/util', () => ({
  Util: {
    logEvent: (eventName: unknown, payload: unknown) =>
      mockLogEvent(eventName, payload),
  },
}));

jest.mock('../components/Loading', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="loading-indicator">loading</div> : null,
}));

jest.mock('../components/signup/LanguageDropdown', () => ({
  __esModule: true,
  default: ({ options, value, onChange }: any) => (
    <select
      aria-label="language-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option: any) => (
        <option key={option.id} value={option.id}>
          {option.displayName}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('../components/signup/LoginWithPhone', () => ({
  __esModule: true,
  default: ({
    onNext,
    phoneNumber,
    setPhoneNumber,
    errorMessage,
    onFocus,
  }: any) => (
    <div data-testid="phone-login">
      <input
        aria-label="phone-input"
        value={phoneNumber}
        onChange={(e) => {
          const value = e.target.value;
          if (/^\d*$/.test(value)) {
            setPhoneNumber(value.slice(0, 10));
          }
        }}
      />
      {errorMessage ? (
        <div data-testid="phone-error">{errorMessage}</div>
      ) : null}
      <button
        disabled={phoneNumber.length !== 10}
        onClick={onNext}
        type="button"
      >
        phone-next
      </button>
      <button onClick={() => void onFocus()} type="button">
        phone-focus
      </button>
    </div>
  ),
}));

jest.mock('../components/signup/LoginWithStudentID', () => ({
  __esModule: true,
  default: ({
    onLogin,
    schoolCode,
    setSchoolCode,
    studentId,
    setStudentId,
    studentPassword,
    setStudentPassword,
    errorMessage,
  }: any) => (
    <div data-testid="student-login">
      <input
        aria-label="school-code-input"
        value={schoolCode}
        onChange={(e) => setSchoolCode(e.target.value)}
      />
      <input
        aria-label="student-id-input"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />
      <input
        aria-label="student-password-input"
        value={studentPassword}
        onChange={(e) => setStudentPassword(e.target.value)}
      />
      {errorMessage ? (
        <div data-testid="student-error">{errorMessage}</div>
      ) : null}
      <button
        disabled={
          !schoolCode ||
          !studentId ||
          !studentPassword ||
          studentPassword.length < 6
        }
        onClick={() => void onLogin()}
        type="button"
      >
        student-login
      </button>
    </div>
  ),
}));

jest.mock('../components/signup/LoginWithEmail', () => ({
  __esModule: true,
  default: ({
    onLogin,
    onForgotPasswordChange,
    email,
    setEmail,
    password,
    setPassword,
    errorMessage,
  }: any) => (
    <div data-testid="email-login">
      <input
        aria-label="email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        aria-label="password-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {errorMessage ? (
        <div data-testid="email-error">{errorMessage}</div>
      ) : null}
      <button
        disabled={
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          password.length < 6 ||
          /\s/.test(password)
        }
        onClick={() => void onLogin(email, password)}
        type="button"
      >
        email-login
      </button>
      <button onClick={onForgotPasswordChange} type="button">
        forgot-password
      </button>
    </div>
  ),
}));

jest.mock('../components/signup/OtpVerification', () => ({
  __esModule: true,
  default: ({
    onVerify,
    verificationCode,
    setVerificationCode,
    errorMessage,
    phoneNumber,
  }: any) => (
    <div data-testid="otp-login">
      <div data-testid="otp-phone">{phoneNumber}</div>
      <input
        aria-label="otp-input"
        value={verificationCode}
        onChange={(e) => {
          const value = e.target.value;
          const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
          setVerificationCode(digitsOnly);
        }}
      />
      {errorMessage ? <div data-testid="otp-error">{errorMessage}</div> : null}
      <button
        disabled={!verificationCode || verificationCode.length !== 6}
        onClick={() => void onVerify(verificationCode)}
        type="button"
      >
        verify-otp
      </button>
    </div>
  ),
}));

jest.mock('../components/signup/ForgotPass', () => ({
  __esModule: true,
  default: ({ onGoBack }: any) => (
    <button onClick={onGoBack} type="button">
      forgot-go-back
    </button>
  ),
}));

jest.mock('../components/signup/LoginSwitch', () => ({
  __esModule: true,
  default: ({
    loginType,
    onSwitch,
    onCheckboxChange,
    checkbox,
    onResend,
    onGoogleSignIn,
    onTermsClick,
    showResendOtp,
    counter,
    otpExpiryCounter,
  }: any) => (
    <div data-testid="login-switch">
      <div data-testid="switch-login-type">{loginType}</div>
      <div data-testid="switch-counter">{String(counter ?? '')}</div>
      <div data-testid="switch-show-resend">
        {String(Boolean(showResendOtp))}
      </div>
      <div data-testid="switch-otp-expiry">{String(otpExpiryCounter)}</div>
      <button onClick={() => onSwitch('phone')} type="button">
        switch-phone
      </button>
      <button onClick={() => onSwitch('student')} type="button">
        switch-student
      </button>
      <button onClick={() => onSwitch('email')} type="button">
        switch-email
      </button>
      <button onClick={onTermsClick} type="button">
        open-terms
      </button>
      <button onClick={() => onCheckboxChange(!checkbox)} type="button">
        toggle-checkbox
      </button>
      <button onClick={() => checkbox && void onGoogleSignIn()} type="button">
        google-signin
      </button>
      <button onClick={onResend} type="button">
        resend-otp
      </button>
    </div>
  ),
}));

const mockApiHandler = { getSchoolsForUser: jest.fn() };
const mockOnlineOfflineHandler =
  useOnlineOfflineErrorMessageHandler as jest.Mock;

// Helper function to create a mock Redux store for testing
// Using shared test utils for Redux store and provider

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const eventually = async (assertion: () => void, timeoutMs = 2500) => {
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await delay(20);
    }
  }
  throw lastError;
};

const renderReady = async () => {
  const mockStore = createTestStore();
  const view = renderWithProviders(<LoginScreen />, { store: mockStore });
  await view.findByTestId('phone-login');
  return { view, store: mockStore };
};

describe('LoginScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockCurrentLanguage = 'en';

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })) as any;

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApiHandler,
      authHandler: mockAuthHandler,
      switchMode: jest.fn(),
    } as any);

    mockOnlineOfflineHandler.mockReturnValue({
      online: true,
      presentToast: mockPresentToast,
    });

    Object.assign(mockAuthHandler, {
      isUserLoggedIn: jest.fn().mockResolvedValue(false),
      getCurrentUser: jest.fn().mockResolvedValue(null),
      generateOtp: jest.fn().mockResolvedValue({ success: true }),
      proceedWithVerificationCode: jest.fn(),
      resendOtpMsg91: jest.fn().mockResolvedValue(true),
      googleSign: jest.fn().mockResolvedValue({ success: true, isSpl: false }),
      loginWithEmailAndPassword: jest.fn(),
      signInWithEmail: jest.fn(),
    });

    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockPortPlugin.requestPermission.mockResolvedValue({});
    mockPortPlugin.numberRetrieve.mockResolvedValue({ number: '' });
    mockPortPlugin.otpRetrieve.mockResolvedValue({ otp: '' });
    (registerPlugin as jest.Mock).mockReturnValue(mockPortPlugin);
    jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    jest.spyOn(Capacitor, 'getPlatform').mockReturnValue('web');
  });

  describe('Initialization', () => {
    it('shows loading and renders phone login', async () => {
      const mockStore = createTestStore();
      const view = renderWithProviders(<LoginScreen />, { store: mockStore });
      expect(view.getByTestId('loading-indicator')).toBeInTheDocument();
      await view.findByTestId('phone-login');
    });

    // 1. Web platform does not lock orientation
    it('does not lock orientation on web platform', async () => {
      await renderReady();
      expect(ScreenOrientation.lock).not.toHaveBeenCalled();
    });

    it('applies default language when storage is empty', async () => {
      await renderReady();
      expect(localStorage.getItem(LANGUAGE)).toBe('en');
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('applies stored language', async () => {
      localStorage.setItem(LANGUAGE, 'hi');
      const mockStore = createTestStore();
      const view = renderWithProviders(<LoginScreen />, { store: mockStore });
      const lang = await view.findByLabelText('language-dropdown');
      expect(lang).toHaveValue('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
    });

    it('redirects logged-in user to select mode', async () => {
      (mockAuthHandler.isUserLoggedIn as jest.Mock).mockResolvedValue(true);
      await renderReady();
      await eventually(() => {
        expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
      });
    });
  });

  describe('Login Type + Basic UI', () => {
    // 3. Login type switching + header UI
    it('switches between phone/email/student and handles forgot password back', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'switch-email' }));
      await view.findByTestId('email-login');

      // 10. Email password reset (Forgot Password)
      await user.click(view.getByRole('button', { name: 'forgot-password' }));
      // 12. Back button during reset password for email
      await user.click(view.getByRole('button', { name: 'Back' }));
      await view.findByTestId('email-login');

      await user.click(view.getByRole('button', { name: 'switch-student' }));
      await view.findByTestId('student-login');

      await user.click(view.getByRole('button', { name: 'switch-phone' }));
      await view.findByTestId('phone-login');
    });

    // 2. LANGUAGE and dropdownand language change
    it('changes language from dropdown', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
    });

    // Terms & Conditions: when clicked should open the page
    it('opens Terms & Conditions page when clicked', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      expect(
        view.queryByRole('button', { name: /close/i }),
      ).not.toBeInTheDocument();
      await user.click(view.getByRole('button', { name: 'open-terms' }));
      await view.findByRole('button', { name: /close/i });
    });

    // Terms & Conditions: when clicked cross button should close the page
    it('closes Terms & Conditions page when close button is clicked', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'open-terms' }));
      await view.findByRole('button', { name: /close/i });
      await user.click(view.getByRole('button', { name: /close/i }));
      expect(
        view.queryByRole('button', { name: /close/i }),
      ).not.toBeInTheDocument();
    });

    it('updates language selection even when changed during OTP flow', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');
      expect(view.getByTestId('otp-phone')).toHaveTextContent('9876543210');

      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      expect(view.getByTestId('otp-login')).toBeInTheDocument();
    });

    it('updates language while staying on phone login state', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');

      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      expect(view.getByTestId('phone-login')).toBeInTheDocument();
      expect(view.getByLabelText('phone-input')).toHaveValue('9876543210');
    });

    it('updates language while staying on email login state', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'switch-email' }));
      await view.findByTestId('email-login');
      await user.type(view.getByLabelText('email-input'), 'parent@example.com');
      await user.type(view.getByLabelText('password-input'), '123456');
      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');

      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      expect(view.getByTestId('email-login')).toBeInTheDocument();
      expect(view.getByLabelText('email-input')).toHaveValue(
        'parent@example.com',
      );
      expect(view.getByLabelText('password-input')).toHaveValue('123456');
    });

    it('updates language while staying on student login state', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'switch-student' }));
      await view.findByTestId('student-login');
      await user.type(view.getByLabelText('school-code-input'), 'SCH');
      await user.type(view.getByLabelText('student-id-input'), '001');
      await user.type(view.getByLabelText('student-password-input'), 'pass123');
      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');

      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      expect(view.getByTestId('student-login')).toBeInTheDocument();
      expect(view.getByLabelText('school-code-input')).toHaveValue('SCH');
      expect(view.getByLabelText('student-id-input')).toHaveValue('001');
      expect(view.getByLabelText('student-password-input')).toHaveValue(
        'pass123',
      );
    });

    // Language: check if we change the language every text and buttons should be updated in the UI
    it('changes language on OTP page and keeps OTP actions working', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      expect(view.getByTestId('otp-login')).toBeInTheDocument();
      expect(view.getByRole('button', { name: 'Back' })).toBeInTheDocument();

      await user.click(view.getByRole('button', { name: 'Back' }));
      await view.findByTestId('phone-login');
    });

    // Language: in any page otp or student login if we change the language language is changed or not
    it('keeps changed language while moving from OTP page to student login page', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');
      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');

      await user.click(view.getByRole('button', { name: 'Back' }));
      await user.click(view.getByRole('button', { name: 'switch-student' }));
      await view.findByTestId('student-login');

      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
    });

    // Language: check language-updated UI message on student login page
    it('applies language change on student page and keeps login action behavior', async () => {
      mockOnlineOfflineHandler.mockReturnValue({
        online: false,
        presentToast: mockPresentToast,
      });
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'switch-student' }));
      await view.findByTestId('student-login');
      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      await eventually(() => {
        expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      });

      await user.type(view.getByLabelText('school-code-input'), 'SCH');
      await user.type(view.getByLabelText('student-id-input'), '001');
      await user.type(view.getByLabelText('student-password-input'), 'pass123');
      await user.click(view.getByRole('button', { name: 'student-login' }));

      await eventually(() => {
        expect(mockPresentToast).toHaveBeenCalled();
      });
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      expect(mockPresentToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Device is offline. Login requires an internet connection',
        }),
      );
    });

    // Language: check if we change the language dynamically it gets updated anywhere and everywhere in login screen
    it('updates language dynamically across all login screen states', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      expect(view.getByTestId('phone-login')).toBeInTheDocument();
      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');

      await user.click(view.getByRole('button', { name: 'switch-email' }));
      await view.findByTestId('email-login');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');

      await user.selectOptions(view.getByLabelText('language-dropdown'), 'en');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('en');
      expect(localStorage.getItem(LANGUAGE)).toBe('en');

      await user.click(view.getByRole('button', { name: 'forgot-password' }));
      expect(view.getByRole('button', { name: 'Back' })).toBeInTheDocument();
      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');

      await user.click(view.getByRole('button', { name: 'Back' }));
      await view.findByTestId('email-login');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');

      await user.click(view.getByRole('button', { name: 'switch-student' }));
      await view.findByTestId('student-login');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');

      await user.selectOptions(view.getByLabelText('language-dropdown'), 'en');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('en');
      expect(localStorage.getItem(LANGUAGE)).toBe('en');

      await user.click(view.getByRole('button', { name: 'switch-phone' }));
      await view.findByTestId('phone-login');
      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('en');

      await user.selectOptions(view.getByLabelText('language-dropdown'), 'hi');
      expect(view.getByLabelText('language-dropdown')).toHaveValue('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
      expect(mockChangeLanguage).toHaveBeenLastCalledWith('hi');
    });
  });

  describe('Phone + OTP', () => {
    it('allows only digits and blocks letters/special characters in phone input', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '12ab@#34');
      expect(view.getByLabelText('phone-input')).toHaveValue('1234');
    });

    it('enables START button only for exactly 10 digits', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      const startBtn = view.getByRole('button', { name: 'phone-next' });

      await user.type(view.getByLabelText('phone-input'), '123456789');
      expect(startBtn).toBeDisabled();

      await user.type(view.getByLabelText('phone-input'), '0');
      expect(startBtn).toBeEnabled();

      await user.type(view.getByLabelText('phone-input'), '12');
      expect(view.getByLabelText('phone-input')).toHaveValue('1234567890');
      expect(startBtn).toBeEnabled();
    });

    it('does not submit for less than 10 digits and submits for valid 10-digit input', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      const startBtn = view.getByRole('button', { name: 'phone-next' });

      await user.type(view.getByLabelText('phone-input'), '123456789');
      await user.click(startBtn);
      expect(mockAuthHandler.generateOtp).not.toHaveBeenCalled();

      await user.type(view.getByLabelText('phone-input'), '0');
      await user.click(startBtn);
      await eventually(() => {
        expect(mockAuthHandler.generateOtp).toHaveBeenCalledWith(
          '1234567890',
          'Chimple',
        );
      });
    });

    it('auto picks up phone number from plugin event', async () => {
      mockPortPlugin.numberRetrieve.mockResolvedValueOnce({
        number: '9998887776',
      });
      const addListenerSpy = jest.spyOn(document, 'addEventListener');
      const { view } = await renderReady();

      const listenerEntry = addListenerSpy.mock.calls.find(
        (call) => call[0] === 'isPhoneNumberSelected',
      );
      expect(listenerEntry).toBeTruthy();
      const listener = listenerEntry?.[1] as EventListener;
      await act(async () => {
        await listener(new Event('isPhoneNumberSelected'));
      });

      await eventually(() => {
        expect(view.getByLabelText('phone-input')).toHaveValue('9998887776');
      });
      addListenerSpy.mockRestore();
    });

    // 4. Phone -> OTP generation flow
    it('validates phone and handles OTP generation error states', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      const startBtn = view.getByRole('button', { name: 'phone-next' });

      await user.type(view.getByLabelText('phone-input'), '12345');
      expect(startBtn).toBeDisabled();
      expect(mockAuthHandler.generateOtp).not.toHaveBeenCalled();

      (mockAuthHandler.generateOtp as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'rate',
      });
      await user.clear(view.getByLabelText('phone-input'));
      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(startBtn);
      expect(await view.findByTestId('phone-error')).toHaveTextContent(
        'Kindly wait for 1 minute and then try logging in again.',
      );

      (mockAuthHandler.generateOtp as jest.Mock).mockRejectedValueOnce(
        new Error('network'),
      );
      await user.click(startBtn);
      await eventually(() => {
        expect(view.getByTestId('phone-error')).toHaveTextContent('network');
      });
    });

    // 13. Start and Send Buttons
    it('moves to OTP mode and back, then blocks duplicate OTP call for same number', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.click(view.getByRole('button', { name: 'Back' }));
      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));

      await eventually(() => {
        expect(Toast.show).toHaveBeenCalled();
      });
      expect(mockAuthHandler.generateOtp).toHaveBeenCalledTimes(1);
    });

    it('shows entered phone number on OTP screen and back returns to phone input', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      expect(await view.findByTestId('otp-phone')).toHaveTextContent(
        '9876543210',
      );

      await user.click(view.getByRole('button', { name: 'Back' }));
      await view.findByTestId('phone-login');
      expect(view.getByLabelText('phone-input')).toHaveValue('');
    });

    it('allows only 6 OTP digits and blocks chars/special chars', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.type(view.getByLabelText('otp-input'), '12ab@#345678');
      expect(view.getByLabelText('otp-input')).toHaveValue('123456');
    });

    it('enables OTP verify button only for valid 6-digit OTP', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      const verifyBtn = view.getByRole('button', { name: 'verify-otp' });
      await user.type(view.getByLabelText('otp-input'), '12345');
      expect(verifyBtn).toBeDisabled();

      await user.type(view.getByLabelText('otp-input'), '6');
      expect(view.getByLabelText('otp-input')).toHaveValue('123456');
      expect(verifyBtn).toBeEnabled();

      await user.type(view.getByLabelText('otp-input'), '78');
      expect(view.getByLabelText('otp-input')).toHaveValue('123456');
      expect(verifyBtn).toBeEnabled();
    });

    it('does not verify for less than 6 digits and verifies for exactly 6 digits', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.type(view.getByLabelText('otp-input'), '12345');
      expect(view.getByRole('button', { name: 'verify-otp' })).toBeDisabled();
      expect(
        mockAuthHandler.proceedWithVerificationCode,
      ).not.toHaveBeenCalled();

      await user.type(view.getByLabelText('otp-input'), '6');
      await user.click(view.getByRole('button', { name: 'verify-otp' }));
      await eventually(() => {
        expect(
          mockAuthHandler.proceedWithVerificationCode,
        ).toHaveBeenCalledWith('9876543210', '123456');
      });
    });

    it('auto picks OTP from plugin event and triggers verification', async () => {
      mockPortPlugin.otpRetrieve.mockResolvedValueOnce({ otp: '654321' });
      const addListenerSpy = jest.spyOn(document, 'addEventListener');
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      const otpListenerEntry = addListenerSpy.mock.calls.find(
        (call) => call[0] === 'otpReceived',
      );
      expect(otpListenerEntry).toBeTruthy();
      const listener = otpListenerEntry?.[1] as EventListener;
      await act(async () => {
        await listener(new Event('otpReceived'));
      });

      await eventually(() => {
        expect(
          mockAuthHandler.proceedWithVerificationCode,
        ).toHaveBeenCalledWith('9876543210', '654321');
      });
      addListenerSpy.mockRestore();
    });

    // 5. OTP verification flow
    it('runs OTP verify success path and redirects', async () => {
      (
        mockAuthHandler.proceedWithVerificationCode as jest.Mock
      ).mockResolvedValue({
        user: {
          uid: 'student-1',
          id: 'student-1',
          name: 'Student',
          username: '9876543210',
          last_login_at: '2026-01-01T00:00:00Z',
        },
        userData: {
          id: 'student-1',
          name: 'Student',
        },
        isSpl: false,
      });

      const user = userEvent.setup();
      const { view, store: mockStore } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.type(view.getByLabelText('otp-input'), '123456');
      await user.click(view.getByRole('button', { name: 'verify-otp' }));

      await eventually(() => {
        expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT);
      });
      expect(mockAuthHandler.proceedWithVerificationCode).toHaveBeenCalledWith(
        '9876543210',
        '123456',
      );
      expect(mockApiHandler.getSchoolsForUser).toHaveBeenCalledWith(
        'student-1',
      );
      // redux should also be updated with the nested user object (res.user.user)
      expect(mockStore.getState().auth.user?.id).toBe('student-1');
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.PARENT);
    });

    // 6. Resend OTP flow
    it('handles OTP verify failure and resend behavior', async () => {
      (
        mockAuthHandler.proceedWithVerificationCode as jest.Mock
      ).mockRejectedValue('code-expired');
      (mockAuthHandler.resendOtpMsg91 as jest.Mock).mockRejectedValue(
        new Error('resend failed'),
      );

      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.type(view.getByLabelText('otp-input'), '111111');
      await user.click(view.getByRole('button', { name: 'verify-otp' }));
      expect(await view.findByTestId('otp-error')).toHaveTextContent(
        'Verification code has expired. Please request a new one.',
      );

      await user.click(view.getByRole('button', { name: 'resend-otp' }));
      await eventually(() => {
        expect(view.getByTestId('otp-error')).toHaveTextContent(
          'Resend Otp Failed!! Please try again after some time.',
        );
      });
    });

    it('shows wrong OTP message for invalid OTP', async () => {
      (
        mockAuthHandler.proceedWithVerificationCode as jest.Mock
      ).mockRejectedValue('invalid-otp');
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.type(view.getByLabelText('otp-input'), '111111');
      await user.click(view.getByRole('button', { name: 'verify-otp' }));
      expect(await view.findByTestId('otp-error')).toHaveTextContent(
        'Incorrect OTP - Please check & try again!',
      );
    });

    it('resends OTP successfully when eligible', async () => {
      (
        mockAuthHandler.proceedWithVerificationCode as jest.Mock
      ).mockRejectedValue('code-expired');
      (mockAuthHandler.resendOtpMsg91 as jest.Mock).mockResolvedValue(true);

      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.type(view.getByLabelText('phone-input'), '9876543210');
      await user.click(view.getByRole('button', { name: 'phone-next' }));
      await view.findByTestId('otp-login');

      await user.type(view.getByLabelText('otp-input'), '111111');
      await user.click(view.getByRole('button', { name: 'verify-otp' }));
      await view.findByTestId('otp-error');

      await user.click(view.getByRole('button', { name: 'resend-otp' }));
      await eventually(() => {
        expect(mockAuthHandler.resendOtpMsg91).toHaveBeenCalledWith(
          '9876543210',
        );
      });
    });

    it('requests phone permission once on android focus', async () => {
      jest.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'phone-focus' }));
      await user.click(view.getByRole('button', { name: 'phone-focus' }));

      expect(mockPortPlugin.requestPermission).toHaveBeenCalledTimes(1);
    });
  });

  // 7. Google sign-in flow
  describe('Google Sign-In', () => {
    it('shows offline toast and skips google sign', async () => {
      mockOnlineOfflineHandler.mockReturnValue({
        online: false,
        presentToast: mockPresentToast,
      });
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'google-signin' }));
      expect(mockPresentToast).toHaveBeenCalled();
      expect(mockAuthHandler.googleSign).not.toHaveBeenCalled();
    });

    // 11. Terms & Conditions checkbox
    it('does not trigger google sign-in when terms checkbox is unchecked', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'toggle-checkbox' }));
      await user.click(view.getByRole('button', { name: 'google-signin' }));

      expect(mockAuthHandler.googleSign).not.toHaveBeenCalled();
    });

    it('handles successful native google sign in and redirects', async () => {
      jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
      (mockAuthHandler.googleSign as jest.Mock).mockResolvedValue({
        success: true,
        isSpl: false,
        user: {
          id: 'parent-2',
          uid: 'parent-2',
          name: 'Google Parent',
          username: 'google@example.com',
          last_login_at: '2026-01-01T00:00:00Z',
        },
        userData: {
          id: 'parent-2',
          name: 'Google Parent',
        },
      });
      (mockAuthHandler.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'parent-2',
        uid: 'parent-2',
        name: 'Google Parent',
        username: 'google@example.com',
        last_login_at: '2026-01-01T00:00:00Z',
      });
      mockApiHandler.getSchoolsForUser.mockResolvedValue([
        { role: RoleType.AUTOUSER },
      ]);

      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'google-signin' }));

      await eventually(() => {
        expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
      });
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.SCHOOL);
      expect(ScreenOrientation.lock).toHaveBeenCalledWith({
        orientation: 'landscape',
      });
    });

    it('shows error and falls back to phone when google sign fails', async () => {
      (mockAuthHandler.googleSign as jest.Mock).mockResolvedValue({
        success: false,
      });

      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-email' }));
      await user.click(view.getByRole('button', { name: 'google-signin' }));

      await eventually(() => {
        expect(mockPresentToast).toHaveBeenCalled();
        expect(view.getByTestId('switch-login-type')).toHaveTextContent(
          LOGIN_TYPES.PHONE,
        );
      });
    });
  });

  // 8. Email login flow
  describe('Email Login', () => {
    // Email Login: start button enable only valid input
    it('enables email START button only for valid email format and valid password', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-email' }));

      const startBtn = view.getByRole('button', { name: 'email-login' });
      expect(startBtn).toBeDisabled();

      await user.type(view.getByLabelText('email-input'), 'bad-email');
      await user.type(view.getByLabelText('password-input'), '123456');
      expect(startBtn).toBeDisabled();

      await user.clear(view.getByLabelText('email-input'));
      await user.type(view.getByLabelText('email-input'), 'valid@example.com');
      await user.clear(view.getByLabelText('password-input'));
      await user.type(view.getByLabelText('password-input'), '12345');
      expect(startBtn).toBeDisabled();

      await user.type(view.getByLabelText('password-input'), '6');
      expect(startBtn).toBeEnabled();
    });

    // Email Login: valid email format
    it('accepts valid email format and triggers email login', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-email' }));

      (mockAuthHandler.signInWithEmail as jest.Mock).mockResolvedValueOnce({
        success: false,
        isSpl: false,
        userData: null,
      });

      await user.type(view.getByLabelText('email-input'), 'parent@example.com');
      await user.type(view.getByLabelText('password-input'), 'pass123');
      await user.click(view.getByRole('button', { name: 'email-login' }));

      await eventually(() => {
        expect(mockAuthHandler.signInWithEmail).toHaveBeenCalledWith(
          'parent@example.com',
          'pass123',
        );
      });
    });

    // Email Login: invalid inputs should not submit
    it('does not submit when email or password format is invalid', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-email' }));
      const startBtn = view.getByRole('button', { name: 'email-login' });

      await user.clear(view.getByLabelText('email-input'));
      await user.type(view.getByLabelText('email-input'), 'bad-email');
      await user.type(view.getByLabelText('password-input'), '123456');
      expect(startBtn).toBeDisabled();
      await user.click(startBtn);
      expect(mockAuthHandler.signInWithEmail).not.toHaveBeenCalled();

      await user.clear(view.getByLabelText('email-input'));
      await user.type(view.getByLabelText('email-input'), 'user@example.com');
      await user.clear(view.getByLabelText('password-input'));
      await user.type(view.getByLabelText('password-input'), '123 4');
      expect(startBtn).toBeDisabled();
      await user.click(startBtn);
      expect(mockAuthHandler.signInWithEmail).not.toHaveBeenCalled();
    });

    // Email Login: wrong password
    it('shows proper error message for wrong password', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-email' }));

      (mockAuthHandler.signInWithEmail as jest.Mock).mockResolvedValueOnce({
        success: false,
        isSpl: false,
        userData: null,
      });

      await user.type(view.getByLabelText('email-input'), 'user@example.com');
      await user.type(view.getByLabelText('password-input'), 'wrong123');
      await user.click(view.getByRole('button', { name: 'email-login' }));

      await eventually(() => {
        expect(view.getByTestId('email-error')).toHaveTextContent(
          'Incorrect credentials - Please check & try again!',
        );
      });
    });

    // Email Login: proper error message
    it('shows proper generic error message when email login throws', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-email' }));

      (mockAuthHandler.signInWithEmail as jest.Mock).mockRejectedValueOnce(
        new Error('network down'),
      );

      await user.type(view.getByLabelText('email-input'), 'user@example.com');
      await user.type(view.getByLabelText('password-input'), 'pass123');
      await user.click(view.getByRole('button', { name: 'email-login' }));

      await eventually(() => {
        expect(view.getByTestId('email-error')).toHaveTextContent(
          'Login unsuccessful. Please try again later.',
        );
      });
    });

    it('handles email success and failure branches', async () => {
      const parent = {
        id: 'parent-3',
        uid: 'parent-3',
        name: 'Email Parent',
        username: 'user@example.com',
        last_login_at: '2026-01-01T00:00:00Z',
      };

      const user = userEvent.setup();
      const { view, store: mockStore } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-email' }));
      await user.type(view.getByLabelText('email-input'), 'user@example.com');
      await user.type(view.getByLabelText('password-input'), '123456');

      (mockAuthHandler.signInWithEmail as jest.Mock).mockResolvedValueOnce({
        success: true,
        isSpl: false,
        user: parent,
        userData: parent,
      });
      (mockAuthHandler.getCurrentUser as jest.Mock).mockResolvedValueOnce(
        parent,
      );
      await user.click(view.getByRole('button', { name: 'email-login' }));

      await eventually(() => {
        expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT);
      });
      expect(mockStore.getState().auth.user?.id).toBe('parent-3');

      (mockAuthHandler.signInWithEmail as jest.Mock).mockResolvedValueOnce({
        success: false,
        isSpl: false,
        userData: null,
      });
      await user.clear(view.getByLabelText('email-input'));
      await user.type(view.getByLabelText('email-input'), 'user@example.com');
      await user.clear(view.getByLabelText('password-input'));
      await user.type(view.getByLabelText('password-input'), '123456');
      await user.click(view.getByRole('button', { name: 'email-login' }));

      await eventually(() => {
        expect(view.getByTestId('email-error')).toHaveTextContent(
          'Incorrect credentials - Please check & try again!',
        );
      });
    });
  });

  // 9. Student credentials login flow
  describe('Student Login', () => {
    it('enables student START button only for valid input', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-student' }));

      const startBtn = view.getByRole('button', { name: 'student-login' });
      expect(startBtn).toBeDisabled();

      await user.type(view.getByLabelText('school-code-input'), 'SCH');
      await user.type(view.getByLabelText('student-id-input'), '001');
      await user.type(view.getByLabelText('student-password-input'), '12345');
      expect(startBtn).toBeDisabled();

      await user.type(view.getByLabelText('student-password-input'), '6');
      expect(startBtn).toBeEnabled();
    });

    it('shows offline toast for student login', async () => {
      mockOnlineOfflineHandler.mockReturnValue({
        online: false,
        presentToast: mockPresentToast,
      });
      const user = userEvent.setup();
      const { view } = await renderReady();

      await user.click(view.getByRole('button', { name: 'switch-student' }));
      await user.type(view.getByLabelText('school-code-input'), 'SCH');
      await user.type(view.getByLabelText('student-id-input'), '001');
      await user.type(view.getByLabelText('student-password-input'), 'pass123');
      await user.click(view.getByRole('button', { name: 'student-login' }));
      expect(mockPresentToast).toHaveBeenCalled();
    });

    it('submits student credentials format', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-student' }));

      (
        mockAuthHandler.loginWithEmailAndPassword as jest.Mock
      ).mockResolvedValue({ success: true, isSpl: false, userData: {} });

      await user.type(view.getByLabelText('school-code-input'), 'SCH');
      await user.type(view.getByLabelText('student-id-input'), '001');
      await user.type(view.getByLabelText('student-password-input'), 'pass123');
      await user.click(view.getByRole('button', { name: 'student-login' }));

      await eventually(() => {
        expect(mockAuthHandler.loginWithEmailAndPassword).toHaveBeenCalledWith(
          'SCH001@chimple.net',
          'pass123',
        );
      });
    });

    it('shows student credential error on failed response', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-student' }));

      (
        mockAuthHandler.loginWithEmailAndPassword as jest.Mock
      ).mockResolvedValue({ success: false, isSpl: false, userData: {} });

      await user.type(view.getByLabelText('school-code-input'), 'SCH');
      await user.type(view.getByLabelText('student-id-input'), '001');
      await user.type(view.getByLabelText('student-password-input'), 'pass123');
      await user.click(view.getByRole('button', { name: 'student-login' }));

      expect(await view.findByTestId('student-error')).toHaveTextContent(
        'Incorrect credentials - Please check & try again!',
      );
    });

    it('shows wrong password error for student login', async () => {
      const user = userEvent.setup();
      const { view } = await renderReady();
      await user.click(view.getByRole('button', { name: 'switch-student' }));

      (
        mockAuthHandler.loginWithEmailAndPassword as jest.Mock
      ).mockResolvedValue({ success: false, isSpl: false, userData: {} });

      await user.type(view.getByLabelText('school-code-input'), 'SCH');
      await user.type(view.getByLabelText('student-id-input'), '001');
      await user.type(view.getByLabelText('student-password-input'), 'wrong12');
      await user.click(view.getByRole('button', { name: 'student-login' }));

      expect(await view.findByTestId('student-error')).toHaveTextContent(
        'Incorrect credentials - Please check & try again!',
      );
    });
  });
});
