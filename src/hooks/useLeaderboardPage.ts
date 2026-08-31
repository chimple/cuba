import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { t } from 'i18next';
import i18n from '../i18n';
import {
  AVATARS,
  CURRENT_MODE,
  LANG,
  LANGUAGE,
  LEADERBOARDHEADERLIST,
  LeaderboardDropdownList,
  MODES,
  PAGES,
  STAGES,
  TableTypes,
} from '../common/constants';
import { AvatarObj } from '../components/animation/Avatar';
import { LeaderboardInfo, StudentLeaderboardInfo } from '../services/api/ServiceApi';
import { ServiceConfig } from '../services/ServiceConfig';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import { getAppSearchParams, replaceAppUrl } from '../utility/routerLocation';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';

const emptyLeaderboardInfo = (): LeaderboardInfo => ({
  weekly: [],
  allTime: [],
  monthly: [],
});

const getLeaderboardListByType = (
  leaderboardInfo: LeaderboardInfo,
  leaderboardDropdownType: LeaderboardDropdownList,
): StudentLeaderboardInfo[] =>
  leaderboardDropdownType === LeaderboardDropdownList.WEEKLY
    ? leaderboardInfo.weekly
    : leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
      ? leaderboardInfo.monthly
      : leaderboardInfo.allTime;

const hasLeaderboardDataForType = (
  leaderboardInfo: LeaderboardInfo,
  leaderboardDropdownType: LeaderboardDropdownList,
) =>
  getLeaderboardListByType(leaderboardInfo, leaderboardDropdownType).length > 0;

const mergeLeaderboardInfo = (
  cachedData: LeaderboardInfo,
  fetchedData: LeaderboardInfo,
  leaderboardDropdownType: LeaderboardDropdownList,
): LeaderboardInfo => ({
  weekly:
    fetchedData.weekly.length > 0 ||
    leaderboardDropdownType === LeaderboardDropdownList.WEEKLY
      ? fetchedData.weekly
      : cachedData.weekly,
  monthly:
    fetchedData.monthly.length > 0 ||
    leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
      ? fetchedData.monthly
      : cachedData.monthly,
  allTime:
    fetchedData.allTime.length > 0 ||
    leaderboardDropdownType === LeaderboardDropdownList.ALL_TIME
      ? fetchedData.allTime
      : cachedData.allTime,
});

export function useLeaderboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<TableTypes<'user'>>();
  const [leaderboardDataInfo, setLeaderboardDataInfo] =
    useState<LeaderboardInfo>({
      weekly: [],
      allTime: [],
      monthly: [],
    });
  const [leaderboardData, setLeaderboardData] = useState<any[][]>([]);
  const [currentUserDataContent, setCurrentUserDataContent] = useState<
    string[][]
  >([]);
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();
  const urlParams = getAppSearchParams();
  const isRewardPage =
    urlParams.get('tab') === LEADERBOARDHEADERLIST.REWARDS.toLowerCase();
  const { setGbUpdated } = useGbContext();

  const [weeklyList, setWeeklyList] = useState<
    {
      id: string;
      displayName: string;
      type: LeaderboardDropdownList;
    }[]
  >([]);
  const [weeklySelectedValue, setWeeklySelectedValue] = useState<string>();
  const [currentClassAndSchool, setCurrentClassAndSchool] = useState<{
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  }>();
  const [tabIndex, setTabIndex] = useState<LEADERBOARDHEADERLIST | 'debugMode'>(
    isRewardPage
      ? LEADERBOARDHEADERLIST.REWARDS
      : LEADERBOARDHEADERLIST.LEADERBOARD,
  );
  const clickCount = useRef(0);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleLeaderboardClick = () => {
    if (showDebug) return;
    clickCount.current += 1;
    if (clickCount.current === 7) {
      setShowDialogBox(true);
      clickCount.current = 0;
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Util.loadBackgroundImage();
    inti();
    const urlParams = getAppSearchParams();
    const rewardsTab = urlParams.get('tab');
    let currentTab = LEADERBOARDHEADERLIST.LEADERBOARD;
    if (rewardsTab) {
      if (rewardsTab === LEADERBOARDHEADERLIST.REWARDS.toLowerCase()) {
        currentTab = LEADERBOARDHEADERLIST.REWARDS;
      }
    }
    setTabIndex(currentTab);
  }, []);

  useEffect(() => {
    if (tabIndex) {
      const nextParams = getAppSearchParams();
      nextParams.set('tab', tabIndex.toLowerCase());
      replaceAppUrl({ search: `?${nextParams.toString()}` });
    }
  }, [tabIndex]);

  const urlOpen = () => {
    App.addListener('appUrlOpen', (event) => {
      const url = new URL(event.url);
      Util.setPathToBackButton(
        `${PAGES.HOME}?page=/${url.pathname.substring(1)}&classCode=${url.searchParams.get('classCode')}`,
        history,
      );
    });
  };
  App.addListener('appStateChange', urlOpen);

  async function inti() {
    const weekOptions = [
      { text: t('Weekly'), type: LeaderboardDropdownList.WEEKLY },
      { text: t('Monthly'), type: LeaderboardDropdownList.MONTHLY },
      { text: t('ALL Time'), type: LeaderboardDropdownList.ALL_TIME },
    ];
    let weekOptionsList: {
      id: string;
      displayName: string;
      type: LeaderboardDropdownList;
    }[] = [];
    weekOptions.forEach((element, i) => {
      weekOptionsList.push({
        id: i.toString(),
        displayName: element.text,
        type: element.type,
      });
    });
    setWeeklyList(weekOptionsList);
    const api = ServiceConfig.getI().apiHandler;
    const currentStudent = Util.getCurrentStudent();
    if (currentStudent != undefined) {
      const getClass = await api.getStudentClassesAndSchools(currentStudent.id);
      const currMode = await schoolUtil.getCurrMode();
      setStudentMode(currMode);
      if (getClass?.classes && getClass?.classes.length > 0) {
        fetchLeaderBoardData(
          currentStudent,
          LeaderboardDropdownList.WEEKLY,
          getClass?.classes[0].id,
        );
        setCurrentClassAndSchool(getClass);
      } else {
        fetchLeaderBoardData(currentStudent, LeaderboardDropdownList.WEEKLY, '');
      }
      setCurrentStudent(currentStudent);
    }
  }

  async function fetchLeaderBoardData(
    currentStudent: TableTypes<'user'>,
    leaderboardDropdownType: LeaderboardDropdownList,
    classId: string,
  ) {
    setIsLoading(true);
    const api = ServiceConfig.getI().apiHandler;
    let currentUserDataContent: any[][] = [];
    let leaderboardDataArray: any[][] = [];
    currentUserDataContent = [
      [t('Rank'), '--'],
      [t('Lessons Played'), '--'],
      [t('Score'), '--'],
      [t('Time Spent'), '--' + t('min') + ' --' + t('sec')],
    ];
    leaderboardDataArray.push([
      '#',
      t('Name'),
      t('Lessons Played'),
      t('Score'),
      t('Time Spent'),
    ]);
    let dummyData = [
      '--',
      currentStudent.name,
      '--',
      '--',
      '--' + t('min') + ' --' + t('sec'),
    ];
    leaderboardDataArray.push(dummyData);
    setCurrentUserDataContent(currentUserDataContent);
    setLeaderboardData(leaderboardDataArray);
    setIsLoading(false);
    const hasCachedLeaderboardData = hasLeaderboardDataForType(
      leaderboardDataInfo,
      leaderboardDropdownType,
    );
    const [leaderboardResult, b2cData] = await Promise.all([
      hasCachedLeaderboardData
        ? Promise.resolve(leaderboardDataInfo)
        : api.getLeaderboardResults(classId, leaderboardDropdownType),
      !classId
        ? api.getLeaderboardStudentResultFromB2CCollection(currentStudent.id)
        : Promise.resolve(undefined),
    ]);
    const tempLeaderboardData: LeaderboardInfo = hasCachedLeaderboardData
      ? leaderboardDataInfo
      : mergeLeaderboardInfo(
          leaderboardDataInfo,
          leaderboardResult || emptyLeaderboardInfo(),
          leaderboardDropdownType,
        );

    const leaderboardAttributes = {
      leaderboard_position_weekly:
        tempLeaderboardData.weekly.findIndex(
          (item) => item.userId === currentStudent.id,
        ) + 1,
      leaderboard_position_monthly:
        tempLeaderboardData.monthly.findIndex(
          (item) => item.userId === currentStudent.id,
        ) + 1,
      leaderboard_position_all:
        tempLeaderboardData.allTime.findIndex(
          (item) => item.userId === currentStudent.id,
        ) + 1,
    };
    updateLocalAttributes(leaderboardAttributes);
    setGbUpdated(true);

    setLeaderboardDataInfo(tempLeaderboardData);

    const currentStudentB2CData = b2cData
      ? getLeaderboardListByType(b2cData, leaderboardDropdownType)[0]
      : undefined;
    const currentStudentLeaderboardEntry = currentStudentB2CData
      ? {
          ...currentStudentB2CData,
          userId: currentStudentB2CData.userId || currentStudent.id,
          name: currentStudentB2CData.name || currentStudent.name || '',
        }
      : undefined;

    let tempData = [
      ...getLeaderboardListByType(tempLeaderboardData, leaderboardDropdownType),
    ];
    if (!classId && currentStudentLeaderboardEntry) {
      const currentStudentIndex = tempData.findIndex(
        (item) => item.userId === currentStudent.id,
      );
      if (currentStudentIndex >= 0) {
        tempData[currentStudentIndex] = currentStudentLeaderboardEntry;
        tempData.sort((a, b) => b.score - a.score);
      }
    }

    let tempLeaderboardDataArray: any[][] = [];
    let tempCurrentUserDataContent: any[][] = [];
    tempLeaderboardDataArray.push([
      '#',
      t('Name'),
      t('Lessons Played'),
      t('Score'),
      t('Time Spent'),
    ]);
    let isCurrentStudentDataFetched = false;
    for (let i = 0; i < tempData.length; i++) {
      const element = tempData[i];
      var computeMinutes = Math.floor(element.timeSpent / 60);
      var computeSeconds = element.timeSpent % 60;
      tempLeaderboardDataArray.push([
        i + 1,
        element.name,
        element.lessonsPlayed,
        element.score,
        computeMinutes + ' ' + t('min') + ' ' + computeSeconds + ' ' + t('sec'),
      ]);

      if (currentStudent.id == element.userId) {
        isCurrentStudentDataFetched = true;
        tempCurrentUserDataContent = [
          [t('Rank'), i + 1],
          [t('Lessons Played'), element.lessonsPlayed],
          [t('Score'), Math.round(element.score)],
          [
            t('Time Spent'),
            computeMinutes + t(' min') + computeSeconds + ' ' + t('sec'),
          ],
        ];
      }
    }
    if (
      !isCurrentStudentDataFetched &&
      !classId &&
      currentStudentLeaderboardEntry
    ) {
      var computeMinutes = Math.floor(
        currentStudentLeaderboardEntry.timeSpent / 60,
      );
      var computeSeconds = currentStudentLeaderboardEntry.timeSpent % 60;
      const cUserRank = tempLeaderboardDataArray.length.toString() + '+';
      tempCurrentUserDataContent = [
        [t('Rank'), cUserRank],
        [t('Lessons Played'), currentStudentLeaderboardEntry.lessonsPlayed],
        [t('Score'), currentStudentLeaderboardEntry.score],
        [
          t('Time Spent'),
          computeMinutes + t(' min') + ' ' + computeSeconds + ' ' + t('sec'),
        ],
      ];
      tempLeaderboardDataArray.push([
        cUserRank,
        currentStudentLeaderboardEntry.name,
        currentStudentLeaderboardEntry.lessonsPlayed,
        currentStudentLeaderboardEntry.score,
        computeMinutes + t(' min') + ' ' + computeSeconds + ' ' + t('sec'),
      ]);
    }
    if (tempCurrentUserDataContent.length <= 0) {
      tempCurrentUserDataContent = currentUserDataContent;
      tempLeaderboardDataArray.push(dummyData);
    }
    setCurrentUserDataContent(tempCurrentUserDataContent);
    setLeaderboardData(tempLeaderboardDataArray);
    setIsLoading(false);
  }

  const handleChange = (
    event: React.SyntheticEvent,
    newValue: LEADERBOARDHEADERLIST,
  ) => {
    setTabIndex(newValue);
  };

  const openDebugMode = () => {
    setShowDebug(true);
    setTabIndex('debugMode');
    setShowDialogBox(false);
  };

  const closeDebugDialog = () => {
    setShowDialogBox(false);
  };

  const switchProfile = async () => {
    AvatarObj.destroyInstance();
    const user = await auth.getCurrentUser();
    if (!!user && !!user.language_id) {
      const langDoc = await api.getLanguageWithId(user.language_id);
      if (langDoc) {
        const tempLangCode = langDoc.code ?? LANG.ENGLISH;
        localStorage.setItem(LANGUAGE, tempLangCode);
        await i18n.changeLanguage(tempLangCode);
      }
    }
    const currentMOde = localStorage.getItem(CURRENT_MODE);
    await api.removeAssignmentChannel();
    await Util.setCurrentStudent(null);
    if (currentMOde === MODES.PARENT) {
      await schoolUtil.setCurrentClass(undefined);
    }
    updateLocalAttributes({
      student_id: null,
      school_ids: [],
    });
    setGbUpdated(true);
    if (currentMOde === MODES.PARENT) {
      Util.setPathToBackButton(PAGES.DISPLAY_STUDENT, history);
    } else {
      Util.setPathToBackButton(PAGES.SELECT_MODE, history);
      Util.setPathToBackButton(PAGES.SELECT_MODE + '?tab=' + STAGES.STUDENT, history);
    }
  };

  return {
    currentClassAndSchool,
    currentStudent,
    currentUserDataContent,
    fetchLeaderBoardData,
    handleChange,
    handleLeaderboardClick,
    isLoading,
    isRewardPage,
    leaderboardData,
    openDebugMode,
    closeDebugDialog,
    setWeeklySelectedValue,
    showDebug,
    showDialogBox,
    studentMode,
    switchProfile,
    tabIndex,
    weeklyList,
    weeklySelectedValue,
  };
}
