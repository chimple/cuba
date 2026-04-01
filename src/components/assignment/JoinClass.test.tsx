import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinClass from './JoinClass';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { MemoryRouter, Route } from 'react-router';

/* ======================= MOCKS ======================= */

jest.mock('i18next', () => {
  const i18n = {
    use: jest.fn().mockReturnThis(), // 🔥 chainable
    init: jest.fn(),
    t: (key: string) => key,
    changeLanguage: jest.fn(),
  };
  return i18n;
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('../../utility/util');
jest.mock('../../common/onlineOfflineErrorMessageHandler', () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    online: true,
    presentToast: jest.fn(),
  }),
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}));

jest.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    setScroll: jest.fn(),
    addListener: jest.fn(),
  },
}));

/* ======================= API MOCK ======================= */

const mockApi = {
  getDataByInviteCode: jest.fn(),
  linkStudent: jest.fn(),
  updateStudent: jest.fn(),
  getClassById: jest.fn(),
  updateSchoolLastModified: jest.fn(),
  updateClassLastModified: jest.fn(),
  updateUserLastModified: jest.fn(),
};

/* ======================= TEST DATA ======================= */

const mockStudent = {
  id: 'student-1',
  name: 'Rahul',
  age: 10,
  gender: 'M',
  avatar: '',
  image: '',
  curriculum_id: '1',
  grade_id: '5',
  language_id: 'en',
};

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
    apiHandler: mockApi,
  } as any);

  (Util.getCurrentStudent as jest.Mock).mockReturnValue(mockStudent);
  (Util.subscribeToClassTopic as jest.Mock).mockImplementation(() => {});
});

/* ======================= BASIC RENDER ======================= */

describe('JoinClass – basic rendering', () => {
  test('renders Join Class screen', async () => {
    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Join a Class by entering the details below'),
    ).toBeInTheDocument();
  });

  test('confirm button is disabled initially', async () => {
    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    const confirmBtn = screen.getByText('Confirm').closest('button');
    expect(confirmBtn).toBeDisabled();
  });
});

/* ======================= INVITE CODE LOOKUP ======================= */

describe('JoinClass – invite code lookup', () => {
  test('fetches class info when valid code entered', async () => {
    mockApi.getDataByInviteCode.mockResolvedValue({
      class_id: 'class-1',
      school_id: 'school-1',
      school_name: 'ABC School',
      class_name: '5A',
    });

    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByPlaceholderText('Enter the code to join a class'),
      '123456',
    );

    await waitFor(() => {
      expect(mockApi.getDataByInviteCode).toHaveBeenCalledWith(123456);
    });

    expect(
      await screen.findByText('School: ABC School, Class: 5A'),
    ).toBeInTheDocument();
  });

  test('shows error when invite code is invalid', async () => {
    mockApi.getDataByInviteCode.mockRejectedValue(
      new Error('Invalid inviteCode'),
    );

    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByPlaceholderText('Enter the code to join a class'),
      '999999',
    );

    await waitFor(() => {
      expect(
        screen.getByText('Invalid code. Please check and Try again.'),
      ).toBeInTheDocument();
    });
  });

  test('does not call API when invite code length < 6', async () => {
    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByPlaceholderText('Enter the code to join a class'),
      '123',
    );

    expect(mockApi.getDataByInviteCode).not.toHaveBeenCalled();
  });

  test('only numeric values are accepted in invite code input', async () => {
    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('Enter the code to join a class');

    await userEvent.type(input, '12ab34');

    expect(input).toHaveValue('1234');
  });
});

/* ======================= JOIN FLOW ======================= */

describe('JoinClass – join flow', () => {
  test('join class calls linkStudent and callbacks', async () => {
    const onClassJoin = jest.fn();

    mockApi.getDataByInviteCode.mockResolvedValue({
      class_id: 'class-1',
      school_id: 'school-1',
      school_name: 'ABC School',
      class_name: '5A',
    });

    mockApi.getClassById.mockResolvedValue({ id: 'class-1' });

    render(
      <MemoryRouter>
        <JoinClass onClassJoin={onClassJoin} />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByPlaceholderText('Enter the code to join a class'),
      '123456',
    );

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });

    await waitFor(() => expect(confirmBtn).not.toBeDisabled());
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.linkStudent).toHaveBeenCalledWith(123456, 'student-1');
      expect(onClassJoin).toHaveBeenCalled();
    });
  });

  test('updates student name when missing before joining', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      ...mockStudent,
      name: '',
    });

    mockApi.getDataByInviteCode.mockResolvedValue({
      class_id: 'class-1',
      school_id: 'school-1',
      school_name: 'ABC School',
      class_name: '5A',
    });

    mockApi.getClassById.mockResolvedValue({ id: 'class-1' });

    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByPlaceholderText('Enter the child’s full name'),
      'Rahul',
    );

    await userEvent.type(
      screen.getByPlaceholderText('Enter the code to join a class'),
      '123456',
    );

    await userEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockApi.updateStudent).toHaveBeenCalled();
    });
  });
});

/* ======================= URL PARAM HANDLING ======================= */

describe('JoinClass – URL params', () => {
  test('auto-fetches class when classCode param exists', async () => {
    mockApi.getDataByInviteCode.mockResolvedValue({
      class_id: 'class-1',
      school_id: 'school-1',
      school_name: 'Auto School',
      class_name: 'Auto Class',
    });

    render(
      <MemoryRouter initialEntries={['/join?classCode=123456']}>
        <Route path="/join">
          <JoinClass onClassJoin={jest.fn()} />
        </Route>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockApi.getDataByInviteCode).toHaveBeenCalledWith(123456);
    });

    expect(
      await screen.findByText('School: Auto School, Class: Auto Class'),
    ).toBeInTheDocument();
  });

  test('ignores invalid classCode param', async () => {
    render(
      <MemoryRouter initialEntries={['/join?classCode=abc']}>
        <Route path="/join">
          <JoinClass onClassJoin={jest.fn()} />
        </Route>
      </MemoryRouter>,
    );

    expect(mockApi.getDataByInviteCode).not.toHaveBeenCalled();
  });
});

/* ======================= EDGE CASES ======================= */

describe('JoinClass – edge cases', () => {
  test('does not crash when student is null', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);

    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Join a Class by entering the details below'),
    ).toBeInTheDocument();
  });

  test('confirm button remains disabled when form is invalid', async () => {
    render(
      <MemoryRouter>
        <JoinClass onClassJoin={jest.fn()} />
      </MemoryRouter>,
    );

    const confirmBtn = screen.getByText('Confirm').closest('button');
    expect(confirmBtn).toBeDisabled();
  });
});
