import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EVENTS, MODES, PAGES } from '../../common/constants';
import ProfileCard from './ProfileCard';
import { Util } from '../../utility/util';

const mockHistoryReplace = jest.fn();
const mockPresentToast = jest.fn();

jest.mock('@ionic/react', () => ({
  IonCard: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    replace: mockHistoryReplace,
    location: { pathname: '/parent' },
  }),
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../../common/onlineOfflineErrorMessageHandler', () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    online: true,
    presentToast: mockPresentToast,
  }),
}));

jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: jest.fn().mockResolvedValue(undefined),
    getCurrentClass: jest.fn(),
  },
}));

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: {
        deleteProfile: jest.fn(),
      },
    }),
  },
}));

jest.mock('../Loading', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./DialogBoxButtons', () => ({
  __esModule: true,
  default: () => null,
}));

const logEventMock = Util.logEvent as jest.MockedFunction<typeof Util.logEvent>;

describe('ProfileCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs profile creation click when Add a Child is clicked', async () => {
    render(
      <ProfileCard
        width="240px"
        height="240px"
        userType={false}
        user={undefined as never}
        setReloadProfiles={jest.fn()}
        profiles={[]}
        studentCurrMode={MODES.PARENT}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add a Child' }));

    await waitFor(() =>
      expect(logEventMock).toHaveBeenCalledWith(
        EVENTS.PROFILE_CREATION_CLICKED,
        {},
      ),
    );
    expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.CREATE_STUDENT, {
      showBackButton: false,
    });
  });
});
