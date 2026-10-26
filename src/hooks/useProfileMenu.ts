import { useEffect, useState } from 'react';
import {
  AVATARS,
  CURRENT_MODE,
  CURRENT_PATHWAY_MODE,
  ENABLE_STICKER_BOOK,
  EVENTS,
  HOMEWORK_PATHWAY,
  LEADERBOARDHEADERLIST,
  MODES,
  PAGES,
  STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
  TableTypes,
  CURRENT_STUDENT_CHANGED_EVENT,
} from '../common/constants';
import { useHistory } from 'react-router';
import { Util } from '../utility/util';
import { AvatarObj } from '../components/animation/Avatar';
import ParentalLock from '../components/parent/ParentalLock';
import { t } from 'i18next';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { ServiceConfig } from '../services/ServiceConfig';
import {
  updateLocalAttributes,
  useGbContext,
  setCachedGrowthBookFeatureValue,
} from '../growthbook/Growthbook';
import { schoolUtil } from '../utility/schoolUtil';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setBadgeProgress } from '../redux/slices/badgeProgress/badgeProgressSlice';
import { RootState } from '../redux/store';
import logger from '../utility/logger';
import { parsePath } from 'history';
import { REWARDS_TABS } from '../common/constants/rewardsPathway';
import { logBadgeEvent } from '../common/Badges/badgeAnalytics';
import type { BadgeAnalyticsProgress } from '../common/Badges/badgeAnalytics';

type ProfileMenuProps = {
  onClose: () => void;
};

export const useProfileMenu = ({ onClose }: ProfileMenuProps) => {
  const history = useHistory();
  const [student, setStudent] = useState<TableTypes<'user'>>();
  const [className, setClassName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasUnseenStickers, setHasUnseenStickers] = useState<boolean>(false);
  const [badgeProgress, setBadgeProgressForAnalytics] =
    useState<BadgeAnalyticsProgress | null>(null);
  const dispatch = useAppDispatch();
  const { setGbUpdated } = useGbContext();
  const api = ServiceConfig.getI().apiHandler;
  const liveIsStickerBookEnabled = useFeatureIsOn(ENABLE_STICKER_BOOK);
  const liveIsStickerBookNotificationDotEnabled = useFeatureIsOn(
    STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
  );
  const growthbookFeatureValues = useAppSelector(
    (state: RootState) => state.growthbook.featureValues,
  );
  const hasUnseenBadge = useAppSelector(
    (state: RootState) =>
      state.badgeProgress?.studentId === student?.id &&
      state.badgeProgress?.hasUnseenBadge === true,
  );
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isStickerBookEnabled = isOffline
    ? ((growthbookFeatureValues?.[ENABLE_STICKER_BOOK] as boolean) ??
      liveIsStickerBookEnabled)
    : liveIsStickerBookEnabled;
  const isStickerBookNotificationDotEnabled = isOffline
    ? ((growthbookFeatureValues?.[
        STICKER_BOOK_NOTIFICATION_DOT_ENABLED
      ] as boolean) ?? liveIsStickerBookNotificationDotEnabled)
    : liveIsStickerBookNotificationDotEnabled;

  const currentMode = localStorage.getItem(CURRENT_MODE);
  const isSchoolKidsMode =
    currentMode === MODES.SCHOOL || currentMode === MODES.TEACHER_SCHOOL;
  const shouldShowStickerBookNotification =
    hasUnseenStickers && isStickerBookNotificationDotEnabled;

  useEffect(() => {
    setCachedGrowthBookFeatureValue(
      ENABLE_STICKER_BOOK,
      liveIsStickerBookEnabled,
    );
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
      liveIsStickerBookNotificationDotEnabled,
    );
  }, [liveIsStickerBookEnabled, liveIsStickerBookNotificationDotEnabled]);

  useEffect(() => {
    loadProfileData();

    const handleStudentChange = (e: Event) => {
      const customEvent = e as CustomEvent<TableTypes<'user'> | null>;
      if (customEvent.detail) {
        setStudent(customEvent.detail);
      }
    };

    window.addEventListener(CURRENT_STUDENT_CHANGED_EVENT, handleStudentChange);
    return () => {
      window.removeEventListener(
        CURRENT_STUDENT_CHANGED_EVENT,
        handleStudentChange,
      );
    };
    // Load the initial profile once; student changes are handled by the event listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
  const loadProfileData = async () => {
    try {
      const currentStudent = Util.getCurrentStudent();
      setStudent(currentStudent);
      const { className, schoolName } = await Util.fetchCurrentClassAndSchool();
      setClassName(className);
      setSchoolName(schoolName);

      if (currentStudent?.id) {
        try {
          const badgeProgress = await api.getUserBadgeProgress(
            currentStudent.id,
          );
          setBadgeProgressForAnalytics(
            badgeProgress
              ? {
                  lessons_played_count: badgeProgress.lessons_played_count,
                  latest_badge_milestone: badgeProgress.latest_badge_milestone,
                  has_unseen_badge: Boolean(badgeProgress.has_unseen_badge),
                }
              : null,
          );
          dispatch(
            setBadgeProgress({
              studentId: currentStudent.id,
              hasUnseenBadge: Boolean(badgeProgress?.has_unseen_badge),
            }),
          );
        } catch (error) {
          // Preserve the Redux badge state and continue loading Sticker Book data.
          logger.error('Failed to load badge progress:', error);
        }
        const userStickers = await api.getUserStickerBook(currentStudent.id);
        const hasUnseen = userStickers.some((s) => !s.is_seen);
        setHasUnseenStickers(hasUnseen);
      }
    } catch (error) {
      logger.error('Failed to load profile data:', error);
    }
  };

  const onEdit = () => {
    history.replace({
      ...parsePath(PAGES.EDIT_STUDENT),
      state: {
        from: history.location.pathname,
      },
    });
  };

  const onLeaderboard = () => {
    history.push({
      ...parsePath(PAGES.LEADERBOARD),
      state: {
        from: history.location.pathname,
      },
    });
  };

  const onStickerBook = async () => {
    Util.logEvent(EVENTS.STICKER_BOOK_MENU_TAP, {
      user_id: student?.id,
      source: 'profile_menu',
    });
    if (hasUnseenStickers) {
      setHasUnseenStickers(false);
      if (student?.id) {
        void api.markStciekercolledasTrue(student.id).catch((error) => {
          logger.error('[ProfileMenu] Failed to mark sticker books as seen', {
            user_id: student.id,
            error,
          });
        });
      }
    }
    history.push({
      ...parsePath(PAGES.STICKER_BOOK),
      state: {
        from: history.location.pathname,
      },
    });
  };

  const onReward = () => {
    let avatarObj = AvatarObj.getInstance();
    if (hasUnseenBadge && student?.id && badgeProgress) {
      void logBadgeEvent(
        EVENTS.UNSEEN_BADGE_INDICATOR_CLICKED,
        student.id,
        badgeProgress,
        { routed_to_tab: REWARDS_TABS.LESSON_COMPLETION },
      );
    }
    const rewardsTab = hasUnseenBadge
      ? REWARDS_TABS.LESSON_COMPLETION
      : avatarObj.unlockedRewards[0]?.leaderboardRewardList.toLowerCase();
    history.push(
      PAGES.LEADERBOARD +
        `?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${rewardsTab}`,
    );
  };

  const onSwichUser = async () => {
    Util.setParentLanguagetoLocal();
    Util.setCurrentStudent(null);
    schoolUtil.setCurrentClass(undefined);
    localStorage.removeItem(CURRENT_PATHWAY_MODE);
    localStorage.removeItem(HOMEWORK_PATHWAY);
    // Reset student-scoped targeting when leaving the active child profile.
    updateLocalAttributes({
      student_id: null,
      school_ids: [],
    });
    setGbUpdated(true);
    history.replace({
      ...parsePath(PAGES.DISPLAY_STUDENT),
      state: {
        from: history.location.pathname,
        fromSwitchProfileReturn: true,
      },
    });
  };

  const onSchoolModeSwitchUser = async () => {
    await Util.setCurrentStudent(null);
    if (currentMode === MODES.PARENT) {
      await schoolUtil.setCurrentClass(undefined);
    }
    updateLocalAttributes({
      student_id: null,
      school_ids: [],
    });
    setGbUpdated(true);
    history.replace({
      ...parsePath(PAGES.SELECT_MODE),
      state: {
        from: history.location.pathname,
        fromSwitchProfileReturn: true,
      },
    });
  };

  const allMenuItems = [
    {
      icon: '/assets/icons/StickerBook.svg',
      label: 'Sticker Book',
      onClick: onStickerBook,
    },
    {
      icon: '/assets/icons/Ranking.svg',
      label: 'Leaderboard',
      onClick: onLeaderboard,
    },
    {
      icon: '/assets/icons/TreasureChest.svg',
      label: 'Rewards',
      onClick: onReward,
      hasUnseenBadge,
    },
    {
      icon: '/assets/icons/Pencil.svg',
      label: 'Edit Profile',
      onClick: onEdit,
    },
    {
      icon: '/assets/icons/Account.svg',
      label: 'Parents Section',
      onClick: () => setShowDialogBox(true),
    },
    {
      icon: '/assets/icons/UserSwitch1.svg',
      label: 'Switch Profile',
      onClick: onSwichUser,
    },
  ];

  const HIDE_IN_SCHOOL = new Set(['Parents Section', 'Edit Profile']);

  const menuItems = allMenuItems
    .filter((item) =>
      item.label === 'Sticker Book' ? isStickerBookEnabled : true,
    )
    .filter((item) => !(isSchoolKidsMode && HIDE_IN_SCHOOL.has(item.label)))
    .map((item) =>
      isSchoolKidsMode && item.label === 'Switch Profile'
        ? {
            ...item,
            onClick: onSchoolModeSwitchUser,
          }
        : item,
    );
  const visibleMenuItems = Util.isRespectMode
    ? menuItems.filter(
        (item) =>
          item.label === 'Parents Section' || item.label === 'Switch Profile',
      )
    : menuItems;
  const hasDetails = !!(className || schoolName);
  return {
    AVATARS,
    HOMEWORK_PATHWAY,
    ParentalLock,
    className,
    hasDetails,
    isClosing,
    isSchoolKidsMode,
    localStorage,
    menuItems: visibleMenuItems,
    onClose,
    onEdit,
    schoolName,
    setIsClosing,
    setShowDialogBox,
    shouldShowStickerBookNotification,
    hasUnseenBadge,
    showDialogBox,
    student,
    t,
    window,
  };
};
