import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

export type WeeklyStripColors = {
  text: {primary: string; secondary?: string};
  background: {primary: string; secondary: string};
  primary: Record<number, string> & {[key: string]: string};
};

export interface WeeklyStripProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  startOnMonday?: boolean;
  locale?: string;
  hasData?: (date: Date) => boolean;
  colors: WeeklyStripColors;
}

/** ---------- LOCAL-DATE HELPERS (TZ güvenli) ---------- **/
const normalizeDate = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()); // yerel 00:00

const addDays = (d: Date, days: number) =>
  normalizeDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));

const startOfWeek = (d: Date, monday = true) => {
  const date = normalizeDate(d);
  const day = date.getDay(); // 0..6 (0=Pazar)
  const diff = monday ? (day === 0 ? -6 : 1 - day) : -day;
  return addDays(date, diff);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const atMidnight = (d: Date) => normalizeDate(d); // mutasyonsuz
const isAfterDay = (a: Date, b: Date) =>
  atMidnight(a).getTime() > atMidnight(b).getTime();
const isBeforeDay = (a: Date, b: Date) =>
  atMidnight(a).getTime() < atMidnight(b).getTime();
/** ------------------------------------------------------ **/

const trShortDays = ['Pzt', 'Sal', 'Çrş', 'Per', 'Cum', 'Cmt', 'Paz'];
const sunStartShortDays = ['Paz', 'Pzt', 'Sal', 'Çrş', 'Per', 'Cum', 'Cmt'];

const WeeklyStrip: React.FC<WeeklyStripProps> = ({
  selectedDate,
  onSelect,
  minDate,
  maxDate,
  startOnMonday = true,
  locale = 'tr-TR',
  hasData,
  colors,
}) => {
  const [today, setToday] = React.useState(() => normalizeDate(new Date()));

  // İsteğe bağlı: gün döndüğünde "today" otomatik güncellensin
  React.useEffect(() => {
    const tick = () => {
      const now = normalizeDate(new Date());
      setToday(t => (t.getTime === now.getTime ? t : now));
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const [weekStart, setWeekStart] = React.useState(() =>
    startOfWeek(selectedDate, startOnMonday),
  );

  // selectedDate değişince şeridi o haftaya hizala
  React.useEffect(() => {
    setWeekStart(startOfWeek(selectedDate, startOnMonday));
  }, [selectedDate, startOnMonday]);

  const daysOfWeek = React.useMemo(
    () => Array.from({length: 7}, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const shortDays = startOnMonday ? trShortDays : sunStartShortDays;

  const monthLabel = React.useMemo(() => {
    const mid = addDays(weekStart, 3);
    return mid.toLocaleDateString(locale, {month: 'long', year: 'numeric'});
  }, [weekStart, locale]);

  const canGoPrevWeek = React.useMemo(() => {
    if (!minDate) return true;
    const prevStart = addDays(weekStart, -7);
    return !isBeforeDay(addDays(prevStart, 6), minDate);
  }, [weekStart, minDate]);

  const canGoNextWeek = React.useMemo(() => {
    const bound = maxDate ?? today;
    const nextStart = addDays(weekStart, 7);
    return !isAfterDay(nextStart, bound);
  }, [weekStart, maxDate, today]);

  const goPrev = () => {
    if (canGoPrevWeek) setWeekStart(addDays(weekStart, -7));
  };

  const goNext = () => {
    if (canGoNextWeek) setWeekStart(addDays(weekStart, 7));
  };

  const isDisabled = (d: Date) => {
    const lowerOk = !minDate || !isBeforeDay(d, minDate);
    const upperOk = !maxDate || !isAfterDay(d, maxDate);
    const futureOk = !isAfterDay(d, today);
    return !(lowerOk && upperOk && futureOk);
  };

  return (
    <View className="w-full">
      {/* Üst başlık */}
      <View className="flex flex-row items-center justify-between mb-3 mt-2">
        <TouchableOpacity
          accessibilityHint="Önceki hafta"
          onPress={goPrev}
          disabled={!canGoPrevWeek}
          className="px-3 py-2 rounded-xl"
          style={{
            backgroundColor: colors.background.secondary,
            opacity: canGoPrevWeek ? 1 : 0.5,
          }}>
          <Text style={{color: colors.text.primary, fontSize: 18}}>‹</Text>
        </TouchableOpacity>

        <Text
          className="font-rubik-medium"
          style={{color: colors.text.primary, fontSize: 16}}>
          {monthLabel.toUpperCase()}
        </Text>

        <TouchableOpacity
          accessibilityHint="Sonraki hafta"
          onPress={goNext}
          disabled={!canGoNextWeek}
          className="px-3 py-2 rounded-xl"
          style={{
            backgroundColor: colors.background.secondary,
            opacity: canGoNextWeek ? 1 : 0.5,
          }}>
          <Text style={{color: colors.text.primary, fontSize: 18}}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Gün çipleri */}
      <View className="flex flex-row items-stretch justify-between">
        {daysOfWeek.map((d, idx) => {
          const disabled = isDisabled(d);
          const selected = isSameDay(d, selectedDate);
          const isTodayDay = isSameDay(d, today);
          const showDot = hasData ? hasData(d) : false;

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={() => onSelect(normalizeDate(d))} // ← her zaman yerel 00:00 Date
              className="flex-1 mx-0.5 items-center"
              style={{opacity: disabled ? 0.45 : 1}}>
              <Text
                className="mb-1 font-rubik"
                style={{color: colors.text.primary, fontSize: 12}}>
                {shortDays[idx]}
              </Text>

              <View
                className="h-12 rounded-full items-center justify-center"
                style={{
                  width: 36,
                  backgroundColor: selected
                    ? colors.primary[200] || '#0077FF'
                    : colors.background.secondary,
                  borderWidth: isTodayDay ? 2 : 0,
                  borderColor: isTodayDay
                    ? colors.primary[200] || '#0077FF'
                    : 'transparent',
                }}>
                <Text
                  className="font-rubik-medium"
                  style={{
                    color: selected ? '#ffffff' : colors.text.primary,
                    fontSize: 16,
                  }}>
                  {d.getDate()}
                </Text>
              </View>

              <View className="h-3 mt-1 items-center justify-center">
                {showDot ? (
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: selected
                        ? '#ffffff'
                        : colors.primary[200] || '#0077FF',
                    }}
                  />
                ) : (
                  <View className="w-1.5 h-1.5" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default WeeklyStrip;
