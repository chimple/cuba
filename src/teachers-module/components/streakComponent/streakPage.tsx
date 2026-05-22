import React, { useEffect, useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Header from '../homePage/Header';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { Util } from '../../../utility/util';
import './streakPage.css';
import logger from '../../../utility/logger';

type CalendarDayCell = {
  day: number | null;
  assigned: boolean;
  future: boolean;
};

type CalendarRow = {
  trackColor: 'orange' | 'gray' | null;
  days: CalendarDayCell[];
};

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ALL_TIME_START = '1970-01-01T00:00:00.000Z';
const ALL_TIME_END = '9999-12-31T23:59:59.999Z';

const StreakPage: React.FC = () => {
  const history = useHistory();
  const service = ServiceConfig.getI();
  const api = service.apiHandler;
  const auth = service.authHandler;

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

      const groupedBatchRowsAllTime =
        await api.getAssignmentBatchGroupsForClassAndSchoolByDateRange(
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

      const rows = await api.getAssignmentsForClassAndSchoolByDateRange(
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
      const rowCells: CalendarDayCell[] = rowDays.map((day) => ({
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

  return (
    <IonPage className="streak-screen streak-page-screen">
      <Header
        isBackButton={true}
        customText="My Streak"
        customTextClassName="streak-page-header-text"
        onBackButtonClick={() => history.goBack()}
        showStreakButton={false}
      />
      <IonContent className="streak-content-shell">
        <div className="streak-content streak-page-layout">
          <div className="streak-coin-card">
            <img
              src="assets/icons/coinIcon.png"
              className="streak-summary-fire"
              alt="Coins"
            />
            <span className="streak-coin-value">{coinCount}</span>
          </div>

          <div className="streak-summary">
            <div className="streak-summary-item">
              <div className="streak-summary-value">
                <span>{streakCount}</span>
                <img
                  src="assets/icons/streakIcon2.png"
                  className="streak-summary-fire"
                  alt="Streak"
                />
              </div>
              <div className="streak-summary-label">Weeks Streak</div>
            </div>
            <div className="streak-summary-item">
              <div className="streak-summary-value">{assignmentCount}</div>
              <div className="streak-summary-label">Assignments</div>
            </div>
          </div>

          <div className="streak-month-row">
            <h2 className="streak-month-title">{monthTitle}</h2>
            <div className="streak-month-nav">
              <button
                type="button"
                className="streak-month-btn"
                aria-label="Previous month"
                onClick={() =>
                  setVisibleMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="streak-month-btn"
                aria-label="Next month"
                onClick={() =>
                  setVisibleMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className="streak-weekdays">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={`${label}-${index}`} className="streak-weekday">
                {label}
              </span>
            ))}
          </div>

          <div className="streak-calendar">
            {calendarRows.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className={`streak-calendar-row ${row.trackColor ? `track-${row.trackColor}` : ''}`}
              >
                <div className="streak-row-track" />
                {row.days.map((cell, dayIndex) => {
                  if (cell.day === null) {
                    return (
                      <div
                        key={`empty-${rowIndex}-${dayIndex}`}
                        className="streak-day-empty"
                      />
                    );
                  }

                  return (
                    <button
                      key={`day-${cell.day}`}
                      type="button"
                      className={`streak-day ${
                        cell.future
                          ? 'future'
                          : cell.assigned
                            ? 'assigned'
                            : 'unassigned'
                      }`}
                      disabled={cell.future}
                    >
                      <span className="streak-day-number">{cell.day}</span>
                      {!cell.assigned && !cell.future && (
                        <span className="streak-day-cross" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default StreakPage;
