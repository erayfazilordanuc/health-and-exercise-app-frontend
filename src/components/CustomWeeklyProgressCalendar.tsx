import React, {useEffect, useRef} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';

interface ExerciseProgressDTO {
  progressRatio: number;
}

interface CustomWeeklyProgressCalendarProps {
  progress: ExerciseProgressDTO[]; // 0: Pazartesi, 1: Çarşamba, 2: Cuma
}

const CustomWeeklyProgressCalendar = ({
  progress,
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
        <View className="flex-row items-center space-x-2">
          <View
            className="p-2 rounded-full mr-1"
            style={{backgroundColor: '#B9E2FE'}}
          />
          <Text
            className="text-sm font-rubik"
            style={{color: colors.text.primary}}>
            Bugün
          </Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <View
            className="p-2 rounded-full mr-1"
            style={{backgroundColor: '#4f9cff'}}
          />
          <Text
            className="text-sm font-rubik"
            style={{color: colors.text.primary}}>
            Yapılacak
          </Text>
        </View>
        <View className="flex-col items-start space-x-2">
          <View className="flex flex-row items-center space-x-2 mb-1">
            <View
              className="p-2 rounded-full mr-1"
              style={{backgroundColor: '#16d750'}}
            />
            <Text
              className="text-sm font-rubik"
              style={{color: colors.text.primary}}>
              Tamamlandı
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <View
              className="p-2 rounded-full mr-1"
              style={{backgroundColor: '#fd5353'}}
            />
            <Text
              className="text-sm font-rubik"
              style={{color: colors.text.primary}}>
              Tamamlanmadı
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable Week */}
      <ScrollView
        ref={scrollRef}
        className="px-3 py-2 rounded-2xl"
        horizontal
        showsHorizontalScrollIndicator={true}
        style={{backgroundColor: colors.background.secondary}}>
        {fullWeek.map(({label, offset, isActive, progressIndex}, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + offset);

          const isToday = isSameDay(date, today);
          const isFuture = date > today;
          let bgColor = colors.background.secondary;

          if (isActive) {
            const progressDay = progress?.[progressIndex ?? -1];
            if (progressDay?.progressRatio === 100) {
              bgColor = '#16d750';
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
              className={`flex flex-col p-3 m-1 rounded-2xl ${
                index === fullWeek.length - 1 ? 'mr-7' : ''
              }`}
              style={{
                backgroundColor: isToday
                  ? theme.name === 'Light'
                    ? '#B9E2FE'
                    : '#B9E2FE'
                  : colors.background.primary,
              }}>
              <Text
                className="text-md text-center font-rubik"
                style={{
                  color:
                    isToday && theme.name === 'Dark'
                      ? colors.background.primary
                      : colors.text.primary,
                }}>
                {label}
              </Text>
              <View
                className="flex flex-row items-center justify-center p-3 rounded-full mr-1 mt-2"
                style={{backgroundColor: bgColor}}>
                <Text
                  className="text-md text-center font-rubik"
                  style={{color: colors.text.primary}}>
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CustomWeeklyProgressCalendar;
