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

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

const Exercises = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const exercisesNavigation =
    useNavigation<BrainExercisesScreenNavigationProp>();
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

  const navigateToBrainExercises = async (routeName: string) => {
    navigation.navigate('BrainExercises', {screen: 'WordExercise'});
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
          <Text className="text-xl mb-4" style={{color: colors.text.primary}}>
            Egzersizler
          </Text>
          <ScrollView
            horizontal
            style={{height: scrollViewHeight}}
            showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#48AAFF'}}
              onPress={() => navigateToPhysicalExercises('Exercise1')}>
              <Image source={icons.chronometer} className="size-20" />
            </TouchableOpacity>

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
              style={{backgroundColor: '#48AAFF'}}>
              <Image source={icons.pulse} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#55CC88'}}>
              <Image source={icons.pulse} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FFAA33'}}>
              <Image source={icons.pulse} className="size-20" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View
          className="px-5 py-3 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text className="text-xl mb-4" style={{color: colors.text.primary}}>
            Beyin Egzersizleri
          </Text>
          <ScrollView
            horizontal
            style={{height: scrollViewHeight}}
            showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}
              onPress={() => navigateToBrainExercises('WordExercise')}>
              <Image source={icons.wordle} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}
              // onPress={() => navigateToBrainExercises('BrainExercise2')}
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

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}>
              <Image source={icons.brain} className="size-20" />
            </TouchableOpacity>

            <TouchableOpacity
              className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
              style={{backgroundColor: '#FF8B8B'}}>
              <Image source={icons.brain} className="size-20" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* TO DO Buraya liste şeklinde gruplar maplenmeli yoksa da no result component kullanılabilir */}
    </>
  );
};

export default Exercises;
