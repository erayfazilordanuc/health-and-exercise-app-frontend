import React, {useEffect, useRef} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
interface CustomWeeklyProgressCalendarProps {
  todayPercent?: number;
  weeklyPercents: number[]; // aktif günlerin yüzdeleri (activeDays ile aynı sıra)
  activeDays: number[]; // 1=Mon ... 7=Sun (ör: [1,3,5])
}

const CustomWeeklyProgressCalendar = ({
  todayPercent,
  weeklyPercents,
  activeDays,
}: CustomWeeklyProgressCalendarProps) => {
  const {colors, theme} = useTheme();
  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.toDateString() === d2.toDateString();
  const scrollRef = useRef<ScrollView>(null);

  // Pazartesiyi bul
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0=Sun ... 6=Sat
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  };
  const monday = getMonday(today);

  // Aktif günleri 1..7’a göre sırala (UI tutarlılığı için)
  const activeDaysSorted = [...new Set(activeDays)].sort((a, b) => a - b); // ör: [1,3,5]

  // Haftanın tüm günleri (label + dayNum=1..7 + aktiflik + progressIndex eşleme)
  const baseWeek = [
    {label: 'Pazartesi', dayNum: 1, offset: 0},
    {label: 'Salı', dayNum: 2, offset: 1},
    {label: 'Çarşamba', dayNum: 3, offset: 2},
    {label: 'Perşembe', dayNum: 4, offset: 3},
    {label: 'Cuma', dayNum: 5, offset: 4},
    {label: 'Cumartesi', dayNum: 6, offset: 5},
    {label: 'Pazar', dayNum: 7, offset: 6},
  ] as const;

  type WeekItem = {
    label: string;
    dayNum: number; // 1..7
    offset: number; // 0..6
    isActive: boolean;
    progressIndex?: number; // active günse weeklyPercents eşlem indeksi
  };

  const fullWeek: WeekItem[] = baseWeek.map(d => {
    const isActive = activeDaysSorted.includes(d.dayNum);
    const progressIndex = isActive
      ? activeDaysSorted.indexOf(d.dayNum)
      : undefined;
    return {...d, isActive, progressIndex};
  });

  // Bugünün index’ini bul (scroll için)
  const todayIndex = fullWeek.findIndex(day => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + day.offset);
    return isSameDay(date, today);
  });

  useEffect(() => {
    if (scrollRef.current && todayIndex !== -1) {
      scrollRef.current.scrollTo({x: todayIndex * 80, animated: true});
    }
  }, [todayIndex]);

  return (
    <View className="flex flex-col">
      {/* <View className="flex flex-row items-center justify-between mb-2 px-4">
        <View className="flex-col items-start space-x-2 mb-1">
          <View className="flex flex-row items-center space-x-2 mb-1 mr-1">
            <View
              className="p-2 rounded-full mr-1"
              style={{backgroundColor: '#14E077'}}
            />
            <Text
              className="text-xs font-rubik"
              style={{color: colors.text.primary}}>
              Tamamlandı
            </Text>
          </View>
          <View className="flex-row items-center space-x-2 mt-1">
            <View
              className="p-2 rounded-full mr-1"
              style={{backgroundColor: '#fd5353'}}
            />
            <Text
              className="text-xs font-rubik"
              style={{color: colors.text.primary}}>
              Tamamlanmadı
            </Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-2">
          <View
            className="p-2 rounded-full mr-1"
            style={{backgroundColor: colors.primary[300]}}
          />
          <Text
            className="text-xs font-rubik"
            style={{color: colors.text.primary}}>
            Yapılacak
          </Text>
        </View>
        <View className="flex-row items-center space-x-2 mr-1">
          <View
            className="p-2 rounded-full mr-1"
            style={{backgroundColor: '#B9E2FE'}}
          />
          <Text
            className="text-xs font-rubik"
            style={{color: colors.text.primary}}>
            Bugün
          </Text>
        </View>
      </View> */}

      <ScrollView
        ref={scrollRef}
        className="px-3 py-2 rounded-2xl mt-1"
        horizontal
        showsHorizontalScrollIndicator
        style={{backgroundColor: colors.background.secondary}}>
        {fullWeek.map(
          ({label, offset, isActive, progressIndex, dayNum}, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + offset);

            const isToday = isSameDay(date, today);
            const isFuture = date > today;

            // Aktif gün için varsayılan arkaplan mantığı
            let bgColor = colors.background.secondary;

            const percent =
              progressIndex != null
                ? weeklyPercents?.[progressIndex]
                : undefined;

            if (isActive) {
              if (percent === 100) {
                bgColor = '#14E077'; // tamamlandı
              } else if (isToday) {
                bgColor = '#0091ff'; // bugün (yapılacak)
              } else if (!isFuture) {
                bgColor = '#fd5353'; // geçmişte tamamlanmamış
              } else {
                bgColor = '#0091ff'; // gelecekte yapılacak
              }
            }

            return (
              <View
                key={label}
                className={`flex flex-col items-center pb-3 pt-2 rounded-2xl ${
                  index === fullWeek.length - 1 ? 'mr-7' : ''
                }`}
                style={{
                  margin: 5,
                  height: 77,
                  width: 77,
                  backgroundColor: isToday
                    ? '#B9E2FE'
                    : colors.background.primary,
                }}>
                {/* Gün adı */}
                <Text
                  className="text-sm text-center font-rubik"
                  style={{
                    color:
                      isToday && theme.name === 'Dark'
                        ? colors.background.primary
                        : colors.text.primary,
                  }}>
                  {label}
                </Text>

                {/* İçerik */}
                {isToday && isActive ? (
                  <View
                    className="flex flex-row items-center justify-center"
                    style={{
                      marginTop: 8,
                      borderRadius: 100,
                      alignSelf: 'center',
                      width: 35,
                      height: 35,
                      backgroundColor: bgColor,
                    }}>
                    <AnimatedCircularProgress
                      size={37}
                      width={2}
                      fill={todayPercent ?? 0}
                      tintColor={bgColor}
                      backgroundColor={colors.background.secondary}
                      rotation={0}
                      lineCap="round"
                      style={{alignSelf: 'center'}}>
                      {() => (
                        <Text
                          className="text-xs font-rubik"
                          style={{color: colors.text.primary}}>
                          %{todayPercent ?? 0}
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                  </View>
                ) : isActive && !isFuture && (percent ?? 0) !== 100 ? (
                  <View
                    className="flex flex-row items-center justify-center"
                    style={{
                      marginTop: 8,
                      borderRadius: 100,
                      alignSelf: 'center',
                      width: 35,
                      height: 35,
                      backgroundColor: '#fd5353',
                    }}>
                    <AnimatedCircularProgress
                      size={37}
                      width={2}
                      fill={percent ?? 0}
                      tintColor="#fd5353"
                      backgroundColor={colors.background.secondary}
                      rotation={0}
                      lineCap="round"
                      style={{alignSelf: 'center'}}>
                      {() => (
                        <Text
                          style={{color: colors.text.primary, fontSize: 11}}>
                          %{percent ?? 0}
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                  </View>
                ) : (
                  <View
                    className="self-center flex flex-row items-center justify-center py-2 rounded-full mt-2"
                    style={{width: 37, height: 37, backgroundColor: bgColor}}>
                    <Text
                      className="text-sm text-center font-rubik"
                      style={{color: colors.text.primary}}>
                      {date.getDate()}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        )}
      </ScrollView>
    </View>
  );
};

export default CustomWeeklyProgressCalendar;
