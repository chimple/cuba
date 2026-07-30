import { useTranslation } from 'react-i18next';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import {
  HOMEHEADERLIST,
  AVATARS,
  DEFAULT_HEADER_ICON_CONFIGS,
  HeaderIconConfig,
  PAGES,
  MODES,
  TableTypes,
  CURRENT_MODE,
  IS_CONECTED,
  CURRENT_STUDENT_CHANGED_EVENT,
  HOME_HEADER_SPECIALS_ENABLED,
} from '../common/constants';
import './HomeHeader.css';
import HeaderIcon from './HeaderIcon';
import React, { useEffect, useRef, useState } from 'react';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { useHistory } from 'react-router';
import { schoolUtil } from '../utility/schoolUtil';
import ProfileMenu from './ProfileMenu/ProfileMenu';
import logger from '../utility/logger';
interface StarsCounterProps {
  starsCount: number;
}

const StarsCounter: React.FC<StarsCounterProps> = ({ starsCount }) => {
  return (
    <div className="home-header-stars-counter">
      <span>{starsCount}</span>
      <img
        src="assets/StarsCounter.svg"
        alt="Stars"
        className="home-header-star-icon"
      />
    </div>
  );
};
const getStoredHeaderIconList = (): HeaderIconConfig[] => {
  const currMode = localStorage.getItem(CURRENT_MODE) || undefined;
  const currentStudent = Util.getCurrentStudent();
  const connectedData = localStorage.getItem(IS_CONECTED);
  let isLinked = false;

  if (currentStudent?.id && connectedData) {
    try {
      const parsed = JSON.parse(connectedData) as Record<string, boolean>;
      isLinked = parsed[currentStudent.id] ?? false;
    } catch {
      isLinked = false;
    }
  }

  return Array.from(DEFAULT_HEADER_ICON_CONFIGS.values()).filter((element) => {
    if (
      currMode === MODES.SCHOOL &&
      element.headerList === HOMEHEADERLIST.ASSIGNMENT
    ) {
      return false;
    }
    if (!isLinked && element.headerList === HOMEHEADERLIST.LIVEQUIZ) {
      return false;
    }
    return true;
  });
};
const buildHeaderIconList = (
  linked: boolean,
  canShowAvatarValue?: boolean,
  currMode?: string,
): HeaderIconConfig[] =>
  Array.from(DEFAULT_HEADER_ICON_CONFIGS.values()).filter((element) => {
    if (
      currMode === MODES.SCHOOL &&
      element.headerList === HOMEHEADERLIST.ASSIGNMENT
    ) {
      return false;
    }
    if (
      canShowAvatarValue === false &&
      element.headerList === HOMEHEADERLIST.SUGGESTIONS
    ) {
      return false;
    }
    if (!linked && element.headerList === HOMEHEADERLIST.LIVEQUIZ) {
      return false;
    }
    return true;
  });
const HomeHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
  pendingAssignmentCount: number;
  pendingLiveQuizCount: number;
}> = ({
  currentHeader,
  onHeaderIconClick,
  pendingAssignmentCount,
  pendingLiveQuizCount,
}) => {
  const { t } = useTranslation();
  const [currentHeaderIconList, setCurrentHeaderIconList] = useState<
    HeaderIconConfig[]
  >(() => getStoredHeaderIconList());

  const history = useHistory();
  const [student, setStudent] = useState<TableTypes<'user'> | undefined>(() =>
    Util.getCurrentStudent(),
  );
  const studentRef = useRef<TableTypes<'user'> | null>(
    Util.getCurrentStudent() ?? null,
  );

  const [studentMode, setStudentMode] = useState<string | undefined>(
    () => localStorage.getItem(CURRENT_MODE) || undefined,
  );
  const [canShowAvatar, setCanShowAvatar] = useState<boolean>();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [starsCount, setStarsCount] = useState<number>(() => {
    const curr = Util.getCurrentStudent();
    return curr?.stars || 0;
  });
  const [isLinked, setIsLinked] = useState(false);
  const isHomeHeaderSpecialsEnabled = useFeatureIsOn(
    HOME_HEADER_SPECIALS_ENABLED,
  );
  const api = ServiceConfig.getI().apiHandler;
  const refreshStarsFromLocal = () => {
    const curr = studentRef.current || Util.getCurrentStudent();
    if (!curr?.id) {
      setStarsCount(0);
      return;
    }

    const dbStars = curr.stars || 0;
    const localStars = Util.getLocalStarsForStudent(curr.id, dbStars);
    setStarsCount(localStars);
  };
  const init = async (fromCache: boolean = true) => {
    try {
      const [canShowAvatarValue, student, currMode] = await Promise.all([
        Util.getCanShowAvatar(),
        Util.getCurrentStudent(),
        schoolUtil.getCurrMode(),
      ]);
      if (!student) {
        history.replace(PAGES.SELECT_MODE);
        return;
      }
      const linked = await api.isStudentLinked(student.id, fromCache);
      setIsLinked(linked);
      setStudentMode(currMode);

      const currentStudent = Util.getCurrentStudent();
      setStarsCount(currentStudent?.stars || 0);

      setStudent(student);
      studentRef.current = student;

      refreshStarsFromLocal();

      setCurrentHeaderIconList(
        buildHeaderIconList(linked, canShowAvatarValue, currMode),
      );
      setStudent(student);
    } catch (error) {
      logger.error('Error in init:', error);
    }
  };

  useEffect(() => {
    init();
    window.addEventListener('JoinClassListner', handleJoinClassListner);

    const handleStudentChange = (e: Event) => {
      const customEvent = e as CustomEvent<TableTypes<'user'> | null>;
      if (customEvent.detail) {
        setStudent(customEvent.detail);
        studentRef.current = customEvent.detail;
      }
    };
    window.addEventListener(CURRENT_STUDENT_CHANGED_EVENT, handleStudentChange);

    return () => {
      window.removeEventListener('JoinClassListner', handleJoinClassListner);
      window.removeEventListener(
        CURRENT_STUDENT_CHANGED_EVENT,
        handleStudentChange,
      );
    };
  }, [isHomeHeaderSpecialsEnabled]);

  const handleJoinClassListner = () => {
    setIsLinked(true);
    setCurrentHeaderIconList(
      buildHeaderIconList(true, canShowAvatar, studentMode),
    );
    window.removeEventListener('JoinClassListner', handleJoinClassListner);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ studentId: string; newStars: number }>;
      const curr = studentRef.current || Util.getCurrentStudent();
      if (!curr?.id) return;

      if (custom.detail?.studentId && custom.detail.studentId !== curr.id) {
        return;
      }

      refreshStarsFromLocal();
    };

    window.addEventListener('starsUpdated', handler);
    return () => {
      window.removeEventListener('starsUpdated', handler);
    };
  }, []);
  return (
    <div id="home-header-icons">
      <div className="home-header-outer-icon">
        <HeaderIcon
          headerConfig={{
            displayName: t('Home'),
            iconSrc: 'assets/icons/HomeIconInactive.svg',
            headerList: HOMEHEADERLIST.HOME,
          }}
          currentHeader={currentHeader}
          pendingAssignmentCount={0}
          pendingLiveQuizCount={0}
          onHeaderIconClick={() => {
            if (currentHeader != HOMEHEADERLIST.HOME) {
              onHeaderIconClick(HOMEHEADERLIST.HOME);
            }
          }}
        />
      </div>

      <div id="home-header-middle-icons">
        {!!currentHeaderIconList &&
          currentHeaderIconList.map((element, index) => {
            if (
              element.headerList === HOMEHEADERLIST.LIVEQUIZ &&
              (!isLinked || !isHomeHeaderSpecialsEnabled)
            ) {
              return null;
            }
            return (
              <HeaderIcon
                key={index}
                headerConfig={element}
                currentHeader={currentHeader}
                pendingAssignmentCount={pendingAssignmentCount}
                pendingLiveQuizCount={pendingLiveQuizCount}
                onHeaderIconClick={() => {
                  if (currentHeader != element.headerList) {
                    onHeaderIconClick(element.headerList);
                  }
                }}
              />
            );
          })}
      </div>

      <div className="home-header-outer-icon">
        <StarsCounter starsCount={starsCount} />
        <HeaderIcon
          headerConfig={{
            displayName: student?.name || t('Name'),
            iconSrc:
              (studentMode === MODES.SCHOOL && student?.image) ||
              `assets/avatars/${student?.avatar ?? AVATARS[0]}.png`,
            headerList: HOMEHEADERLIST.PROFILE,
          }}
          currentHeader={currentHeader}
          pendingAssignmentCount={0}
          pendingLiveQuizCount={0}
          onHeaderIconClick={() => {
            setProfileMenuOpen(true);
          }}
          isProfile={true}
        />
      </div>
      {isProfileMenuOpen && (
        <div
          className="home-header-menu-overlay"
          onClick={() => setProfileMenuOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ProfileMenu onClose={() => setProfileMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeHeader;
