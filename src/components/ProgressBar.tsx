import icons from '../constants/icons';
import {useTheme} from '../themes/ThemeProvider';
import React from 'react';
import {View, Text, Image} from 'react-native';

type ProgressBarProps = {
  value: number; // Nabız ise bpm, sağlık ise yüzde, adım ise sayı
  label: string;
  iconSource: any;
  color: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  iconSource,
  color,
}) => {
  const {colors} = useTheme();

  if (value < 0) {
    return (
      <View className="py-4">
        <View className="flex-row items-center mb-2">
          <Image
            source={iconSource}
            className="size-8"
            tintColor={colors.text.primary}
          />
          <Text
            className="pl-2 flex-1 text-lg font-rubik"
            style={{color: colors.text.primary}}>
            {label}
          </Text>
          <Text
            className="text-md font-rubik"
            style={{color: colors.text.primary}}>
            Veri yok
          </Text>
        </View>
      </View>
    );
  }

  const isStep = iconSource === icons.man_walking;
  const isSleep = iconSource === icons.sleep;
  const maxSleepHours = 15;

  // maxSteps: 5000 → 10000 → 15000 mantığı
  let maxSteps = 2500;
  if (isStep && value > maxSteps) {
    if (maxSteps == 2500) {
      maxSteps = 5000;
    }

    const gap = value - maxSteps;
    maxSteps += (Math.floor(gap / 5000) + 1) * 5000;
  }
  // if (isStep && value > 5000) {
  //   maxSteps = 10000;
  // }
  // if (isStep && value > 10000) {
  //   maxSteps = 15000;
  // }
  const isCalorie = iconSource === icons.kcal;

  let maxCalories = 2000;
  if (isCalorie && value > maxCalories) maxCalories += 500;

  // İç bar oranı
  const progressRatio = isStep
    ? Math.min((value / maxSteps) * 100, 100)
    : iconSource === icons.pulse
    ? value / 1.5
    : iconSource === icons.kcal
    ? Math.min((value / maxCalories) * 100, 100)
    : isSleep
    ? Math.min((value / maxSleepHours) * 100, 100)
    : Math.min(value, 100);

  // Sağ üst metin
  const displayText = isStep
    ? `${value} adım`
    : `${
        iconSource === icons.better_health || iconSource == icons.o2sat
          ? '%'
          : ''
      }${
        iconSource == icons.sleep
          ? Math.floor(value) +
            ' saat ' +
            (value - Math.floor(value)) * 60 +
            ' dakika'
          : value
      }${iconSource == icons.pulse ? ' bpm' : ''}${
        iconSource == icons.kcal ? ' kcal' : ''
      }`;

  return (
    <View className="py-4">
      <View className="flex-row items-center mb-2">
        <Image
          source={iconSource}
          className="size-8"
          tintColor={colors.text.primary}
        />
        <Text
          className="pl-2 flex-1 text-lg font-rubik"
          style={{color: colors.text.primary}}>
          {label}
        </Text>
        <Text
          className="text-md font-rubik"
          style={{
            color: colors.text.primary,
          }}>
          {displayText}
        </Text>
      </View>

      <View
        className="w-full h-1 rounded-full overflow-hidden"
        style={{backgroundColor: colors.background.secondary}}>
        <View
          className="h-1 rounded-full"
          style={{
            width: `${progressRatio}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
};

export default ProgressBar;
