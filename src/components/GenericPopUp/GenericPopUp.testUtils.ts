import { PopupConfig } from './GenericPopUpType';
import { GENERIC_POPUP_TRIGGER_CONDITION } from '../../common/constants';

type PopupConfigOverrides = Omit<
  Partial<PopupConfig>,
  'triggers' | 'schedule'
> & {
  triggers?: Partial<PopupConfig['triggers']>;
  schedule?: Partial<PopupConfig['schedule']>;
};

export const createPopupConfig = (
  overrides: PopupConfigOverrides = {},
): PopupConfig => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const baseConfig: PopupConfig = {
    id: 'popup-1',
    isActive: true,
    priority: 1,
    screen_name: 'home',
    triggers: {
      type: GENERIC_POPUP_TRIGGER_CONDITION.APP_OPEN,
      value: 1,
      ...overrides.triggers,
    },
    schedule: {
      daysOfWeek: [dayOfWeek],
      maxViewsPerDay: 2,
      startDate: new Date(now.getTime() - 60_000).toISOString(),
      endDate: new Date(now.getTime() + 60_000).toISOString(),
      ...overrides.schedule,
    },
    content: {
      en: {
        thumbnailImageUrl: '/thumb.png',
        backgroundImageUrl: '/bg.png',
        heading: 'Popup heading',
        subHeading: 'Popup sub heading',
        details: ['Line 1', 'Line 2'],
        buttonText: 'Continue',
      },
      es: {
        thumbnailImageUrl: '/thumb-es.png',
        backgroundImageUrl: '/bg-es.png',
        heading: 'Encabezado',
        subHeading: 'Subtitulo',
        details: ['Detalle 1'],
        buttonText: 'Seguir',
      },
    },
    action: {
      type: 'DEEP_LINK',
      target: 'SUBJECTS',
    },
  };

  return {
    ...baseConfig,
    ...overrides,
    triggers: {
      ...baseConfig.triggers,
      ...overrides.triggers,
    },
    schedule: {
      ...baseConfig.schedule,
      ...overrides.schedule,
    },
  };
};

export const setFixedSystemTime = (value = '2026-02-15T12:00:00.000Z') => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(value));
};

export const useRealClock = () => {
  jest.useRealTimers();
};

export const mockLocalStorageFailure = (
  method: 'getItem' | 'setItem',
  error = new Error(`localStorage.${method} failed`),
) => {
  if (method === 'getItem') {
    return jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw error;
    });
  }

  return jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw error;
  });
};

export const installAnalyticsMock = (shouldThrow = false) => {
  const track = jest.fn(() => {
    if (shouldThrow) {
      throw new Error('analytics failure');
    }
  });

  (window as any).analytics = { track };
  return track;
};

export const mockNavigation = () => {
  const originalLocation = window.location;
  const replaceSpy = jest.fn();
  // window.location is read-only in jsdom, so we must redefine it
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...originalLocation, replace: replaceSpy },
  });
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

  return {
    replaceSpy,
    openSpy,
    restore: () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    },
  };
};
