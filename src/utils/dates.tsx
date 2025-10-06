import {isSameDay} from 'date-fns';

export const ymdLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseYMDLocal = (s: string) => {
  // "YYYY-MM-DD" → yerel saatle Date
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const atLocalMidnight = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

export const isTodayExerciseDay = (days: number[]) => {
  return days.includes(((new Date().getDay() + 6) % 7) + 1);
};

export const isTodayLocal = (d: Date) => isSameDay(new Date(), d);

export const getMondayLocal = (input: Date | string) => {
  const base =
    typeof input === 'string'
      ? atLocalMidnight(parseYMDLocal(input))
      : atLocalMidnight(input);

  const day = base.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // Pazartesiye çek
  const monday = new Date(base);
  monday.setDate(base.getDate() + diff);
  return atLocalMidnight(monday);
};
