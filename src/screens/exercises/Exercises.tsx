import {
  View,
  Text,
  TextInput,
  Image,
  BackHandler,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React, {useCallback} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../themes/ThemeProvider';
import icons from '../../constants/icons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

const Exercises = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const exercisesNavigation = useNavigation<ExercisesScreenNavigationProp>();
  const scrollViewHeight = SCREEN_HEIGHT / 8;

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  const navigateToPhysicalExercises = async (routeName: string) => {
    navigation.navigate('PhysicalExercises', {screen: 'Exercise1'});
  };

  const navigateToMindGames = async (routeName: string) => {
    navigation.navigate('MindGames', {screen: 'WordGame'});
  };

  return (
    <>
      <View
        className="pt-14"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Egzersizler
        </Text>
      </View>
      <View
        className="h-full pb-32 px-3 pt-3"
        style={{
          backgroundColor: colors.background.secondary,
          // paddingTop: insets.top / 2,
        }}>
        <View
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-5"
            style={{color: colors.text.primary}}>
            Başarımlarım
          </Text>
          <View className="flex flex-row justify-between mb-4">
            <Text
              className="font-rubik text-xl"
              style={{color: colors.text.primary}}>
              Başarım 1
            </Text>
            <Image
              source={icons.badge1_colorful_bordered}
              className="size-8 mr-2"
            />
          </View>
          <View className="flex flex-row justify-between mb-4">
            <Text
              className="font-rubik text-xl"
              style={{color: colors.text.primary}}>
              Başarım 2
            </Text>
            <Image source={icons.badge1_colorful} className="size-8 mr-2" />
          </View>
          <View className="flex flex-row justify-between mb-4">
            <Text
              className="font-rubik text-xl"
              style={{color: colors.text.primary}}>
              Başarım 3
            </Text>
            <Image
              source={icons.badge1}
              tintColor={colors.text.primary} // Eğer renkli değilse tintColor verilsin
              className="size-8 mr-2"
            />
          </View>
        </View>

        <View
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <View className="flex flex-row justify-between items-start">
            <Text
              className="font-rubik text-2xl mb-3"
              style={{color: colors.text.primary}}>
              Günlük Egzersizler
            </Text>
            <View className="flex flex-col items-center justify-center">
              <AnimatedCircularProgress
                size={50}
                width={4}
                fill={59}
                tintColor={colors.primary[300]}
                onAnimationComplete={() => console.log('onAnimationComplete')}
                backgroundColor={colors.background.secondary}>
                {() => (
                  <Text
                    className="text-lg font-rubik"
                    style={{
                      color: colors.text.primary,
                    }}>
                    %{59}
                  </Text>
                )}
              </AnimatedCircularProgress>
              <Text
                className="text-lg font-rubik"
                style={{
                  color: colors.text.primary,
                }}>
                tamamlandı
              </Text>
            </View>
          </View>
          <ScrollView
            className="mt-4"
            horizontal
            style={{height: scrollViewHeight}}
            showsHorizontalScrollIndicator={false}>
            {/* <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#48AAFF'}}
              // onPress={() => navigateToPhysicalExercises('Exercise2')}
            >
              <Image source={icons.back} className="size-20" />
            </TouchableOpacity> */}

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#55CC88'}}
              onPress={() => {}}>
              <Image source={icons.stretching} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FFAA33'}}
              onPress={() => exercisesNavigation.navigate('Exercise1')}>
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
              onPress={() => exercisesNavigation.navigate('Exercise2')}>
              <Image source={icons.chronometer} className="size-20" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-4"
            style={{color: colors.text.primary}}>
            Tüm Egzersizler
          </Text>
          <ScrollView
            horizontal
            style={{height: scrollViewHeight}}
            showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#48AAFF'}}
              // onPress={() => navigateToPhysicalExercises('Exercise2')}
            >
              <Image source={icons.back} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#55CC88'}}
              onPress={() => {}}>
              <Image source={icons.stretching} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FFAA33'}}>
              <Image source={icons.gymnastic_1} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#48AAFF'}}
              onPress={() => exercisesNavigation.navigate('Exercise1')}>
              <Image source={icons.chronometer} className="size-20" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* <View
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
        </View> */}
      </View>

      {/* TO DO Buraya liste şeklinde Grup maplenmeli yoksa da no result component kullanılabilir */}
    </>
  );
};

export default Exercises;
