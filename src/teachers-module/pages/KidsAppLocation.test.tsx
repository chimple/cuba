import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import KidsAppLocation from './KidsAppLocation';
import {
  EVENTS,
  KIDS_APP_LOCATION_SELECTIONS,
  MODES,
  PAGES,
} from '../../common/constants';
import { schoolUtil } from '../../utility/schoolUtil';
import { Util } from '../../utility/util';

const mockReplace = jest.fn();

function mockTranslate(key: string): string {
  return key;
}

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: jest.fn(() => 'web'),
    isNativePlatform: jest.fn(() => false),
  },
}));

jest.mock('@capacitor/screen-orientation', () => ({
  ScreenOrientation: {
    lock: jest.fn(),
  },
}));

jest.mock('i18next', () => ({
  t: mockTranslate,
}));

jest.mock('../../utility/schoolUtil', () => ({
  schoolUtil: {
    setCurrMode: jest.fn(),
  },
}));

jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../utility/logger', () => ({
  warn: jest.fn(),
}));

jest.mock('../../components/learningPathway/ChimpleRiveMascot', () => {
  const ReactModule = require('react');
  const MockChimpleRiveMascot = () =>
    ReactModule.createElement('div', {
      'data-testid': 'kids-app-location-mascot',
    });

  return {
    __esModule: true,
    default: MockChimpleRiveMascot,
  };
});

jest.mock('../assets/icons/homeLocationIcon.svg', () => ({
  ReactComponent: () =>
    require('react').createElement('svg', {
      'data-testid': 'home-location-icon',
    }),
}));

jest.mock('../assets/icons/schoolLocationIcon.svg', () => ({
  ReactComponent: () =>
    require('react').createElement('svg', {
      'data-testid': 'school-location-icon',
    }),
}));

const logEventMock = Util.logEvent;
const setCurrModeMock = schoolUtil.setCurrMode;

describe('KidsAppLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs home selection before opening home kids app', async () => {
    render(React.createElement(KidsAppLocation));

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));

    await waitFor(() =>
      expect(logEventMock).toHaveBeenCalledWith(
        EVENTS.KIDS_APP_LOCATION_SELECTED,
        {
          selected_location: KIDS_APP_LOCATION_SELECTIONS.HOME,
          selected_app_mode: MODES.TEACHER_HOME,
        },
      ),
    );
    expect(setCurrModeMock).toHaveBeenCalledWith(MODES.TEACHER_HOME);
    expect(mockReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT);
  });

  test('logs school selection before opening school kids app', async () => {
    render(React.createElement(KidsAppLocation));

    fireEvent.click(screen.getByRole('button', { name: 'School' }));

    await waitFor(() =>
      expect(logEventMock).toHaveBeenCalledWith(
        EVENTS.KIDS_APP_LOCATION_SELECTED,
        {
          selected_location: KIDS_APP_LOCATION_SELECTIONS.SCHOOL,
          selected_app_mode: MODES.TEACHER_SCHOOL,
        },
      ),
    );
    expect(setCurrModeMock).toHaveBeenCalledWith(MODES.TEACHER_SCHOOL);
    expect(mockReplace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
  });
});
