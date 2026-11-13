import { initializeClickListener } from './clickUtil';
import { logClickAnalytics } from './clickUtil';
import { CLICK_ANALYTICS_CONFIG, EVENTS, PAGES } from '../common/constants';
import {
  TRACKABLE_ID_ATTRIBUTE,
  TRACKABLE_IDS,
  getTrackableParentIgnoreProps,
  getTrackableProps,
} from './trackable';
// eslint-disable-next-line jest/no-mocks-import -- shared state lets tests emulate SDK updates.
import {
  __getGrowthBookMock,
  __resetGrowthBookMock,
  __setGrowthBookMock,
  useGrowthBook,
} from '../tests/__mocks__/@growthbook/growthbook-react';
import { Util } from '../utility/util';
import { SupabaseAuth } from '../services/auth/SupabaseAuth';
import { getAppHref, getAppPathname } from '../utility/routerLocation';

jest.mock('../utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
  },
}));

jest.mock('../services/auth/SupabaseAuth', () => ({
  SupabaseAuth: {
    i: {
      getCurrentUser: jest.fn(),
    },
  },
}));

jest.mock('../utility/routerLocation', () => ({
  getAppHref: jest.fn(),
  getAppPathname: jest.fn(),
}));

const logEventMock = Util.logEvent as jest.MockedFunction<typeof Util.logEvent>;
const getCurrentUserMock = SupabaseAuth.i.getCurrentUser as jest.MockedFunction<
  typeof SupabaseAuth.i.getCurrentUser
>;
const getAppHrefMock = getAppHref as jest.MockedFunction<typeof getAppHref>;
const getAppPathnameMock = getAppPathname as jest.MockedFunction<
  typeof getAppPathname
>;

const flushPromises = () => new Promise(process.nextTick);

describe('initializeClickListener', () => {
  let nowSeed = 1000;
  let cleanup: () => void;
  let dateNowSpy: jest.SpyInstance<number, []>;
  let now: number;
  const approvedConfig = {
    enabled_buttons: [
      ...Object.values(TRACKABLE_IDS),
      'fallback-dom-id',
      'fallback-class-name',
    ],
    global_override: false,
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    logEventMock.mockClear();
    __resetGrowthBookMock();
    __setGrowthBookMock({
      features: { [CLICK_ANALYTICS_CONFIG]: approvedConfig },
    });
    useGrowthBook.mockImplementation(() => ({
      setAttributes: jest.fn((attributes) =>
        __setGrowthBookMock({ attributes }),
      ),
      getFeatureValue: (key, fallback) => {
        const features = __getGrowthBookMock().features;
        return Object.prototype.hasOwnProperty.call(features, key)
          ? features[key]
          : fallback;
      },
      getAttributes: () => __getGrowthBookMock().attributes,
    }));
    getCurrentUserMock.mockResolvedValue({
      id: 'student-1',
      name: 'Student One',
      gender: 'girl',
    } as never);
    getAppPathnameMock.mockReturnValue(PAGES.HOME);
    getAppHrefMock.mockReturnValue('http://localhost/home');
    nowSeed += 1000;
    now = nowSeed;
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const growthbook = useGrowthBook();
    expect(
      growthbook.getFeatureValue(CLICK_ANALYTICS_CONFIG, {
        enabled_buttons: [],
        global_override: true,
      }),
    ).toEqual(approvedConfig);
    cleanup = initializeClickListener(growthbook);
  });

  afterEach(() => {
    cleanup();
    dateNowSpy.mockRestore();
  });

  it('does not log clicks without a trackable ancestor', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it('does not log a trackable element without a button ID', async () => {
    const button = document.createElement('button');
    button.setAttribute(TRACKABLE_ID_ATTRIBUTE, '');
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it('logs button_id from the closest trackable ancestor', async () => {
    const button = document.createElement('button');
    button.id = 'fallback-dom-id';
    button.className = 'fallback-class-name';
    Object.entries(getTrackableProps(TRACKABLE_IDS.HOME_TAB)).forEach(
      ([key, value]) => button.setAttribute(key, value),
    );
    const icon = document.createElement('span');
    button.appendChild(icon);
    document.body.appendChild(button);

    icon.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledWith(EVENTS.CLICK_ANALYTICS, {
      user_id: 'student-1',
      user_name: 'Student One',
      user_gender: 'girl',
      user_type: 'student',
      button_id: TRACKABLE_IDS.HOME_TAB,
      page_name: 'home',
      page_path: PAGES.HOME,
      complete_path: 'http://localhost/home',
      action_type: 'click',
    });
  });

  it.each([
    ['sticker', TRACKABLE_IDS.PATHWAY_STICKER_REWARD],
    ['mystery_box', TRACKABLE_IDS.PATHWAY_MYSTERY_REWARD],
  ])(
    'logs reward nodes from their trackable ID: %s',
    async (rewardMode, buttonId) => {
      const reward = document.createElement('g');
      reward.setAttribute('data-reward-mode', rewardMode);
      reward.setAttribute(TRACKABLE_ID_ATTRIBUTE, buttonId);
      const icon = document.createElement('span');
      reward.appendChild(icon);
      document.body.appendChild(reward);

      icon.click();
      await flushPromises();

      expect(logEventMock).toHaveBeenCalledWith(
        EVENTS.CLICK_ANALYTICS,
        expect.objectContaining({ button_id: buttonId }),
      );
    },
  );

  it('logs active pathway lessons from their trackable ID', async () => {
    const lessonGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g',
    );
    const lessonImage = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'image',
    );
    const pointer = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'image',
    );
    pointer.setAttribute('class', 'PathwayStructure-animated-pointer');
    lessonGroup.setAttribute(
      TRACKABLE_ID_ATTRIBUTE,
      TRACKABLE_IDS.PATHWAY_PLAY_LESSON,
    );
    lessonGroup.append(lessonImage, pointer);
    document.body.appendChild(lessonGroup);

    lessonImage.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledWith(
      EVENTS.CLICK_ANALYTICS,
      expect.objectContaining({
        button_id: TRACKABLE_IDS.PATHWAY_PLAY_LESSON,
      }),
    );
  });

  it('uses the HTML id when a button has no trackable ID', async () => {
    const button = document.createElement('button');
    button.id = 'fallback-dom-id';
    button.className = 'fallback-class-name';
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledWith(
      EVENTS.CLICK_ANALYTICS,
      expect.objectContaining({ button_id: 'fallback-dom-id' }),
    );
  });

  it('uses the class name when a button has no trackable ID or HTML id', async () => {
    const button = document.createElement('button');
    button.className = 'fallback-class-name extra-class';
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledWith(
      EVENTS.CLICK_ANALYTICS,
      expect.objectContaining({ button_id: 'fallback-class-name' }),
    );
  });

  it('logs trackable clicks inside a propagation-stopping boundary', async () => {
    const boundary = document.createElement('div');
    Object.entries(getTrackableParentIgnoreProps()).forEach(([key, value]) =>
      boundary.setAttribute(key, value),
    );
    boundary.addEventListener('click', (event) => event.stopPropagation());

    const button = document.createElement('button');
    Object.entries(
      getTrackableProps(TRACKABLE_IDS.PATHWAY_COURSE_OPTION),
    ).forEach(([key, value]) => button.setAttribute(key, value));
    boundary.appendChild(button);
    document.body.appendChild(boundary);

    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledWith(
      EVENTS.CLICK_ANALYTICS,
      expect.objectContaining({
        button_id: TRACKABLE_IDS.PATHWAY_COURSE_OPTION,
      }),
    );
  });

  it('does not log a parent trackable through an ignored child boundary', async () => {
    const card = document.createElement('button');
    Object.entries(getTrackableProps(TRACKABLE_IDS.CHAPTER_CARD)).forEach(
      ([key, value]) => card.setAttribute(key, value),
    );

    const ignoredChild = document.createElement('span');
    Object.entries(getTrackableParentIgnoreProps()).forEach(([key, value]) =>
      ignoredChild.setAttribute(key, value),
    );
    ignoredChild.addEventListener('click', (event) => event.stopPropagation());
    card.appendChild(ignoredChild);
    document.body.appendChild(card);

    ignoredChild.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it('throttles repeated clicks on the same button ID within 500ms', async () => {
    const button = document.createElement('button');
    Object.entries(getTrackableProps(TRACKABLE_IDS.HOME_TAB)).forEach(
      ([key, value]) => button.setAttribute(key, value),
    );
    document.body.appendChild(button);

    button.click();
    now += 499;
    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledTimes(1);

    now += 1;
    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledTimes(2);
  });

  it('does not throttle different button IDs within 500ms', async () => {
    const homeButton = document.createElement('button');
    Object.entries(getTrackableProps(TRACKABLE_IDS.HOME_TAB)).forEach(
      ([key, value]) => homeButton.setAttribute(key, value),
    );
    const optionButton = document.createElement('button');
    Object.entries(
      getTrackableProps(TRACKABLE_IDS.PATHWAY_COURSE_OPTION),
    ).forEach(([key, value]) => optionButton.setAttribute(key, value));
    document.body.append(homeButton, optionButton);

    homeButton.click();
    now += 100;
    optionButton.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledTimes(2);
    expect(logEventMock).toHaveBeenNthCalledWith(
      1,
      EVENTS.CLICK_ANALYTICS,
      expect.objectContaining({ button_id: TRACKABLE_IDS.HOME_TAB }),
    );
    expect(logEventMock).toHaveBeenNthCalledWith(
      2,
      EVENTS.CLICK_ANALYTICS,
      expect.objectContaining({
        button_id: TRACKABLE_IDS.PATHWAY_COURSE_OPTION,
      }),
    );
  });

  it.each([
    PAGES.HOME,
    PAGES.ADD_SUBJECTS,
    PAGES.DISPLAY_CHAPTERS,
    PAGES.LIDO_PLAYER,
  ])(
    'logs trackable clicks on an approved Kids App route: %s',
    async (pathname) => {
      getAppPathnameMock.mockReturnValue(pathname);
      const button = document.createElement('button');
      Object.entries(getTrackableProps(TRACKABLE_IDS.LESSON_CARD)).forEach(
        ([key, value]) => button.setAttribute(key, value),
      );
      document.body.appendChild(button);

      button.click();
      await flushPromises();

      expect(logEventMock).toHaveBeenCalledWith(
        EVENTS.CLICK_ANALYTICS,
        expect.objectContaining({
          button_id: TRACKABLE_IDS.LESSON_CARD,
          page_path: pathname,
        }),
      );
    },
  );

  it('does not log unmarked gameplay taps on the Lido route', async () => {
    getAppPathnameMock.mockReturnValue(PAGES.LIDO_PLAYER);
    const gameArea = document.createElement('div');
    document.body.appendChild(gameArea);

    gameArea.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it('logs an approved ID on Select Mode regardless of stored mode', async () => {
    getAppPathnameMock.mockReturnValue(PAGES.SELECT_MODE);
    const button = document.createElement('button');
    Object.entries(
      getTrackableProps(TRACKABLE_IDS.CONTINUE_TO_CLASS_SELECTION),
    ).forEach(([key, value]) => button.setAttribute(key, value));
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledTimes(1);

    now += 500;
    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    PAGES.LIVE_QUIZ_GAME,
    PAGES.TEACHER_ASSIGNMENT,
    PAGES.OPS_MODULE_PAGE,
  ])('logs approved trackable clicks on app routes: %s', async (pathname) => {
    getAppPathnameMock.mockReturnValue(pathname);
    const button = document.createElement('button');
    Object.entries(getTrackableProps(TRACKABLE_IDS.HOME_TAB)).forEach(
      ([key, value]) => button.setAttribute(key, value),
    );
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).toHaveBeenCalledWith(
      EVENTS.CLICK_ANALYTICS,
      expect.objectContaining({ button_id: TRACKABLE_IDS.HOME_TAB }),
    );
  });

  it('does not log a trackable ID missing from the GrowthBook allowlist', async () => {
    __setGrowthBookMock({
      features: {
        [CLICK_ANALYTICS_CONFIG]: {
          enabled_buttons: [],
          global_override: false,
        },
      },
    });
    const button = document.createElement('button');
    Object.entries(getTrackableProps(TRACKABLE_IDS.HOME_TAB)).forEach(
      ([key, value]) => button.setAttribute(key, value),
    );
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it('suppresses all click events when GrowthBook global override is on', async () => {
    __setGrowthBookMock({
      features: {
        [CLICK_ANALYTICS_CONFIG]: {
          enabled_buttons: Object.values(TRACKABLE_IDS),
          global_override: true,
        },
      },
    });
    const button = document.createElement('button');
    Object.entries(getTrackableProps(TRACKABLE_IDS.HOME_TAB)).forEach(
      ([key, value]) => button.setAttribute(key, value),
    );
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it('fails closed when GrowthBook config is missing or malformed', async () => {
    __resetGrowthBookMock();
    const button = document.createElement('button');
    Object.entries(getTrackableProps(TRACKABLE_IDS.HOME_TAB)).forEach(
      ([key, value]) => button.setAttribute(key, value),
    );
    document.body.appendChild(button);

    button.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();

    __setGrowthBookMock({
      features: {
        [CLICK_ANALYTICS_CONFIG]: {
          enabled_buttons: 'open_home_tab',
          global_override: false,
        },
      },
    });
    button.click();
    await flushPromises();

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it('applies the GrowthBook gate to direct click analytics calls', async () => {
    __setGrowthBookMock({
      features: {
        [CLICK_ANALYTICS_CONFIG]: {
          enabled_buttons: [],
          global_override: false,
        },
      },
    });

    await logClickAnalytics(TRACKABLE_IDS.HOME_TAB);

    expect(logEventMock).not.toHaveBeenCalled();
  });
});
