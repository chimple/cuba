import { Util } from '../utility/util';
import { EVENTS } from '../common/constants';
import { RoleType } from '../interface/modelInterfaces';
import { SupabaseAuth } from '../services/auth/SupabaseAuth';
import { getAppHref, getAppPathname } from '../utility/routerLocation';
import {
  TRACKABLE_ID_ATTRIBUTE,
  TRACKABLE_IDS,
  type TrackableId,
  TRACKABLE_PARENT_IGNORE_SELECTOR,
  TRACKABLE_SELECTOR,
  isKidsAppClickAnalyticsPath,
} from './trackable';

const REWARD_MODE_ATTRIBUTE = 'data-reward-mode';
const REWARD_MODE_SELECTOR = '[' + REWARD_MODE_ATTRIBUTE + ']';
const PATHWAY_POINTER_SELECTOR = '.PathwayStructure-animated-pointer';
const REWARD_TRACKABLE_IDS_BY_MODE: Record<string, TrackableId> = {
  sticker: TRACKABLE_IDS.PATHWAY_STICKER_REWARD,
  mystery_box: TRACKABLE_IDS.PATHWAY_MYSTERY_REWARD,
};

const storedStudent: {
  id?: string;
  name?: string;
  gender?: string;
  type?: string;
} = {};

const CLICK_ANALYTICS_THROTTLE_MS = 500;
const lastTrackedClickAtByButtonId: Partial<Record<TrackableId, number>> = {};

const getClickAnalyticsStudent = async () => {
  try {
    return (
      (await SupabaseAuth.i?.getCurrentUser?.()) ?? Util.getCurrentStudent?.()
    );
  } catch {
    return Util.getCurrentStudent?.();
  }
};

const getRewardTrackableId = (target: Element) => {
  const rewardElement = target.closest(REWARD_MODE_SELECTOR);
  const rewardMode = rewardElement?.getAttribute(REWARD_MODE_ATTRIBUTE);

  return rewardMode ? REWARD_TRACKABLE_IDS_BY_MODE[rewardMode] : undefined;
};

const getPathwayLessonElement = (target: Element) => {
  let element: Element | null = target;

  while (element && element !== document.body) {
    if (
      element.tagName.toLowerCase() === 'g' &&
      element.querySelector(PATHWAY_POINTER_SELECTOR)
    ) {
      return element;
    }

    element = element.parentElement;
  }

  return undefined;
};

export const logClickAnalytics = async (
  buttonId: TrackableId,
  actionType = 'click',
) => {
  const student = await getClickAnalyticsStudent();
  storedStudent.id = student?.id || storedStudent.id || 'null';
  storedStudent.name = student?.name || storedStudent.name || 'null';
  storedStudent.gender = student?.gender || storedStudent.gender || 'null';
  storedStudent.type = RoleType.STUDENT || 'null';

  const eventData = {
    user_id: storedStudent.id,
    user_name: storedStudent.name,
    user_gender: storedStudent.gender,
    user_type: storedStudent.type,
    button_id: buttonId,
    page_name: getAppPathname().replace('/', ''),
    page_path: getAppPathname(),
    complete_path: getAppHref(),
    action_type: actionType,
  };

  Util.logEvent(EVENTS.CLICK_ANALYTICS, eventData);
};

const handleClick = async (event: MouseEvent) => {
  if (!isKidsAppClickAnalyticsPath(getAppPathname())) {
    return;
  }

  if (!(event.target instanceof Element)) {
    return;
  }

  const trackableElement = event.target.closest(TRACKABLE_SELECTOR);
  const rewardElement = event.target.closest(REWARD_MODE_SELECTOR);
  const pathwayLessonElement = getPathwayLessonElement(event.target);
  const analyticsElement =
    trackableElement ?? rewardElement ?? pathwayLessonElement;

  if (!analyticsElement) {
    return;
  }

  const ignoredParentElement = event.target.closest(
    TRACKABLE_PARENT_IGNORE_SELECTOR,
  );
  if (
    ignoredParentElement &&
    !ignoredParentElement.contains(analyticsElement)
  ) {
    return;
  }

  const buttonId =
    (trackableElement?.getAttribute(
      TRACKABLE_ID_ATTRIBUTE,
    ) as TrackableId | null) ??
    getRewardTrackableId(event.target) ??
    (pathwayLessonElement ? TRACKABLE_IDS.PATHWAY_PLAY_LESSON : undefined);
  if (!buttonId) {
    return;
  }

  const now = Date.now();
  const lastTrackedClickAt = lastTrackedClickAtByButtonId[buttonId] ?? 0;
  if (now - lastTrackedClickAt < CLICK_ANALYTICS_THROTTLE_MS) {
    return;
  }
  lastTrackedClickAtByButtonId[buttonId] = now;

  await logClickAnalytics(buttonId, event.type);
};

export const initializeClickListener = () => {
  document.addEventListener('click', handleClick, true);

  return () => {
    document.removeEventListener('click', handleClick, true);
  };
};
