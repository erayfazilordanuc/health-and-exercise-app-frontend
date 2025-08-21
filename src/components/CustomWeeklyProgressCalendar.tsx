import React, {useEffect, useRef} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';
import {AnimatedCircularProgress} from 'react-native-circular-progress';

interface CustomWeeklyProgressCalendarProps {
  weeklyProgressPercents: number[]; // 0: Pazartesi, 1: Çarşamba, 2: Cuma
}

const CustomWeeklyProgressCalendar = ({
  weeklyProgressPercents,
}: CustomWeeklyProgressCalendarProps) => {
  const {colors, theme} = useTheme();
  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.toDateString() === d2.toDateString();
  const scrollRef = useRef<ScrollView>(null);

  // Pazartesi'yi bul
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const monday = getMonday(today);

  const fullWeek = [
    {label: 'Pazartesi', offset: 0, isActive: true, progressIndex: 0},
    {label: 'Salı', offset: 1, isActive: false},
    {label: 'Çarşamba', offset: 2, isActive: true, progressIndex: 1},
    {label: 'Perşembe', offset: 3, isActive: false},
    {label: 'Cuma', offset: 4, isActive: true, progressIndex: 2},
    {label: 'Cumartesi', offset: 5, isActive: false},
    {label: 'Pazar', offset: 6, isActive: false},
  ];

  // Bugünün index’ini bul (scroll için)
  const todayIndex = fullWeek.findIndex(day => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + day.offset);
    return date.toDateString() === today.toDateString();
  });

  useEffect(() => {
    if (scrollRef.current && todayIndex !== -1) {
      scrollRef.current.scrollTo({
        x: todayIndex * 80, // yaklaşık kutu genişliği
        animated: true,
      });
    }
  }, [todayIndex]);

  return (
    <View className="flex flex-col">
      {/* Legend (Açıklama) */}
      <View className="flex flex-row items-center justify-between mb-2 px-4">
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
            style={{backgroundColor: colors.primary[300] /*'#4f9cff' */}}
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
      </View>

      {/* Scrollable Week */}
      <ScrollView
        ref={scrollRef}
        className="px-3 py-2 rounded-2xl mt-1"
        horizontal
        showsHorizontalScrollIndicator={true}
        style={{backgroundColor: colors.background.secondary}}>
        {fullWeek.map(({label, offset, isActive, progressIndex}, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + offset);

          const isToday = isSameDay(date, today);
          const isFuture = date > today;

          let bgColor = colors.background.secondary;

          console.log(
            'şıkıdım şıkıdım',
            isActive,
            progressIndex,
            weeklyProgressPercents[progressIndex!],
            weeklyProgressPercents,
            isToday,
          );
          if (isActive) {
            if (
              progressIndex &&
              weeklyProgressPercents[progressIndex] === 100
            ) {
              bgColor = '#14E077';
            } else if (isToday) {
              bgColor = '#4f9cff';
            } else if (!isFuture) {
              bgColor = '#fd5353';
            } else {
              bgColor = '#4f9cff';
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
                  ? theme.name === 'Light'
                    ? '#B9E2FE'
                    : '#B9E2FE'
                  : colors.background.primary,
              }}>
              {/* ───────── Başlık (gün adı) ───────── */}
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

              {/* ───────── Gün içeriği ───────── */}
              {isToday && isActive ? (
                /* Bugün → Daire içine ilerleme */ <View
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
                    size={37} // kutu kadar
                    width={2}
                    fill={weeklyProgressPercents[todayIndex] ?? 0}
                    tintColor={bgColor}
                    backgroundColor={bgColor}
                    rotation={0} // tepe noktasından başlasın
                    lineCap="round"
                    style={{alignSelf: 'center'}}>
                    {() => (
                      <Text
                        className="text-xs font-rubik"
                        style={{color: colors.text.primary}}>
                        %{weeklyProgressPercents[todayIndex] ?? 0}
                      </Text>
                    )}
                  </AnimatedCircularProgress>
                </View>
              ) : isActive &&
                !isFuture &&
                weeklyProgressPercents?.[progressIndex!] !== 100 ? (
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
                    fill={weeklyProgressPercents?.[progressIndex!] ?? 0}
                    tintColor="#fd5353" /* kırmızı halkalı */
                    backgroundColor={colors.background.secondary}
                    rotation={0}
                    lineCap="round"
                    style={{
                      alignSelf: 'center',
                    }}>
                    {() => (
                      <Text style={{color: colors.text.primary, fontSize: 11}}>
                        %{weeklyProgressPercents?.[progressIndex!] ?? 0}
                      </Text>
                    )}
                  </AnimatedCircularProgress>
                </View>
              ) : (
                /* ───── DİĞER ───── */
                /* Diğer günler → Eski kare */
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
        })}
      </ScrollView>
    </View>
  );
};

export default CustomWeeklyProgressCalendar;
