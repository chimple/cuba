import type { GrowthBook } from '@growthbook/growthbook-react';
import { CLICK_ANALYTICS_CONFIG, EVENTS } from '../common/constants';
import { Util } from '../utility/util';
import { RoleType } from '../interface/modelInterfaces';
import { SupabaseAuth } from '../services/auth/SupabaseAuth';
import { getAppHref, getAppPathname } from '../utility/routerLocation';
import {
  TRACKABLE_ID_ATTRIBUTE,
  type TrackableId,
  CLICKABLE_SELECTOR,
  TRACKABLE_PARENT_IGNORE_SELECTOR,
  TRACKABLE_SELECTOR,
} from './trackable';

type ClickAnalyticsConfig = {
  enabled_buttons: string[];
  global_override: boolean;
};

const CLICK_ANALYTICS_DISABLED_CONFIG: ClickAnalyticsConfig = {
  enabled_buttons: [],
  global_override: true,
};

const storedStudent: {
  id?: string;
  name?: string;
  gender?: string;
  type?: string;
} = {};

let activeGrowthBook: GrowthBook | undefined;
const CLICK_ANALYTICS_THROTTLE_MS = 500;
const lastTrackedClickAtByButtonId: Record<string, number> = {};

const getClickAnalyticsStudent = async () => {
  try {
    return (
      (await SupabaseAuth.i?.getCurrentUser?.()) ?? Util.getCurrentStudent?.()
    );
  } catch {
    return Util.getCurrentStudent?.();
  }
};

// Fail closed so an unpublished or malformed ruleset never emits click events.
const isClickAnalyticsEnabled = (
  growthbook: GrowthBook | undefined,
  buttonId: string,
): boolean => {
  if (!growthbook) return false;

  const config = growthbook.getFeatureValue<ClickAnalyticsConfig>(
    CLICK_ANALYTICS_CONFIG,
    CLICK_ANALYTICS_DISABLED_CONFIG,
  );

  return (
    !!config &&
    typeof config === 'object' &&
    config.global_override === false &&
    Array.isArray(config.enabled_buttons) &&
    config.enabled_buttons.includes(buttonId)
  );
};

export const logClickAnalytics = async (
  buttonId: TrackableId,
  actionType = 'click',
  growthbook: GrowthBook | undefined = activeGrowthBook,
): Promise<void> => {
  if (!isClickAnalyticsEnabled(growthbook, buttonId)) return;

  const now = Date.now();
  const lastTrackedClickAt = lastTrackedClickAtByButtonId[buttonId] ?? 0;
  if (now - lastTrackedClickAt < CLICK_ANALYTICS_THROTTLE_MS) return;
  lastTrackedClickAtByButtonId[buttonId] = now;

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

const handleClick = async (
  event: MouseEvent,
  growthbook?: GrowthBook,
): Promise<void> => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const trackableElement = event.target.closest(TRACKABLE_SELECTOR);
  const clickableElement = event.target.closest(CLICKABLE_SELECTOR);
  const analyticsElement = trackableElement ?? clickableElement;
  if (!analyticsElement) return;

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
    trackableElement?.getAttribute(TRACKABLE_ID_ATTRIBUTE) ||
    analyticsElement.id ||
    analyticsElement.getAttribute('class')?.trim().split(/\s+/)[0];
  if (!buttonId) {
    return;
  }

  await logClickAnalytics(buttonId, event.type, growthbook);
};

export const initializeClickListener = (
  growthbook?: GrowthBook,
): (() => void) => {
  activeGrowthBook = growthbook;
  const listener = (event: MouseEvent) => {
    void handleClick(event, growthbook);
  };
  document.addEventListener('click', listener, true);

  return () => {
    document.removeEventListener('click', listener, true);
    if (activeGrowthBook === growthbook) activeGrowthBook = undefined;
  };
};
