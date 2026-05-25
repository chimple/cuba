import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { toPng } from 'html-to-image';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import { Util } from '../../../../utility/util';
import logger from '../../../../utility/logger';
import { CalendarRow, StreakShareImageFile } from '../streakPage.types';

interface StreakPortPlugin {
  shareContentWithAndroidShare(options: {
    text: string;
    title: string;
    url?: string;
    imageFile?: StreakShareImageFile;
  }): Promise<void>;
}

const ALL_TIME_START = '1970-01-01T00:00:00.000Z';
const ALL_TIME_END = '9999-12-31T23:59:59.999Z';

export const useStreakPageLogic = () => {
  const service = ServiceConfig.getI();
  const api = service.apiHandler;
  const auth = service.authHandler;
  const PortPlugin = registerPlugin<StreakPortPlugin>('Port');
  const shareCardRef = useRef<HTMLDivElement>(null);

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [assignedDays, setAssignedDays] = useState<Set<number>>(new Set());
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadSummaryAndAllTimeCount = async () => {
      const currentClass = Util.getCurrentClass();
      const currentSchool = Util.getCurrentSchool();
      const currentUser = await auth.getCurrentUser();
      const classId = currentClass?.id;
      const schoolId = currentSchool?.id || currentClass?.school_id;
      const userId = currentUser?.id;

      if (userId && classId && schoolId) {
        const summary = await api.getCoinAndStreakCount(
          userId,
          classId,
          schoolId,
        );
        logger.info(
          `StreakPage: Fetched coin and streak count for user ${userId}, class ${classId}, school ${schoolId}:`,
          summary?.coins,
          summary?.streak,
        );
        if (isMounted) {
          setCoinCount(summary?.coins ?? 0);
          setStreakCount(summary?.streak ?? 0);
        }
      } else if (isMounted) {
        setCoinCount(0);
        setStreakCount(0);
      }

      if (!classId || !schoolId) {
        if (!isMounted) return;
        setAssignmentCount(0);
        return;
      }

      const { batchGroups: groupedBatchRowsAllTime } =
        await api.getAssignmentDateRangeDataForClassAndSchool(
          classId,
          schoolId,
          ALL_TIME_START,
          ALL_TIME_END,
        );

      if (!isMounted) return;
      setAssignmentCount(groupedBatchRowsAllTime.length);
    };

    loadSummaryAndAllTimeCount();

    return () => {
      isMounted = false;
    };
  }, [api, auth]);

  useEffect(() => {
    let isMounted = true;
    const loadMonthAssignments = async () => {
      const currentClass = Util.getCurrentClass();
      const currentSchool = Util.getCurrentSchool();
      const classId = currentClass?.id;
      const schoolId = currentSchool?.id || currentClass?.school_id;

      if (!classId || !schoolId) {
        if (!isMounted) return;
        setAssignedDays(new Set());
        return;
      }

      const year = visibleMonth.getFullYear();
      const month = visibleMonth.getMonth();
      const startDate = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
      const endDate = new Date(
        year,
        month + 1,
        0,
        23,
        59,
        59,
        999,
      ).toISOString();

      const { assignments: rows } =
        await api.getAssignmentDateRangeDataForClassAndSchool(
          classId,
          schoolId,
          startDate,
          endDate,
        );

      if (!isMounted) return;

      const monthAssignedDays = new Set<number>();
      rows.forEach((assignment) => {
        if (!assignment.created_at) return;
        const createdAt = new Date(assignment.created_at);
        if (
          createdAt.getFullYear() === year &&
          createdAt.getMonth() === month
        ) {
          monthAssignedDays.add(createdAt.getDate());
        }
      });

      setAssignedDays(monthAssignedDays);
    };

    loadMonthAssignments();

    return () => {
      isMounted = false;
    };
  }, [api, visibleMonth]);

  const monthTitle = useMemo(() => {
    return visibleMonth.toLocaleString('en-US', { month: 'long' });
  }, [visibleMonth]);

  const calendarRows = useMemo<CalendarRow[]>(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;

    const dayCells: Array<number | null> = [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    while (dayCells.length % 7 !== 0) {
      dayCells.push(null);
    }

    const rows: CalendarRow[] = [];

    for (let i = 0; i < dayCells.length; i += 7) {
      const rowDays = dayCells.slice(i, i + 7);
      const rowCells = rowDays.map((day) => ({
        day,
        assigned: day !== null && assignedDays.has(day),
        future:
          day !== null &&
          (year > todayYear ||
            (year === todayYear && month > todayMonth) ||
            (year === todayYear && month === todayMonth && day > todayDate)),
      }));

      const realDays = rowCells.filter((cell) => cell.day !== null);
      const hasAnyAssigned = realDays.some(
        (cell) => cell.assigned && !cell.future,
      );

      rows.push({
        trackColor: realDays.length
          ? hasAnyAssigned
            ? 'orange'
            : 'gray'
          : null,
        days: rowCells,
      });
    }

    return rows;
  }, [visibleMonth, assignedDays]);

  const goToPreviousMonth = useCallback(() => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }, []);

  const goToNextMonth = useCallback(() => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }, []);

  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleShareStreak = useCallback(async () => {
    if (!shareCardRef.current) return;

    const message = `I'm on ${streakCount} weeks streak with ${assignmentCount} assignments. Keep Going!`;

    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const fileName = `streak-share-${Date.now()}.png`;

      if (!Capacitor.isNativePlatform()) {
        const file = dataURLtoFile(dataUrl, fileName);
        await Util.sendContentToAndroidOrWebShare(message, 'My Streak', '', [
          file,
        ]);
        return;
      }

      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await PortPlugin.shareContentWithAndroidShare({
        text: message,
        title: 'My Streak',
        url: '',
        imageFile: {
          name: fileName,
          path: savedFile.uri.replace('file://', ''),
        },
      });
    } catch (error) {
      logger.error('Failed to capture or share streak card.', error);
    }
  }, [PortPlugin, assignmentCount, streakCount]);

  return {
    coinCount,
    streakCount,
    assignmentCount,
    monthTitle,
    calendarRows,
    shareCardRef,
    handleShareStreak,
    goToPreviousMonth,
    goToNextMonth,
  };
};
