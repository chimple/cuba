export type CalendarDayCell = {
  day: number | null;
  assigned: boolean;
  future: boolean;
};

export type CalendarRow = {
  trackColor: 'orange' | 'gray' | null;
  days: CalendarDayCell[];
};

export type StreakShareImageFile = File[] | { name: string; path: string };
