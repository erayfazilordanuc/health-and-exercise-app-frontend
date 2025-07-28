import React, {useState, useRef, useCallback} from 'react';
import {View, Text, TouchableOpacity, BackHandler} from 'react-native';
import {useTheme} from '../../../themes/ThemeProvider';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const Exercise2: React.FC = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStart = () => {
    const currentTime = Date.now();
    setStartTime(currentTime);
    setNow(currentTime);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 10);
  };

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  let secondsPassed = 0;
  if (startTime !== null && now !== null) {
    secondsPassed = (now - startTime) / 1000;
  }

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('ExercisesUser');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{backgroundColor: colors.background.secondary}}>
      <Text
        className="text-4xl font-bold mb-8"
        style={{color: colors.text.primary}}>
        Geçen Zaman: {secondsPassed.toFixed(3)} s
      </Text>

      <TouchableOpacity
        onPress={handleStart}
        className="bg-blue-600 px-6 py-3 rounded-xl mb-4">
        <Text className="text-white text-lg font-semibold">Başlat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleStop}
        className="bg-red-600 px-6 py-3 rounded-xl">
        <Text className="text-white text-lg font-semibold">Durdur</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Exercise2;

{
  /* <View
          className="px-5 py-3 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-4"
            style={{color: colors.text.primary}}>
            Zeka Oyunları
          </Text>
          <ScrollView
            horizontal
            style={{height: scrollViewHeight}}
            showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}
              onPress={() => navigateToMindGames('WordGame')}>
              <Image source={icons.wordle} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}
              // onPress={() => navigateToMindGames('MindGame2')}
            >
              <Image source={icons.brickwall} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}>
              <Image source={icons.piano} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}>
              <Image source={icons.xox} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}>
              <Image source={icons.board_game} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}>
              <Image source={icons.brain} className="size-20" />
            </TouchableOpacity>
          </ScrollView>
        </View> */
}

{
  /* <ScrollView
            className="mt-4"
            horizontal
            style={{height: scrollViewHeight}}
            showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#55CC88'}}
              onPress={() => {}}>
              <Image source={icons.stretching} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FFAA33'}}
              onPress={() => navigation.navigate('Exercise')}>
              <Image source={icons.gymnastic_1} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#48AAFF'}}>
              <Image source={icons.dumbell_up} className="size-16" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#55CC88'}}
              onPress={() => navigation.navigate('Exercise')}>
              <Image source={icons.chronometer} className="size-20" />
            </TouchableOpacity>
          </ScrollView>*/
}
