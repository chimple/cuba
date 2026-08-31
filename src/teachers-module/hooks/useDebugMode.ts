import { useEffect, useRef, useState } from 'react';
import {
  CAN_HOT_UPDATE,
  DOWNLOADED_LESSON_ID,
  DOWNLOADED_LESSONS_SIZE,
} from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { HotUpdateState, Util } from '../../utility/util';
import { toPng } from 'html-to-image';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { useGrowthBook } from '@growthbook/growthbook-react';
import { t } from 'i18next';
import logger from '../../utility/logger';
import { dataURLtoFile } from '../components/debugModeHelpers';

export const useDebugMode = () => {
  const [syncLogs, setSyncLogs] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const PortPlugin = registerPlugin<any>('Port');
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const [isHotUpdating, setIsHotUpdating] = useState(false);
  const [hotUpdateState, setHotUpdateStateUI] = useState<HotUpdateState>({
    status: 'Idle',
    progress: 0,
    channel: 'N/A',
    lastChecked: 'N/A',
    lastUpdated: 'N/A',
    error: '',
    isAuto: false,
  });
  const [hotUpdateMeta, setHotUpdateMeta] = useState({
    versionName: 'N/A',
    versionCode: 'N/A',
    currentBundleId: 'N/A',
    latestBundleId: 'N/A',
    isUpdateAvailable: false,
  });

  const [classData, setClassData] = useState<
    {
      studentId: string;
      studentName: string;
      classId?: string;
      className?: string;
      schoolId?: string;
      schoolName?: string;
    }[]
  >([]);

  const [totals, setTotals] = useState({
    parentId: '',
    parentName: '',
    rowsPushed: 0,
    rowsPulled: 0,
    dataTransferredMB: 0,
    rowsPending: 0,
    localDBSizeMB: 0,
    lessonsDownloaded: 0,
    lessonsSize: 0,
  });
  const growthbook = useGrowthBook();

  useEffect(() => {
    fetchData();
    init();
    loadHotUpdateMeta();
  }, []);

  useEffect(() => {
    // initial load
    setHotUpdateStateUI(Util.getHotUpdateState());
    const handler = () => {
      const state = Util.getHotUpdateState();
      setHotUpdateStateUI(state);
      setIsHotUpdating(state.progress > 0 && state.progress < 100);
      if (state.progress === 100) {
        loadHotUpdateMeta(); // refresh bundle info
      }
    };

    window.addEventListener('hot-update-progress', handler);

    return () => {
      window.removeEventListener('hot-update-progress', handler);
    };
  }, []);

  async function init() {
    const debug = await api.getParentStudentProfiles();

    const studentData = debug.map((user) => ({
      id: user.id,
      name: user.name ?? '',
    }));

    const classDataMapped = await Promise.all(
      studentData.map(async (student) => {
        const class1 = await api.getClassByUserId(student.id);
        const school = await api.getSchoolById(class1?.school_id ?? '');

        return {
          studentId: student.id,
          studentName: student.name,
          classId: class1?.id,
          className: class1?.name,
          schoolId: class1?.school_id,
          schoolName: school?.name,
        };
      }),
    );

    setClassData(classDataMapped);

    let localDBSizeMB = 0;
    if (Capacitor.isNativePlatform()) {
      const data = await PortPlugin.getLocalDatabaseSize();
      localDBSizeMB = data.dbSize / 1024 / 1024;
    }

    const lessonData = JSON.parse(
      localStorage.getItem(DOWNLOADED_LESSONS_SIZE) || '{}',
    ) as { [lessonId: string]: { size: number } };

    const lessonsDownloaded = Object.keys(lessonData).length;
    const lessonsSizeInByte = Object.values(lessonData).reduce(
      (acc, lesson) => acc + lesson.size,
      0,
    );
    const lessonsSize = lessonsSizeInByte / (1024 * 1024);

    const rowsPending = await api.countAllPendingPushes();

    setTotals((prev) => ({
      ...prev,
      rowsPending,
      localDBSizeMB,
      lessonsDownloaded,
      lessonsSize,
    }));
  }
  const fetchData = async () => {
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    const parentId = currentUser?.id;
    const parentName = currentUser?.name;

    if (parentId) {
      const result = await api.getDebugInfoLast30Days(parentId);
      setData(result);

      if (result.length > 0) {
        setColumns(Object.keys(result[0]));

        // Optional: sum if more than one day
        const totalPushed = result.reduce(
          (sum, row) => sum + (row.total_pushed || 0),
          0,
        );
        const totalPulled = result.reduce(
          (sum, row) => sum + (row.total_pulled || 0),
          0,
        );
        const totalTransferred = result.reduce(
          (sum, row) => sum + (row.total_transferred || 0),
          0,
        );

        setTotals({
          parentId,
          parentName: parentName ?? '',
          rowsPushed: totalPushed,
          rowsPulled: totalPulled,
          dataTransferredMB: totalTransferred / 1024,
          rowsPending: totals.rowsPending,
          localDBSizeMB: totals.localDBSizeMB,
          lessonsDownloaded: totals.lessonsDownloaded,
          lessonsSize: totals.lessonsSize,
        });
      }
    }
  };
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncLogs('');

    try {
      await api.syncDB();
      await fetchData();
      await init();
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred during sync.';
      setSyncLogs(`Sync failed: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLessons = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Filesystem.rmdir({
        path: '/',
        directory: Directory.External,
        recursive: true,
      });

      localStorage.removeItem('downloaded_lessons_size');
      localStorage.removeItem(DOWNLOADED_LESSON_ID);

      await init();
      return true;
    } catch (error) {
      logger.error('Error deleting all lessons:', error);
      return false;
    }
  };

  const handleCaptureScreenshot = async () => {
    if (ref.current === null) return;

    try {
      const dataUrl = await toPng(ref.current, { backgroundColor: 'white' });

      if (!Capacitor.isNativePlatform()) {
        const file = dataURLtoFile(dataUrl, 'debug-screenshot.png');

        await Util.sendContentToAndroidOrWebShare(
          'Debug info attached.',
          'Debug Screenshot',
          undefined,
          [file],
        );
        return;
      }

      // Strip the base64 header
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const fileName = `debug-screenshot-${Date.now()}.png`;

      // Save the file to app's cache directory
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      const fileUri = savedFile.uri; // e.g., file://...

      // Now share using plugin
      await PortPlugin.shareContentWithAndroidShare({
        text: 'Debug info attached.',
        title: 'Debug Screenshot',
        url: '',
        imageFile: {
          name: fileName,
          path: fileUri.replace('file://', ''), // Make sure it's a proper File path
        },
      });
    } catch (err) {
      logger.error('Failed to capture or save screenshot:', err);
    }
  };
  async function getHotUpdateChannel() {
    const { versionName } = await LiveUpdate.getVersionName();
    const majorVersion = versionName.split('.')[0];
    return `${import.meta.env.VITE_ENV}-${majorVersion}`;
  }

  const handleManualHotUpdate = async () => {
    if (!Capacitor.isNativePlatform()) return;
    const isAllowed = growthbook?.isOn(CAN_HOT_UPDATE) ?? false;

    const channel = await getHotUpdateChannel();

    if (!isAllowed) {
      Util.setHotUpdateState({
        status: 'Hot Update disabled for this user',
        progress: 0,
        error: 'User not included in GrowthBook rollout',
        isAuto: false,
        lastChecked: new Date().toLocaleString(),
      });
      return;
    }
    try {
      const latest = await LiveUpdate.fetchLatestBundle({ channel });
      Util.setHotUpdateState({ progress: 40 });

      const { bundleId: currentBundleId } = await LiveUpdate.getCurrentBundle();
      const { versionName } = await LiveUpdate.getVersionName();
      let isUpdateAllowed = false;
      if (latest.customProperties && latest.customProperties.version) {
        isUpdateAllowed = Util.isVersionAllowed(
          latest.customProperties.version,
          versionName,
        );
      }

      if (
        !latest.bundleId ||
        latest.bundleId === currentBundleId ||
        !isUpdateAllowed
      ) {
        Util.setHotUpdateState({
          status: 'Already up to date',
          progress: 100,
        });
        return;
      }

      Util.setHotUpdateState({ status: 'Downloading...', progress: 70 });

      await LiveUpdate.sync({ channel });

      Util.setHotUpdateState({
        status: 'Updated successfully',
        progress: 100,
        lastUpdated: new Date().toLocaleString(),
      });

      await LiveUpdate.reload();
    } catch (err: any) {
      Util.setHotUpdateState({
        status: 'Update failed',
        progress: 0,
        error: err?.message || 'Manual update failed',
      });
    }
  };

  async function loadHotUpdateMeta() {
    if (!Capacitor.isNativePlatform()) return;
    const channel = await getHotUpdateChannel();
    const version = await LiveUpdate.getVersionName();
    const code = await LiveUpdate.getVersionCode();
    const current = await LiveUpdate.getCurrentBundle();
    const latest = await LiveUpdate.fetchLatestBundle({ channel });

    let isUpdateAllowed = false;
    if (latest.customProperties && latest.customProperties.version) {
      isUpdateAllowed = Util.isVersionAllowed(
        latest.customProperties.version,
        version.versionName,
      );
    }

    setHotUpdateMeta({
      versionName: version.versionName,
      versionCode: String(code.versionCode),
      currentBundleId: current.bundleId ?? 'None',
      latestBundleId: latest.bundleId ?? 'None',
      isUpdateAvailable:
        !!latest.bundleId &&
        latest.bundleId !== current.bundleId &&
        isUpdateAllowed,
    });
  }

  return {
    classData,
    data,
    handleCaptureScreenshot,
    handleClearLessons,
    handleManualHotUpdate,
    handleSyncNow,
    hotUpdateMeta,
    hotUpdateState,
    isHotUpdating,
    isSyncing,
    ref,
    syncLogs,
    t,
    totals,
  };
};