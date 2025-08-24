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
  minDate?: Date; // seçilebilir en erken gün (dahil)
  maxDate?: Date; // seçilebilir en geç gün (dahil)
  startOnMonday?: boolean; // varsayılan: true
  locale?: string; // varsayılan: 'tr-TR'
  hasData?: (date: Date) => boolean; // nokta göstermek için
  colors: WeeklyStripColors; // uygulamanın theme renkleri
}

const trShortDays = ['Pzt', 'Sal', 'Çrş', 'Per', 'Cum', 'Cmt', 'Paz'];
const sunStartShortDays = ['Paz', 'Pzt', 'Sal', 'Çrş', 'Per', 'Cum', 'Cmt'];

function startOfWeek(d: Date, monday = true) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Pazar ... 6=Cumartesi
  const diff = monday
    ? day === 0
      ? -6
      : 1 - day // Pazartesi başlangıç
    : -day; // Pazar başlangıç
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isAfterDay(a: Date, b: Date) {
  return a.setHours(0, 0, 0, 0) > b.setHours(0, 0, 0, 0);
}

function isBeforeDay(a: Date, b: Date) {
  return a.setHours(0, 0, 0, 0) < b.setHours(0, 0, 0, 0);
}

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
  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [weekStart, setWeekStart] = React.useState(() =>
    startOfWeek(selectedDate, startOnMonday),
  );

  // selectedDate değişince şeridi o haftaya hizala
  React.useEffect(() => {
    setWeekStart(startOfWeek(selectedDate, startOnMonday));
  }, [selectedDate, startOnMonday]);

  const daysOfWeek = React.useMemo(() => {
    return Array.from({length: 7}, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const shortDays = startOnMonday ? trShortDays : sunStartShortDays;

  const monthLabel = React.useMemo(() => {
    const mid = addDays(weekStart, 3);
    return mid.toLocaleDateString(locale, {month: 'short', year: 'numeric'});
  }, [weekStart, locale]);

  const canGoPrevWeek = React.useMemo(() => {
    if (!minDate) return true;
    const prevStart = addDays(weekStart, -7);
    // Önceki haftanın son günü bile minDate'den küçükse gitme
    return !isBeforeDay(addDays(prevStart, 6), minDate);
  }, [weekStart, minDate]);

  const canGoNextWeek = React.useMemo(() => {
    const bound = maxDate ?? today;
    const nextStart = addDays(weekStart, 7);
    // Sonraki haftanın ilk günü bile bound'dan büyükse gitme
    return !isAfterDay(nextStart, bound);
  }, [weekStart, maxDate, today]);

  const goPrev = () => {
    if (!canGoPrevWeek) return;
    setWeekStart(addDays(weekStart, -7));
  };

  const goNext = () => {
    if (!canGoNextWeek) return;
    setWeekStart(addDays(weekStart, 7));
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
      <View className="flex flex-row items-center justify-between mb-3 mt-1">
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
              onPress={() => onSelect(d)}
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

              {/* küçük nokta: o güne ait veri varsa */}
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
