import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Image,
  BackHandler,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../src/themes/ThemeProvider';
import icons from '../../../src/constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const exercisesNavigation =
    useNavigation<BrainExercisesScreenNavigationProp>();
  let exitCount = 0; // TO DO sayaç lazım
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);

  const healthProgressPercent = 93;
  const exercizeProgressPercent = 59;

  const scrollViewHeight = SCREEN_HEIGHT / 8;

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      const user: User = JSON.parse(userData!);
      setUser(user);
    };

    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (exitCount > 0) {
          exitCount = 0;
          BackHandler.exitApp();
        } else {
          ToastAndroid.show('Çıkmak için tekrar ediniz', ToastAndroid.SHORT);
          exitCount++;
        }
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const navigateToPhysicalExercises = async (routeName: string) => {
    exercisesNavigation.navigate('Exercises', {
      screen: 'PhysicalExercises',
      params: {screen: routeName},
    });
  };

  const navigateToBrainExercises = async (routeName: string) => {
    exercisesNavigation.navigate('Exercises', {
      screen: 'BrainExercises',
      params: {screen: routeName},
    });
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
          Ana Ekran
        </Text>
      </View>
      <View
        className="px-3 pt-3"
        style={{
          flex: 1,
          backgroundColor: colors.background.secondary,
        }}>
        <ScrollView
          style={
            {
              // paddingTop: insets.top / 2,
            }
          }
          showsVerticalScrollIndicator={false}>
          <View
            className="flex flex-row justify-between px-3 py-3 rounded-2xl mb-2"
            style={{backgroundColor: colors.background.primary}}>
            {/* <Text
              className="pl-2 text-2xl font-rubik-medium"
              style={{
                color: colors.primary[300],
              }}>
              {user?.username}
            </Text> */}
            <MaskedView
              maskElement={
                <Text
                  className="pl-2 text-2xl font-rubik-medium text-center mb-1"
                  style={{
                    backgroundColor: 'transparent',
                  }}>
                  {user?.username}
                </Text>
              }>
              <LinearGradient
                colors={[colors.primary[300], '#40E0D0']} // mavi → turkuaz
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text
                  className="pl-2 text-2xl font-rubik-medium text-center mb-1"
                  style={{
                    opacity: 0, // metni sadece maskeye çevirdik
                  }}>
                  {user?.username}
                </Text>
              </LinearGradient>
            </MaskedView>
            <View className="flex flex-row">
              <Image
                source={icons.badge1_colorful_bordered}
                className="size-8 mr-2"
              />
              <Image source={icons.badge1_colorful} className="size-8 mr-2" />
              <Image
                source={icons.badge1}
                tintColor={colors.text.primary} // Eğer renkli değilse tintColor verilsin
                className="size-8 mr-1"
              />
            </View>
          </View>
          <View className="flex flex-row justify-between my-1">
            <View
              className="flex flex-col px-3 py-3 rounded-3xl mb-2"
              style={{
                backgroundColor: colors.background.primary,
                width: SCREEN_WIDTH / 2 - 16,
              }}>
              <Text
                className="pl-2 text-2xl font-rubik"
                style={{
                  color: colors.text.primary,
                }}>
                Sağlık
              </Text>
              <View className="mt-4 mb-2 flex justify-center items-center">
                <AnimatedCircularProgress
                  size={100}
                  width={8}
                  fill={healthProgressPercent}
                  tintColor={'#3EDA87'}
                  onAnimationComplete={() => console.log('onAnimationComplete')}
                  backgroundColor={colors.background.secondary}>
                  {() => (
                    <Text
                      className="text-2xl font-rubik"
                      style={{
                        color: colors.text.primary,
                      }}>
                      %{healthProgressPercent}
                    </Text>
                  )}
                </AnimatedCircularProgress>
              </View>
            </View>
            <View
              className="flex flex-col px-3 py-3 rounded-3xl mb-2"
              style={{
                backgroundColor: colors.background.primary,
                width: SCREEN_WIDTH / 2 - 16,
              }}>
              <Text
                className="pl-2 text-xl font-rubik"
                style={{
                  color: colors.text.primary,
                }}>
                Günlük Egzersiz
              </Text>
              <View className="mt-4 mb-2 flex justify-center items-center">
                <AnimatedCircularProgress
                  size={100}
                  width={8}
                  fill={exercizeProgressPercent}
                  tintColor={colors.primary[300]}
                  onAnimationComplete={() => console.log('onAnimationComplete')}
                  backgroundColor={colors.background.secondary}>
                  {() => (
                    <Text
                      className="text-2xl font-rubik"
                      style={{
                        color: colors.text.primary,
                      }}>
                      %{exercizeProgressPercent}
                    </Text>
                  )}
                </AnimatedCircularProgress>
              </View>
            </View>
          </View>
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
        </ScrollView>
      </View>
    </>
  );
};

export default Home;
