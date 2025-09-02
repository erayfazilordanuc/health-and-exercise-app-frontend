import {isSameDay} from 'date-fns';

export const ymdLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const atLocalMidnight = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

export const isTodayExerciseDay = (days: number[]) => {
  return days.includes(((new Date().getDay() + 6) % 7) + 1);
};

export const isTodayLocal = (d: Date) => isSameDay(new Date(), d);
