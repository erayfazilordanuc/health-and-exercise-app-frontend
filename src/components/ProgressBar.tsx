import MaskedView from '@react-native-masked-view/masked-view';
import icons from '../constants/icons';
import {useTheme} from '../themes/ThemeProvider';
import React from 'react';
import {View, Text, Image, TouchableOpacity, ToastAndroid} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {fonts} from 'react-native-elements/dist/config';
import NetInfo from '@react-native-community/netinfo';

type ProgressBarProps = {
  value?: number; // artık optional
  label: string;
  iconSource: any;
  color: string;
  updateDisabled?: boolean;
  setAddModalFunction?: React.Dispatch<
    React.SetStateAction<{
      setSymptom?: React.Dispatch<React.SetStateAction<number>>;
    }>
  >;
  setSymptom?: React.Dispatch<React.SetStateAction<number>>;
  onAdd?: React.Dispatch<React.SetStateAction<boolean>>;
};

const MAX_SLEEP_HOURS = 16;
const MAX_SLEEP_MINUTES = MAX_SLEEP_HOURS * 60;
const INITIAL_MAX_STEPS = 2500;
const INITIAL_MAX_CALORIES = 2000;

const GradientText: React.FC<{text: string}> = ({text}) => (
  <MaskedView
    maskElement={
      <Text
        className="text-md font-rubik"
        style={{backgroundColor: 'transparent'}}>
        {text}
      </Text>
    }>
    <LinearGradient
      colors={['#27d95c', '#9debb4']}
      start={{x: 0, y: 0}}
      end={{x: 2, y: 0}}>
      <Text className="text-md font-rubik" style={{opacity: 0}}>
        {text}
      </Text>
    </LinearGradient>
  </MaskedView>
);

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  iconSource,
  color,
  updateDisabled,
  setAddModalFunction,
  setSymptom,
  onAdd,
}) => {
  const {colors} = useTheme();

  const calculateProgressRatio = (): number => {
    if (value == null) return 0; // value undefined/null için 0
    let ratio = 0;
    if (iconSource === icons.man_walking) {
      let maxSteps = INITIAL_MAX_STEPS;
      if (value > maxSteps) {
        const gap = value - maxSteps;
        maxSteps += (Math.floor(gap / 5000) + 1) * 5000;
      }
      ratio = Math.min((value / maxSteps) * 100, 100);
    } else if (iconSource === icons.pulse) {
      ratio = value / 1.5;
    } else if (iconSource === icons.kcal) {
      let maxCalories = INITIAL_MAX_CALORIES;
      if (value > maxCalories) maxCalories += 500;
      ratio = Math.min((value / maxCalories) * 100, 100);
    } else if (iconSource === icons.sleep) {
      ratio = Math.min((value / MAX_SLEEP_MINUTES) * 100, 100);
    } else {
      ratio = Math.min(value, 100);
    }
    return ratio;
  };

  const getDisplayText = (): string => {
    if (value == null || value == 0) return ''; // 'Veri yok';
    if (iconSource === icons.man_walking) return `${value} adım`;
    if (iconSource === icons.sleep) {
      const hours = Math.floor(value / 60); // toplam dakikadan saat çıkar
      const minutes = Math.round(value % 60); // kalan dakikayı al
      return `${hours} saat ${minutes} dk`;
    }
    if (iconSource === icons.pulse) return `${value} bpm`;
    if (iconSource === icons.kcal) return `${value} kcal`;
    if (iconSource === icons.better_health || iconSource === icons.o2sat)
      return `%${value}`;
    return `${value}`;
  };

  const progressRatio = calculateProgressRatio();

  return (
    <View className="py-4">
      <View className="flex-row items-center mb-2 justify-between">
        <View className="flex-row items-center flex-1">
          <Image
            source={iconSource}
            className="size-7 ml-1"
            tintColor={colors.text.primary}
          />
          <Text
            className="pl-2 font-rubik"
            style={{fontSize: 15, color: colors.text.primary}}>
            {label}
          </Text>
        </View>

        <Text
          className="text-sm font-rubik mr-2"
          style={{color: colors.text.primary}}>
          {getDisplayText()}
        </Text>

        {!updateDisabled && setAddModalFunction && setSymptom && onAdd && (
          <TouchableOpacity
            className="ml-1 flex-row justify-center items-center px-3 py-1 rounded-2xl"
            style={{backgroundColor: colors.background.secondary}}
            onPress={async () => {
              // const net = await NetInfo.fetch();
              // const isOnline = !!net.isConnected;
              // if (!isOnline) {
              //   ToastAndroid.show(
              //     'İnternet bağlantınız olmadığı için şuanda güncelleme yapamazsınız',
              //     ToastAndroid.LONG,
              //   );
              //   return;
              // }
              setAddModalFunction({setSymptom});
              onAdd(true);
            }}>
            <GradientText text="Güncelle" />
          </TouchableOpacity>
        )}
      </View>

      {
        // value != null &&
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
      }
    </View>
  );
};

export default ProgressBar;
